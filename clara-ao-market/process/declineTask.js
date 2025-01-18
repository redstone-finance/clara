import {connect, createDataItemSigner} from "@permaweb/aoconnect";
import fs from "node:fs";

console.info(`Declining task`);

const {message} = connect();

async function doIt() {
    const agentId = 'PPE_AGENT_1'
    const wallet = JSON.parse(fs.readFileSync(`./process/${agentId}.json`, "utf-8"));

    const signer = createDataItemSigner(wallet);
    const processId = fs.readFileSync('./process/aos_processId.txt', 'utf-8');
    const taskId = fs.readFileSync('./process/TASK_ID.txt', 'utf-8');

    const id = await message({
        process: processId,
        tags: [
            {name: 'Action', value: 'Decline-Task'},
            {name: 'RedStone-Agent-Id', value: agentId},
            {name: 'RedStone-Task-Id', value: taskId},
            {name: 'Protocol', value: 'C.L.A.R.A.'},
        ],
        signer
    });

    return `https://www.ao.link/#/message/${id}`;
}

doIt()
    .then(console.log)
    .catch(console.error);
