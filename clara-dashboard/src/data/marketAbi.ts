export const marketAbi =
    [{
        "inputs": [{"internalType": "address", "name": "_paymentsToken", "type": "address"}],
        "stateMutability": "nonpayable",
        "type": "constructor"
    }, {"inputs": [], "name": "InvalidInitialization", "type": "error"}, {
        "inputs": [],
        "name": "NotInitializing",
        "type": "error"
    }, {"anonymous": false, "inputs": [], "name": "DispatchedTasks", "type": "event"}, {
        "anonymous": false,
        "inputs": [{"indexed": false, "internalType": "uint64", "name": "version", "type": "uint64"}],
        "name": "Initialized",
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
                "internalType": "address",
                "name": "id",
                "type": "address"
            }, {"internalType": "uint256", "name": "fee", "type": "uint256"}, {
                "internalType": "string",
                "name": "topic",
                "type": "string"
            }, {"internalType": "string", "name": "metadata", "type": "string"}],
            "indexed": false,
            "internalType": "struct MarketLib.AgentInfo",
            "name": "agentInfo",
            "type": "tuple"
        }],
        "name": "RegisteredAgent",
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
                "name": "contextId",
                "type": "uint256"
            }, {"internalType": "uint256", "name": "timestamp", "type": "uint256"}, {
                "internalType": "uint256",
                "name": "blockNumber",
                "type": "uint256"
            }, {"internalType": "uint256", "name": "reward", "type": "uint256"}, {
                "internalType": "address",
                "name": "requester",
                "type": "address"
            }, {"internalType": "address", "name": "agentId", "type": "address"}, {
                "internalType": "string",
                "name": "matchingStrategy",
                "type": "string"
            }, {"internalType": "string", "name": "payload", "type": "string"}, {
                "internalType": "string",
                "name": "topic",
                "type": "string"
            }], "indexed": false, "internalType": "struct MarketLib.Task", "name": "task", "type": "tuple"
        }],
        "name": "RegisteredTask",
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
                "name": "contextId",
                "type": "uint256"
            }, {"internalType": "uint256", "name": "timestamp", "type": "uint256"}, {
                "internalType": "uint256",
                "name": "blockNumber",
                "type": "uint256"
            }, {"internalType": "uint256", "name": "reward", "type": "uint256"}, {
                "internalType": "address",
                "name": "requester",
                "type": "address"
            }, {"internalType": "address", "name": "agentId", "type": "address"}, {
                "internalType": "string",
                "name": "matchingStrategy",
                "type": "string"
            }, {"internalType": "string", "name": "payload", "type": "string"}, {
                "internalType": "string",
                "name": "topic",
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
        "inputs": [{"internalType": "address", "name": "", "type": "address"}, {
            "internalType": "uint256",
            "name": "",
            "type": "uint256"
        }],
        "name": "agentInbox",
        "outputs": [{"internalType": "uint256", "name": "id", "type": "uint256"}, {
            "internalType": "uint256",
            "name": "contextId",
            "type": "uint256"
        }, {"internalType": "uint256", "name": "timestamp", "type": "uint256"}, {
            "internalType": "uint256",
            "name": "blockNumber",
            "type": "uint256"
        }, {"internalType": "uint256", "name": "reward", "type": "uint256"}, {
            "internalType": "address",
            "name": "requester",
            "type": "address"
        }, {"internalType": "address", "name": "agentId", "type": "address"}, {
            "internalType": "string",
            "name": "matchingStrategy",
            "type": "string"
        }, {"internalType": "string", "name": "payload", "type": "string"}, {
            "internalType": "string",
            "name": "topic",
            "type": "string"
        }],
        "stateMutability": "view",
        "type": "function"
    }, {
        "inputs": [{"internalType": "address", "name": "", "type": "address"}],
        "name": "agentTotals",
        "outputs": [{"internalType": "uint256", "name": "requested", "type": "uint256"}, {
            "internalType": "uint256",
            "name": "assigned",
            "type": "uint256"
        }, {"internalType": "uint256", "name": "done", "type": "uint256"}, {
            "internalType": "uint256",
            "name": "rewards",
            "type": "uint256"
        }],
        "stateMutability": "view",
        "type": "function"
    }, {
        "inputs": [{"internalType": "address", "name": "", "type": "address"}],
        "name": "agents",
        "outputs": [{"internalType": "bool", "name": "exists", "type": "bool"}, {
            "internalType": "address",
            "name": "id",
            "type": "address"
        }, {"internalType": "uint256", "name": "fee", "type": "uint256"}, {
            "internalType": "string",
            "name": "topic",
            "type": "string"
        }, {"internalType": "string", "name": "metadata", "type": "string"}],
        "stateMutability": "view",
        "type": "function"
    }, {
        "inputs": [],
        "name": "agentsLength",
        "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
    }, {
        "inputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "name": "allAgents",
        "outputs": [{"internalType": "address", "name": "", "type": "address"}],
        "stateMutability": "view",
        "type": "function"
    }, {
        "inputs": [],
        "name": "dispatchTasks",
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
        "inputs": [{"internalType": "uint256", "name": "_idx", "type": "uint256"}],
        "name": "getQueuedTaskData",
        "outputs": [{
            "components": [{
                "internalType": "uint256",
                "name": "id",
                "type": "uint256"
            }, {"internalType": "uint256", "name": "contextId", "type": "uint256"}, {
                "internalType": "uint256",
                "name": "timestamp",
                "type": "uint256"
            }, {"internalType": "uint256", "name": "blockNumber", "type": "uint256"}, {
                "internalType": "uint256",
                "name": "reward",
                "type": "uint256"
            }, {"internalType": "address", "name": "requester", "type": "address"}, {
                "internalType": "address",
                "name": "agentId",
                "type": "address"
            }, {"internalType": "string", "name": "matchingStrategy", "type": "string"}, {
                "internalType": "string",
                "name": "payload",
                "type": "string"
            }, {"internalType": "string", "name": "topic", "type": "string"}],
            "internalType": "struct MarketLib.Task",
            "name": "",
            "type": "tuple"
        }],
        "stateMutability": "view",
        "type": "function"
    }, {
        "inputs": [],
        "name": "marketTotals",
        "outputs": [{"internalType": "uint256", "name": "done", "type": "uint256"}, {
            "internalType": "uint256",
            "name": "rewards",
            "type": "uint256"
        }],
        "stateMutability": "view",
        "type": "function"
    }, {
        "inputs": [{"internalType": "uint256", "name": "_fee", "type": "uint256"}, {
            "internalType": "string",
            "name": "_topic",
            "type": "string"
        }, {"internalType": "string", "name": "_metadata", "type": "string"}],
        "name": "registerAgentProfile",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    }, {
        "inputs": [{"internalType": "uint256", "name": "_reward", "type": "uint256"}, {
            "internalType": "uint256",
            "name": "_contextId",
            "type": "uint256"
        }, {"internalType": "string", "name": "_topic", "type": "string"}, {
            "internalType": "string",
            "name": "_matchingStrategy",
            "type": "string"
        }, {"internalType": "string", "name": "_payload", "type": "string"}],
        "name": "registerTask",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    }, {
        "inputs": [{"internalType": "uint256", "name": "_taskId", "type": "uint256"}, {
            "internalType": "string",
            "name": "_resultJSON",
            "type": "string"
        }], "name": "sendResult", "outputs": [], "stateMutability": "nonpayable", "type": "function"
    }, {
        "inputs": [],
        "name": "tasksQueue",
        "outputs": [{"internalType": "uint256", "name": "head", "type": "uint256"}, {
            "internalType": "uint256",
            "name": "tail",
            "type": "uint256"
        }],
        "stateMutability": "view",
        "type": "function"
    }]