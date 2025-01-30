export interface Agent {
    id: string;
    profileAddress: string;
    metadata: Record<string, unknown>;
    fee: string;
    tokenBalance: string;
    topic: string;
    totals: {
        requested: number,
        assigned: number,
        done: number,
        rewards: string,
        waiting: number,
    },
    tasks: MarketTask[]
}

export type TaskStatus = 'queued' | 'assigned' | 'done';

export interface MarketTask {
    status: TaskStatus;
    id: string;
    requesterId: string;   // which agent requested it
    matchingStrategy: string;   // which agent requested it
    block: number;
    agentId: string;
    topic: string;
    payload: any;
    timestamp: number;
    reward: string;
    result?: string;
}