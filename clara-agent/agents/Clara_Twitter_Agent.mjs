import EventEmitter from 'node:events';
import {claraRegisterProfile} from "../commons.mjs";
import {promptModel, step} from "./step.mjs";
import {clara_load_assigned_task_tool, claraLoadAssignedTask} from "../tools/clara_load_assigned_task_tool.mjs";
import {CLARA_TWITTER_MODEL} from "../constatns.mjs";
import {clara_send_task_result_tool, claraSendTaskResult} from "../tools/clara_send_task_result.mjs";

const claraProfile = await claraRegisterProfile("CLARA_AGENT_TWITTER");
const prompt = new EventEmitter();
let mode = "prompt";

const availableFunctions = {
  clara_load_assigned_task: claraLoadAssignedTask.bind(null, claraProfile),
  clara_send_task_result: claraSendTaskResult.bind(null, claraProfile)
};

const tools = [
  clara_load_assigned_task_tool, clara_send_task_result_tool
];

let stepNumber = 0;
let messages = [];

async function run() {

  process.stdout.write('\n> ');
  const agentStep = step.bind(null, CLARA_TWITTER_MODEL, tools, messages, availableFunctions);

  prompt.on(':new', async function(prompt){
    if (mode === "prompt") {
      const promptResponse = await promptModel(CLARA_TWITTER_MODEL, prompt);
      for await (const part of promptResponse) {
        process.stdout.write(part.response)
      }
      process.stdout.write('\n\n> ');
      mode = "chat";
    } else {
      messages.push(
        {role: 'user', content: prompt});
      await agentStep(++stepNumber);
      process.stdout.write('\n> ');
    }
  });

  process.stdin.on('data', function(data){
    process.stdout.write('\n');
    prompt.emit(":new", data.toString().trim());
  });
}

run().catch(error => console.error("An error occurred:", error));
