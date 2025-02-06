// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.26;

import {ClaraMarket} from "../src/ClaraMarket.sol";
import {MarketLib} from "../src/MarketLib.sol";
import {SUSD} from "../src/mocks/SUSD.sol";
import {CommonBase} from "forge-std/Base.sol";
import {StdChains} from "forge-std/StdChains.sol";
import {StdCheats, StdCheatsSafe} from "forge-std/StdCheats.sol";
import {StdUtils} from "forge-std/StdUtils.sol";
import {Test} from "forge-std/Test.sol";
import {console} from "forge-std/console.sol";

contract AgentsMarketTest is Test {
    SUSD internal susdToken;
    ClaraMarket internal market;

    // Two test addresses
    address internal user1 = address(0x1111);
    address internal user2 = address(0x2222);

    function setUp() public {
        // 1. Deploy a mock SUSD token
        susdToken = new SUSD();

        // 2. Mint some tokens to our test users
        susdToken.mint(user1, 1_000_000 ether);
        susdToken.mint(user2, 1_000_000 ether);

        // 3. Deploy the AgentsMarket contract and pass the SUSD address
        market = new ClaraMarket(address(susdToken));
    }

    function testRegisterAgentProfile() public {
        vm.startPrank(user1);

        string memory topic = "chat";
        uint256 fee = 50;
        string memory metadata = "some metadata";

        vm.expectEmit(true, false, false, true);
        emit RegisteredAgent(user1, MarketLib.AgentInfo({
            exists: true,
            id: user1,
            fee: fee,
            topic: topic,
            metadata: metadata
        }));

        market.registerAgentProfile(fee, topic, metadata);
        vm.stopPrank();

        (
            bool exists,
            address id,
            uint256 storedFee,
            string memory storedTopic,
            string memory storedMetadata
        ) = market.agents(user1);

        assertTrue(exists, "Agent should exist after registration");
        assertEq(id, user1, "Agent address mismatch");
        assertEq(storedTopic, topic, "Agent topic mismatch");
        assertEq(storedFee, fee, "Agent fee mismatch");
        assertEq(storedMetadata, metadata, "Agent metadata mismatch");
    }

    function testRegisterTask() public {
        vm.startPrank(user1);
        market.registerAgentProfile(50, "chat", "some metadata");
        vm.stopPrank();

        vm.startPrank(user2);
        market.registerAgentProfile(10, "chat", "another agent");
        vm.stopPrank();

        vm.startPrank(user2);
        susdToken.approve(address(market), 500 ether);

        vm.expectEmit(true, true, true, false);
        emit TaskAssigned(user2,user1,  1, MarketLib.Task({
            id: 1,
            contextId: 1,
            timestamp: 1,
            blockNumber: 1,
            reward: 100 ether,
            requester: user2,
            agentId: user1,
            matchingStrategy: "broadcast",
            payload: "task payload",
            topic: "chat"
        }));

        uint256 reward = 100 ether;
        market.registerTask(
            reward,
            0,
            "chat",
            "broadcast",
            "task payload"
        );

        uint256 marketBalance = susdToken.balanceOf(address(market));
        assertEq(marketBalance, reward, "Market contract should hold the reward");

        // QueueLib.Queue memory tasks = market.tasksQueue();
        //assertEq(market.tasksQueue().length(), 1, "taskQueue might be empty if _dispatchTasksInternal assigned it immediately");
        //console.log(tasks[0].id);
        vm.stopPrank();
    }

    function testSendResult() public {
        vm.startPrank(user1);
        market.registerAgentProfile(100 ether, "chat", "metadataA");
        vm.stopPrank();

        vm.startPrank(user2);
        market.registerAgentProfile(20, "chat", "metadataB");
        vm.stopPrank();

        uint256 rewardAmount = 100 ether;

        vm.startPrank(user2);
        susdToken.approve(address(market), rewardAmount);

        market.registerTask(
            rewardAmount,
            0,
            "chat",
            "broadcast",
            "someTaskPayload"
        );

        vm.stopPrank();

        vm.startPrank(user1);
        uint256 assignedTaskId = 1;

        string memory resultJSON = "{\"status\":\"done\"}";

        vm.expectEmit(true, true, true, true);
        emit TaskResultSent(user2, user1, assignedTaskId, MarketLib.TaskResult({
            id: assignedTaskId,
            timestamp: 1,
            blockNumber: 1,
            result: resultJSON
        }));

        market.sendResult(assignedTaskId, resultJSON);
        vm.stopPrank();

        uint256 finalUser1Bal = susdToken.balanceOf(user1);
        assertEq(finalUser1Bal, 1_000_000 ether + 100 ether, "AgentA did not receive reward");

        (uint256 requested,
            uint256 assigned,
            uint256 done,
            uint256 rewards
        ) = market.agentTotals(user1);
        assertEq(requested, 0, "AgentA never requested tasks");
        assertEq(assigned, 1, "AgentA should have 1 assigned task");
        assertEq(done, 1, "AgentA should have done 1 task");
        assertEq(rewards, 100 ether, "AgentA's total rewards mismatch");

        (uint256 marketDone, uint256 marketRewards) = market.marketTotals();
        assertEq(marketDone, 1, "marketTotals done mismatch");
        assertEq(marketRewards, 100 ether, "marketTotals rewards mismatch");
    }


    event RegisteredAgent(address indexed agent, MarketLib.AgentInfo agentInfo);
    event TaskAssigned(address indexed requestingAgent, address indexed assignedAgent, uint256 indexed taskId, MarketLib.Task task);
    event TaskResultSent(address indexed requestingAgent, address indexed assignedAgent, uint256 indexed taskId, MarketLib.TaskResult taskResult);
}
