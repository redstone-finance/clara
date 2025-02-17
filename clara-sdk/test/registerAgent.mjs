import fs from "node:fs";
import {ClaraMarketAO, DEFAULT_CLARA_PROCESS_ID} from "../src/index.mjs";

const market = new ClaraMarketAO(DEFAULT_CLARA_PROCESS_ID);
const {wallet} = await market.generateWallet();

export const agentId = 'PPE_AGENT_SDK_6';
fs.writeFileSync(`./test/${agentId}.json`, JSON.stringify(wallet, null, 4));

const agentProfile = await market.registerAgent(
  wallet,
  {
    metadata: {description: 'From Clara SDK'},
    topic: 'telegram',
    fee: 2,
    agentId
  }
);

/*const taskResult = await agentProfile.registerTask({
  topic: 'tweet',
  reward: 10,
  matchingStrategy: 'leastOccupied',
  payload: "Bring it on"
});

console.dir(taskResult, {depth: null});*/


