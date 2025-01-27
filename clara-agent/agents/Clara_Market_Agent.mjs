import {CLARA_MARKET_MODEL} from "../constatns.mjs";
import {clara_send_task_tool, claraSendTask} from "../tools/clara_send_task_tool.mjs";
import {claraRegisterProfile} from "../commons.mjs";
import {clara_load_task_result_tool, claraLoadTaskResult} from "../tools/clara_load_task_result_tool.mjs";
import {prompt, step} from "./step.mjs";
import {clara_print_result_tool, claraPrintResults} from "../tools/clara_print_result_tool.mjs";

const claraProfile = await claraRegisterProfile("CLARA_AGENT_MARKET");

const availableFunctions = {
  clara_send_task: claraSendTask.bind(null, claraProfile),
  clara_load_task_result: claraLoadTaskResult.bind(null, claraProfile),
  clara_print_result: claraPrintResults.bind(null, claraProfile),
};

const tools = [
  clara_send_task_tool, clara_load_task_result_tool, clara_print_result_tool
];

let stepNumber = 0;
let messages = [];

async function run(tweet) {

  const promptResponse = await prompt(CLARA_MARKET_MODEL, "Please introduce yourself shortly");
  for await (const part of promptResponse) {
    process.stdout.write(part.response)
  }

  const agentStep = step.bind(null, CLARA_MARKET_MODEL, tools, messages, availableFunctions);
  messages.push(
    {role: 'user', content: `Please send a task on 'tweet' topic for a reward '100' with a content about "${tweet}"`})

  await agentStep(++stepNumber);
  await agentStep(++stepNumber);
  await agentStep(++stepNumber);
  await agentStep(++stepNumber);
}

run("blockchain technology")
  .catch(error => console.error("An error occurred:", error));
