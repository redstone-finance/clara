// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "./QueueLib.sol";
import "./mocks/AgentNFT.sol";

import "./mocks/RevenueToken.sol";
import { ERC721Holder } from "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";
import { ILicensingModule } from "@storyprotocol/core/interfaces/modules/licensing/ILicensingModule.sol";
import { IPAssetRegistry } from "@storyprotocol/core/registries/IPAssetRegistry.sol";
import { IPILicenseTemplate } from "@storyprotocol/core/interfaces/modules/licensing/IPILicenseTemplate.sol";
import { IRoyaltyModule } from "@storyprotocol/core/interfaces/modules/royalty/IRoyaltyModule.sol";
import { IRoyaltyWorkflows } from "@storyprotocol/periphery/interfaces/workflows/IRoyaltyWorkflows.sol";

import { PILFlavors } from "@storyprotocol/core/lib/PILFlavors.sol";
import { PILTerms } from "@storyprotocol/core/interfaces/modules/licensing/IPILicenseTemplate.sol";
// import {console} from "forge-std/console.sol";
import { RoyaltyPolicyLAP } from "@storyprotocol/core/modules/royalty/policies/LAP/RoyaltyPolicyLAP.sol";
import {Context} from "@openzeppelin/contracts/utils/Context.sol";
import {MarketLib} from "./MarketLib.sol";

error UnknownTopic(bytes32 topic);
error UnknownMatchingStrategy(bytes32 strategy);
error AgentNotRegistered(address agent);
error AgentAlreadyRegistered(address agent);
error TaskNotFound(uint256 taskId);
error ValueNegative();
error NoAgentsMatchedForTask();
error PreviousTaskNotSentBack(uint256 taskId);

/**
 * @title ClaraMarketV1
 */
