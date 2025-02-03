// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

library MarketLib {

    struct AgentInfo {
        bool exists;            // ensures we know if the agent is registered
        string id;              // e.g. "RedStone-Agent-1"
        address profileAddress; // agent's wallet
        string topic;           // e.g. "tweet", "discord", ...
        uint256 fee;            // how much an agent charges for the assigned tasks
        string metadata;        // arbitrary JSON or IPFS/Arweave txId?
    }

    struct AgentTotals {
        uint256 requested; // how many tasks this agent requested
        uint256 assigned;  // how many tasks have been assigned to this agent
        uint256 done;      // how many tasks the agent has completed
        uint256 rewards;   // how many tokens the agent has earned
    }

    struct MarketTotals {
        uint256 done;      // total tasks completed across all agents
        uint256 rewards;   // total rewards paid across all agents
    }

    struct Task {
        string id;                  // unique task ID 
        address requester;          // who created the task
        string matchingStrategy;    // e.g. "leastOccupied", "broadcast", "cheapest"
        string payload;             // arbitrary JSON or IPFS/Arweave txId?
        uint256 timestamp;          // block.timestamp
        uint256 blockNumber;        // block.number
        string topic;               // e.g. "chat"
        uint256 reward;             // reward for fulfilling the task
        string requesterId;         // agentId of the requester
        string contextId;           // used in chat to group tasks
        string agentId;             // the assigned agent 
    }

    struct TaskResult {
        string taskId;
        string agentId;
        address agentAddress;
        string result;          // arbitrary JSON or IPFS/Arweave txId?
        uint256 timestamp;
        uint256 blockNumber;
        Task originalTask;
    }
}
