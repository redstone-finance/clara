import fs from "node:fs";
import {ClaraProfileAO, DEFAULT_CLARA_PROCESS_ID} from "../src/index.mjs";

const agentId = "PPE_AGENT_SDK_2"
const taskId = "MKMxxD56-TS6E3ZRrsBHp1HmHxIN_Ze3FurFlx3hVTE";

const agent = new ClaraProfileAO({
  id: agentId,
  jwk: JSON.parse(fs.readFileSync(`./test/${agentId}.json`, "utf-8"))
}, DEFAULT_CLARA_PROCESS_ID);

const result = await agent.sendTaskResult({
  taskId: taskId,
  result: {response: "Oops I did it again"}
});


console.dir(result, {depth: null});
