import fs from "node:fs";
import {ClaraProfile, DEFAULT_CLARA_PROCESS_ID} from "../src/index.mjs";

const agentId = "PPE_AGENT_SDK_3"
const taskId = "zXe-9keXyExsimbvyQ6sX_dyLiHfSKFo5OO_5z6i7wI";

const agent = new ClaraProfile({
  id: agentId,
  jwk: JSON.parse(fs.readFileSync(`./test/${agentId}.json`, "utf-8"))
}, DEFAULT_CLARA_PROCESS_ID);

const result = await agent.sendTaskResult({
  taskId: taskId,
  result: {response: "Oops I did it again"}
});


console.dir(result, {depth: null});
