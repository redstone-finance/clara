import {Component, createMemo, createResource, For, Show} from "solid-js";
import {useParams} from "@solidjs/router";
import {Preloader} from "../components/Preloader";
import {formatAmount} from "../utils/formatters";
import {useDataSource} from "../DataSourceContext";
import {cachedMarketData} from "../data/fetch-market-data";
import {MarketDataResult} from "../types/types";

export const AgentDetailsPage: Component = () => {
    const { dataSource } = useDataSource();
    const [marketData] = createResource<MarketDataResult>(dataSource, cachedMarketData);
    const params = useParams();

    const agent = createMemo(() => marketData()?.agents.find(a => {
        return a.id === params.id
    }));

    return (
        <div class="container">
            <Show when={marketData.loading}>
                <Preloader/>
            </Show>
            <Show when={marketData.error}>
                <div class="alert alert-danger">
                    Failed to load market data: {marketData.error?.message}
                </div>
            </Show>
            <Show when={marketData()} keyed>
                <Show when={agent()} fallback={<div>Agent not found</div>}>
                    <h1 class="display-6">{agent()?.id}</h1>
                    <div class="mb-3">
                        <strong>Wallet address:</strong> <span class="badge bg-light font-monospace">{agent()?.profileAddress}</span>
                    </div>
                    <div class="mb-3">
                        <strong>Topic:</strong> <span class="badge bg-light font-monospace">{agent()?.topic}</span>
                    </div>
                    <div class="mb-3">
                        <strong>Minimum Fee:</strong> <span class="badge bg-light font-monospace">{formatAmount(dataSource(), agent()?.fee)}</span>
                    </div>

                    <h4 class="mt-5">Stats</h4>
                    <div class="bg-component mb-3">
                        <span
                            class="badge bg-info p-2 m-1">Tokens Earned: {formatAmount(dataSource(), agent()?.totals.rewards)}</span>
                        <span class="badge bg-primary p-2 m-1">Tasks Requested: {agent()?.totals.requested}</span>
                        <span class="badge bg-light p-2 m-1">Tasks Assigned: {agent()?.totals.assigned}</span>
                        <span class="badge bg-success p-2 m-1">Tasks Done: {agent()?.totals.done}</span>
                        <span class="badge bg-warning p-2 m-1">Tasks Waiting: {agent()?.totals.waiting}</span>
                    </div>
                    <h4 class="mt-5">Tasks</h4>
                    <table class="table table-bordered">
                        <thead>
                        <tr>
                            <th>Task ID</th>
                            <th>Topic</th>
                            <th>Reward</th>
                            <th>Status</th>
                        </tr>
                        </thead>
                        <tbody>
                        <For each={agent()?.tasks || []}>
                            {(task) => (
                                <tr>
                                    <td>
                                        <a href={`/tasks/${task.id}`}>{task.id}</a>
                                    </td>
                                    <td>{task.topic}</td>
                                    <td>{formatAmount(dataSource(), task.reward)}</td>
                                    <td>{task.status}</td>
                                </tr>
                            )}
                        </For>
                        </tbody>
                    </table>
                </Show>
            </Show>
        </div>
    );
};