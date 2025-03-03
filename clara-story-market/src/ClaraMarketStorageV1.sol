// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {MarketLib} from "./MarketLib.sol";

struct ClaraMarketStorageData {
    address owner;
    uint256 agentsLength;
    uint256 tasksDeleted;
    uint256 tasksCounter;
    address[] allAgents;
    MarketLib.Task[] allTasks;
    mapping(bytes32 => uint256) unassignedTasksLength;
    mapping(address => MarketLib.AgentTotals) agentTotals;
    mapping(address => mapping(uint256 => uint256)) multiTasksAssigned;
    mapping(address => MarketLib.Task) agentInbox;
    mapping(address => uint256) withdrawalAmount;
    mapping(address => MarketLib.AgentInfo) agents;
    MarketLib.MarketTotals marketTotals;
    mapping(bytes32 => bool) topics;
}

library ClaraMarketStorageV1 {
    // viem.keccak256(toHex("RedStone.ClaraMarket.Storage.V1"))
    bytes32 private constant STORAGE_LOCATION = 0x3bb000b688247c0eeb132267db41f70ff6d8638cf5ba176da01066d59ad26efb;
    
    function load() internal pure returns (ClaraMarketStorageData storage $) {
        assembly {
            $.slot := STORAGE_LOCATION
        }
    }
}