contract ClaraMarketV1 is Context, ERC721Holder {
    // constants
    bytes32 internal constant TOPIC_TWEET = "tweet";
    bytes32 internal constant TOPIC_DISCORD = "discord";
    bytes32 internal constant TOPIC_TELEGRAM = "telegram";
    bytes32 internal constant TOPIC_NFT = "nft";
    bytes32 internal constant TOPIC_CHAT = "chat";
    bytes32 internal constant TOPIC_NONE = "none";
    
    address internal constant ZERO_ADDRESS = address(0);

    // viem.keccak256(toHex("RedStone.ClaraMarket.Storage"))
    bytes32 private constant STORAGE_LOCATION = 0x662d955f31e0cda1ca2e8148a249b0c86a4293138bfb4d882e692ec1f9dabd24;

    // public
    IPAssetRegistry public immutable IP_ASSET_REGISTRY;
    ILicensingModule public immutable LICENSING_MODULE;
    IPILicenseTemplate public immutable PIL_TEMPLATE;
    RoyaltyPolicyLAP public immutable ROYALTY_POLICY_LAP;
    IRoyaltyWorkflows public immutable ROYALTY_WORKFLOWS;
    IRoyaltyModule public immutable ROYALTY_MODULE;
    RevenueToken public immutable REVENUE_TOKEN;
    AgentNFT public immutable AGENT_NFT;
    
    uint256 public agentsLength;
    uint256 public tasksDeleted;
    uint256 public tasksCounter;
    address[] public allAgents;
    MarketLib.Task[] public allTasks;
    mapping(bytes32 => uint256) public unassignedTasksLength;
    mapping(address => MarketLib.AgentTotals) public agentTotals;
    mapping(address => mapping(uint256 => uint256)) public multiTasksAssigned;
    mapping(address => MarketLib.Task) public agentInbox;
    mapping(address => uint256) public withdrawalAmount;
    mapping(address => MarketLib.AgentInfo) public agents;
    MarketLib.MarketTotals public marketTotals;
    // internal
    mapping(bytes32 => bool) internal topics;

    // events
    event AgentRegistered(address indexed agent, MarketLib.AgentInfo agentInfo);
    event AgentUpdated(address indexed agent, MarketLib.AgentInfo agentInfo);
    event TaskRegistered(
        address indexed requestingAgent,
        uint256 indexed taskId,
        MarketLib.Task task);
    event TaskAssigned(
        address indexed requestingAgent,
        address indexed assignedAgent,
        uint256 indexed taskId,
        MarketLib.Task task);
    event TaskResultSent(
        address indexed requestingAgent,
        address indexed assignedAgent,
        uint256 indexed taskId,
        MarketLib.TaskResult taskResult);
    event RewardWithdrawn(address agent, uint256 amount);

    constructor(
        address ipAssetRegistry,
        address licensingModule,
        address pilTemplate,
        address royaltyPolicyLAP,
        address royaltyWorkflows,
        address royaltyModule,
        address payable _revenueToken) {
        
        REVENUE_TOKEN = RevenueToken(_revenueToken);
        IP_ASSET_REGISTRY = IPAssetRegistry(ipAssetRegistry);
        LICENSING_MODULE = ILicensingModule(licensingModule);
        PIL_TEMPLATE = IPILicenseTemplate(pilTemplate);
        ROYALTY_POLICY_LAP = RoyaltyPolicyLAP(royaltyPolicyLAP);
        ROYALTY_WORKFLOWS = IRoyaltyWorkflows(royaltyWorkflows);
        ROYALTY_MODULE = IRoyaltyModule(royaltyModule);
        
        topics[TOPIC_TWEET] = true;
        topics[TOPIC_DISCORD] = true;
        topics[TOPIC_TELEGRAM] = true;
        topics[TOPIC_NFT] = true;
        topics[TOPIC_CHAT] = true;
        topics[TOPIC_NONE] = true;

        tasksCounter = 1;

        AGENT_NFT = new AgentNFT("CLARA AGENT IP NFT", "CAIN"); 
    }

    function getPaymentsAddr() external view returns (address) {
        return address(REVENUE_TOKEN);
    }

    function withdraw()
    external {
        _assertAgentRegistered();
        uint256 amount = withdrawalAmount[_msgSender()];
        if (amount > 0) {
            withdrawalAmount[_msgSender()] = 0;
            REVENUE_TOKEN.transfer(_msgSender(), amount);
            emit RewardWithdrawn(_msgSender(), amount);
        }
    }

    function cleanTasks()
    external {
        _assertAgentRegistered();
        if (tasksDeleted > 0) {
            uint256 write = 0;
            for (uint256 i = 0; i < allTasks.length; i++) {
                // If the element should be kept...
                if (!allTasks[i].isDeleted) {
                    allTasks[write] = allTasks[i];
                    write++;
                }
            }
            // Remove extra tail elements
            while (allTasks.length > write) {
                allTasks.pop();
            }
            tasksDeleted = 0;
        }
    }

    function registerAgentProfile(
        uint256 _fee,
        bytes32 _topic,
        string calldata _metadata
    )
    external
    {
        require(agents[_msgSender()].exists == false, AgentAlreadyRegistered(_msgSender()));
        _assertTopic(_topic);
        require(_fee >= 0, ValueNegative());

        uint256 tokenId = AGENT_NFT.mint(address(this));
        address ipId = IP_ASSET_REGISTRY.register(block.chainid, address(AGENT_NFT), tokenId);
        uint256 licenseTermsId = PIL_TEMPLATE.registerLicenseTerms(
            PILFlavors.commercialRemix({
            mintingFee: 0,
            commercialRevShare: 100 * 10 ** 6, // 100% - i.e. all royalties for the tasks (childIPs) are sent to the Agent assigned to this task
            royaltyPolicy: address(ROYALTY_POLICY_LAP),
            currencyToken: address(REVENUE_TOKEN)
        }));
        
        // attach the license terms to the IP Asset
        LICENSING_MODULE.attachLicenseTerms(ipId, address(PIL_TEMPLATE), licenseTermsId);

        // transfer the NFT to the receiver so it owns the IPA
        AGENT_NFT.transferFrom(address(this), _msgSender(), tokenId);
        
        _registerAgent();
        agents[_msgSender()] = MarketLib.AgentInfo({
            exists: true,
            id: _msgSender(),
            topic: _topic,
            fee: _fee,
            metadata: _metadata,
            ipAssetId: ipId,
            canNftTokenId: tokenId,
            licenceTermsId: licenseTermsId
        });
        
        emit AgentRegistered(_msgSender(), agents[_msgSender()]);
    }

    function updateAgentFee(uint256 _fee)
    external
    {
        require(agents[_msgSender()].exists == true, AgentNotRegistered(_msgSender()));
        require(_fee >= 0, ValueNegative());

        agents[_msgSender()].fee = _fee;
        emit AgentUpdated(_msgSender(), agents[_msgSender()]);
    }

    function updateAgentTopic(bytes32 _topic)
    external
    {
        require(agents[_msgSender()].exists == true, AgentNotRegistered(_msgSender()));
        _assertTopic(_topic);

        agents[_msgSender()].topic = _topic;
        emit AgentUpdated(_msgSender(), agents[_msgSender()]);
    }

    function registerTask(
        uint256 _reward,
        uint256 _contextId,
        bytes32 _topic,
        string calldata _payload
    )
    external
    {
        _assertAgentRegistered();
        require(_reward >= 0, ValueNegative());
        _assertTopic(_topic);

        agentTotals[_msgSender()].requested += 1;
        
        uint256 taskId = tasksCounter++;

        allTasks.push(MarketLib.Task({
                id: taskId,
                parentTaskId: 0,
                contextId: _contextId == 0 ? taskId : _contextId,
                blockNumber: block.number,
                reward: _reward,
                requester: _msgSender(),
                agentId: ZERO_ADDRESS,
                payload: _payload,
                topic: _topic,
                childTokenId: 0,
                childIpId: ZERO_ADDRESS,
                maxRepeatedPerAgent: 1,
                isMultiTask: false,
                isDeleted: false
            })
        );
        unassignedTasksLength[_topic]++;
        // locking Revenue Tokens on Market contract - allowance required!
        REVENUE_TOKEN.transferFrom(_msgSender(), address(this), _reward);
        
        emit TaskRegistered(_msgSender(), taskId, allTasks[allTasks.length - 1]);
    }

    function registerMultiTask(
        uint256 _tasksCount,
        uint256 _maxRewardPerTask,
        uint256 _maxRepeatedTasksPerAgent,
        bytes32 _topic,
        string calldata _payload
    )
    external
    {
        _assertAgentRegistered();
        require(_maxRewardPerTask >= 0, ValueNegative());
        _assertTopic(_topic);

        agentTotals[_msgSender()].requested += _tasksCount; // not sure about this
        uint256 parentTaskId = tasksCounter++;
        
        for (uint256 i = 0; i < _tasksCount; i++) {
            uint256 taskId = tasksCounter++;
            
            MarketLib.Task memory newTask = MarketLib.Task({
                id: taskId, 
                parentTaskId: parentTaskId,
                contextId: 0,
                blockNumber: block.number,
                reward: _maxRewardPerTask,
                requester: _msgSender(),
                agentId: ZERO_ADDRESS,
                payload: _payload,
                topic: _topic,
                childTokenId: 0,
                childIpId: ZERO_ADDRESS,
                maxRepeatedPerAgent: _maxRepeatedTasksPerAgent,
                isMultiTask: true,
                isDeleted: false
            });
            allTasks.push(newTask);
            emit TaskRegistered(_msgSender(), taskId, newTask);
        }
        
        unassignedTasksLength[_topic] += _tasksCount;
        // locking Revenue Tokens on Market contract - allowance required!
        REVENUE_TOKEN.transferFrom(_msgSender(), address(this), _tasksCount * _maxRewardPerTask);
    }

    function loadNextTask()
    external
    {
        _assertAgentRegistered();
        address sender = _msgSender();
        if (unassignedTasksLength[agents[sender].topic] == 0) {
            return;
        }
        
        require(agentInbox[sender].requester == ZERO_ADDRESS, PreviousTaskNotSentBack(agentInbox[sender].id));
        
        require(agents[sender].exists == true, AgentNotRegistered(sender));
        uint256 currentTasksLength = allTasks.length;
        MarketLib.AgentInfo storage agent = agents[sender];
        
        for (uint256 i = 0; i < currentTasksLength; i++) {
            MarketLib.Task storage task = allTasks[i];
            if (task.isDeleted) {
                continue;
            }
            if (agent.topic == task.topic
                && agent.fee <= task.reward
                && task.requester != sender
                && (!task.isMultiTask 
                    || (task.isMultiTask 
                        && multiTasksAssigned[sender][task.parentTaskId] < task.maxRepeatedPerAgent))
            ) {
                _loadTask(
                    sender,
                    task,
                    agent.fee);
                unassignedTasksLength[task.topic]--;
                tasksDeleted++;
                task.isDeleted = true;
                return;
            }
        }
    }

    function sendResult(
        uint256 _taskId,
        string calldata _resultJSON
    )
    external
    {
        _assertAgentRegistered();

        MarketLib.Task memory originalTask = agentInbox[_msgSender()];
        require(
            originalTask.id != 0,
            TaskNotFound(_taskId)
        );

        delete agentInbox[_msgSender()];

        agentTotals[_msgSender()].done += 1;
        agentTotals[_msgSender()].rewards += originalTask.reward;

        marketTotals.done += 1;
        marketTotals.rewards += originalTask.reward;

        MarketLib.TaskResult memory taskResult = MarketLib.TaskResult({
            id: originalTask.id,
            timestamp: block.timestamp,
            blockNumber: block.number,
            result: _resultJSON
        });

        REVENUE_TOKEN.approve(address(ROYALTY_MODULE), originalTask.reward);
        ROYALTY_MODULE.payRoyaltyOnBehalf(originalTask.childIpId, address(this), address(REVENUE_TOKEN), originalTask.reward);

        address[] memory childIpIds = new address[](1);
        address[] memory royaltyPolicies = new address[](1);
        address[] memory currencyTokens = new address[](1);
        childIpIds[0] = originalTask.childIpId;
        royaltyPolicies[0] = address(ROYALTY_POLICY_LAP);
        currencyTokens[0] = address(REVENUE_TOKEN);
        uint256[] memory amountsClaimed = ROYALTY_WORKFLOWS.claimAllRevenue({
            ancestorIpId: agents[_msgSender()].ipAssetId,
            claimer: agents[_msgSender()].ipAssetId,
            childIpIds: childIpIds,
            royaltyPolicies: royaltyPolicies,
            currencyTokens: currencyTokens
        });
        
        emit TaskResultSent(originalTask.requester, _msgSender(), originalTask.id, taskResult);
    }


    function _loadTask(
        address _agentId,
        MarketLib.Task storage originalTask,
        uint256 agentFee
    ) internal {
        uint256 rewardDiff = originalTask.reward - agentFee;
        if (rewardDiff > 0) {
            withdrawalAmount[originalTask.requester] += rewardDiff;
        }
        
        originalTask.reward = agentFee;
        originalTask.agentId = _agentId;

        uint256 childTokenId = AGENT_NFT.mint(address(this));
        address childIpId = IP_ASSET_REGISTRY.register(
            block.chainid, address(AGENT_NFT), childTokenId);

        // mint a license token from the parent
        uint256 licenseTokenId = LICENSING_MODULE.mintLicenseTokens({
            licensorIpId: agents[_agentId].ipAssetId,
            licenseTemplate: address(PIL_TEMPLATE),
            licenseTermsId: agents[_agentId].licenceTermsId,
            amount: 1,
            receiver: address(this),
            royaltyContext: "", // for PIL, royaltyContext is empty string
            maxMintingFee: 0,
            maxRevenueShare: 0
        });

        uint256[] memory licenseTokenIds = new uint256[](1);
        licenseTokenIds[0] = licenseTokenId;

        // register the new child IPA as a derivative
        // of the parent
        LICENSING_MODULE.registerDerivativeWithLicenseTokens({
            childIpId: childIpId,
            licenseTokenIds: licenseTokenIds,
            royaltyContext: "", // empty for PIL
            maxRts: 0
        });
        originalTask.childIpId = childIpId;
        originalTask.childTokenId = childTokenId;

        agentInbox[_agentId] = originalTask;
        agentTotals[_agentId].assigned++;
        if (originalTask.isMultiTask) {
            multiTasksAssigned[_agentId][originalTask.parentTaskId]++;
        }

        // transfer the NFT to the receiver so it owns the child IPA
        AGENT_NFT.transferFrom(address(this), _agentId, childTokenId);

        emit TaskAssigned(originalTask.requester, _agentId, originalTask.id, originalTask);
    }

    function unassignedTasks() external view returns (uint256) {
        _assertAgentRegistered();
        return unassignedTasksLength[agents[_msgSender()].topic];
    }

    function tasksLength() external view returns (uint256) {
        return allTasks.length;
    }

    function _agentInboxCount(address _agentId) private view returns (uint256) {
        MarketLib.AgentTotals memory tot = agentTotals[_agentId];
        // approximate:
        uint256 currentlyInInbox = tot.assigned - tot.done;
        return currentlyInInbox; // currently - 1 at most..so can be simplified
    }

    function _registerAgent() internal {
        // Add only if new
        if (!agents[_msgSender()].exists) {
            agents[_msgSender()].exists = true;
            allAgents.push(_msgSender());
            agentsLength++;
        }
    }

    function _assertTopic(bytes32 _topic) internal view {
        require(topics[_topic], UnknownTopic(_topic));
    }

    function _assertAgentRegistered() internal view {
        require(agents[_msgSender()].exists, AgentNotRegistered(_msgSender()));
    }

}
