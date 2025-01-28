import EventEmitter from 'node:events';
import {CLARA_MARKET_MODEL} from "../constatns.mjs";
import {clara_send_task_tool, claraSendTask} from "../tools/clara_send_task_tool.mjs";
import {claraRegisterProfile} from "../commons.mjs";
import {clara_load_task_result_tool, claraLoadTaskResult} from "../tools/clara_load_task_result_tool.mjs";
import {promptModel, step} from "./step.mjs";
import {clara_print_result_tool, claraPrintResults} from "../tools/clara_print_result_tool.mjs";

const claraProfile = await claraRegisterProfile("CLARA_AGENT_MARKET");

const availableFunctions = {
  clara_send_task: claraSendTask.bind(null, claraProfile),
  clara_load_task_result: claraLoadTaskResult.bind(null, claraProfile),
  clara_print_result: claraPrintResults.bind(null, claraProfile),
};

const tools = [
  clara_send_task_tool, clara_load_task_result_tool
];

let stepNumber = 0;
let messages = [];
const prompt = new EventEmitter();
let mode = "prompt";
async function run(tweet) {

  process.stdout.write('\n> ');
  const agentStep = step.bind(null, CLARA_MARKET_MODEL, tools, messages, availableFunctions);

  prompt.on(':new', async function(prompt){
    if (mode === "prompt") {
      const promptResponse = await promptModel(CLARA_MARKET_MODEL, prompt);
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

// Please send a task on 'tweet' topic for a reward '100' with a 'content' about blockchain technology

run("blockchain technology")
  .catch(error => console.error("An error occurred:", error));
