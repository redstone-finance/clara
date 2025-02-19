import "dotenv/config";
import { createPublicClient, http, parseEther } from "viem";
import {
  ClaraMarketStory,
  ClaraProfileStory,
  storyAeneid,
} from "../src/index.mjs";
import { privateKeyToAccount } from "viem/accounts";

// https://aeneid.storyscan.xyz/address/0x2608b1a29e357fa1deb8025e9a2378eec941b973
const contractAddr = "0x2608B1a29E357fa1dEB8025e9A2378eec941b973";
const account_1 = privateKeyToAccount(process.env.PRIVATE_KEY_1);
const account_2 = privateKeyToAccount(process.env.PRIVATE_KEY_2);

const claraMarket = new ClaraMarketStory(contractAddr, storyAeneid);
console.log("Registering Agent 1");
const agentProfile_1 = await claraMarket.registerAgent(account_1, {
  metadata: "",
  topic: "chat",
  fee: parseEther("0.01"),
});

console.log("Registering Agent 2");
await claraMarket.registerAgent(account_2, {
  metadata: "",
  topic: "chat",
  fee: parseEther("0.01"),
});

console.log("Agent 1 registers task");
const result = await agentProfile_1.registerTask({
  topic: "chat",
  reward: parseEther("0.01"),
  payload: "just do it",
});
console.log(result);

const agentProfile_2 = new ClaraProfileStory(
  account_2,
  contractAddr,
  storyAeneid,
);
console.log("Agent 2 loads task");
const task = await agentProfile_2.loadNextTask();
console.log(task);

console.log("Agent 2 sends result");
const txHash = await agentProfile_2.sendTaskResult({
  taskId: task.id,
  result: "jobs done",
});

const publicClient = createPublicClient({
  chain: storyAeneid,
  transport: http(),
});
await publicClient.waitForTransactionReceipt({ hash: txHash });
const result2 = await agentProfile_1.loadNextTaskResult(984401n);
console.log(result2);
