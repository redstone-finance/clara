// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "./ClaraMarketRead.sol";

import "./ClaraMarketStorageV1.sol";
import "./ClaraMarketWrite.sol";
import "./QueueLib.sol";
import "./ClaraIPRegister.sol";
import "./mocks/AgentNFT.sol";
import "./mocks/RevenueToken.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {Context} from "@openzeppelin/contracts/utils/Context.sol";
import {ILicensingModule} from "@storyprotocol/core/interfaces/modules/licensing/ILicensingModule.sol";
import {IPAssetRegistry} from "@storyprotocol/core/registries/IPAssetRegistry.sol";
import {IPILicenseTemplate} from "@storyprotocol/core/interfaces/modules/licensing/IPILicenseTemplate.sol";
import {IRoyaltyModule} from "@storyprotocol/core/interfaces/modules/royalty/IRoyaltyModule.sol";
import {IRoyaltyWorkflows} from "@storyprotocol/periphery/interfaces/workflows/IRoyaltyWorkflows.sol";
import {MarketLib} from "./MarketLib.sol";
import {PILFlavors} from "@storyprotocol/core/lib/PILFlavors.sol";
import {PILTerms} from "@storyprotocol/core/interfaces/modules/licensing/IPILicenseTemplate.sol";
import {RoyaltyPolicyLAP} from "@storyprotocol/core/modules/royalty/policies/LAP/RoyaltyPolicyLAP.sol";

error UnknownTopic(bytes32 topic);
error UnknownMatchingStrategy(bytes32 strategy);
error AgentNotRegistered(address agent);
error AgentAlreadyRegistered(address agent);
error TaskNotFound(uint256 taskId);
error ValueNegative();
error NoAgentsMatchedForTask();
error PreviousTaskNotSentBack(uint256 taskId);
error AgentPaused(address agent);
error NoTaskIdsProvided();
error UnauthorizedAccess();


/**
 * @title ClaraMarketV1
 */
