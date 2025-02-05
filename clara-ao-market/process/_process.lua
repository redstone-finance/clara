local json = require "json"
local bint = require('.bint')(256)
local utils = require('.utils')

local version = "1.0.0"
AGENTS_MARKET = AGENTS_MARKET or {}

AGENTS_MARKET._version = AGENTS_MARKET._version or version
AGENTS_MARKET.Storage = AGENTS_MARKET.Storage or {
    Agents = {},
    TasksQueue = {}, -- queueueueueueueueueue
    Totals = {
        rewards = "0",
        done = 0
    },
    balances = {},
}

AGENTS_MARKET.topic = {
    "tweet",
    "discord",
    "telegram",
    "nft",
    "chat"
}

AGENTS_MARKET.protocol = "C.L.A.R.A."

AGENTS_MARKET.v1 = AGENTS_MARKET.v1 or {}

PaymentsToken = "NG-0lVX882MG5nhARrSzyprEK6ejonHpdUmaaMPsHE8"

-- PaymentsToken = "iJoi8w1KkSfyN2sKDXma81sOxL2czCb50MheUQ_SoUQ"

function AGENTS_MARKET.v1.RegisterAgentProfile(msg)
    local profileAddr = msg.From
    local topic = msg.Tags["RedStone-Agent-Topic"]
    local agentFee = msg.Tags["RedStone-Agent-Fee"];
    local agentId = msg.Tags["RedStone-Agent-Id"]
    local protocol = msg.Tags["Protocol"]

    _assertProtocol(protocol)
    -- if agent does not want to handle tasks (only post) - they do not send the topic
    -- if topic is set - we need to verify if it is one of the defined topics
    if (topic ~= nil) then
        _assertTopic(topic)
        _assertIsPositiveInteger(agentFee, "Agent-Fee")
    end

    -- remove if previously registered - i.e. perform 'upsert'
    for i, agent in ipairs(AGENTS_MARKET.Storage.Agents) do
        -- note: not using profileAddr, as there may be potentially
        -- many Agents registered on the same wallet address
        if (agent.id == agentId) then
            assert(agent.profileAddress == profileAddr, profileAddr .. " does not own " .. agentId)
            table.remove(AGENTS_MARKET.Storage.Agents, i)
        end
    end

    table.insert(AGENTS_MARKET.Storage.Agents, {
        id = agentId,
        profileAddress = profileAddr,
        topic = topic,
        fee = agentFee,
        metadata = json.decode(msg.Data),
        tasks = {
            inbox = {}, -- tasks to be processed by this Agent
            results = {}, -- results of the the tasks requested by this Agent
            declined = {}   --  array of IDs of the tasks declined by this Agent
        },
        totals = _initTotals()
    })

    _dispatchTasks()

    msg.reply({
        Action = "Registered",
        Protocol = AGENTS_MARKET.protocol,
        Data = "Agent " .. agentId .. " registered in Market"
    })
end

function AGENTS_MARKET.v1.RegisterTask(msg)
    local senderAddr = msg.From
    local topic = msg.Tags["RedStone-Agent-Topic"]
    local reward = msg.Tags["RedStone-Agent-Reward"]
    local matchingStrategy = msg.Tags["RedStone-Agent-Matching"] or "leastOccupied"
    local agentId = msg.Tags["RedStone-Agent-Id"]
    local payload = json.decode(msg.Data)
    local taskId = msg.Id
    local contextId = msg.Tags["Context-Id"] or taskId
    local protocol = msg.Tags["Protocol"]

    -- TODO: add task max lifetime
    _assertAgentRegistered(agentId, senderAddr)
    _assertIsPositiveInteger(reward, "Agent-Reward")
    _assertRequesterHasSufficientFunds(reward, senderAddr)
    _assertProtocol(protocol)
    _assertTopic(topic)
    _assertStrategy(matchingStrategy)

    local requestingAgent = utils.find(function(x)
        return x.id == agentId and x.profileAddress == senderAddr
    end)(AGENTS_MARKET.Storage.Agents)
    _maybeInitTotals(requestingAgent)
    requestingAgent.totals.requested = requestingAgent.totals.requested + 1;

    local function __createTask()
        local task = {
            id = taskId,
            requester = senderAddr,
            matchingStrategy = matchingStrategy,
            payload = payload,
            timestamp = msg.Timestamp,
            block = msg["Block-Height"],
            topic = topic,
            reward = reward,
            requesterId = agentId,
            -- in case of chat - allows to group messages from the same 'thread'
            -- each consecutive message within given thread will have this value set
            -- to the initial message id
            contextId = contextId
        }

        return task
    end

    if (AGENTS_MARKET.Storage.TasksQueue == nil) then
        AGENTS_MARKET.Storage.TasksQueue = {}
    end
    table.insert(AGENTS_MARKET.Storage.TasksQueue, __createTask())
    _dispatchTasks()
