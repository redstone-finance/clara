import 'dotenv/config';
import {
  ExecutableGameFunctionResponse,
  ExecutableGameFunctionStatus,
  GameAgent,
  GameFunction,
  GameWorker
} from "@virtuals-protocol/game";
import {connectClaraProfile, loadRedStoneFeeds, sendToTelegram, TOPIC, VIRTUALS_AGENT_1_ID} from "./commons.mjs";

// CLARA Market profile related to this Virtuals Agent
const claraProfile = await connectClaraProfile(VIRTUALS_AGENT_1_ID);

const loadTelegramMentions = new GameFunction({
  name: "load telegram messages",
  description: "Extract crypto token name from a telegram message",
  args: [],
  executable: async (args, logger) => {
    try {
      // TODO: set offset
      const url = `https://api.telegram.org/bot${process.env.CLARA_1_TG_BOT_TOKEN}/getupdates`;
      const response = await fetch(url);
      const tgResult = await response.json();
      if (tgResult.result.length === 0) {
        return new ExecutableGameFunctionResponse(
          ExecutableGameFunctionStatus.Failed,
          `No new mentions on telegram`
        );
      }
      let tgMessage;
      for (let message of tgResult.result) {
        if ("" + message.message?.chat?.id !== process.env.TG_CHAT_ID) {
          continue;
        }
        if (!message.message.entities?.find(e => e.type === "mention")) {
          continue;
        }
        if (!message.message.text.includes("@Clara_1_bot")) {
          continue;
        }
        tgMessage = {
          text: message.message.text,
          from: message.message.from?.username
        }
        break;
      }
      if (tgMessage) {
        return new ExecutableGameFunctionResponse(
          ExecutableGameFunctionStatus.Done,
          `Message from telegram: text=${tgMessage.text}, from=${tgMessage.from}`,
        );
      } else {
        return new ExecutableGameFunctionResponse(
          ExecutableGameFunctionStatus.Failed,
          `No new mentions on telegram`
        );
      }
    } catch (e) {
      console.error(e);
      return new ExecutableGameFunctionResponse(
        ExecutableGameFunctionStatus.Failed,
        `Could not load messages from telegram`
      );
    }
  },
})

const generateClaraTask = new GameFunction({
  name: "generate_clara_task",
  description: "Loads prices data from RedStone Oracle based on the token chosen extracted from the telegram message. Sends loaded prices as a Task to CLARA Market.",
  args: [
    {
      name: "tokenToCheck",
      description: "A token extracted from the telegram message",
      optional: false,
      type: "string"
    },
    {
      name: "from",
      description: "Author of the telegram message",
      optional: false,
      type: "string"
    },
  ],
  executable: async (args, logger) => {
    try {
      console.log(`Args tokenToCheck`, args.tokenToCheck);
      console.log(`Args from`, args.from);
      if (!args.tokenToCheck) {
        throw new Error("Token to check not determined");
      }

      const result = await loadRedStoneFeeds(args.tokenToCheck);
      logger(`Loaded prices length ${result.length}`);
      if (result.length === 0) {
        return new ExecutableGameFunctionResponse(
          ExecutableGameFunctionStatus.Failed,
          "No prices returned from RedStone Oralces"
        );
      }

      // now kindly ask CLARA Market for some Agent that have technical analysis capabilities
      // and can return buy/sell recommendation
      const task = await claraProfile.registerTask({
        topic: TOPIC,
        reward: 2000000,
        matchingStrategy: "leastOccupied",
        payload: {
          // the technical indicators that should be measured
          topicDetails: "['oscillator/RSI']",
          prices: result,
          from: args.from,
          token: args.tokenToCheck
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
  args: [],
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
        result: result.result, // not enough result
        from: result.originalTask.payload.from,
        token: result.originalTask.payload.token
      }

      if (logObject.from) {
        sendToTg(`@${logObject.from} - ${logObject.result.analysis} ${logObject.result.analysis_reasoning}`).then();
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
  description: "A worker that sends tasks to other Agents through CLARA Market.",
  functions: [loadTelegramMentions, generateClaraTask],
  getEnvironment: async () => {
    return {};
  },
});

const worker_2 = new GameWorker({
  id: "clara worker 2",
  name: "clara worker 2",
  description: "Checks whether tasks results CLARA Market and sends them to Telegram",
  functions: [loadClaraTaskResult],
  getEnvironment: async () => {
    return {};
  },
});

const agent = new GameAgent(process.env.VIRTUALS_AGENT_1_API_KEY, {
  name: "RedStone Agent",
  goal: "Perform a technical analysis on a token loaded from a telegram message." +
    "  Load the token data from the RedStone Oracles. Having the data, send Task to another Agent using the CLARA Market to perform technical analysis." +
    " Check for results of posted tasks on CLARA Market and if available, send them to telegram",
  description: "A bot that performs technical analysis using data from RedStone Oracles.",
  workers: [worker_1, worker_2],
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
