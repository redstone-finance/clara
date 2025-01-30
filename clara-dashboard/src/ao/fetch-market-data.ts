import {dryrun} from "@permaweb/aoconnect";
import {Agent, MarketTask, TaskStatus} from "../types/types";

const processId = 'VWXNi4IaUAOyQ04PjKsq8CO5wr8dXjHxFY-Oo2oyLCs';
//const processId = '_enL2dDFYn9bcv0APyUbDlgAU6Z6DfiWC2yc0yMav-Y';

type MarketDataResult = { agents: Agent[], tasks: MarketTask[], totals: { done: number, rewards: string } };
let cache: MarketDataResult | null = null;

let alreadyFetching: Promise<MarketDataResult> | null = null;

export async function fetchMarketData() {
    if (alreadyFetching) {
        return alreadyFetching;
    } else {
        alreadyFetching = new Promise<MarketDataResult>(async (resolve, reject) => {
            console.log("Fetching Market Data...", cache);
            try {
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
                cache = {
                    agents: rawAgents,
                    tasks,
                    totals: parsedData.totals
                }
                resolve(cache);
            } catch (error) {
                reject(error);
            } finally {
                alreadyFetching = null;
            }

        });
        return alreadyFetching;
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
                status: 'done' as TaskStatus,
            }));

        const agentsTasks = [...assigned, ...done];
        result.push(...agentsTasks);
        agent.tasks = agentsTasks;
    }

    return result;
}

export async function cachedMarketData() {
    if (cache) {
        return cache;
    } else {
        return fetchMarketData();
    }
}