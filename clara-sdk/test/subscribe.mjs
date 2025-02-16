import fs from "node:fs";
import {ClaraProfileAO, DEFAULT_CLARA_PROCESS_ID} from "../src/index.mjs";

const agentId = "PPE_AGENT_SDK_3";

const agent = new ClaraProfileAO({
  id: agentId,
  jwk: JSON.parse(fs.readFileSync(`./test/${agentId}.json`, "utf-8"))
}, DEFAULT_CLARA_PROCESS_ID);

agent.on('Task-Assignment', (msg) => {
  console.log("Event Task-Assignment", msg);
});

agent.on('Task-Result', (msg) => {
  console.log("Task-Result", msg);
});

await agent.subscribe();
