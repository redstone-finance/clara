import 'dotenv/config'
import fs from "node:fs";
// Create an agent with the worker
import {
  ExecutableGameFunctionResponse,
  ExecutableGameFunctionStatus,
  GameAgent,
  GameFunction,
  GameWorker
} from "@virtuals-protocol/game";
import {ClaraMarket, ClaraProfile, DEFAULT_CLARA_PROCESS_ID, fetchTransactions} from "redstone-clara-sdk";

const AGENT_ID = "VIRTUALS_CLARA_NFT_AGENT_2";

const CLARA_PROCESS_ID = DEFAULT_CLARA_PROCESS_ID;

function getRedStoneApiUrl({symbol, from, to}) {
  return `https://api.redstone.finance/prices?provider=redstone-primary-prod&symbol=${symbol}&forceInflux=true&fromTimestamp=${from}&toTimestamp=${to}&interval=3600000`
}

const TOPIC = "chat";


async function connectClaraProfile(id) {
  if (fs.existsSync(`./profiles/${id}.json`)) {
    const jwk = JSON.parse(fs.readFileSync(`./profiles/${id}.json`, "utf-8"));
    return new ClaraProfile({id, jwk}, CLARA_PROCESS_ID);
  } else {
    const claraMarket = new ClaraMarket(CLARA_PROCESS_ID);
    const {wallet, address} = await claraMarket.generateWallet();
    console.log("generated new wallet", address);
    fs.writeFileSync(`./profiles/${id}.json`, JSON.stringify(wallet));
    return claraMarket.registerAgent(wallet, {
      metadata: {},
      topic: TOPIC,
      fee: 1000000,
      agentId: id
    });
  }
}

// CLARA Market profile related to this Virtuals Agent
const claraProfile = await connectClaraProfile(AGENT_ID);
const claraProfileData = await claraProfile.profileData();

const results = {}

claraProfile.on('Task-Result', (msg) => {
  console.log("Task-Result", msg);

});

const chooseTokenFunction = new GameFunction({
  name: "choose_token_function",
  description: "Chooses next token to analyse depending on last update time sentiment on X.",
  args: [
    {
      // passing values from Worker.Environment does not work deterministically
      name: "lastCheckTime",
      description: "Last check time",
      optional: false
    },
  ],
  executable: async (args, logger) => {
    try {
      // TODO: add some logic to choose token - maybe by recent activity on X?
      console.log("lastCheckTime ", args.lastCheckTime);
      let lastCheckTime;
      try {
        lastCheckTime = parseInt(args.lastCheckTime);
      } catch (e) {
        console.error(e);
      }
      const now = Date.now();
      if (!lastCheckTime || now - lastCheckTime > 3600 * 1000) {
        return new ExecutableGameFunctionResponse(
          ExecutableGameFunctionStatus.Done,
          `tokenToCheck: "BTC", lastCheckTime: ${Date.now()}`
        );
      } else {
        return new ExecutableGameFunctionResponse(
          ExecutableGameFunctionStatus.Failed,
          `Not enough time have passed since last check`
        );
      }
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

      const response = await fetch(getRedStoneApiUrl({
        symbol: args.tokenToCheck,
        from: Date.now() - 5 * 86400 * 1000,
        to: Date.now()
      }));
      if (!response.ok) {
        throw new Error('Could not load data from RedStone Oracles api')
      }
      const result = (await response.json()).map(feed => {
        return {
          symbol: feed.symbol,
          value: feed.value,
          timestamp: feed.timestamp,
        }
      });
      console.log("Loaded prices length ", result.length);

      // now kindly ask CLARA Market for some Agent that have technical analysis capabilities
      // and can return buy/sell recommendation
      const task = await claraProfile.registerTask({
        topic: TOPIC,
        reward: 200,
        matchingStrategy: "leastOccupied",
        payload: {
          // the technical indicators that should be measured
          topicDetails: "['oscillator/RSI']",
          prices: result
        }
      });

      console.log(task);
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
    {
      name: "claraTaskId",
      description: "A task id for which the result should be loaded passed from the generate_clara_task function",
      optional: false,
      type: "string"
    },
  ],
  executable: async (args, logger) => {
    try {
      console.log(`Args claraTaskId`, args.claraTaskId);
      const taskId = args.claraTaskId;
      if (!taskId) {
        throw new Error("Task Id to load result not set");
      }

      function messageWithTags(result, requiredTags) {
        for (let msg of result) {
          let foundTags = 0;
          for (let requiredTag of requiredTags) {
            if (msg.tags.find(({name, value}) => name === requiredTag.name && value === requiredTag.value)) {
              foundTags++;
            }
            if (foundTags === requiredTags.length) {
              return msg;
            }
          }
        }
      }

      const messages = await fetchTransactions(claraProfileData.address, CLARA_PROCESS_ID);
      const taskResult = messageWithTags(messages, [{name: 'Task-Id', value: taskId}]);
      if (!taskResult) {
        return new ExecutableGameFunctionResponse(
          ExecutableGameFunctionStatus.Failed,
          "Task Result from CLARA Market not yet available. Try again in a few seconds with the same claraTaskId",
        );
      }

      return new ExecutableGameFunctionResponse(
        ExecutableGameFunctionStatus.Done,
        `Task result from CLARA Market: ${JSON.stringify(taskResult)}`
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
  functions: [chooseTokenFunction, generateClaraTask, loadClaraTaskResult],
  getEnvironment: async () => {
    return {
      lastCheckTime: 0
    };
  },
});

const agent = new GameAgent(process.env.VIRTUALS_AGENT_API_KEY, {
  name: "RedStone Agent",
  goal: "Perform a technical analysis on a token chosen based on sentiment analysis from tweets on X platform." +
    "  Load the token data from the RedStone Oracles. Having the data, send Task to another Agent using the CLARA Market to perform technical analysis" +
    " using requested indicator and generate long/short position recommendation based on the response.",
  description: "A bot that performs technical analysis using data from RedStone Oracles.",
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

  await agent.step({
    verbose: true,
  });

  await agent.step({
    verbose: true,
  });

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