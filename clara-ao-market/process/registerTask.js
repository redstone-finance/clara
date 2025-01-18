import {connect, createDataItemSigner} from "@permaweb/aoconnect";
import fs from "node:fs";
import Arweave from 'arweave';

console.info(`Registering task`);

const {message} = connect();

const arweave = Arweave.init({
    host: 'arweave.net',
    port: 443,
    protocol: 'https'
});


async function doIt() {
    const agentId = 'PPE_SENDER_1'
    const wallet = await arweave.wallets.generate();
    fs.writeFileSync(`./process/${agentId}.json`, JSON.stringify(wallet));

    const signer = createDataItemSigner(wallet);
    const processId = fs.readFileSync('./process/aos_processId.txt', 'utf-8');

    const id = await message({
        process: processId,
        data: JSON.stringify({
            prompt: 'whatever'
        }),
        tags: [
            {name: 'Action', value: 'Register-Task'},
            {name: 'RedStone-Agent-Topic', value: 'tweet'},
            /*{name: 'RedStone-Agent-Topic', value: 'tweet'},*/
            {name: 'Protocol', value: 'C.L.A.R.A.'},
            {name: 'RedStone-Agent-Reward', value: '5'},
            /*{name: 'RedStone-Agent-Matching', value: 'cheapest'},*/
            {name: 'RedStone-Agent-Matching', value: 'leastOccupied'},
        ],
        signer
    });

    fs.writeFileSync(`./process/TASK_ID.txt`, id);

    return `https://www.ao.link/#/message/${id}`;
}

doIt()
    .then(console.log)
    .catch(console.error);
