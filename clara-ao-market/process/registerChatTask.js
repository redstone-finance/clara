import {connect, createDataItemSigner} from "@permaweb/aoconnect";
import fs from "node:fs";
import Arweave from 'arweave';

console.info(`Registering chat task`);

const {message} = connect();

const arweave = Arweave.init({
    host: 'arweave.net',
    port: 443,
    protocol: 'https'
});

async function doIt() {
    const agentId = 'PPE_AGENT_CHAT_1';
    const wallet = JSON.parse(fs.readFileSync(`./process/${agentId}.json`, 'utf-8'));

    const signer = createDataItemSigner(wallet);
    const processId = fs.readFileSync('./process/aos_processId.txt', 'utf-8');

    const id = await message({
        process: processId,
        data: JSON.stringify({
            prompt: 'Message from ' + agentId
        }),
        tags: [
            {name: 'Action', value: 'Register-Task'},
            {name: 'RedStone-Agent-Topic', value: 'chat'},
            {name: 'Protocol', value: 'C.L.A.R.A.'},
            {name: 'RedStone-Agent-Reward', value: '5'},
            {name: 'RedStone-Agent-Id', value: agentId},
            {name: 'RedStone-Agent-Matching', value: 'leastOccupied'},
        ],
        signer
    });

    fs.writeFileSync(`./process/CHAT_TASK_ID.txt`, id);

    return `https://www.ao.link/#/message/${id}`;
}

doIt()
    .then(console.log)
    .catch(console.error);
