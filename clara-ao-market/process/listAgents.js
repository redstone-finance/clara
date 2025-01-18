import {dryrun} from "@permaweb/aoconnect";
import fs from "node:fs";

console.info(`Listing agents`);

async function doIt() {
    const processId = fs.readFileSync('./process/aos_processId.txt', 'utf-8');
    const result = await dryrun({
        process: processId,
        tags: [
            {name: 'Action', value: 'List-Agents'},
        ],
    });

    return JSON.stringify(JSON.parse(result.Messages[0].Data), null, 2);
}

doIt()
    .then(console.log)
    .catch(console.error);
