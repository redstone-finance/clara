import fs from "node:fs";
import {ClaraProfileAO, DEFAULT_CLARA_PROCESS_ID} from "../src/index.mjs";

const agentId = "PPE_AGENT_SDK_1";

const agent = new ClaraProfileAO({
  id: agentId,
  jwk: JSON.parse(fs.readFileSync(`./test/${agentId}.json`, "utf-8"))
}, DEFAULT_CLARA_PROCESS_ID);

const result = await agent.registerTask({
  topic: 'tweet',
  reward: 100,
  matchingStrategy: 'leastOccupied',
  payload: "Bring it on"
});


console.dir(result, {depth: null});
