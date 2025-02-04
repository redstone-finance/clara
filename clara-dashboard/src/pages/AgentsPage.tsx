import {Component, createMemo, createResource, createSignal, For, Show} from "solid-js";
import {useNavigate} from "@solidjs/router";
import {Preloader} from "../components/Preloader";
import {fetchMarketData} from "../ao/fetch-market-data";
import {formatAmount} from "../utils/formatters";

export const AgentsPage: Component = () => {
    const navigate = useNavigate();
    const [marketData] = createResource(fetchMarketData);

    const [filterAgentId, setFilterAgentId] = createSignal("");
    const [filterWalletAddress, setFilterWalletAddress] = createSignal("");
    const [filterTopic, setFilterTopic] = createSignal("");

    const filteredAgents = createMemo(() => {
        return marketData()?.agents.filter(agent => {
            return (
                (filterAgentId() ? agent.id?.toLowerCase().includes(filterAgentId()?.toLowerCase()) : true) &&
                (filterWalletAddress() ? agent.profileAddress.toLowerCase().includes(filterWalletAddress()?.toLowerCase()) : true) &&
                (filterTopic() ? agent.topic?.toLowerCase().includes(filterTopic()?.toLowerCase()) : true)
            );
        });
    });


    const handleAgentClick = (agentId: string) => {
        navigate(`/agents/${agentId}`);
    };

    return (
        <div class="container">
            <h1 class="display-6">Agents</h1>

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
                            placeholder="Filter by Agent ID"
                            value={filterAgentId()}
                            onInput={(e) => setFilterAgentId(e.currentTarget.value)}
                        />
                    </div>
                    <div class="col">
                        <input
                            type="text"
                            class="form-control"
                            placeholder="Filter by Wallet Address"
                            value={filterWalletAddress()}
                            onInput={(e) => setFilterWalletAddress(e.currentTarget.value)}
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
                </div>


                <table class="table table-striped table-hover">
                    <thead>
                    <tr>
                        <th>Agent ID</th>
                        <th>Wallet address</th>
                        <th>Topic</th>
                        <th>Min Fee</th>
                        <th>Earned Tokens</th>
                    </tr>
                    </thead>
                    <tbody>
                    <For each={filteredAgents()}>
                        {(agent) => (
                            <tr style={{cursor: "pointer"}} onClick={() => handleAgentClick(agent.id)}>
                                <td class="fs-6 text-truncate">{agent.id}</td>
                                <td class="fs-6"><span class="badge bg-light font-monospace"
                                                       onClick={(e) => {
                                                           e.stopImmediatePropagation();
                                                           e.preventDefault()
                                                       }}>{agent.profileAddress}</span></td>
                                <td class="fs-6 text-uppercase">{agent.topic}</td>
                                <td class="fs-6"><span class="badge bg-warning">{formatAmount(agent.fee)}</span></td>
                                <td class="fs-6"><span class="badge bg-info text-white">{formatAmount(agent.totals?.rewards || "0")}</span></td>
                            </tr>
                        )}
                    </For>
                    </tbody>
                </table>
            </Show>
        </div>
    );
};