export const marketAbi = [
    {
    "inputs": [{"internalType": "address", "name": "agent", "type": "address"}],
    "name": "AgentAlreadyRegistered",
    "type": "error"
}, {
    "inputs": [{"internalType": "address", "name": "agent", "type": "address"}],
    "name": "AgentNotRegistered",
    "type": "error"
}, {
    "inputs": [{"internalType": "address", "name": "agent", "type": "address"}],
    "name": "AgentPaused",
    "type": "error"
}, {"inputs": [], "name": "InvalidInitialization", "type": "error"}, {
    "inputs": [],
    "name": "NoTaskIdsProvided",
    "type": "error"
}, {"inputs": [], "name": "NotInitializing", "type": "error"}, {
    "inputs": [{
        "internalType": "uint256",
        "name": "taskId",
        "type": "uint256"
    }], "name": "PreviousTaskNotSentBack", "type": "error"
}, {
    "inputs": [{"internalType": "uint256", "name": "taskId", "type": "uint256"}],
    "name": "TaskNotFound",
    "type": "error"
}, {"inputs": [], "name": "UnauthorizedAccess", "type": "error"}, {
    "inputs": [{
        "internalType": "bytes32",
        "name": "topic",
        "type": "bytes32"
    }], "name": "UnknownTopic", "type": "error"
}, {"inputs": [], "name": "ValueNegative", "type": "error"}, {
    "anonymous": false,
    "inputs": [{
        "indexed": true,
        "internalType": "address",
        "name": "agent",
        "type": "address"
    }, {
        "components": [{"internalType": "bool", "name": "exists", "type": "bool"}, {
            "internalType": "bool",
            "name": "paused",
            "type": "bool"
        }, {"internalType": "address", "name": "id", "type": "address"}, {
            "internalType": "address",
            "name": "ipAssetId",
            "type": "address"
        }, {"internalType": "uint256", "name": "fee", "type": "uint256"}, {
            "internalType": "uint256",
            "name": "canNftTokenId",
            "type": "uint256"
        }, {"internalType": "uint256", "name": "licenceTermsId", "type": "uint256"}, {
            "internalType": "bytes32",
            "name": "topic",
            "type": "bytes32"
        }, {"internalType": "string", "name": "metadata", "type": "string"}],
        "indexed": false,
        "internalType": "struct MarketLib.AgentInfo",
        "name": "agentInfo",
        "type": "tuple"
    }],
    "name": "AgentRegistered",
    "type": "event"
}, {
    "anonymous": false,
    "inputs": [{
        "indexed": true,
        "internalType": "address",
        "name": "agent",
        "type": "address"
    }, {
        "components": [{"internalType": "bool", "name": "exists", "type": "bool"}, {
            "internalType": "bool",
            "name": "paused",
            "type": "bool"
        }, {"internalType": "address", "name": "id", "type": "address"}, {
            "internalType": "address",
            "name": "ipAssetId",
            "type": "address"
        }, {"internalType": "uint256", "name": "fee", "type": "uint256"}, {
            "internalType": "uint256",
            "name": "canNftTokenId",
            "type": "uint256"
        }, {"internalType": "uint256", "name": "licenceTermsId", "type": "uint256"}, {
            "internalType": "bytes32",
            "name": "topic",
            "type": "bytes32"
        }, {"internalType": "string", "name": "metadata", "type": "string"}],
        "indexed": false,
        "internalType": "struct MarketLib.AgentInfo",
        "name": "agentInfo",
        "type": "tuple"
    }],
    "name": "AgentUpdated",
    "type": "event"
}, {
    "anonymous": false,
    "inputs": [{"indexed": false, "internalType": "uint64", "name": "version", "type": "uint64"}],
    "name": "Initialized",
    "type": "event"
}, {
    "anonymous": false,
    "inputs": [{"indexed": false, "internalType": "address", "name": "agent", "type": "address"}, {
        "indexed": false,
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
    }],
    "name": "RewardWithdrawn",
    "type": "event"
}, {
    "anonymous": false,
    "inputs": [{
        "indexed": true,
        "internalType": "address",
        "name": "requestingAgent",
        "type": "address"
    }, {"indexed": true, "internalType": "address", "name": "assignedAgent", "type": "address"}, {
        "indexed": true,
        "internalType": "uint256",
        "name": "taskId",
        "type": "uint256"
    }, {
        "components": [{"internalType": "uint256", "name": "id", "type": "uint256"}, {
            "internalType": "uint256",
            "name": "parentTaskId",
            "type": "uint256"
        }, {"internalType": "uint256", "name": "contextId", "type": "uint256"}, {
            "internalType": "uint256",
            "name": "blockNumber",
            "type": "uint256"
        }, {"internalType": "uint256", "name": "reward", "type": "uint256"}, {
            "internalType": "uint256",
            "name": "childTokenId",
            "type": "uint256"
        }, {"internalType": "uint256", "name": "maxRepeatedPerAgent", "type": "uint256"}, {
            "internalType": "address",
            "name": "requester",
            "type": "address"
        }, {"internalType": "address", "name": "agentId", "type": "address"}, {
            "internalType": "address",
            "name": "childIpId",
            "type": "address"
        }, {"internalType": "bytes32", "name": "topic", "type": "bytes32"}, {
            "internalType": "bool",
            "name": "isMultiTask",
            "type": "bool"
        }, {"internalType": "bool", "name": "isDeleted", "type": "bool"}, {
            "internalType": "string",
            "name": "payload",
            "type": "string"
        }], "indexed": false, "internalType": "struct MarketLib.Task", "name": "task", "type": "tuple"
    }],
    "name": "TaskAssigned",
    "type": "event"
}, {
    "anonymous": false,
    "inputs": [{
        "indexed": true,
        "internalType": "address",
        "name": "requestingAgent",
        "type": "address"
    }, {
        "indexed": true,
        "internalType": "uint256",
        "name": "taskId",
        "type": "uint256"
    }, {
        "components": [{"internalType": "uint256", "name": "id", "type": "uint256"}, {
            "internalType": "uint256",
            "name": "parentTaskId",
            "type": "uint256"
        }, {"internalType": "uint256", "name": "contextId", "type": "uint256"}, {
            "internalType": "uint256",
            "name": "blockNumber",
            "type": "uint256"
        }, {"internalType": "uint256", "name": "reward", "type": "uint256"}, {
            "internalType": "uint256",
            "name": "childTokenId",
            "type": "uint256"
        }, {"internalType": "uint256", "name": "maxRepeatedPerAgent", "type": "uint256"}, {
            "internalType": "address",
            "name": "requester",
            "type": "address"
        }, {"internalType": "address", "name": "agentId", "type": "address"}, {
            "internalType": "address",
            "name": "childIpId",
            "type": "address"
        }, {"internalType": "bytes32", "name": "topic", "type": "bytes32"}, {
            "internalType": "bool",
            "name": "isMultiTask",
            "type": "bool"
        }, {"internalType": "bool", "name": "isDeleted", "type": "bool"}, {
            "internalType": "string",
            "name": "payload",
            "type": "string"
        }], "indexed": false, "internalType": "struct MarketLib.Task", "name": "task", "type": "tuple"
    }],
    "name": "TaskRegistered",
    "type": "event"
}, {
    "anonymous": false,
    "inputs": [{
        "indexed": true,
        "internalType": "address",
        "name": "requestingAgent",
        "type": "address"
    }, {"indexed": true, "internalType": "address", "name": "assignedAgent", "type": "address"}, {
        "indexed": true,
        "internalType": "uint256",
        "name": "taskId",
        "type": "uint256"
    }, {
        "components": [{"internalType": "uint256", "name": "id", "type": "uint256"}, {
            "internalType": "uint256",
            "name": "timestamp",
            "type": "uint256"
        }, {"internalType": "uint256", "name": "blockNumber", "type": "uint256"}, {
            "internalType": "string",
            "name": "result",
            "type": "string"
        }], "indexed": false, "internalType": "struct MarketLib.TaskResult", "name": "taskResult", "type": "tuple"
    }],
    "name": "TaskResultSent",
    "type": "event"
}, {
    "inputs": [],
    "name": "CLARA_IP_REGISTER",
    "outputs": [{"internalType": "contract ClaraIPRegister", "name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
}, {
    "inputs": [],
    "name": "REVENUE_TOKEN",
    "outputs": [{"internalType": "contract RevenueToken", "name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
}, {
    "inputs": [],
    "name": "ROYALTY_MODULE",
    "outputs": [{"internalType": "contract IRoyaltyModule", "name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
}, {
    "inputs": [{"internalType": "address", "name": "_agentId", "type": "address"}],
    "name": "agent",
    "outputs": [{
        "components": [{"internalType": "bool", "name": "exists", "type": "bool"}, {
            "internalType": "bool",
            "name": "paused",
            "type": "bool"
        }, {"internalType": "address", "name": "id", "type": "address"}, {
            "internalType": "address",
            "name": "ipAssetId",
            "type": "address"
        }, {"internalType": "uint256", "name": "fee", "type": "uint256"}, {
            "internalType": "uint256",
            "name": "canNftTokenId",
            "type": "uint256"
        }, {"internalType": "uint256", "name": "licenceTermsId", "type": "uint256"}, {
            "internalType": "bytes32",
            "name": "topic",
            "type": "bytes32"
        }, {"internalType": "string", "name": "metadata", "type": "string"}],
        "internalType": "struct MarketLib.AgentInfo",
        "name": "",
        "type": "tuple"
    }],
    "stateMutability": "view",
    "type": "function"
}, {
    "inputs": [{"internalType": "address", "name": "_agentId", "type": "address"}],
    "name": "agentInbox",
    "outputs": [{
        "components": [{
            "internalType": "uint256",
            "name": "id",
            "type": "uint256"
        }, {"internalType": "uint256", "name": "parentTaskId", "type": "uint256"}, {
            "internalType": "uint256",
            "name": "contextId",
            "type": "uint256"
        }, {"internalType": "uint256", "name": "blockNumber", "type": "uint256"}, {
            "internalType": "uint256",
            "name": "reward",
            "type": "uint256"
        }, {"internalType": "uint256", "name": "childTokenId", "type": "uint256"}, {
            "internalType": "uint256",
            "name": "maxRepeatedPerAgent",
            "type": "uint256"
        }, {"internalType": "address", "name": "requester", "type": "address"}, {
            "internalType": "address",
            "name": "agentId",
            "type": "address"
        }, {"internalType": "address", "name": "childIpId", "type": "address"}, {
            "internalType": "bytes32",
            "name": "topic",
            "type": "bytes32"
        }, {"internalType": "bool", "name": "isMultiTask", "type": "bool"}, {
            "internalType": "bool",
            "name": "isDeleted",
            "type": "bool"
        }, {"internalType": "string", "name": "payload", "type": "string"}],
        "internalType": "struct MarketLib.Task",
        "name": "",
        "type": "tuple"
    }],
    "stateMutability": "view",
    "type": "function"
}, {
    "inputs": [{"internalType": "address", "name": "_agentId", "type": "address"}],
    "name": "agentTotals",
    "outputs": [{
        "components": [{
            "internalType": "uint256",
            "name": "requested",
            "type": "uint256"
        }, {"internalType": "uint256", "name": "assigned", "type": "uint256"}, {
            "internalType": "uint256",
            "name": "done",
            "type": "uint256"
        }, {"internalType": "uint256", "name": "rewards", "type": "uint256"}],
        "internalType": "struct MarketLib.AgentTotals",
        "name": "",
        "type": "tuple"
    }],
    "stateMutability": "view",
    "type": "function"
}, {
    "inputs": [],
    "name": "allUnassignedTasks",
    "outputs": [{
        "components": [{
            "internalType": "uint256",
            "name": "id",
            "type": "uint256"
        }, {"internalType": "uint256", "name": "parentTaskId", "type": "uint256"}, {
            "internalType": "uint256",
            "name": "contextId",
            "type": "uint256"
        }, {"internalType": "uint256", "name": "blockNumber", "type": "uint256"}, {
            "internalType": "uint256",
            "name": "reward",
            "type": "uint256"
        }, {"internalType": "uint256", "name": "childTokenId", "type": "uint256"}, {
            "internalType": "uint256",
            "name": "maxRepeatedPerAgent",
            "type": "uint256"
        }, {"internalType": "address", "name": "requester", "type": "address"}, {
            "internalType": "address",
            "name": "agentId",
            "type": "address"
        }, {"internalType": "address", "name": "childIpId", "type": "address"}, {
            "internalType": "bytes32",
            "name": "topic",
            "type": "bytes32"
        }, {"internalType": "bool", "name": "isMultiTask", "type": "bool"}, {
            "internalType": "bool",
            "name": "isDeleted",
            "type": "bool"
        }, {"internalType": "string", "name": "payload", "type": "string"}],
        "internalType": "struct MarketLib.Task[]",
        "name": "",
        "type": "tuple[]"
    }],
    "stateMutability": "view",
    "type": "function"
}, {
    "inputs": [{"internalType": "address", "name": "requestingAgent", "type": "address"}],
    "name": "allUnassignedTasks",
    "outputs": [{
        "components": [{
            "internalType": "uint256",
            "name": "id",
            "type": "uint256"
        }, {"internalType": "uint256", "name": "parentTaskId", "type": "uint256"}, {
            "internalType": "uint256",
            "name": "contextId",
            "type": "uint256"
        }, {"internalType": "uint256", "name": "blockNumber", "type": "uint256"}, {
            "internalType": "uint256",
            "name": "reward",
            "type": "uint256"
        }, {"internalType": "uint256", "name": "childTokenId", "type": "uint256"}, {
            "internalType": "uint256",
            "name": "maxRepeatedPerAgent",
            "type": "uint256"
        }, {"internalType": "address", "name": "requester", "type": "address"}, {
            "internalType": "address",
            "name": "agentId",
            "type": "address"
        }, {"internalType": "address", "name": "childIpId", "type": "address"}, {
            "internalType": "bytes32",
            "name": "topic",
            "type": "bytes32"
        }, {"internalType": "bool", "name": "isMultiTask", "type": "bool"}, {
            "internalType": "bool",
            "name": "isDeleted",
            "type": "bool"
        }, {"internalType": "string", "name": "payload", "type": "string"}],
        "internalType": "struct MarketLib.Task[]",
        "name": "",
        "type": "tuple[]"
    }],
    "stateMutability": "view",
    "type": "function"
}, {
    "inputs": [],
    "name": "cleanTasks",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
}, {
    "inputs": [{"internalType": "uint256[]", "name": "taskIds", "type": "uint256[]"}],
    "name": "deleteTasks",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
}, {
    "inputs": [],
    "name": "getPaymentsAddr",
    "outputs": [{"internalType": "address", "name": "", "type": "address"}],
    "stateMutability": "view",
    "type": "function"
}, {
    "inputs": [{"internalType": "address", "name": "claraIPRegister", "type": "address"}, {
        "internalType": "address",
        "name": "royaltyModule",
        "type": "address"
    }, {"internalType": "address payable", "name": "_revenueToken", "type": "address"}],
    "name": "initialize",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
}, {
    "inputs": [],
    "name": "isAgentPaused",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
}, {
    "inputs": [],
    "name": "loadNextTask",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
}, {
    "inputs": [],
    "name": "marketTotals",
    "outputs": [{
        "components": [{
            "internalType": "uint256",
            "name": "done",
            "type": "uint256"
        }, {"internalType": "uint256", "name": "rewards", "type": "uint256"}],
        "internalType": "struct MarketLib.MarketTotals",
        "name": "",
        "type": "tuple"
    }],
    "stateMutability": "view",
    "type": "function"
}, {
    "inputs": [{"internalType": "uint256", "name": "_fee", "type": "uint256"}, {
        "internalType": "bytes32",
        "name": "_topic",
        "type": "bytes32"
    }, {"internalType": "string", "name": "_metadata", "type": "string"}],
    "name": "registerAgentProfile",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
}, {
    "inputs": [{"internalType": "uint256", "name": "_tasksCount", "type": "uint256"}, {
        "internalType": "uint256",
        "name": "_maxRewardPerTask",
        "type": "uint256"
    }, {"internalType": "uint256", "name": "_maxRepeatedTasksPerAgent", "type": "uint256"}, {
        "internalType": "bytes32",
        "name": "_topic",
        "type": "bytes32"
    }, {"internalType": "string", "name": "_payload", "type": "string"}],
    "name": "registerMultiTask",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
}, {
    "inputs": [{"internalType": "uint256", "name": "_reward", "type": "uint256"}, {
        "internalType": "uint256",
        "name": "_contextId",
        "type": "uint256"
    }, {"internalType": "bytes32", "name": "_topic", "type": "bytes32"}, {
        "internalType": "string",
        "name": "_payload",
        "type": "string"
    }], "name": "registerTask", "outputs": [], "stateMutability": "nonpayable", "type": "function"
}, {
    "inputs": [{"internalType": "uint256", "name": "_taskId", "type": "uint256"}, {
        "internalType": "string",
        "name": "_resultJSON",
        "type": "string"
    }], "name": "sendResult", "outputs": [], "stateMutability": "nonpayable", "type": "function"
}, {
    "inputs": [{"internalType": "uint256", "name": "id", "type": "uint256"}],
    "name": "taskById",
    "outputs": [{
        "components": [{
            "internalType": "uint256",
            "name": "id",
            "type": "uint256"
        }, {"internalType": "uint256", "name": "parentTaskId", "type": "uint256"}, {
            "internalType": "uint256",
            "name": "contextId",
            "type": "uint256"
        }, {"internalType": "uint256", "name": "blockNumber", "type": "uint256"}, {
            "internalType": "uint256",
            "name": "reward",
            "type": "uint256"
        }, {"internalType": "uint256", "name": "childTokenId", "type": "uint256"}, {
            "internalType": "uint256",
            "name": "maxRepeatedPerAgent",
            "type": "uint256"
        }, {"internalType": "address", "name": "requester", "type": "address"}, {
            "internalType": "address",
            "name": "agentId",
            "type": "address"
        }, {"internalType": "address", "name": "childIpId", "type": "address"}, {
            "internalType": "bytes32",
            "name": "topic",
            "type": "bytes32"
        }, {"internalType": "bool", "name": "isMultiTask", "type": "bool"}, {
            "internalType": "bool",
            "name": "isDeleted",
            "type": "bool"
        }, {"internalType": "string", "name": "payload", "type": "string"}],
        "internalType": "struct MarketLib.Task",
        "name": "",
        "type": "tuple"
    }],
    "stateMutability": "view",
    "type": "function"
}, {
    "inputs": [],
    "name": "tasksCounter",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
}, {
    "inputs": [],
    "name": "tasksDeleted",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
}, {
    "inputs": [],
    "name": "tasksLength",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
}, {
    "inputs": [],
    "name": "unassignedTasks",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
}, {
    "inputs": [{"internalType": "bytes32", "name": "_topic", "type": "bytes32"}],
    "name": "unassignedTasksLength",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
}, {
    "inputs": [{"internalType": "uint256", "name": "_fee", "type": "uint256"}],
    "name": "updateAgentFee",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
}, {
    "inputs": [{"internalType": "bool", "name": "paused", "type": "bool"}],
    "name": "updateAgentPaused",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
}, {
    "inputs": [{"internalType": "bytes32", "name": "_topic", "type": "bytes32"}],
    "name": "updateAgentTopic",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
}, {
    "inputs": [],
    "name": "withdraw",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
}, {
    "inputs": [{"internalType": "address", "name": "_agentId", "type": "address"}],
    "name": "withdrawalAmount",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
}]
