import {Component, createMemo, createResource, Show} from "solid-js";
import {useNavigate, useParams} from "@solidjs/router";
import {Preloader} from "../components/Preloader";
import {formatAmount} from "../utils/formatters";
import {useDataSource} from "../DataSourceContext";
import {cachedMarketData} from "../data/fetch-market-data";
import {MarketDataResult} from "../types/types";

export const TaskDetailsPage: Component = () => {
    const navigate = useNavigate();
    const { dataSource } = useDataSource();
    const [marketData] = createResource<MarketDataResult>(dataSource, cachedMarketData);

    const params = useParams();

    const task = createMemo(() => marketData()?.tasks.find(t => {
        return t.id === params.id
    }));

    const handleAgentClick = (agentId: string) => {
        navigate(`/agents/${agentId}`);
    };

    return (
        <div class="container">
            <h1 class="display-6">Task Details</h1>
            <Show when={marketData.loading}>
                <Preloader/>
            </Show>
            <Show when={marketData.error}>
                <div class="alert alert-danger">
                    Failed to load market data: {marketData.error?.message}
                </div>
            </Show>
            <Show when={marketData()} keyed>
                <Show when={task()} fallback={<div>Task not found</div>}>
                    <div class="mb-3">
                        <strong>Task ID:</strong> <span class="badge bg-light font-monospace">{task()?.id}</span>
                    </div>
                    <div class="mb-3">
                        <strong>Requesting Agent ID:</strong> <a
                        href={`/agents/${task()?.requesterId}`}>{task()?.requesterId}</a>
                    </div>
                    <div class="mb-3">
                        <strong>Created at:</strong>
                        <span class="badge bg-light font-monospace">
                            {(new Date(task()?.timestamp)).toISOString()}
                        </span>
                    </div>
                    <div class="mb-3">
                        <strong>Reward:</strong> <span
                        class="badge bg-light font-monospace">{formatAmount(dataSource(), task()?.reward)}</span>
                    </div>
                    <div class="mb-3">
                        <strong>Matching Strategy:</strong> <span
                        class="badge bg-light font-monospace">{task()?.matchingStrategy}</span>
                    </div>
                    <div class="mb-3">
                        <strong>Topic:</strong> <span class="badge bg-light font-monospace">{task()?.topic}</span>
                    </div>
                    <div class="mb-3">
                        <strong>Payload:</strong>
                        <pre style="max-width: 600px; white-space: pre-wrap; ">{JSON.stringify(task()?.payload)}</pre>
                    </div>
                    <div class="mb-3">
                        <strong>Status:</strong> <span class="badge bg-light font-monospace">{task()?.status}</span>
                    </div>

                    <Show when={task()?.status === "done"}>
                        <div class="mb-3">
                            <strong>Done at:</strong>
                            <span class="badge bg-light font-monospace">
                                {(new Date(task()?.doneTimestamp)).toISOString()}
                            </span>
                        </div>
                        <div class="mb-3">
                            <strong>Result:</strong>
                            <pre style="max-width: 600px; white-space: pre-wrap; ">{JSON.stringify(task()?.result)}</pre>
                        </div>
                    </Show>
                </Show>
            </Show>
        </div>
    );
};