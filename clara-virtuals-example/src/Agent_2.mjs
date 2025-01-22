import 'dotenv/config'
// Create an agent with the worker
import {
  ExecutableGameFunctionResponse,
  ExecutableGameFunctionStatus,
  GameAgent,
  GameFunction,
  GameWorker
} from "@virtuals-protocol/game";
import {connectClaraProfile, VIRTUALS_AGENT_2_ID} from "./commons.mjs";
import {RSI} from "trading-signals";

console.log("AGENT 2");

// CLARA Market profile related to this Virtuals Agent
const claraProfile = await connectClaraProfile(VIRTUALS_AGENT_2_ID);
const claraProfileData = await claraProfile.profileData();


const loadClaraTask = new GameFunction({
  name: "load_clara_task",
  description: "Search for tasks assigned to this Agent on CLARA Market, generate RSI value",
  args: [],
  executable: async (args, logger) => {
    try {
      const nextTask = await claraProfile.loadNextAssignedTask();
      if (!nextTask) {
        return new ExecutableGameFunctionResponse(
          ExecutableGameFunctionStatus.Failed,
          `No CLARA Tasks to process`,
        );
      }

      const values = nextTask.payload.prices.map((price) => price.value);
      console.log(values);
      const rsi = new RSI(values.length - 1);
      rsi.updates(values, false);
      const rsiValue = rsi.getResult();
      console.log("RSI:", rsiValue);

      const result = {
        rsi: rsiValue,
      }
      console.log(result);

      const taskId = nextTask.id

      return new ExecutableGameFunctionResponse(
        ExecutableGameFunctionStatus.Done,
        `task_id: ${taskId}, generated RSI: ${rsiValue}. Analyzing the calculated RSI value`,
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

const generateRecommendation = new GameFunction({
  name: "generate_recommendation",
  description: "Describe the RSI technical indicator",
  args: [
    {
      name: "task_id",
      description: "A CLARA Market task id for which the signal should be generated",
      optional: false,
      type: "string"
    },
    {
      name: "rsi",
      description: "An RSI technical indicator calculated based on data from CLARA task used to generate bullish or bearish signal",
      optional: false,
      type: "number"
    },
    {
      name: "analysis",
      description: "Analysis of the RSI value",
      optional: false,
      type: "string"
    },
    {
      name: "analysis_reasoning",
      description: "Reasoning behind the analysis",
      optional: false,
      type: "string"
    },
  ],
  executable: async (args, logger) => {
    try {
      console.log(args);
      if (!args.analysis || !args.analysis_reasoning || !args.rsi) {
        return new ExecutableGameFunctionResponse(
          ExecutableGameFunctionStatus.Failed,
          "RSI Analysis not performed",
        );
      }
      if (!args.task_id) {
        return new ExecutableGameFunctionResponse(
          ExecutableGameFunctionStatus.Failed,
          "Task id not available",
        );
      }

      console.log("Sending result to the requesting agent");

      const result = await claraProfile.sendTaskResult({
        taskId: args.task_id,
        result: {
          rsi: args.rsi,
          analysis: args.analysis,
          analysis_reasoning: args.analysis_reasoning,
        }
      })

      return new ExecutableGameFunctionResponse(
        ExecutableGameFunctionStatus.Done,
        `Done`,
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
  description: "A worker that analyses RSI value on prices from tasks loaded from CLARA market",
  functions: [loadClaraTask, generateRecommendation],
  getEnvironment: async () => {
    return {};
  },
});

const agent = new GameAgent(process.env.VIRTUALS_AGENT_2_API_KEY, {
  name: "Clara Agent",
  goal: "Analyses the calculated RSI value",
  description: "Perform technical analysis based on tasks loaded from CLARA market",
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


  while (true) {
    const result = await agent.step({
      verbose: true,
    });

    console.log(result);
  }
})();