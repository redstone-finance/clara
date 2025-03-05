// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.26;

import {ClaraMarketV1, PreviousTaskNotSentBack} from "../src/ClaraMarketV1.sol";
import {MarketLib} from "../src/MarketLib.sol";
import {ClaraIPRegister} from "../src/ClaraIPRegister.sol";
import {RevenueToken} from "../src/mocks/RevenueToken.sol";
import {AgentNFT} from "../src/mocks/AgentNFT.sol";
import {CommonBase} from "forge-std/Base.sol";
import {StdChains} from "forge-std/StdChains.sol";
import {StdCheats, StdCheatsSafe} from "forge-std/StdCheats.sol";
import {StdUtils} from "forge-std/StdUtils.sol";
import {Test} from "forge-std/Test.sol";
import {console} from "forge-std/console.sol";
import { MockIPGraph } from "@storyprotocol/test/mocks/MockIPGraph.sol";
import { IPAssetRegistry } from "@storyprotocol/core/registries/IPAssetRegistry.sol";
import { LicenseRegistry } from "@storyprotocol/core/registries/LicenseRegistry.sol";
import { IIPAccount } from "@storyprotocol/core/interfaces/IIPAccount.sol";
import "openzeppelin-foundry-upgrades/Upgrades.sol";

contract ClaraMarketTest is Test {
    RevenueToken internal revToken;
    ClaraIPRegister internal register;
    ClaraMarketV1 internal market;
    AgentNFT internal agentNft;

    // Two test addresses
    address internal agent_1 = address(0x1111);
    address internal agent_2 = address(0x2222);
    address internal agent_3 = address(0x3333);
    address internal agent_4 = address(0x4444);
    address internal agent_5 = address(0x5555);
    address internal agent_6 = address(0x6666);
    

    // "IPAssetRegistry": "0x77319B4031e6eF1250907aa00018B8B1c67a244b",
    address internal ipAssetRegistry = 0x77319B4031e6eF1250907aa00018B8B1c67a244b;
    // "LicensingModule": "0x04fbd8a2e56dd85CFD5500A4A4DfA955B9f1dE6f",
    address internal licensingModule = 0x04fbd8a2e56dd85CFD5500A4A4DfA955B9f1dE6f;
    // "PILicenseTemplate": "0x2E896b0b2Fdb7457499B56AAaA4AE55BCB4Cd316",
    address internal pilTemplate = 0x2E896b0b2Fdb7457499B56AAaA4AE55BCB4Cd316;
    // "RoyaltyPolicyLAP": "0xBe54FB168b3c982b7AaE60dB6CF75Bd8447b390E",
    address internal royaltyPolicyLAP = 0xBe54FB168b3c982b7AaE60dB6CF75Bd8447b390E;
    // "RoyaltyWorkflows": "0x9515faE61E0c0447C6AC6dEe5628A2097aFE1890",
    address internal royaltyWorkflows = 0x9515faE61E0c0447C6AC6dEe5628A2097aFE1890;
    //  "RoyaltyModule": "0xD2f60c40fEbccf6311f8B47c4f2Ec6b040400086",
    address internal royaltyModule = 0xD2f60c40fEbccf6311f8B47c4f2Ec6b040400086;
    // "WIP": "0x1514000000000000000000000000000000000000"
    address payable internal _revenueToken = payable(0x1514000000000000000000000000000000000000);

    // Protocol Core - LicenseRegistry
    address internal licenseRegistry = 0x529a750E02d8E2f15649c13D69a465286a780e24;
   
    function setUp() public {
        // this is only for testing purposes
        // due to our IPGraph precompile not being
        // deployed on the fork
        vm.etch(address(0x0101), address(new MockIPGraph()).code);
        
        revToken = RevenueToken(_revenueToken);

        // 2. Mint some tokens to our test users
        vm.startPrank(agent_1);
        vm.deal(agent_1, 100000 ether);
        revToken.deposit{value: 10000 ether}();
        vm.stopPrank();
        
        vm.startPrank(agent_2);
        vm.deal(agent_2, 10000 ether);
        revToken.deposit{value: 1000 ether}();
        vm.stopPrank();
        
        vm.startPrank(agent_3);
        vm.deal(agent_3, 10000 ether);
        revToken.deposit{value: 1000 ether}();
        vm.stopPrank();
        
        vm.startPrank(agent_4);
        vm.deal(agent_4, 10000 ether);
        revToken.deposit{value: 1000 ether}();
        vm.stopPrank();

        // 3. Deploy the ClaraIPRegister contract
        register = new ClaraIPRegister(
            ipAssetRegistry,
            licensingModule,
            pilTemplate,
            royaltyPolicyLAP,
            royaltyWorkflows,
            _revenueToken);

        // 3. Deploy the ClaraMarket contract
        address proxy = Upgrades.deployTransparentProxy(
            "ClaraMarketV1.sol",
            msg.sender,
            abi.encodeCall(
                ClaraMarketV1.initialize,
                (address(register),
                    royaltyModule,
                _revenueToken)));

        market = ClaraMarketV1(proxy);
        register.transferOwnership(address(market));
        agentNft = AgentNFT(register.AGENT_NFT());
    }

    function testRegisterAgentProfileSkip() public {
        vm.startPrank(agent_1);
        IPAssetRegistry IP_ASSET_REGISTRY = IPAssetRegistry(ipAssetRegistry);
        LicenseRegistry LICENSE_REGISTRY = LicenseRegistry(licenseRegistry);

        uint256 expectedTokenId = agentNft.nextTokenId();
        address expectedIpId = IP_ASSET_REGISTRY.ipId(block.chainid, address(agentNft), expectedTokenId);

        market.registerAgentProfile(50 ether, "chat", "some metadata");
        (address licenseTemplate, uint256 attachedLicenseTermsId) = LICENSE_REGISTRY.getAttachedLicenseTerms({
            ipId: expectedIpId,
            index: 0
        });
        
        vm.stopPrank();

        MarketLib.AgentInfo memory agent = market.agent(agent_1);

        assertTrue(agent.exists, "Agent should exist after registration");
        assertFalse(agent.paused, "Agent should not be paused");
        assertEq(agent.id, agent_1, "Agent address mismatch");
        assertEq(agent.topic, "chat", "Agent topic mismatch");
        assertEq(agent.fee, 50 ether, "Agent fee mismatch");
        assertEq(agent.metadata, "some metadata", "Agent metadata mismatch");
        assertEq(agent.ipAssetId, expectedIpId, "IP Asset ID mismatch");
        assertEq(agent.canNftTokenId, expectedTokenId, "Token ID mismatch");
        assertEq(agent.licenceTermsId, attachedLicenseTermsId, "License terms ID mismatch");
    }

    function testMultitaskSkip() public {
        vm.startPrank(agent_1);
        market.registerAgentProfile(50 ether, "chat", "some metadata 1");
        vm.stopPrank();

        vm.startPrank(agent_2);
        market.registerAgentProfile(25 ether, "chat", "some metadata 2");
        vm.stopPrank();

        vm.startPrank(agent_3);
        market.registerAgentProfile(50 ether, "chat", "some metadata 3");
        vm.stopPrank();

        vm.startPrank(agent_4);
        market.registerAgentProfile(75 ether, "chat", "some metadata 4");
        vm.stopPrank();

        uint256 reward = 100 ether;
        uint256 tasksCount = 10;
        vm.startPrank(agent_1);
        revToken.approve(address(market), tasksCount * reward);
        market.registerMultiTask(
            tasksCount,
            reward,
            2,
            "chat",
            "task payload"
        );
        assertEq(market.unassignedTasksLength("chat"), 10, "There should be 10 unassigned tasks");
        assertEq(market.unassignedTasks(), 10, "There should be 10 unassigned tasks");
        vm.stopPrank();
        vm.startPrank(agent_2);
        market.loadNextTask();
        assertEq(market.withdrawalAmount(agent_1), 75 ether, "Should have 75 WIP to withdraw");
        vm.stopPrank();

        vm.startPrank(agent_3);
        market.loadNextTask();
        assertEq(market.withdrawalAmount(agent_1), 125 ether, "Should have 125 WIP to withdraw");
        vm.stopPrank();

        vm.startPrank(agent_4);
        market.loadNextTask();
        assertEq(market.withdrawalAmount(agent_1), 150 ether, "Should have 150 WIP to withdraw");
        vm.stopPrank();
        
        vm.startPrank(agent_1);
        market.withdraw();
        assertEq(market.withdrawalAmount(agent_1), 0, "Should have 0 WIP to withdraw");
        vm.stopPrank();
        
        MarketLib.AgentTotals memory agentTotals_2 = market.agentTotals(agent_2);
        assertEq(agentTotals_2.assigned, 1, "Agent 2 should have 1 task assigned");

        MarketLib.AgentTotals memory agentTotals_3 = market.agentTotals(agent_3);
        assertEq(agentTotals_3.assigned, 1, "Agent 3 should have 1 task assigned");

        MarketLib.AgentTotals memory agentTotals_4 = market.agentTotals(agent_4);
        assertEq(agentTotals_4.assigned, 1, "Agent 4 should have 1 task assigned");

        vm.startPrank(agent_2);
        market.sendResult(1, "whatever");
        market.loadNextTask();
        vm.stopPrank();

        vm.startPrank(agent_3);
        market.sendResult(2, "whatever");
        market.loadNextTask();
        vm.stopPrank();

        vm.startPrank(agent_4);
        market.sendResult(3, "whatever");
        market.loadNextTask();
        assertEq(market.unassignedTasks(), 4, "There should be 4 unassigned tasks");
        assertEq(market.unassignedTasksLength("chat"), 4, "There should be 4 unassigned tasks");

        assertEq(market.tasksDeleted(), 6, "should have 6 tasks deleted");
        assertEq(market.tasksLength(), 10, "should have 10 tasks");
        vm.startPrank(agent_4);
        market.cleanTasks();
        vm.stopPrank();
        assertEq(market.tasksDeleted(), 0, "should have 0 tasks deleted");
        assertEq(market.tasksLength(), 4, "should have 4 tasks");
        
        vm.stopPrank();
        
        MarketLib.AgentTotals memory agentTotals_2_2 = market.agentTotals(agent_2);
        assertEq(agentTotals_2_2.assigned, 2, "Agent 2 should have 2 tasks assigned");
        
        MarketLib.AgentTotals memory agentTotals_3_2 = market.agentTotals(agent_3);
        assertEq(agentTotals_3_2.assigned, 2, "Agent 3 should have 2 tasks assigned");
        
        MarketLib.AgentTotals memory agentTotals_4_2 = market.agentTotals(agent_4);
        assertEq(agentTotals_4_2.assigned, 2, "Agent 4 should have 2 tasks assigned");

        vm.startPrank(agent_2);
        market.sendResult(4, "whatever");
        market.loadNextTask();
        vm.stopPrank();
        MarketLib.AgentTotals memory agentTotals_2_3 = market.agentTotals(agent_2);
        // because max tasks per agent is 2.
        assertEq(agentTotals_2_3.assigned, 2, "Agent 2 should have 2 tasks assigned");

        vm.startPrank(agent_5);
        market.registerAgentProfile(50 ether, "chat", "some metadata 5");
        market.loadNextTask();
        market.sendResult(7, "whatever");
        market.loadNextTask();
        market.sendResult(8, "whatever");
        assertEq(market.unassignedTasks(), 2, "There should be 2 unassigned tasks");
        assertEq(market.unassignedTasksLength("chat"), 2, "There should be 2 unassigned tasks");
        vm.stopPrank();

        MarketLib.AgentTotals memory totals5 = market.agentTotals(agent_5);
        assertEq(totals5.assigned, 2, "Agent 5 should have 2 tasks assigned");
        assertEq(totals5.done, 2, "Agent 5 should have 2 tasks done");

        vm.startPrank(agent_6);
        market.registerAgentProfile(25 ether, "chat", "some metadata 6");
        market.loadNextTask();
        market.sendResult(9, "whatever");
        market.loadNextTask();
        market.sendResult(10, "whatever");
        assertEq(market.unassignedTasks(), 0, "There should be 0 unassigned tasks");
        assertEq(market.unassignedTasksLength("chat"), 0, "There should be no unassigned tasks");
        vm.stopPrank();

        MarketLib.AgentTotals memory totals6 = market.agentTotals(agent_6);
        assertEq(totals5.assigned, 2, "Agent 6 should have 2 tasks assigned");
        assertEq(totals5.done, 2, "Agent 6 should have 2 tasks done");
        
        MarketLib.Task memory task = market.taskById(0);
        assertEq(task.isDeleted, true, "Task should be deleted");
        
        assertEq(market.tasksDeleted(), 4, "should have 4 tasks deleted");
        assertEq(market.tasksLength(), 4, "should have 4 tasks");
        vm.startPrank(agent_6);
        market.cleanTasks();
        vm.stopPrank();
        assertEq(market.tasksDeleted(), 0, "should have 0 tasks deleted");
        assertEq(market.tasksLength(), 0, "should have 0 tasks");
    }


    function testRegisterTaskSkip() public {
        IPAssetRegistry IP_ASSET_REGISTRY = IPAssetRegistry(ipAssetRegistry);

        vm.startPrank(agent_1);
        market.registerAgentProfile(50 ether, "chat", "some metadata");
        vm.stopPrank();

        vm.startPrank(agent_2);
        market.registerAgentProfile(10 ether, "chat", "another agent");
        vm.stopPrank();

        vm.startPrank(agent_2);
        revToken.approve(address(market), 500 ether);
        uint256 expectedTokenId = agentNft.nextTokenId();
        address expectedIpId = IP_ASSET_REGISTRY.ipId(block.chainid, address(agentNft), expectedTokenId);
        uint256 expectedTaskId = market.tasksCounter();
         
        uint256 reward = 100 ether;
        market.registerTask(
            reward,
            0,
            "chat",
            "task payload"
        );

        vm.startPrank(agent_1);
        vm.expectEmit(true, true, true, false); // TODO: fix checkData
        emit TaskAssigned(agent_2, agent_1,  expectedTaskId, MarketLib.Task({
            id: expectedTaskId,
            contextId: expectedTaskId,
            blockNumber: block.number,
            reward: 50 ether, // cause that's the assigned agent's fee
            requester: agent_2,
            agentId: agent_1,
            payload: "task payload",
            topic: "chat",
            childTokenId: expectedTokenId,
            childIpId: expectedIpId,
            maxRepeatedPerAgent: 0,
            parentTaskId: 0,
            isMultiTask: false,
            isDeleted: false
        }));
        market.loadNextTask();
        vm.stopPrank();

        uint256 marketBalance = revToken.balanceOf(address(market));
        assertEq(marketBalance, reward, "Market contract should hold the reward");

        vm.stopPrank();
    }

    function testLoadTwoTasksInARowSkip() public {
        IPAssetRegistry IP_ASSET_REGISTRY = IPAssetRegistry(ipAssetRegistry);

        vm.startPrank(agent_1);
        market.registerAgentProfile(50 ether, "chat", "some metadata");
        vm.stopPrank();

        vm.startPrank(agent_2);
        market.registerAgentProfile(10 ether, "chat", "another agent");
        vm.stopPrank();

        vm.startPrank(agent_2);
        revToken.approve(address(market), 500 ether);
        uint256 reward = 100 ether;
        market.registerTask(
            reward,
            0,
            "chat",
            "task payload"
        );
        market.registerTask(
            reward,
            0,
            "chat",
            "task payloa2"
        );
        market.registerTask(
            2 ether,
            0,
            "chat",
            "task payloa2"
        );

        
        vm.startPrank(agent_1);
        assertEq(market.unassignedTasks(), 2, "Agent should have 2 assignable tasks");
        market.loadNextTask();
        uint256 marketBalance = revToken.balanceOf(address(market));
        assertEq(marketBalance, reward * 2 + 2 ether, "Market contract should hold the reward");

        vm.expectPartialRevert(PreviousTaskNotSentBack.selector);
        market.loadNextTask();
        vm.stopPrank();
    }
    
    function testSendResul() public {
        vm.startPrank(agent_1);
        market.registerAgentProfile(100 ether, "chat", "metadataA");
        vm.stopPrank();

        vm.startPrank(agent_2);
        market.registerAgentProfile(20 ether, "chat", "metadataB");
        vm.stopPrank();

        uint256 rewardAmount = 100 ether;

        vm.startPrank(agent_2);
        revToken.approve(address(market), rewardAmount);

        market.registerTask(
            rewardAmount,
            0,
            "chat",
            "someTaskPayload"
        );

        vm.stopPrank();

        vm.startPrank(agent_1);
        market.loadNextTask();
        
        uint256 assignedTaskId = 1;

        string memory resultJSON = "{\"status\":\"done\"}";

        vm.expectEmit(true, true, true, true);
        emit TaskResultSent(agent_2, agent_1, assignedTaskId, MarketLib.TaskResult({
            id: assignedTaskId,
            timestamp: block.timestamp,
            blockNumber: block.number,
            result: resultJSON
        }));

        market.sendResult(assignedTaskId, resultJSON);


        MarketLib.AgentInfo memory agent = market.agent(agent_1);

        uint256 currentAgentBalance = revToken.balanceOf(agent_1);
        assertEq(revToken.balanceOf(agent.ipAssetId), 100 ether);
        IIPAccount ipAccount = IIPAccount(payable(agent.ipAssetId));
        ipAccount.execute(
            address(revToken),
            0,
            abi.encodeCall(revToken.transfer, (agent_1, 100 ether)
            ));
        vm.stopPrank();

        assertEq(revToken.balanceOf(agent_1), currentAgentBalance + 100 ether);
        assertEq(revToken.balanceOf(agent.ipAssetId), 0);


        MarketLib.AgentTotals memory agentTotals = market.agentTotals(agent_1);
        assertEq(agentTotals.requested, 0, "AgentA never requested tasks");
        assertEq(agentTotals.assigned, 1, "AgentA should have 1 assigned task");
        assertEq(agentTotals.done, 1, "AgentA should have done 1 task");
        assertEq(agentTotals.rewards, 100 ether, "AgentA's total rewards mismatch");

        MarketLib.MarketTotals memory marketTotals = market.marketTotals();
        assertEq(marketTotals.done, 1, "marketTotals done mismatch");
        assertEq(marketTotals.rewards, 100 ether, "marketTotals rewards mismatch");
    }

    function testViewUnassignedTasks() public {
        IPAssetRegistry IP_ASSET_REGISTRY = IPAssetRegistry(ipAssetRegistry);

        vm.startPrank(agent_1);
        market.registerAgentProfile(50 ether, "chat", "some metadata");
        vm.stopPrank();

        vm.startPrank(agent_2);
        market.registerAgentProfile(50 ether, "chat", "some metadata");
        vm.stopPrank();

        vm.startPrank(agent_1);
        revToken.approve(address(market), 500 ether);
         
        uint256 reward = 100 ether;
        market.registerTask(
            reward,
            0,
            "chat",
            "task payload"
        );

        uint256 reward_2 = 50 ether;
        market.registerTask(
            reward_2,
            0,
            "tweet",
            "task payload"
        );
        vm.stopPrank();

        vm.startPrank(agent_2);
        revToken.approve(address(market), 500 ether);

        uint256 reward_3 = 25 ether;
        market.registerTask(
            reward_3,
            0,
            "nft",
            "task payload"
        );
        vm.stopPrank();


        MarketLib.Task[] memory tasks = market.allUnassignedTasks();
        assertEq(tasks[0].topic, "chat");
        assertEq(tasks[0].reward, reward);
        assertEq(tasks[1].topic, "tweet");
        assertEq(tasks[1].reward, reward_2);
        assertEq(tasks[2].topic, "nft");
        assertEq(tasks[2].reward, reward_3);
        assertEq(tasks.length, 3);


        MarketLib.Task[] memory tasksPerAgent = market.allUnassignedTasks(agent_1);
        assertEq(tasksPerAgent[0].topic, "chat");
        assertEq(tasksPerAgent[0].reward, reward);
        assertEq(tasksPerAgent[1].topic, "tweet");
        assertEq(tasksPerAgent[1].reward, reward_2);
        assertEq(tasksPerAgent.length, 2);
    }

    function testDeleteTasks() public {
        IPAssetRegistry IP_ASSET_REGISTRY = IPAssetRegistry(ipAssetRegistry);

        vm.startPrank(agent_1);
        market.registerAgentProfile(50 ether, "chat", "some metadata");
        vm.stopPrank();

        vm.startPrank(agent_1);
        revToken.approve(address(market), 500 ether);

        uint256 reward = 100 ether;
        market.registerTask(
            reward,
            0,
            "chat",
            "task payload"
        );

        uint256 reward_2 = 50 ether;
        market.registerTask(
            reward_2,
            0,
            "tweet",
            "task payload"
        );

        MarketLib.Task[] memory tasks = market.allUnassignedTasks();
        assertEq(tasks.length, 2);
        uint256[] memory taskIds = new uint256[](tasks.length);
        for (uint256 i = 0; i < tasks.length; i++) {
            taskIds[i] = tasks[i].id;
        }
        uint256 currentAgentBalance = revToken.balanceOf(agent_1);
        market.deleteTasks(taskIds);
        vm.stopPrank();
        assertEq(market.tasksDeleted(), 2);
        uint256 newAgentBalance = revToken.balanceOf(agent_1);
        assertEq(newAgentBalance - currentAgentBalance, 150 ether);
    }

    function testDeleteTasksNonOwner() public {
        IPAssetRegistry IP_ASSET_REGISTRY = IPAssetRegistry(ipAssetRegistry);

        vm.startPrank(agent_1);
        market.registerAgentProfile(50 ether, "chat", "some metadata");
        vm.stopPrank();

        vm.startPrank(agent_2);
        market.registerAgentProfile(100 ether, "tweet", "some metadata");
        vm.stopPrank();

        vm.startPrank(agent_1);
        revToken.approve(address(market), 500 ether);

        uint256 reward = 100 ether;
        market.registerTask(
            reward,
            0,
            "chat",
            "task payload"
        );
        vm.stopPrank();

        vm.startPrank(agent_2);
        MarketLib.Task[] memory tasks = market.allUnassignedTasks();
        assertEq(tasks.length, 1);
        uint256[] memory taskIds = new uint256[](tasks.length);
        for (uint256 i = 0; i < tasks.length; i++) {
            taskIds[i] = tasks[i].id;
        }
        vm.expectRevert(UnauthorizedAccess.selector);
        market.deleteTasks(taskIds);
        vm.stopPrank();
        assertEq(market.tasksDeleted(), 0);
    }

    event RegisteredAgent(address indexed agent, MarketLib.AgentInfo agentInfo);
    event TaskAssigned(address indexed requestingAgent, address indexed assignedAgent, uint256 indexed taskId, MarketLib.Task task);
    event TaskResultSent(address indexed requestingAgent, address indexed assignedAgent, uint256 indexed taskId, MarketLib.TaskResult taskResult);

    error UnauthorizedAccess();
}
