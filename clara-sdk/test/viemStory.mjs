import 'dotenv/config';
import { createPublicClient, http, parseEther } from 'viem';
import { ClaraMarketStory, ClaraProfileStory, storyAeneid, storyMainnet } from '../src/index.mjs';
import { privateKeyToAccount } from 'viem/accounts';

const network = storyAeneid;
// https://aeneid.storyscan.xyz/address/0x056DFB62F3272b54136bd9F388Ef2cFFb19D46d0
const contractAddr = '0x056DFB62F3272b54136bd9F388Ef2cFFb19D46d0';
// const contractAddr = "0x24566F8848C861A5dDf943642A77B2a1723664DC";
const account_1 = privateKeyToAccount(process.env.PRIVATE_KEY_1);
const account_2 = privateKeyToAccount(process.env.PRIVATE_KEY_2);
const account_4 = privateKeyToAccount(process.env.PRIVATE_KEY_4);

/*const claraMarket = new ClaraMarketStory(contractAddr, network);
console.log("Registering Agent 1");
const agentProfile_2 = new ClaraProfileStory(account_2, contractAddr, network);
//const result = await agentProfile_1.mintWIPs(parseEther("0.1"));
console.log(await agentProfile_2.earnedRewards());

console.log(await agentProfile_2.withdrawEarnedRewards(true));*/
/*const agentProfile_1 = await claraMarket.registerAgent(account_1, {
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
*/
const agentProfile_1 = new ClaraProfileStory(account_4, network);
console.log('Agent 1 registers task');
console.log(await agentProfile_1.agentData());
const task = await agentProfile_1.loadNextTask();
/*const result = await agentProfile_1.registerTask({
  topic: "tweet",
  reward: parseEther("0.02"),
  payload: "In Sides",
});
console.log(result);*/

/*const agentProfile_2 = new ClaraProfileStory(account_2, contractAddr, network);
 */
/*console.log("Agent 2 loads task");
const task = await agentProfile_2.loadNextTask();

console.log("Agent 2 sends result");
const txHash = await agentProfile_2.sendTaskResult({
  taskId: task.id,
  result:
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla bibendum eros elit, eget imperdiet quam imperdiet at. Fusce lobortis metus nisl, in eleifend nibh luctus id. Vestibulum id mi augue. Aenean posuere enim non tempor aliquam. Phasellus ornare bibendum ipsum turpis duis.",
});
console.log(txHash);*/

/*
console.log("Agent 1 withdraw");
const resultWithdraw = await agentProfile_1.withdrawRewards();
console.log(resultWithdraw);*/

/*const taskId = await agentProfile_2.getAssignedTaskId();
console.log(taskId);*/
/*
const task = await agentProfile_2.loadNextTask();
console.log(task);*/
/*
console.log("Agent 2 sends result");
const txHash = await agentProfile_2.sendTaskResult({
  taskId: 2,
  result: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla bibendum eros elit, eget imperdiet quam imperdiet at. Fusce lobortis metus nisl, in eleifend nibh luctus id. Vestibulum id mi augue. Aenean posuere enim non tempor aliquam. Phasellus ornare bibendum ipsum turpis duis.",
});
/*
const publicClient = createPublicClient({
  chain: network,
  transport: http(),
});
await publicClient.waitForTransactionReceipt({ hash: txHash });
const result2 = await agentProfile_1.loadNextTaskResult(984401n);
console.log(result2);*/
