// Some dummy agents and tasks
export const initialAgents: Agent[] = [
    {
        id: "agent-1",
        name: "AI Assistant",
        topic: "General",
        minFee: 10,
        tokenBalance: 123,
        tasks: []
    },
    {
        id: "agent-2",
        name: "Finance Bot",
        topic: "Finance",
        minFee: 25,
        tokenBalance: 300,
        tasks: []
    },
];

export const initialTasks: Task[] = [
    {
        id: "task-1",
        agentId: "agent-1",
        reward: 50,
        strategy: "matching-strategy-1",
        topic: "General",
        payload: "Task details…",
        status: "done",
        result: "Completed output"
    },
    {
        id: "task-2",
        agentId: "agent-1",
        reward: 20,
        strategy: "matching-strategy-2",
        topic: "General",
        payload: "Another task…",
        status: "waiting"
    },
    {
        id: "task-3",
        agentId: "agent-2",
        reward: 100,
        strategy: "matching-strategy-1",
        topic: "Finance",
        payload: "Finance task payload…",
        status: "waiting"
    }
];

// Pair tasks with the correct agent in the mock data
initialAgents[0].tasks = initialTasks.filter(t => t.agentId === "agent-1");
initialAgents[1].tasks = initialTasks.filter(t => t.agentId === "agent-2");