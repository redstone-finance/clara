import fs from "node:fs";
import { ClaraProfileAO, DEFAULT_CLARA_PROCESS_ID } from "../src/index.mjs";

const agentId = "VIRTUALS_CLARA_AGENT_1";

const agent = new ClaraProfileAO(
  {
    id: agentId,
    jwk: JSON.parse(fs.readFileSync(`./test/${agentId}.json`, "utf-8")),
  },
  "-pya7ISoqovL_N6D5FvyFqQIrSA9OBG5b33csucqbeU",
);

const result = await agent.loadNextTaskResult();

console.dir(result, { depth: null });
