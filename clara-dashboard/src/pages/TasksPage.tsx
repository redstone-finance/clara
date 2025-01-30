import {Component, createMemo, createResource, createSignal, For, Show} from "solid-js";
import {useNavigate} from "@solidjs/router";
import {TaskStatus} from "../types/types";
import {cachedMarketData} from "../ao/fetch-market-data";
import {Preloader} from "../components/Preloader";
import {formatAmount} from "../utils/formatters";

export const TasksPage: Component = () => {
    const navigate = useNavigate();
    const [marketData] = createResource(cachedMarketData);

    const [filterAgentId, setFilterAgentId] = createSignal("");
    const [filterTaskId, setFilterTaskId] = createSignal("");
    const [filterTopic, setFilterTopic] = createSignal("");
    const [filterStatus, setFilterStatus] = createSignal<"" | TaskStatus>("");

    const filteredTasks = createMemo(() => {
        return marketData()?.tasks.filter(task => {
            return (
                (filterAgentId() ? task.requesterId.toLowerCase().includes(filterAgentId().toLowerCase()) : true) &&
                (filterTaskId() ? task.id.toLowerCase().includes(filterTaskId().toLowerCase()) : true) &&
                (filterTopic() ? task.topic.includes(filterTopic()) : true) &&
                (filterStatus() ? task.status === filterStatus() : true)
            );
        });
    });

    const handleTaskClick = (taskId: string) => {
        navigate(`/tasks/${taskId}`);
    };

    return (
        <div class="container">
            <h1 class="display-5">Tasks</h1>
            <Show when={marketData.loading}>
                <Preloader/>
            </Show>
            <Show when={marketData.error}>
                <div class="alert alert-danger">
                    Failed to load market data: {marketData.error?.message}
                </div>
            </Show>
            <Show when={marketData()} keyed>
                <div class="row mb-3">
                    <div class="col">
                        <input
                            type="text"
                            class="form-control"
                            placeholder="Filter by Task ID"
                            value={filterTaskId()}
                            onInput={(e) => setFilterTaskId(e.currentTarget.value)}
                        />
                    </div>
                    <div class="col">
                        <input
                            type="text"
                            class="form-control"
                            placeholder="Filter by Requesting Agent ID"
                            value={filterAgentId()}
                            onInput={(e) => setFilterAgentId(e.currentTarget.value)}
                        />
                    </div>
                    <div class="col">
                        <input
                            type="text"
                            class="form-control"
                            placeholder="Filter by Topic"
                            value={filterTopic()}
                            onInput={(e) => setFilterTopic(e.currentTarget.value)}
                        />
                    </div>
                    <div class="col">
                        <select
                            class="form-select"
                            value={filterStatus()}
                            onChange={(e) => setFilterStatus(e.currentTarget.value as "" | TaskStatus)}
                        >
                            <option value="">All Statuses</option>
                            <option value="queued">Queued</option>
                            <option value="assigned">Assigned</option>
                            <option value="done">Done</option>
                        </select>
                    </div>
                </div>

                <table class="table table-striped">
                    <thead>
                    <tr>
                        <th>Task ID</th>
                        <th>Requesting Agent</th>
                        <th>Assigned Agent</th>
                        <th>Topic</th>
                        <th>Reward</th>
                        <th>Status</th>
                        <th>Created</th>
                    </tr>
                    </thead>
                    <tbody>
                    <For each={filteredTasks()}>
                        {(task) => (
                            <tr style={{cursor: "pointer"}} onClick={() => handleTaskClick(task.id)}>
                                <td class="fs-6 text-truncate">{task.id}</td>
                                <td class="fs-6">{task.requesterId}</td>
                                <td class="fs-6">{task.agentId || 'N/A'}</td>
                                <td class="fs-6">{task.topic}</td>
                                <td class="fs-6">{formatAmount(task.reward)}</td>
                                <td class="fs-6">{task.status}</td>
                                <td class="fs-6 text-truncate">{(new Date(task.timestamp)).toISOString()}</td>
                            </tr>
                        )}
                    </For>
                    </tbody>
                </table>
            </Show>
        </div>
    );
};