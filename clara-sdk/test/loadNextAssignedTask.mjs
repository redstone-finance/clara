import fs from "node:fs";
import {ClaraProfile, DEFAULT_CLARA_PROCESS_ID} from "../src/index.mjs";

const agentId = "VIRTUALS_CLARA_AGENT_2";

const agent = new ClaraProfile({
  id: agentId,
  jwk: JSON.parse(fs.readFileSync(`./test/${agentId}.json`, "utf-8"))
}, "-pya7ISoqovL_N6D5FvyFqQIrSA9OBG5b33csucqbeU");

const result = await agent.loadNextAssignedTask();


console.dir(result, {depth: null});
