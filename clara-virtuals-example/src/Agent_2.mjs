import 'dotenv/config'
// Create an agent with the worker
import {
  ExecutableGameFunctionResponse,
  ExecutableGameFunctionStatus,
  GameAgent,
  GameFunction,
  GameWorker
} from "@virtuals-protocol/game";
import {fetchTransactions, loadTxData} from "redstone-clara-sdk";
import {
  CLARA_PROCESS_ID,
  connectClaraProfile,
  loadRedStoneFeeds,
  messageWithTags,
  TOPIC,
  VIRTUALS_AGENT_2_ID
} from "./commons.mjs";
import {EMA, MACD, RSI} from "trading-signals";

console.log("AGENT 2");

// CLARA Market profile related to this Virtuals Agent
const claraProfile = await connectClaraProfile(VIRTUALS_AGENT_2_ID);
const claraProfileData = await claraProfile.profileData();


const loadClaraTask = new GameFunction({
  name: "load_clara_task",
  description: "Search for tasks assigned to this Agent on CLARA Market",
  args: [
  ],
  executable: async (args, logger) => {
    try {
      const messages = await fetchTransactions(claraProfileData.address, CLARA_PROCESS_ID);
      const task = messageWithTags(messages, [
        {name: 'Action', value: 'Task-Assignment'},
        {name: 'Requesting-Agent-Id', value: VIRTUALS_AGENT_1_ID}
      ]);
      if (!task) {
        return new ExecutableGameFunctionResponse(
          ExecutableGameFunctionStatus.Failed,
          "Task Assignment from CLARA Market not yet available",
        );
      }
      const taskData = await loadTxData(task.id);
      if (!taskData) {
        return new ExecutableGameFunctionResponse(
          ExecutableGameFunctionStatus.Failed,
          `Task Data for ${task.id} could not be loaded from Arweave`,
        );
      }

      const values = taskData.payload.prices.map((price) => price.value);
      console.log(values);
      const rsi1 = new RSI(values.length - 1);
      rsi1.updates(values, false);
      const RSI = rsi1.getResult();
      console.log("RSI:", RSI);

      const macd = new MACD({
        indicator: EMA,
        longInterval: 26,
        shortInterval: 12,
        signalInterval: 9,
      });

      macd.updates(values, false);
      const MACDHistogram = macd.getResult().histogram.toFixed(2);

      return new ExecutableGameFunctionResponse(
        ExecutableGameFunctionStatus.Done,
        `Task result from CLARA Market: ${JSON.stringify(task)}`
      );
    } catch (e) {
      console.error(e);
      return new ExecutableGameFunctionResponse(
        ExecutableGameFunctionStatus.Failed,
        "Could not load data from CLARA Market. Try again in a few seconds with the same claraTaskId",
      );
    }
  },
});


const worker = new GameWorker({
  id: "clara",
  name: "clara",
  description: "A worker that talks to other Agents through CLARA Market.",
  functions: [loadClaraTask],
  getEnvironment: async () => {
    return {
      lastCheckTime: 0
    };
  },
});

const agent = new GameAgent(process.env.VIRTUALS_AGENT_API_KEY, {
  name: "Technical Indicators Agent",
  goal: "Loads tasks assigned to this Agent on CLARA Market and calculates RSI and MACD technical indicators.",
  workers: [worker],
  getAgentState: async () => {
    return {}
  },
});

(async () => {
  agent.setLogger((agent, message) => {
    console.log(`-----[${agent.name}]-----`);
    console.log(message);
    console.log("\n");
  });

  await agent.init();

  await agent.step({
    verbose: true,
  });



  /*
    while (true) {
      const result = await agent.step({
        verbose: true,
      });

      console.log(result);
    }*/
})();