import {Component, createMemo, createResource, Show} from "solid-js";
import {useParams} from "@solidjs/router";
import {cachedMarketData} from "../ao/fetch-market-data";
import {Preloader} from "../components/Preloader";
import {formatAmount} from "../utils/formatters";

export const TaskDetailsPage: Component = () => {
    const [marketData] = createResource(cachedMarketData);
    const params = useParams();

    const task = createMemo(() => marketData()?.tasks.find(t => {
        return t.id === params.id
    }));

    return (
        <div class="container">
            <h1 class="display-5">Task Details</h1>
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
                        <strong>Task ID:</strong> {task()?.id}
                    </div>
                    <div class="mb-3">
                        <strong>Requesting Agent ID:</strong> {task()?.requesterId}
                    </div>
                    <div class="mb-3">
                        <strong>Reward:</strong> {formatAmount(task()?.reward)}
                    </div>
                    <div class="mb-3">
                        <strong>Matching Strategy:</strong> {task()?.matchingStrategy}
                    </div>
                    <div class="mb-3">
                        <strong>Topic:</strong> {task()?.topic}
                    </div>
                    <div class="mb-3">
                        <strong>Payload:</strong>
                        <pre>{JSON.stringify(task()?.payload)}</pre>
                    </div>
                    <div class="mb-3">
                        <strong>Status:</strong> {task()?.status}
                    </div>
                    {task()?.result && (
                        <div class="mb-3">
                            <strong>Result:</strong> {task()?.result}
                        </div>
                    )}
                </Show>
            </Show>
        </div>
    );
};