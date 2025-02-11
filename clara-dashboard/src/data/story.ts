import {Agent, DataSource, MarketDataResult, MarketTask, TaskStatus} from "../types/types";
import {createPublicClient, defineChain, http, PublicClient} from "viem";
import {storyOdyssey} from "viem/chains";
import {odysseyMarketAbi} from "./odysseyMarketAbi";
import {aeneidMarketAbi} from "./aeneidMarketAbi";

const contractAddrOdyssey = "0x0F3444e3a87066DdB7aC582dC776f499d44187f7";
const contractAddrAeneid = "0x65ABFE481b20d526FAf040a9DeB5d2Baf52EcFB9";

const fromBlock = 2500425n;

export async function getStoryData(source: DataSource): Promise<MarketDataResult> {
    const contractAddr = source === 'story_odyssey'
        ? contractAddrOdyssey
        : contractAddrAeneid;

    const fromBlock = source === 'story_odyssey'
        ? 2500425n
        : 662722n;

    const chainDef = source === 'story_odyssey'
        ? storyOdyssey
        : defineChain({
            id: 1315,
            name: 'Story Aeneid Testnet',
            nativeCurrency: {
                decimals: 18,
                name: 'IP',
                symbol: 'IP',
            },
            rpcUrls: {
                default: {http: ['https://aeneid.storyrpc.io']},
            },
            blockExplorers: {
                default: {
                    name: 'Aeneid Testnet Explorer',
                    url: 'https://aeneid.storyscan.xyz/',
                },
            },
            testnet: true,
        });

    const effectiveAbi = source === 'story_odyssey'
        ? odysseyMarketAbi
        : aeneidMarketAbi


    const publicClient: PublicClient = createPublicClient({
        chain: chainDef,
        transport: http(),
    });

    const agentsPromise = publicClient.getContractEvents({
        address: contractAddr,
        abi: effectiveAbi,
        eventName: 'RegisteredAgent',
        fromBlock,
    });

    const tasksPromise = publicClient.getContractEvents({
        address: contractAddr,
        abi: effectiveAbi,
        eventName: 'TaskAssigned',
        fromBlock,
    });

    const tasksResultsPromise = publicClient.getContractEvents({
        address: contractAddr,
        abi: effectiveAbi,
        eventName: 'TaskResultSent',
        fromBlock: fromBlock,
    });

    const marketTotalsPromise = publicClient.readContract({
        address: contractAddr,
        functionName: 'marketTotals',
        abi: effectiveAbi,
    });

    const [marketTotals, agentsResult, tasksResult, tasksResultsResult] =
        await Promise.all([marketTotalsPromise, agentsPromise, tasksPromise, tasksResultsPromise]);

    const agentIds: string[] = [];
    const agentsMap: {[key: string]: Agent} = {};
    const agents = agentsResult.map((log: any) => {
        const rawAgent = log.args.agentInfo;
        agentIds.push(rawAgent.id);
        const mappedAgent = {
            id: rawAgent.id,
            profileAddress: rawAgent.id,
            metadata: rawAgent.metadata,
            fee: rawAgent.fee,
            topic: rawAgent.topic,
            totals: {
                requested: 0,
                assigned: 0,
                done: 0,
                rewards: "0",
                waiting: 0,
            },
            tasks: []
        }
        agentsMap[rawAgent.id as string] = mappedAgent;
        return mappedAgent;
    });

    const totals = agentIds.map(id => {
        return publicClient.readContract({
            address: contractAddr,
            functionName: 'agentTotals',
            abi: effectiveAbi,
            args: [id]
        });
    });
    const totalsResults = await Promise.all(totals);

    for (let i = 0; i < agentIds.length; i++) {
        // @ts-ignore
        agents[i].totals = {
            requested: Number(totalsResults[i][0]),
            assigned: Number(totalsResults[i][1]),
            done: Number(totalsResults[i][2]),
            rewards: totalsResults[i][3],
            waiting: Number(totalsResults[i][1]) - Number(totalsResults[i][2]),
        };
    }

    const allTasksMap: {[key: string]: MarketTask} = {};
    const allTasks = tasksResult.map((log: any) => {
        const rawTask = log.args.task;
        const mappedTask = {
            status: "assigned" as TaskStatus,
            id: rawTask.id.toString(),
            requesterId: rawTask.requester,
            matchingStrategy: rawTask.matchingStrategy,
            block: rawTask.blockNumber,
            agentId: rawTask.agentId,
            topic: rawTask.topic,
            payload: rawTask.payload,
            timestamp: Number(rawTask.timestamp) * 1000,
            reward: rawTask.reward,
        }
        allTasksMap[rawTask.id.toString()] = mappedTask;
        agentsMap[rawTask.agentId].tasks.push(mappedTask);
        return mappedTask;
    });
    for (const log of tasksResultsResult) {
        const rawTaskResult = (log as any).args.taskResult;
        allTasksMap[rawTaskResult.id.toString()].doneTimestamp = Number(rawTaskResult.timestamp) * 1000;
        allTasksMap[rawTaskResult.id.toString()].result = rawTaskResult.result;
        allTasksMap[rawTaskResult.id.toString()].status = "done";
    }

    return {
        agents,
        tasks: allTasks,
        totals: {
            done: Number(marketTotals[0]), rewards: marketTotals[1],
        }
    }
}
