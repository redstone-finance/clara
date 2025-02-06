import {Agent, MarketDataResult, MarketTask, TaskStatus} from "../types/types";
import {dryrun} from "@permaweb/aoconnect";

const processId = '86kVM56iOu4P_AfgGGfS9wEDzpO9yb6vaX_tOaDKqMU';

export async function getAoData(): Promise<MarketDataResult> {
    const response = await dryrun({
        process: processId,
        data: '',
        tags: [{name: 'Action', value: 'Dashboard-Data'}]
    });
    const parsedData = JSON.parse(response.Messages[0].Data);

    const rawAgents = parsedData.agents.map((a: Agent) => {
        if (!a.totals) {
            // @ts-ignore
            a.totals = {
                requested: 0,
                assigned: 0,
                done: 0,
                rewards: "0"
            }
        }
        a.totals.waiting = a.totals.assigned - a.totals.done;
        return a;
    });
    const rawTasks = parsedData.queue;
    const tasks = [...flattenTasks(rawAgents), ...rawTasks.map((task: MarketTask) => ({
        ...task,
        status: "queued"
    }))];

    return {
        agents: rawAgents,
        tasks,
        totals: parsedData.totals
    }
}

function flattenTasks(agents: any[]) {
    const result: MarketTask[] = [];
    for (const agent of agents) {
        const assigned = Object.values<MarketTask>(agent.tasks.inbox)
            .map((task) => ({
                ...task,
                status: "assigned" as TaskStatus,
            }));
        const done = Object.values<MarketTask>(agent.tasks.results)
            .map((task) => ({
                ...task,
                doneTimestamp: task.timestamp,
                ...task.originalTask,
                status: 'done' as TaskStatus,
            }));

        const agentsTasks = [...assigned, ...done];
        result.push(...agentsTasks);
        agent.tasks = agentsTasks;
    }

    return result;
}
