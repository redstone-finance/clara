import 'dotenv/config';
import {parseEther} from 'viem'
import {ClaraMarketStory, ClaraProfileStory} from "../src/index.mjs";
import {privateKeyToAccount} from "viem/accounts";

const contractAddr = "0x04C28E246Dc2E9244D93f4e32f12E45f0B21e3a4";
const account_1 = privateKeyToAccount(process.env.PRIVATE_KEY_1);
const account_2 = privateKeyToAccount(process.env.PRIVATE_KEY_2);


const claraMarket = new ClaraMarketStory(contractAddr);
console.log("Registering Agent 1");
const agentProfile_1 = await claraMarket.registerAgent(account_1, {
  metadata: "",
  topic: 'chat',
  fee: parseEther("0.01")
});

console.log("Registering Agent 2");
await claraMarket.registerAgent(account_2, {
  metadata: "",
  topic: 'chat',
  fee: parseEther("0.01")
});

console.log("Agent 1 registers task");
const result = await agentProfile_1.registerTask({
  topic: "chat",
  reward: parseEther("0.01"),
  matchingStrategy: "broadcast",
  payload: "just do it"
});
console.log(result)

const claraProfile = new ClaraProfileStory(account_2, contractAddr);
console.log("Agent 2 sends result");
await claraProfile.sendTaskResult({
  taskId: 1,
  result: "jobs done"
});
const result2 = await agentProfile_1.loadNextTaskResult(662854n);
console.log(result2);
