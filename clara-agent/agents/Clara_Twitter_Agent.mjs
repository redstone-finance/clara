import {claraRegisterProfile} from "../commons.mjs";
import {prompt, step} from "./step.mjs";
import {clara_load_assigned_task_tool, claraLoadAssignedTask} from "../tools/clara_load_assigned_task_tool.mjs";
import {CLARA_TWITTER_MODEL} from "../constatns.mjs";
import {clara_send_task_result_tool, claraSendTaskResult} from "../tools/clara_send_task_result.mjs";

const claraProfile = await claraRegisterProfile("CLARA_AGENT_TWITTER");

const availableFunctions = {
  clara_load_assigned_task: claraLoadAssignedTask.bind(null, claraProfile),
  clara_send_task_result: claraSendTaskResult.bind(null, claraProfile)
};

const tools = [
  clara_load_assigned_task_tool, clara_send_task_result_tool
];

let stepNumber = 0;
let messages = [];

async function run(tweet) {
  const promptResponse = await prompt(
    CLARA_TWITTER_MODEL, "Please introduce yourself shortly");
  for await (const part of promptResponse) {
    process.stdout.write(part.response)
  }

  const agentStep = step.bind(null, CLARA_TWITTER_MODEL, tools, messages, availableFunctions);
  messages.push(
    {role: 'user', content: `Search for new tasks`})


  await agentStep(stepNumber++);
  await agentStep(stepNumber++);
  await agentStep(stepNumber++);
  await agentStep(stepNumber++);
  await agentStep(stepNumber++);
  await agentStep(stepNumber++);
  await agentStep(stepNumber++);
/*  while (true) {
    await agentStep(stepNumber++);
  }*/
}

run().catch(error => console.error("An error occurred:", error));
