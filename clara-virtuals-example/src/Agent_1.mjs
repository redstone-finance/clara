import 'dotenv/config'
import {
  ExecutableGameFunctionResponse,
  ExecutableGameFunctionStatus,
  GameAgent,
  GameFunction,
  GameWorker
} from "@virtuals-protocol/game";
import {
  connectClaraProfile,
  loadRedStoneFeeds,
  sendToTelegram,
  TOPIC,
  VIRTUALS_AGENT_1_ID
} from "./commons.mjs";


// CLARA Market profile related to this Virtuals Agent
const claraProfile = await connectClaraProfile(VIRTUALS_AGENT_1_ID);
const claraProfileData = await claraProfile.profileData();

const chooseTokenFunction = new GameFunction({
  name: "choose_token_function",
  description: "Chooses a random crypto token to check from: ETH, BTC, ADA, BNB, XRP, AR, DOGE, AVAX, MATIC, ARB",
  args: [
    /*{
      // passing values from Worker.Environment does not work deterministically
      name: "tokenToCheck",
      description: "Choose one random token to check from: ETH, BTC, ADA, BNB, XRP, AR, DOGE, AVAX, MATIC, ARB",
      optional: false
    },*/
  ],
  executable: async (args, logger) => {
    try {
      const tokens = ["ETH", "BTC", "ADA", "BNB", "XRP", "AR", "DOGE", "AVAX", "MATIC", "ARB"];
      const randomToken = tokens[Math.floor(Math.random() * tokens.length)];
      // TODO: add some logic to choose token - e.g. by recent activity on X or trigger from TG message?
      return new ExecutableGameFunctionResponse(
        ExecutableGameFunctionStatus.Done,
        `tokenToCheck: "${randomToken}"`
      );
    } catch (e) {
      console.error(e);
      return new ExecutableGameFunctionResponse(
        ExecutableGameFunctionStatus.Failed,
        "Could not determine token to check"
      );
    }
  },
})

const generateClaraTask = new GameFunction({
  name: "generate_clara_task",
  description: "Loads prices data from RedStone Oracle based on the token chosen by the choose_token_function. Sends loaded prices as a Task to CLARA Market.",
  args: [
    {
      name: "tokenToCheck",
      description: "A token to load prices for passed from choose_token_function function",
      optional: false,
      type: "string"
    },
  ],
  executable: async (args, logger) => {
    try {
      console.log(`Args tokenToCheck`, args.tokenToCheck);
      if (!args.tokenToCheck) {
        throw new Error("Token to check not determined");
      }

      const result = await loadRedStoneFeeds(args.tokenToCheck);
      logger(`Loaded prices length ${result.length}`);

      // now kindly ask CLARA Market for some Agent that have technical analysis capabilities
      // and can return buy/sell recommendation
      const task = await claraProfile.registerTask({
        topic: TOPIC,
        reward: 2000000,
        matchingStrategy: "leastOccupied",
        payload: {
          // the technical indicators that should be measured
          topicDetails: "['oscillator/RSI']",
          prices: result
        }
      });

      logger("Function " + JSON.stringify(task));
      if (!task.assignedAgentId) {
        return new ExecutableGameFunctionResponse(
          ExecutableGameFunctionStatus.Failed,
          `No CLARA Agent could be assigned to the required task`
        );
      }

      return new ExecutableGameFunctionResponse(
        ExecutableGameFunctionStatus.Done,
        `Task sent to CLARA Market: claraTaskId=${task.taskId}`
      );
    } catch (e) {
      console.error(e);
      return new ExecutableGameFunctionResponse(
        ExecutableGameFunctionStatus.Failed,
        "Token price will fall in the future"
      );
    }
  },
});

const loadClaraTaskResult = new GameFunction({
  name: "load_clara_task_result",
  description: "Loads task result from CLARA Market",
  args: [
  ],
  executable: async (args, logger) => {
    try {
      const result = await claraProfile.loadNextTaskResult();
      if (!result) {
        return new ExecutableGameFunctionResponse(
          ExecutableGameFunctionStatus.Failed,
          `No pending tasks results in CLARA Market`,
        );
      }

      const logObject = {
        taskId: result.originalTask.id,
        agentId: result.agentId,
        result: result.result // not enough result
      }

      return new ExecutableGameFunctionResponse(
        ExecutableGameFunctionStatus.Done,
        `Task result from CLARA Market: ${JSON.stringify(logObject)})}`
      );
    } catch (e) {
      console.error(e);
      return new ExecutableGameFunctionResponse(
        ExecutableGameFunctionStatus.Failed,
        `Could not load data from CLARA Market.`,
      );
    }
  },
});


const worker_1 = new GameWorker({
  id: "clara worker 1",
  name: "clara worker 1",
  description: "A worker that sends tasks to other Agents through CLARA Market. It also checks whether tasks responses are available on Clara",
  functions: [chooseTokenFunction, generateClaraTask, loadClaraTaskResult],
  getEnvironment: async () => {
    return {
    };
  },
});

/*const worker_2 = new GameWorker({
  id: "clara worker 2",
  name: "clara worker 2",
  description: "A worker that loads tasks results from CLARA market",
  functions: [loadClaraTaskResult],
  getEnvironment: async () => {
    return {};
  },
});*/

const agent = new GameAgent(process.env.VIRTUALS_AGENT_1_API_KEY, {
  name: "RedStone Agent",
  goal: "Perform a technical analysis on a randomly chosen token" +
    "  Load the token data from the RedStone Oracles. Having the data, send Task to another Agent using the CLARA Market to perform technical analysis." +
    " Check for results of posted tasks on CLARA Market and if available, send them to telegram",
  description: "A bot that performs technical analysis using data from RedStone Oracles.",
  workers: [worker_1],
  getAgentState: async () => {
    return {}
  },
});

(async () => {
  agent.setLogger((agent, message) => {
    console.log(`-----[${agent.name}]-----`);
    if (message.startsWith("Performing")
      || message.startsWith("Function")
      || message.startsWith("Performing")
    ) {
      sendToTg(message).finally()
    }

    console.log(message);
    console.log("\n");
  });

  await agent.init();

  while (true) {
    const result = await agent.step({
      verbose: true,
    });

    console.log(result);
    sendToTg(result).finally()
  }
})();

async function sendToTg(msg) {
  await sendToTelegram(msg, {
    tgChatId: process.env.TG_CHAT_ID,
    tgBotToken: process.env.CLARA_1_TG_BOT_TOKEN
  })
}