contract ClaraMarketV1 is Context, ClaraMarketRead, ClaraMarketWrite, Initializable {
    // constants
    bytes32 internal constant TOPIC_TWEET = "tweet";
    bytes32 internal constant TOPIC_DISCORD = "discord";
    bytes32 internal constant TOPIC_TELEGRAM = "telegram";
    bytes32 internal constant TOPIC_NFT = "nft";
    bytes32 internal constant TOPIC_CHAT = "chat";
    bytes32 internal constant TOPIC_NONE = "none";
    
    address internal constant ZERO_ADDRESS = address(0);

    // public
    IRoyaltyModule public ROYALTY_MODULE;
    RevenueToken public REVENUE_TOKEN;
    ClaraIPRegister public CLARA_IP_REGISTER;

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

    function initialize(
        address claraIPRegister,
        address royaltyModule,
        address payable _revenueToken) public initializer {
        
        REVENUE_TOKEN = RevenueToken(_revenueToken);
        ROYALTY_MODULE = IRoyaltyModule(royaltyModule);
        CLARA_IP_REGISTER = ClaraIPRegister(claraIPRegister);
        
        _getStorage().topics[TOPIC_TWEET] = true;
        _getStorage().topics[TOPIC_DISCORD] = true;
        _getStorage().topics[TOPIC_TELEGRAM] = true;
        _getStorage().topics[TOPIC_NFT] = true;
        _getStorage().topics[TOPIC_CHAT] = true;
        _getStorage().topics[TOPIC_NONE] = true;

        _getStorage().tasksCounter = 1;
        
        _getStorage().owner = _msgSender();
    }

    function withdraw()
    external {
        _assertAgentRegistered();
        uint256 amount = _getStorage().withdrawalAmount[_msgSender()];
        if (amount > 0) {
            _getStorage().withdrawalAmount[_msgSender()] = 0;
            REVENUE_TOKEN.transfer(_msgSender(), amount);
            emit RewardWithdrawn(_msgSender(), amount);
        }
    }

    function cleanTasks()
    external {
        _assertAgentRegistered();
        if (_getStorage().tasksDeleted > 0) {
            uint256 write = 0;
            uint256 tasksLen = _getStorage().allTasks.length;
            for (uint256 i = 0; i < tasksLen; i++) {
                // If the element should be kept...
                if (!_getStorage().allTasks[i].isDeleted) {
                    _getStorage().allTasks[write] = _getStorage().allTasks[i];
                    write++;
                }
            }
            // Remove extra tail elements
            while (_getStorage().allTasks.length > write) {
                _getStorage().allTasks.pop();
            }
            _getStorage().tasksDeleted = 0;
        }
    }

    function registerAgentProfile(
        uint256 _fee,
        bytes32 _topic,
        string calldata _metadata
    )
    external
    {
        require(_getStorage().agents[_msgSender()].exists == false, AgentAlreadyRegistered(_msgSender()));
        _assertTopic(_topic);
        require(_fee >= 0, ValueNegative());
        
        (uint256 tokenId, address ipId, uint256 licenseTermsId) = CLARA_IP_REGISTER.registerAgentProfile(_msgSender());
        
        _registerAgent();
        _getStorage().agents[_msgSender()] = MarketLib.AgentInfo({
            exists: true,
            paused: false,
            id: _msgSender(),
            topic: _topic,
            fee: _fee,
            metadata: _metadata,
            ipAssetId: ipId,
            canNftTokenId: tokenId,
            licenceTermsId: licenseTermsId
        });
        
        emit AgentRegistered(_msgSender(), _getStorage().agents[_msgSender()]);
    }

    function updateAgentFee(uint256 _fee)
    external
    {
        _assertAgentRegistered();
        require(_fee >= 0, ValueNegative());

        _getStorage().agents[_msgSender()].fee = _fee;
        emit AgentUpdated(_msgSender(), _getStorage().agents[_msgSender()]);
    }

    function updateAgentPaused(bool paused)
    external
    {
        _assertAgentRegistered();
        
        _getStorage().agents[_msgSender()].paused = paused;
        emit AgentUpdated(_msgSender(), _getStorage().agents[_msgSender()]);
    }

    function updateAgentTopic(bytes32 _topic)
    external
    {
        require(_getStorage().agents[_msgSender()].exists == true, AgentNotRegistered(_msgSender()));
        _assertTopic(_topic);

        _getStorage().agents[_msgSender()].topic = _topic;
        emit AgentUpdated(_msgSender(), _getStorage().agents[_msgSender()]);
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
        _assertAgentNotPaused();
        require(_reward >= 0, ValueNegative());
        _assertTopic(_topic);

        _getStorage().agentTotals[_msgSender()].requested += 1;
        
        uint256 taskId = _getStorage().tasksCounter++;

        _getStorage().allTasks.push(MarketLib.Task({
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
        _getStorage().unassignedTasksLength[_topic]++;
        // locking Revenue Tokens on Market contract - allowance required!
        REVENUE_TOKEN.transferFrom(_msgSender(), address(this), _reward);
        
        emit TaskRegistered(_msgSender(), taskId, _getStorage().allTasks[_getStorage().allTasks.length - 1]);
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
        _assertAgentNotPaused();
        require(_maxRewardPerTask >= 0, ValueNegative());
        _assertTopic(_topic);

        _getStorage().agentTotals[_msgSender()].requested += _tasksCount; // not sure about this
        uint256 parentTaskId = _getStorage().tasksCounter++;
        
        for (uint256 i = 0; i < _tasksCount; i++) {
            uint256 taskId = _getStorage().tasksCounter++;
            
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
            _getStorage().allTasks.push(newTask);
            emit TaskRegistered(_msgSender(), taskId, newTask);
        }
        
        _getStorage().unassignedTasksLength[_topic] += _tasksCount;
        // locking Revenue Tokens on Market contract - allowance required!
        REVENUE_TOKEN.transferFrom(_msgSender(), address(this), _tasksCount * _maxRewardPerTask);
    }

    function loadNextTask()
    external
    {
        _assertAgentRegistered();
        _assertAgentNotPaused();
        address sender = _msgSender();
        if (_getStorage().unassignedTasksLength[_getStorage().agents[sender].topic] == 0) {
            return;
        }
        
        require(_getStorage().agentInbox[sender].requester == ZERO_ADDRESS, PreviousTaskNotSentBack(_getStorage().agentInbox[sender].id));
        
        require(_getStorage().agents[sender].exists == true, AgentNotRegistered(sender));
        uint256 currentTasksLength = _getStorage().allTasks.length;
        MarketLib.AgentInfo storage agent = _getStorage().agents[sender];
        
        for (uint256 i = 0; i < currentTasksLength; i++) {
            MarketLib.Task storage task = _getStorage().allTasks[i];
            if (task.isDeleted) {
                continue;
            }
            if (isTaskAssignable(agent, task, sender)) {
                _loadTask(
                    sender,
                    task,
                    agent.fee);
                _getStorage().unassignedTasksLength[task.topic]--;
                _getStorage().tasksDeleted++;
                task.isDeleted = true;
                return;
            }
        }
    }
    
    function isTaskAssignable(MarketLib.AgentInfo storage agent, MarketLib.Task storage task, address sender) internal view returns (bool) {
        return (agent.topic == task.topic
            && agent.fee <= task.reward
            && task.requester != sender
            && (!task.isMultiTask
            || (task.isMultiTask
            && _getStorage().multiTasksAssigned[sender][task.parentTaskId] < task.maxRepeatedPerAgent)));
    }

    function sendResult(
        uint256 _taskId,
        string calldata _resultJSON
    )
    external
    {
        _assertAgentRegistered();

        MarketLib.Task memory originalTask = _getStorage().agentInbox[_msgSender()];
        require(
            originalTask.id != 0,
            TaskNotFound(_taskId)
        );

        delete _getStorage().agentInbox[_msgSender()];

        _getStorage().agentTotals[_msgSender()].done += 1;
        _getStorage().agentTotals[_msgSender()].rewards += originalTask.reward;

        _getStorage().marketTotals.done += 1;
        _getStorage().marketTotals.rewards += originalTask.reward;

        MarketLib.TaskResult memory taskResult = MarketLib.TaskResult({
            id: originalTask.id,
            timestamp: block.timestamp,
            blockNumber: block.number,
            result: _resultJSON
        });

        address ipAssetId = _getStorage().agents[_msgSender()].ipAssetId;
        REVENUE_TOKEN.approve(address(ROYALTY_MODULE), originalTask.reward);
        ROYALTY_MODULE.payRoyaltyOnBehalf(originalTask.childIpId, address(this), address(REVENUE_TOKEN), originalTask.reward);
        CLARA_IP_REGISTER.claimAllRevenue(originalTask.childIpId, ipAssetId);
        
        emit TaskResultSent(originalTask.requester, _msgSender(), originalTask.id, taskResult);
    }

    function agent(address _agentId) external view returns (MarketLib.AgentInfo memory)
    {
        return _getStorage().agents[_agentId];
    }

    function agentInbox(address _agentId) external view returns (MarketLib.Task memory)
    {
        return _getStorage().agentInbox[_agentId];
    }

    function agentTotals(address _agentId) external view returns (MarketLib.AgentTotals memory)
    {
        return _getStorage().agentTotals[_agentId];
    }
    
    function unassignedTasks() external view returns (uint256) {
        _assertAgentRegistered();
        address sender = _msgSender();
        uint256 unassignedTasksCount = 0;

        uint256 currentTasksLength = _getStorage().allTasks.length;
        MarketLib.AgentInfo storage agent = _getStorage().agents[sender];

        for (uint256 i = 0; i < currentTasksLength; i++) {
            MarketLib.Task storage task = _getStorage().allTasks[i];
            if (task.isDeleted) {
                continue;
            }
            if (isTaskAssignable(agent, task, sender)) {
                unassignedTasksCount = unassignedTasksCount + 1;
            }
        }
        
        return unassignedTasksCount;
    }
    
    function unassignedTasksLength(bytes32 _topic) external view returns(uint256) {
        return _getStorage().unassignedTasksLength[_topic];
    }
    
    function withdrawalAmount(address _agentId) external view returns(uint256) {
        return _getStorage().withdrawalAmount[_agentId];
    }
    
    function tasksCounter() external view returns(uint256) {
        return _getStorage().tasksCounter;
    }

    function tasksDeleted() external view returns (uint256) {
        return _getStorage().tasksDeleted;
    }

    function taskById(uint256 id) external view returns (MarketLib.Task memory) {
        return _getStorage().allTasks[id];
    }

    function tasksLength() external view returns (uint256) {
        return _getStorage().allTasks.length;
    }

    function marketTotals() external view returns (MarketLib.MarketTotals memory) {
        return _getStorage().marketTotals;
    }

    function isAgentPaused() external view returns (bool) {
        _assertAgentRegistered();
        return _getStorage().agents[_msgSender()].paused;
    }

    function getPaymentsAddr() external view returns (address) {
        return address(REVENUE_TOKEN);
    }

    function _loadTask(
        address _agentId,
        MarketLib.Task storage originalTask,
        uint256 agentFee
    ) internal {
        uint256 rewardDiff = originalTask.reward - agentFee;
        if (rewardDiff > 0) {
            _getStorage().withdrawalAmount[originalTask.requester] += rewardDiff;
        }

        originalTask.reward = agentFee;
        originalTask.agentId = _agentId;
        
        address licensorIpId = _getStorage().agents[_agentId].ipAssetId;
        uint256 licenseTermsId = _getStorage().agents[_agentId].licenceTermsId;
        (uint256 childTokenId, address childIpId) = CLARA_IP_REGISTER.setupTask(_agentId, licensorIpId, licenseTermsId);
    
        originalTask.childIpId = childIpId;
        originalTask.childTokenId = childTokenId;

        _getStorage().agentInbox[_agentId] = originalTask;
        _getStorage().agentTotals[_agentId].assigned++;
        if (originalTask.isMultiTask) {
            _getStorage().multiTasksAssigned[_agentId][originalTask.parentTaskId]++;
        }

        emit TaskAssigned(originalTask.requester, _agentId, originalTask.id, originalTask);
    }

    function allUnassignedTasks() external view returns (MarketLib.Task[] memory) {
        return retrieveUnassignedTasks(ZERO_ADDRESS);
    }

    function allUnassignedTasks(address requestingAgent) external view returns (MarketLib.Task[] memory) {
        return retrieveUnassignedTasks(requestingAgent);
    }

    function retrieveUnassignedTasks(address requestingAgent) internal view returns (MarketLib.Task[] memory) {
        uint256 allTasksLength = _getStorage().allTasks.length;
        uint256 unassignedCount = 0;
        uint256[] memory unassignedIndices = new uint256[](allTasksLength);

        for (uint256 i = 0; i < allTasksLength; i++) {
            if (isTaskUnassigned(_getStorage().allTasks[i], requestingAgent)) {
                unassignedIndices[unassignedCount++] = i;
            }
        }

        MarketLib.Task[] memory unassignedTasks = new MarketLib.Task[](unassignedCount);
        for (uint256 i = 0; i < unassignedCount; i++) {
            unassignedTasks[i] = _getStorage().allTasks[unassignedIndices[i]];
        }
        return unassignedTasks;
    }

    function isTaskUnassigned(MarketLib.Task storage task, address requestingAgent) internal view returns (bool) {
        bool baseUnassignedConditions = !task.isDeleted && task.agentId == ZERO_ADDRESS;
        if (requestingAgent == ZERO_ADDRESS) {
            return baseUnassignedConditions;
        } else {
            return baseUnassignedConditions && task.requester == requestingAgent;
        }
    }

    function deleteTasks(uint256[] calldata taskIds) external {
        require(taskIds.length > 0, NoTaskIdsProvided());
        uint256 taskIdsLength = taskIds.length;
        MarketLib.Task[] memory allTasks = _getStorage().allTasks;
        uint256 allTasksLength = _getStorage().allTasks.length;
        for (uint256 i = 0; i < taskIdsLength; i++) {
            for (uint256 j = 0; j < allTasksLength; j++) {
                if (allTasks[j].id == taskIds[i] && !allTasks[j].isDeleted) {
                    require(_msgSender() == _getStorage().owner || _msgSender() == allTasks[j].requester, UnauthorizedAccess());
                    uint256 reward = allTasks[j].reward;
                    if (reward > 0) {
                        REVENUE_TOKEN.transfer(allTasks[j].requester, reward);
                    }
                    allTasks[j].isDeleted = true;
                    _getStorage().tasksDeleted++;
                    break;
                }
            }
        }
    }
    
    function _agentInboxCount(address _agentId) private view returns (uint256) {
        MarketLib.AgentTotals memory tot = _getStorage().agentTotals[_agentId];
        // approximate:
        uint256 currentlyInInbox = tot.assigned - tot.done;
        return currentlyInInbox; // currently - 1 at most..so can be simplified
    }

    function _registerAgent() internal {
        // Add only if new
        if (!_getStorage().agents[_msgSender()].exists) {
            _getStorage().agents[_msgSender()].exists = true;
            _getStorage().allAgents.push(_msgSender());
            _getStorage().agentsLength++;
        }
    }

    function _assertTopic(bytes32 _topic) internal view {
        require(_getStorage().topics[_topic], UnknownTopic(_topic));
    }

    function _assertAgentRegistered() internal view {
        require(_getStorage().agents[_msgSender()].exists, AgentNotRegistered(_msgSender()));
    }

    function _assertAgentNotPaused() internal view {
        require(_getStorage().agents[_msgSender()].paused == false, AgentPaused(_msgSender()));
    }

    function _getStorage() internal pure returns (ClaraMarketStorageData storage _sd) {
        return ClaraMarketStorageV1.load();
    }
}
