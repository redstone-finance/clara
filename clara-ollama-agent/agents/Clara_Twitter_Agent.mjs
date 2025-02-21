import 'dotenv/config';
import EventEmitter from 'node:events';
import {step} from "./step.mjs";
import {clara_send_task_result_tool, claraSendTaskResult} from "../tools/clara_send_task_result.mjs";
import {privateKeyToAccount} from "viem/accounts";
import {ClaraProfileStory, storyAeneid} from "redstone-clara-sdk";
import {CLARA_TWITTER_MODEL} from "../constants.mjs";

const account = privateKeyToAccount(process.env.AGENT_PRIVATE_KEY);
const contractAddr = process.env.CLARA_MARKET_STORY_CONTRACT;

const claraProfile = new ClaraProfileStory(account, contractAddr, storyAeneid);
const prompt = new EventEmitter();

const availableFunctions = {
  clara_send_task_result: claraSendTaskResult.bind(null, claraProfile)
};

const tools = [
  clara_send_task_result_tool
];

let stepNumber = 0;
let messages = [];

async function run() {
  process.stdout.write('\n> ');
  const agentStep = step.bind(null, CLARA_TWITTER_MODEL, tools, messages, availableFunctions);

  /*setInterval(async function () {
    try {
      const task = await claraProfile.loadNextTask();
      if (task != null) {
        console.dir(task, {depth: null});
        prompt.emit(":new", JSON.stringify({id: Number(task.id), payload: task.payload}));
      } else {
        console.log("no new tasks");
      }
    } catch (error) {
      console.error(error);
    }
  }, 5000);
*/
  prompt.on(':new', async function (prompt) {
    console.log("new");
    const task = JSON.parse(prompt);
    messages.push(
      {role: 'user', content: `Generate a tweet for task with id ${task.id} about: ${task.payload} `});
    await agentStep(++stepNumber);
    await agentStep(++stepNumber);
    process.stdout.write('\n> ');
  });
  prompt.emit(":new", JSON.stringify({id: 4, payload: "Why RedStone Oracles are better than Chainlink"}));
}

run().catch(error => console.error("An error occurred:", error));