end

function AGENTS_MARKET.v1.SendResult(msg)
    local agentAddr = msg.From
    local agentId = msg.Tags["RedStone-Agent-Id"]
    local taskId = msg.Tags["RedStone-Task-Id"]
    local protocol = msg.Tags["Protocol"]

    _assertAgentRegistered(agentId, agentAddr)
    _assertProtocol(protocol)

    local agent = utils.find(function(x)
        return x.id == agentId
    end)(AGENTS_MARKET.Storage.Agents)
    local originalTask = agent.tasks.inbox[taskId]
    assert(originalTask ~= nil, "Already sent result for task " .. taskId)

    local recipient = originalTask.requester;
    assert(agent ~= nil, "Agent with " .. agentId .. " not found")
    assert(originalTask.agentId == agentId, "Agent was not assigned to task")
    assert(agent.profileAddress == agentAddr, "Sender address for " .. agentId .. " not same as registered")

    local requestingAgent = utils.find(function(x)
        return x.id == originalTask.requesterId
    end)(AGENTS_MARKET.Storage.Agents)

    local responseData = {
        id = taskId,
        agentId = agentId,
        agentAddress = agentAddr,
        result = json.decode(msg.Data),
        timestamp = msg.Timestamp,
        block = msg["Block-Height"],
        originalTask = originalTask
    }

    agent.tasks.inbox[taskId] = nil
    _maybeInitTotals(agent)
    agent.totals.done = agent.totals.done + 1
    agent.totals.rewards = tostring(bint.new(agent.totals.rewards) + bint.new(originalTask.reward))
    _maybeInitGlobalTotals()
    AGENTS_MARKET.Storage.Totals.done = AGENTS_MARKET.Storage.Totals.done + 1
    AGENTS_MARKET.Storage.Totals.rewards = tostring(bint.new(AGENTS_MARKET.Storage.Totals.rewards) + bint.new(originalTask.reward))

    if (requestingAgent.tasks.results == nil) then
        requestingAgent.tasks.results = {}
    end
    requestingAgent.tasks.results[taskId] = {};
    requestingAgent.tasks.results[taskId][agent.id] = responseData;

    Send({
        Target = recipient,
        ["Task-Id"] = taskId,
        ["Assigned-Agent-Id"] = agentId,
        ["Assigned-Agent-Address"] = agentAddr,
        Action = 'Task-Result',
        Fee = originalTask.reward,
        Protocol = AGENTS_MARKET.protocol,
        Data = json.encode(responseData)
    })

    local currentRequesterBalance = _walletBalance(requestingAgent.profileAddress)

    local feeBint = bint(originalTask.reward)
    local currentRequesterBalanceBint = bint(currentRequesterBalance)
    if (currentRequesterBalanceBint < feeBint) then
        -- what now?
    end
    AGENTS_MARKET.Storage.balances[requestingAgent.profileAddress] = tostring(currentRequesterBalanceBint - feeBint)

    _transferTokens(msg.From, originalTask.reward)

    -- note - putting new message into "previous" message sender inbox
    if (originalTask.topic == "chat") then
        -- fixme: c/p from RegisterTask
        local task = {
            id = msg.Id,
            requester = msg.From,
            matchingStrategy = originalTask.matchingStrategy,
            payload = responseData,
            timestamp = msg.Timestamp,
            block = msg["Block-Height"],
            topic = originalTask.topic,
            reward = originalTask.reward,
            previousTaskId = originalTask.id,
            requesterId = agentId,
            contextId = originalTask.contextId
        }

        task.reward = requestingAgent.fee
        task.agentId = requestingAgent.id
        assert(requestingAgent ~= nil, "Chat topic receiver agent not found " .. originalTask.requesterId)
        _storeAndSendTask(requestingAgent, task)
    end
