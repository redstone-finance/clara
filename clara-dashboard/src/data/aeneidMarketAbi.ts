export const aeneidMarketAbi =
    [{
        "inputs": [{"internalType": "address", "name": "ipAssetRegistry", "type": "address"}, {
            "internalType": "address",
            "name": "licensingModule",
            "type": "address"
        }, {"internalType": "address", "name": "pilTemplate", "type": "address"}, {
            "internalType": "address",
            "name": "royaltyPolicyLAP",
            "type": "address"
        }, {"internalType": "address", "name": "royaltyWorkflows", "type": "address"}, {
            "internalType": "address",
            "name": "royaltyModule",
            "type": "address"
        }, {"internalType": "address payable", "name": "_revenueToken", "type": "address"}],
        "stateMutability": "nonpayable",
        "type": "constructor"
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
            }, {"internalType": "string", "name": "metadata", "type": "string"}, {
                "internalType": "address",
                "name": "ipAssetId",
                "type": "address"
            }, {"internalType": "uint256", "name": "canNftTokenId", "type": "uint256"}, {
                "internalType": "uint256",
                "name": "licenceTermsId",
                "type": "uint256"
            }], "indexed": false, "internalType": "struct MarketLib.AgentInfo", "name": "agentInfo", "type": "tuple"
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
            }, {"internalType": "uint256", "name": "childTokenId", "type": "uint256"}, {
                "internalType": "address",
                "name": "childIpId",
                "type": "address"
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
        "inputs": [],
        "name": "AGENT_NFT",
        "outputs": [{"internalType": "contract AgentNFT", "name": "", "type": "address"}],
        "stateMutability": "view",
        "type": "function"
    }, {
        "inputs": [],
        "name": "IP_ASSET_REGISTRY",
        "outputs": [{"internalType": "contract IPAssetRegistry", "name": "", "type": "address"}],
        "stateMutability": "view",
        "type": "function"
    }, {
        "inputs": [],
        "name": "LICENSING_MODULE",
        "outputs": [{"internalType": "contract ILicensingModule", "name": "", "type": "address"}],
        "stateMutability": "view",
        "type": "function"
    }, {
        "inputs": [],
        "name": "PIL_TEMPLATE",
        "outputs": [{"internalType": "contract IPILicenseTemplate", "name": "", "type": "address"}],
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
        "inputs": [],
        "name": "ROYALTY_POLICY_LAP",
        "outputs": [{"internalType": "contract RoyaltyPolicyLAP", "name": "", "type": "address"}],
        "stateMutability": "view",
        "type": "function"
    }, {
        "inputs": [],
        "name": "ROYALTY_WORKFLOWS",
        "outputs": [{"internalType": "contract IRoyaltyWorkflows", "name": "", "type": "address"}],
        "stateMutability": "view",
        "type": "function"
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
        }, {"internalType": "uint256", "name": "childTokenId", "type": "uint256"}, {
            "internalType": "address",
            "name": "childIpId",
            "type": "address"
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
        }, {"internalType": "string", "name": "metadata", "type": "string"}, {
            "internalType": "address",
            "name": "ipAssetId",
            "type": "address"
        }, {"internalType": "uint256", "name": "canNftTokenId", "type": "uint256"}, {
            "internalType": "uint256",
            "name": "licenceTermsId",
            "type": "uint256"
        }],
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
        "name": "getPaymentsAddr",
        "outputs": [{"internalType": "address", "name": "", "type": "address"}],
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
        "inputs": [{"internalType": "address", "name": "", "type": "address"}, {
            "internalType": "address",
            "name": "",
            "type": "address"
        }, {"internalType": "uint256", "name": "", "type": "uint256"}, {
            "internalType": "bytes",
            "name": "",
            "type": "bytes"
        }],
        "name": "onERC721Received",
        "outputs": [{"internalType": "bytes4", "name": "", "type": "bytes4"}],
        "stateMutability": "nonpayable",
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
        "name": "tasksCounter",
        "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
    }];