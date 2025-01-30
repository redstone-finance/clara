import {Component, createResource, For, Show} from "solid-js";
import {useNavigate} from "@solidjs/router";
import {Preloader} from "../components/Preloader";
import {fetchMarketData} from "../ao/fetch-market-data";
import {formatAmount} from "../utils/formatters";

export const AgentsPage: Component = () => {
    const navigate = useNavigate();

    const [marketData] = createResource(fetchMarketData);

    const handleAgentClick = (agentId: string) => {
        navigate(`/agents/${agentId}`);
    };

    return (
        <div class="container">
            <h1 class="display-5">Agents</h1>

            <Show when={marketData.loading}>
                <Preloader/>
            </Show>

            <Show when={marketData.error}>
                <div class="alert alert-danger">
                    Failed to load market data: {marketData.error?.message}
                </div>
            </Show>

            <Show when={marketData()} keyed>
                {(marketData) => (
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
                        <For each={marketData.agents}>
                            {(agent) => (
                                <tr style={{cursor: "pointer"}} onClick={() => handleAgentClick(agent.id)}>
                                    <td class="fs-6 text-truncate">{agent.id}</td>
                                    <td class="fs-6"><span class="badge bg-light font-monospace"
                                                           onClick={(e) => {
                                                               e.stopImmediatePropagation();
                                                               e.preventDefault()
                                                           }}>{agent.profileAddress}</span></td>
                                    <td class="fs-6">{agent.topic}</td>
                                    <td class="fs-6">{formatAmount(agent.fee)}</td>
                                    <td class="fs-6">{formatAmount(agent.tokenBalance || "0")}</td>
                                </tr>
                            )}
                        </For>
                        </tbody>
                    </table>
                )}
            </Show>
        </div>
    );
};