end

function AGENTS_MARKET.v1.DeclineTask(msg)
    local agentAddr = msg.From
    local agentId = msg.Tags["RedStone-Agent-Id"]
    local taskId = msg.Tags["RedStone-Task-Id"]
    local protocol = msg.Tags["Protocol"]

    _assertAgentRegistered(agentId, agentAddr)
    _assertProtocol(protocol)

    local agent = utils.find(function(x)
        return x.id == agentId
    end)(AGENTS_MARKET.Storage.Agents)
    assert(agent ~= nil, "Agent with " .. agentId .. " not found")
    assert(agent.profileAddress == agentAddr, "Sender address for " .. agentId .. " not same as registered")
    agent.tasks.inbox[taskId] = nil
    if (agent.tasks.declined == nil) then
        agent.tasks.declined = {}
    end
    table.insert(agent.tasks.declined, taskId)

    _dispatchTasks()

    msg.reply({
        Target = agentAddr,
        ["Task-Id"] = taskId,
        Action = 'Task-Declined',
        Protocol = AGENTS_MARKET.protocol,
    })
end

function AGENTS_MARKET.v1.DispatchTasks(msg)
    _dispatchTasks()
    msg.reply({
        Action = "Tasks-Dispatched",
        Protocol = AGENTS_MARKET.protocol,
        Data = AGENTS_MARKET.Storage.TasksQueue
    })
end

function AGENTS_MARKET.v1.ListAgents(msg)
    msg.reply({
        Action = "List-Agents",
        Protocol = AGENTS_MARKET.protocol,
        Data = AGENTS_MARKET.Storage.Agents
    })
end

function AGENTS_MARKET.v1.TasksQueue(msg)
    msg.reply({
        Action = "Tasks-Queue",
        Protocol = AGENTS_MARKET.protocol,
        Data = AGENTS_MARKET.Storage.TasksQueue
    })
end

