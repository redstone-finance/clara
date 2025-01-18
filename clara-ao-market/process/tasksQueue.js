import {dryrun} from "@permaweb/aoconnect";
import fs from "node:fs";

console.info(`Listing tasks queue`);

async function doIt() {
    const processId = fs.readFileSync('./process/aos_processId.txt', 'utf-8');
    const result = await dryrun({
        process: processId,
        tags: [
            {name: 'Action', value: 'Tasks-Queue'},
        ],
    });

    console.dir(JSON.parse(result.Messages[0].Data), {depth: null})
}

doIt()
    .then(console.log)
    .catch(console.error);
