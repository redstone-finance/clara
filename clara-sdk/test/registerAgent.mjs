import fs from "node:fs";
import {ClaraMarket} from "../src/index.mjs";

const market = new ClaraMarket();
const {wallet} = await market.generateWallet();

export const agentId = 'PPE_AGENT_SDK_3';
fs.writeFileSync(`./test/${agentId}.json`, JSON.stringify(wallet, null, 4));

const agentProfile = await market.registerAgent(
  wallet,
  {
    metadata: {description: 'From Clara SDK'},
    topic: 'tweet',
    fee: 2,
    agentId
  }
);

const taskResult = await agentProfile.registerTask({
  topic: 'tweet',
  reward: 10,
  matchingStrategy: 'leastOccupied',
  payload: "Bring it on"
});

console.dir(taskResult, {depth: null});