function AGENTS_MARKET.v1.LoadNextAssignedTask(msg)
    local agentAddr = msg.From
    local agentId = msg.Tags["RedStone-Agent-Id"]
    local protocol = msg.Tags["Protocol"]

    _assertProtocol(protocol)
    _assertAgentRegistered(agentId, agentAddr)
    local agent = utils.find(function(x)
        return x.id == agentId
    end)(AGENTS_MARKET.Storage.Agents)
    assert(agent ~= nil, "Agent with " .. agentId .. " not found")

    if (#utils.keys(agent.tasks.inbox) > 0) then
        for _, task in pairs(agent.tasks.inbox) do
            msg.reply({
                Action = "Load-Next-Assigned-Task-Result",
                Protocol = AGENTS_MARKET.protocol,
                Data = json.encode(task)
            })
            return
        end
    end
end

function AGENTS_MARKET.v1.LoadNextTaskResult(msg)
    local agentAddr = msg.From
    local agentId = msg.Tags["RedStone-Agent-Id"]
    local protocol = msg.Tags["Protocol"]

    _assertProtocol(protocol)
    _assertAgentRegistered(agentId, agentAddr)
    local agent = utils.find(function(x)
        return x.id == agentId
    end)(AGENTS_MARKET.Storage.Agents)
    assert(agent ~= nil, "Agent with " .. agentId .. " not found")

    if (#utils.keys(agent.tasks.results) > 0) then
        for taskId, agentResults in pairs(agent.tasks.results) do
            for agentResultId, taskResult in pairs(agentResults) do
                msg.reply({
                    Action = "Load-Next-Task-Result-Response",
                    Protocol = AGENTS_MARKET.protocol,
                    Data = json.encode(taskResult)
                })
                agent.tasks.results[taskId][agentResultId] = nil
                
                if next(agent.tasks.results[taskId]) == nil then
                    agent.tasks.results[taskId] = nil
                end
                return
            end
        end
    end
end


function AGENTS_MARKET.v1.AddTokens(msg)
    local sender = msg.Tags.Sender
    local Quantity = msg.Tags.Quantity

    local current = _walletBalance(sender)
    local newQuantity = tostring(bint(current) + bint(Quantity))
    _storeWalletBalance(sender, newQuantity)

    Send({
        Target = sender,
        ["New-Balance"] = newQuantity,
        ["Added-Quantity"] = Quantity,
        Action = 'Tokens-Locked',
    })
end


function AGENTS_MARKET.v1.ClaimReward(msg)
    local from = msg.From
    local qty = msg.Tags.Quantity
    _assertIsPositiveInteger(qty, "Quantity")
    local qtyBint = bint(qty)

    local currentBalance = _walletBalance(from)
    local balanceBint = bint(currentBalance)
    if (qtyBint > balanceBint) then
        msg.reply({
            Action = "Claim-Reward-Failed",
            Protocol = AGENTS_MARKET.protocol,
            Balance = currentBalance,
        })
        return
    end

    _storeWalletBalance(from, tostring(balanceBint - qtyBint))

    _transferTokens(from, qty)
end

function AGENTS_MARKET.v1.ClaimRewardAll(msg)
    local currentBalance = _walletBalance(msg.From)

    _storeWalletBalance(msg.From, "0")
    _transferTokens(msg.From, currentBalance)
end

function AGENTS_MARKET.v1.Balance(msg)
    local wallet = msg.Tags.Recipient or msg.From
    local balance = _walletBalance(wallet)

    msg.reply({
        Action = "Balance",
        Protocol = AGENTS_MARKET.protocol,
        Balance = balance,
        Account = wallet,
    })
end

function AGENTS_MARKET.v1.Balances(msg)
    msg.reply({
        Action = "Balances",
        Protocol = AGENTS_MARKET.protocol,
        Data = {
            balances = json.encode(AGENTS_MARKET.Storage.balances)
        }
    })
end

function AGENTS_MARKET.v1.DashboardData(msg)
    msg.reply({
        Action = "Tasks-Queue",
        Protocol = AGENTS_MARKET.protocol,
        Data = {
            queue = AGENTS_MARKET.Storage.TasksQueue,
            agents = AGENTS_MARKET.Storage.Agents,
            totals = AGENTS_MARKET.Storage.Totals
        }
    })
end

-- ======= HANDLERS REGISTRATION
Handlers.add(
        "AGENTS_MARKET.v1.RegisterAgentProfile",
        Handlers.utils.hasMatchingTagOf("Action", { "Register-Agent-Profile", "v1.Register-Agent-Profile" }),
        AGENTS_MARKET.v1.RegisterAgentProfile
)

Handlers.add(
        "AGENTS_MARKET.v1.ListAgents",
        Handlers.utils.hasMatchingTagOf("Action", { "List-Agents", "v1.List-Agents" }),
        AGENTS_MARKET.v1.ListAgents
)

Handlers.add(
        "AGENTS_MARKET.v1.RegisterTask",
        Handlers.utils.hasMatchingTagOf("Action", { "Register-Task", "v1.Register-Task" }),
        AGENTS_MARKET.v1.RegisterTask
)

Handlers.add(
        "AGENTS_MARKET.v1.SendResult",
        Handlers.utils.hasMatchingTagOf("Action", { "Send-Result", "v1.Send-Result" }),
        AGENTS_MARKET.v1.SendResult
)

Handlers.add(
        "AGENTS_MARKET.v1.DeclineTask",
        Handlers.utils.hasMatchingTagOf("Action", { "Decline-Task", "v1.Decline-Task" }),
        AGENTS_MARKET.v1.DeclineTask
)

Handlers.add(
        "AGENTS_MARKET.v1.TasksQueue",
        Handlers.utils.hasMatchingTagOf("Action", { "Tasks-Queue", "v1.Tasks-Queue" }),
        AGENTS_MARKET.v1.TasksQueue
)

Handlers.add(
        "AGENTS_MARKET.v1.DispatchTasks",
        Handlers.utils.hasMatchingTagOf("Action", { "Dispatch-Tasks", "v1.Dispatch-Tasks" }),
        AGENTS_MARKET.v1.DispatchTasks
)

Handlers.add(
        "AGENTS_MARKET.v1.LoadNextAssignedTask",
        Handlers.utils.hasMatchingTagOf("Action", { "Load-Next-Assigned-Task", "v1.Load-Next-Assigned-Task" }),
        AGENTS_MARKET.v1.LoadNextAssignedTask
)
Handlers.add(
        "AGENTS_MARKET.v1.LoadNextTaskResult",
        Handlers.utils.hasMatchingTagOf("Action", { "Load-Next-Task-Result", "v1.Load-Next-Task-Result" }),
        AGENTS_MARKET.v1.LoadNextTaskResult
)
Handlers.add(
        "AGENTS_MARKET.v1.DashboardData",
        Handlers.utils.hasMatchingTagOf("Action", { "Dashboard-Data", "v1.Dashboard-Data" }),
        AGENTS_MARKET.v1.DashboardData
)

Handlers.add(
        "AGENTS_MARKET.v1.AddTokens",
        function(msg)
            return msg.Action == "Credit-Notice" and msg.From == PaymentsToken
        end,
        AGENTS_MARKET.v1.AddTokens
)

Handlers.add(
        "AGENTS_MARKET.v1.AddTokensToAgent",
        Handlers.utils.hasMatchingTagOf("Action", { "Add-Tokens-To-Agent", "v1.Add-Tokens-To-Agent" }),
        AGENTS_MARKET.v1.AddTokensToAgent
)

Handlers.add(
        "AGENTS_MARKET.v1.ClaimReward",
        Handlers.utils.hasMatchingTagOf("Action", { "Claim-Reward", "v1.Claim-Reward" }),
        AGENTS_MARKET.v1.ClaimReward
)

Handlers.add(
        "AGENTS_MARKET.v1.ClaimRewardAll",
        Handlers.utils.hasMatchingTagOf("Action", { "Claim-Reward-All", "v1.Claim-Reward-All" }),
        AGENTS_MARKET.v1.ClaimRewardAll
)

Handlers.add(
        "AGENTS_MARKET.v1.Balance",
        Handlers.utils.hasMatchingTagOf("Action", { "Balance", "v1.Balance" }),
        AGENTS_MARKET.v1.Balance
)

Handlers.add(
        "AGENTS_MARKET.v1.Balances",
        Handlers.utils.hasMatchingTagOf("Action", { "Balances", "v1.Balances" }),
        AGENTS_MARKET.v1.Balances
)

-- ======= ASSERTS
function _assertProtocol(protocol)
    assert(protocol == AGENTS_MARKET.protocol,
            "Unknown protocol " .. protocol .. "supported: " .. AGENTS_MARKET.protocol)
end

function _assertTopic(topic)
    assert(utils.find(function(x)
        return x == topic
    end)(AGENTS_MARKET.topic) ~= nil,
            "Unknown Topic" .. topic)
end

function _assertStrategy(strategy)
    assert(AGENTS_MARKET.matchingStrategies[strategy] ~= nil, "Unknown strategy " .. strategy)
end

function _assertIsPositiveInteger(str, name)
    local num = tonumber(str)
    assert(num and num > 0 and math.floor(num) == num, "Value " .. name .. " must be positive integer")
end

function _assertRequesterHasSufficientFunds(str, requester)
    local reward = tonumber(str)

    local currentRequesterBalance = _walletBalance(requester)
    local balance = bint(currentRequesterBalance)
    assert(balance - reward >= 0,
            "Requesting agent (" .. requester .. ") funds (" .. currentRequesterBalance .. ") are insufficient")
end

function _assertAgentRegistered(agentId, sender)
    assert(agentId ~= nil, 'Sender not registered as Agent')
    assert(utils.find(function(x)
        return x.id == agentId and x.profileAddress == sender
    end)(AGENTS_MARKET.Storage.Agents) ~= nil,
            "Agent " .. agentId .. " not registered for sender " .. sender)
end


-- ======= PRIVATE FUNCTIONS
function _storeAndSendTask(chosenAgent, task, numberOfAgents)
    -- local uniqueKey = task.id .. "_" .. chosenAgent.id
    local taskCopy = {
        id = task.id,
        -- originalId = task.id,
        requester = task.requester,
        matchingStrategy = task.matchingStrategy,
        payload = task.payload,
        timestamp = task.timestamp,
        block = task.block,
        topic = task.topic,
        reward = task.reward,
        requesterId = task.requesterId,
        contextId = task.contextId,
        agentId = task.agentId
    }

    chosenAgent.tasks.inbox[task.id] = taskCopy
    _maybeInitTotals(chosenAgent)
    chosenAgent.totals.assigned = chosenAgent.totals.assigned + 1;

    Send({
        Target = chosenAgent.profileAddress,
        ["Task-Id"] = task.id,
        ["Assigned-Agent-Id"] = chosenAgent.id,
        ["Requesting-Agent-Id"] = task.requesterId,
        ["Context-Id"] = task.contextId,
        Action = 'Task-Assignment',
        Protocol = AGENTS_MARKET.protocol,
        Data = json.encode(taskCopy),
        ["Number-Of-Agents"] = tostring(numberOfAgents)
    })
end

function _walletBalance(wallet)
    if (AGENTS_MARKET.Storage.balances == nil) then
        AGENTS_MARKET.Storage.balances = {}
    end

    if (AGENTS_MARKET.Storage.balances[wallet] == nil) then
        AGENTS_MARKET.Storage.balances[wallet] = "0"
    end

    return AGENTS_MARKET.Storage.balances[wallet]
end

function _storeWalletBalance(wallet, qty)
    _walletBalance(wallet)
    AGENTS_MARKET.Storage.balances[wallet] = qty
end

function _transferTokens(to, quantity)
    Send({
        Target = PaymentsToken,
        ["Action"] = 'Transfer',
        Quantity = quantity,
        Recipient = to
    })
end

function _dispatchTasks()
    if (AGENTS_MARKET.Storage.TasksQueue == nil) then
        AGENTS_MARKET.Storage.TasksQueue = {}
        return
    end
    if (#AGENTS_MARKET.Storage.TasksQueue == 0) then
        return
    end

    -- iterating backwards to make removing elements safe.
    local removedIndexes = {}
    for i = #AGENTS_MARKET.Storage.TasksQueue, 1, -1 do
        assert(i ~= nil, "duh")
        local task = AGENTS_MARKET.Storage.TasksQueue[i]
        local matchAgent = AGENTS_MARKET.matchingStrategies[task.matchingStrategy]
        assert(matchAgent ~= nil, "Could not assign matching function")

        local chosenAgent = matchAgent(task.topic, task.id, task.reward, task.requesterId)
        assert(chosenAgent ~= nil, "No agents to choose from")
        if type(chosenAgent) == "table" and #chosenAgent > 0 then
            for _, agent in ipairs(chosenAgent) do
                if (agent ~= nil) then
                    task.reward = agent.fee
                    task.agentId = agent.id
                    _storeAndSendTask(agent, task, #chosenAgent)
                end
            end
            table.insert(removedIndexes, i)
        else
            if (chosenAgent ~= nil) then
                task.reward = chosenAgent.fee
                task.agentId = chosenAgent.id
                _storeAndSendTask(chosenAgent, task, 1)
                table.insert(removedIndexes, i)
            end
        end
    end
    for _, index in ipairs(removedIndexes) do
        table.remove(AGENTS_MARKET.Storage.TasksQueue, index)
    end

    -- assert(false, json.encode(AGENTS_MARKET.Storage.TasksQueue))

    return removedIndexes
end

-- FIXME: some kind of monster
function _filterAgentsWithTopicAndFeeAndNotDeclinedTask(topic, taskId, reward, requesterId)
    --assert(false, topic .. " " .. taskId .. " " .. reward)
    return utils.filter(function(x)
        return tonumber(x.fee) <= tonumber(reward)
                and x.topic == topic -- filter by required topic
                and (x.tasks.declined == nil or not utils.includes(taskId)(x.tasks.declined) -- agent did not decline task
                and (requesterId == nil or (requesterId ~= x.id)) -- do not assign task to yourself :)
        )
    end)(AGENTS_MARKET.Storage.Agents)
end

function _broadcastStrategy(topic, taskId, reward, requesterId)
    local agentsWithTopic = _filterAgentsWithTopicAndFeeAndNotDeclinedTask(topic, taskId, reward, requesterId)
    if #agentsWithTopic == 0 then
        return nil
    end
    return agentsWithTopic
end

function _leastOccupiedStrategy(topic, taskId, reward, requesterId)
    local agentsWithTopic = _filterAgentsWithTopicAndFeeAndNotDeclinedTask(topic, taskId, reward, requesterId)
    local currentLowest
    local matchedAgent
    for _, agent in ipairs(agentsWithTopic) do
        local assignedTasksSize = #(utils.keys(agent.tasks.inbox))
        if (currentLowest == nil) then
            currentLowest = assignedTasksSize
            matchedAgent = agent
            goto continue -- omfg
        end
        if (assignedTasksSize < currentLowest) then
            currentLowest = assignedTasksSize
            matchedAgent = agent
        end
        :: continue ::
    end

    return matchedAgent
end
-- FIXME: c/p - same _leastOccupiedStrategy, but with a different condition..
function _cheapestStrategy(topic, taskId, reward, requesterId)
    local agentsWithTopic = _filterAgentsWithTopicAndFeeAndNotDeclinedTask(topic, taskId, reward, requesterId)
    local currentLowest
    local agentIdx
    for i, v in ipairs(agentsWithTopic) do
        if (currentLowest == nil) then
            currentLowest = bint.new(v.fee)
            agentIdx = i
            goto continue -- omfg
        end
        if (bint.new(v.fee) < currentLowest) then
            currentLowest = v.fee
            agentIdx = i
        end
        :: continue ::
    end

    if (agentIdx ~= nil) then
        return agentsWithTopic[agentIdx]
    else
        return nil
    end
end

function _maybeInitTotals(agent)
    if (agent.totals == nil) then
        agent.totals = _initTotals()
    end
end

function _maybeInitGlobalTotals()
    if (AGENTS_MARKET.Storage.Totals == nil) then
        AGENTS_MARKET.Storage.Totals = {
            rewards = "0",
            done = 0
        }
    end
end

function _initTotals()
    return {
        requested = 0,
        assigned = 0,
        done = 0,
        rewards = "0"
    }
end

AGENTS_MARKET.matchingStrategies = {
    broadcast = _broadcastStrategy,
    leastOccupied = _leastOccupiedStrategy, -- choose next agent that supports required "topic" and is least occupied
    cheapest = _cheapestStrategy, -- choose agent that supports required "topic" for the lowest fee
    query = nil -- query agents first with the tasks details and choose the cheapest from the responses (TODO)
}
