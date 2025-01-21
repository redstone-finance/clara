import 'dotenv/config'
import fs from "node:fs";
// Create an agent with the worker
import {
  ExecutableGameFunctionResponse,
  ExecutableGameFunctionStatus,
  GameAgent,
  GameFunction, GameWorker
} from "@virtuals-protocol/game";
import {ClaraMarket, ClaraProfile, DEFAULT_CLARA_PROCESS_ID} from "redstone-clara-sdk";

// import {VirtualsClaraPlugin} from "./clara-plugin/virtualsClaraPlugin.mjs";

// const claraPlugin = new VirtualsClaraPlugin();

const AGENT_ID = "VIRTUALS_CLARA_NFT_AGENT_1";

async function connectClaraProfile(id) {
  if (fs.existsSync(`./profiles/${id}.json`)) {
    const jwk = JSON.parse(fs.readFileSync(`./profiles/${id}.json`, "utf-8"));
    return new ClaraProfile({id, jwk}, DEFAULT_CLARA_PROCESS_ID);
  } else {
    const claraMarket = new ClaraMarket(DEFAULT_CLARA_PROCESS_ID);
    const {wallet, address} = await claraMarket.generateWallet();
    console.log("generated new wallet", address);
    fs.writeFileSync(`./profiles/${id}.json`, JSON.stringify(wallet));
    return claraMarket.registerAgent(wallet, {
      metadata: {},
      topic: 'nft',
      fee: 1000000,
      agentId: id
    });
  }
}

const claraProfile = await connectClaraProfile(AGENT_ID);


const generateNftTask = new GameFunction({
  name: "generate_nft_task_for_clara",
  description: "Generate an image",
  args: [
    {
      name: "image_description",
      description: "The description of the image to generate",
    },
  ],
  executable: async (args, logger) => {
    try {
      logger(`Generating nft task: ${args.image_description}`);

      const result = await claraProfile.registerTask({
        topic: "nft",
        reward: 200,
        matchingStrategy: "leastOccupied",
        payload: args.image_description
      });

      return new ExecutableGameFunctionResponse(
        ExecutableGameFunctionStatus.Done,
        `New nft task created in CLARA market with id ${result.taskId}`
      );
    } catch (e) {
      console.error(e);
      return new ExecutableGameFunctionResponse(
        ExecutableGameFunctionStatus.Failed,
        "Failed to create nft task in CLARA market"
      );
    }
  },
});


const worker = new GameWorker({
  id: "clara",
  name: "clara",
  description: "Clara worker",
  functions: [generateNftTask],
});

const agent = new GameAgent(process.env.VIRTUALS_AGENT_API_KEY, {
  name: "Beaver Bot",
  goal: "generate NFTs with cyberpunk beavers with weapons",
  description: "A bot that can communicate with other Agents and ask them to generate nft",
  workers: [worker],
});

(async () => {
  agent.setLogger((agent, message) => {
    console.log(`-----[${agent.name}]-----`);
    console.log(message);
    console.log("\n");
  });

  await agent.init();

  while (true) {
    await agent.step({
      verbose: true,
    });
  }
})();