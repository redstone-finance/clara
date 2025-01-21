local json = require "json"
local bint = require('.bint')(256)
local utils = require('.utils')

local version = "1.0.0"
AGENTS_MARKET = AGENTS_MARKET or {}

AGENTS_MARKET._version = AGENTS_MARKET._version or version
AGENTS_MARKET.Storage = AGENTS_MARKET.Storage or {
    Agents = {},
    TasksQueue = {} -- queueueueueueueueueue
}

AGENTS_MARKET.topic = {
    "broadcast",
    "tweet",
    "discord",
    "telegram",
    "nft",
    "chat"
}


AGENTS_MARKET.protocol = "C.L.A.R.A."

AGENTS_MARKET.v1 = AGENTS_MARKET.v1 or {}

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
            outbox = {}, -- results of the the tasks processed by this Agent
            declined = {}   --  array of IDs of the tasks declined by this Agent
        },
        declinedTasks = {}
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
    _assertAgentBelongsToSender(agentId, senderAddr)
    _assertIsPositiveInteger(reward, "Agent-Reward")
    _assertProtocol(protocol)
    _assertTopic(topic)
    _assertStrategy(matchingStrategy)

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
    agent.tasks.outbox[taskId] = responseData;
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
        local chosenAgent = utils.find(function(x)
            return x.id == originalTask.requesterId
        end)(AGENTS_MARKET.Storage.Agents)
        task.reward = chosenAgent.fee
        task.agentId = chosenAgent.id
        assert(chosenAgent ~= nil, "Chat topic receiver agent not found " .. originalTask.requesterId)
        _storeAndSendTask(chosenAgent, task)
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
        Data = json.encode(AGENTS_MARKET.Storage.TasksQueue)
    })
end

function AGENTS_MARKET.v1.ListAgents(msg)
    msg.reply({
        Action = "List-Agents",
        Protocol = AGENTS_MARKET.protocol,
        Data = json.encode(AGENTS_MARKET.Storage.Agents)
    })
end

function AGENTS_MARKET.v1.TasksQueue(msg)
    msg.reply({
        Action = "Tasks-Queue",
        Protocol = AGENTS_MARKET.protocol,
        Data = json.encode(AGENTS_MARKET.Storage.TasksQueue)
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

-- ======= ASSERTS
function _assertAgentBelongsToSender(agentId, senderAddr)

end

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

function _assertAgentRegistered(agentId, sender)
    assert(agentId ~= nil, 'Sender not registered as Agent')
    assert(utils.find(function(x)
        return x.id == agentId and x.profileAddress == sender
    end)(AGENTS_MARKET.Storage.Agents) ~= nil,
            "Agent " .. agentId .. " not registered for sender " .. sender)
end


-- ======= PRIVATE FUNCTIONS
function _storeAndSendTask(chosenAgent, task)
    chosenAgent.tasks.inbox[task.id] = task;
    Send({
        Target = chosenAgent.profileAddress,
        ["Task-Id"] = task.id,
        ["Assigned-Agent-Id"] = chosenAgent.id,
        ["Requesting-Agent-Id"] = task.requesterId,
        ["Context-Id"] = task.contextId,
        Action = 'Task-Assignment',
        Protocol = AGENTS_MARKET.protocol,
        Data = json.encode(task)
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
        local task = AGENTS_MARKET.Storage.TasksQueue[i]
        assert(i ~= nil, "duh")
        if (task.topic == "broadcast") then
            ao.log("broadcast") -- this shit ain't loggin'
            -- TODO: this probably should be limited to only some whitelisted profiles?
            for i in ipairs(AGENTS_MARKET.Storage.Agents) do
                local agent = AGENTS_MARKET.Storage.Agents[i]
                _storeAndSendTask(agent, task)
            end
            table.remove(AGENTS_MARKET.Storage.TasksQueue, i)
            table.insert(removedIndexes, i)
        else
            local matchAgent = AGENTS_MARKET.matchingStrategies[task.matchingStrategy]
            assert(matchAgent ~= nil, "Could not assign matching function")
            local chosenAgent = matchAgent(task.topic, task.id, task.reward, task.requesterId)
            if (chosenAgent ~= nil) then
                task.reward = chosenAgent.fee
                task.agentId = chosenAgent.id
                _storeAndSendTask(chosenAgent, task)
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

AGENTS_MARKET.matchingStrategies = {
    leastOccupied = _leastOccupiedStrategy, -- choose next agent that supports required "topic" and is least occupied
    cheapest = _cheapestStrategy, -- choose agent that supports required "topic" for the lowest fee
    query = nil -- query agents first with the tasks details and choose the cheapest from the responses (TODO)
}

