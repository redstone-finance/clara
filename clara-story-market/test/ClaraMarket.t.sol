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
import "openzeppelin-foundry-upgrades/Upgrades.sol";

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

        address proxy = Upgrades.deployTransparentProxy(
            "ClaraMarket.sol",
            msg.sender,
            abi.encodeCall(ClaraMarket.initialize, (address(susdToken)))
        );
        
        market = ClaraMarket(proxy);
    }

    function testRegisterAgentProfile() public {
        vm.startPrank(user1);

        string memory agentId = "Agent001";
        string memory topic = "chat";
        uint256 fee = 50;
        string memory metadata = "some metadata";

        vm.expectEmit(true, true, false, true);
        emit RegisteredAgent(user1, agentId);

        market.registerAgentProfile(agentId, topic, fee, metadata);
        vm.stopPrank();

        (
            bool exists,
            string memory storedId,
            address profileAddress,
            string memory storedTopic,
            uint256 storedFee,
            string memory storedMetadata
        ) = market.agents(agentId);

        assertTrue(exists, "Agent should exist after registration");
        assertEq(storedId, agentId, "Agent ID mismatch");
        assertEq(profileAddress, user1, "Agent address mismatch");
        assertEq(storedTopic, topic, "Agent topic mismatch");
        assertEq(storedFee, fee, "Agent fee mismatch");
        assertEq(storedMetadata, metadata, "Agent metadata mismatch");
    }

    function testRegisterTask() public {
        vm.startPrank(user1);
        market.registerAgentProfile("Agent001", "chat", 50, "some metadata");
        vm.stopPrank();

        vm.startPrank(user2);
        market.registerAgentProfile("Agent002", "chat", 10, "another agent");
        vm.stopPrank();

        vm.startPrank(user2);
        susdToken.approve(address(market), 500 ether);

        vm.expectEmit(true, true, false, true);
        emit RegisteredTask(user2, "TASK-0x0000000000000000000000000000000000002222-1", "Agent002", 100 ether);

        uint256 reward = 100 ether;
        market.registerTask(
            "Agent002",
            "chat",
            reward,
            "broadcast",
            "someContextId",
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
        market.registerAgentProfile("AgentA", "chat", 100 ether, "metadataA");
        vm.stopPrank();

        vm.startPrank(user2);
        market.registerAgentProfile("AgentB", "chat", 20, "metadataB");
        vm.stopPrank();

        uint256 rewardAmount = 100 ether;

        vm.startPrank(user2);
        susdToken.approve(address(market), rewardAmount);

        market.registerTask(
            "AgentB",
            "chat",
            rewardAmount,
            "broadcast",
            "",
            "someTaskPayload"
        );
        vm.stopPrank();

        vm.startPrank(user1);
        string memory assignedTaskId = "TASK-0x0000000000000000000000000000000000002222-1";

        string memory resultJSON = "{\"status\":\"done\"}";

        vm.expectEmit(true, false, false, true);
        emit TaskResultSent(user2, "TASK-0x0000000000000000000000000000000000002222-1_AgentA", "AgentA");

        market.sendResult("AgentA", "TASK-0x0000000000000000000000000000000000002222-1_AgentA", resultJSON);
        vm.stopPrank();

        uint256 finalUser1Bal = susdToken.balanceOf(user1);
        assertEq(finalUser1Bal, 1_000_000 ether + 100 ether, "AgentA did not receive reward");

        (uint256 requested,
            uint256 assigned,
            uint256 done,
            uint256 rewards
        ) = market.agentTotals("AgentA");
        assertEq(requested, 0, "AgentA never requested tasks");
        assertEq(assigned, 1, "AgentA should have 1 assigned task");
        assertEq(done, 1, "AgentA should have done 1 task");
        assertEq(rewards, 100 ether, "AgentA's total rewards mismatch");

        (uint256 marketDone, uint256 marketRewards) = market.marketTotals();
        assertEq(marketDone, 1, "marketTotals done mismatch");
        assertEq(marketRewards, 100 ether, "marketTotals rewards mismatch");
    }


    event RegisteredAgent(address indexed agentAddress, string agentId);
    event RegisteredTask(address indexed agentAddress, string taskId, string agentId, uint256 reward);
    event TaskResultSent(address indexed agentAddress, string taskId, string agentId);
}
