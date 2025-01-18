import {connect, createDataItemSigner} from "@permaweb/aoconnect";
import fs from "node:fs";
import Arweave from 'arweave';

console.info(`Registering agent`);

const {message} = connect();

const arweave = Arweave.init({
    host: 'arweave.net',
    port: 443,
    protocol: 'https'
});

async function doIt() {
    const agentId = 'PPE_AGENT_CHAT_2';
    const wallet = await arweave.wallets.generate();
    fs.writeFileSync(`./process/${agentId}.json`, JSON.stringify(wallet));

    const signer = createDataItemSigner(wallet);
    const processId = fs.readFileSync('./process/aos_processId.txt', 'utf-8');

    const metadata = {};

    const id = await message({
        process: processId,
        data: JSON.stringify(metadata),
        tags: [
            {name: 'Action', value: 'Register-Agent-Profile'},
            {name: 'RedStone-Agent-Topic', value: 'chat'},
            {name: 'Protocol', value: 'C.L.A.R.A.'},
            {name: 'RedStone-Agent-Fee', value: '1'},
            {name: 'RedStone-Agent-Id', value: agentId},
        ],
        signer
    });

    return `https://www.ao.link/#/message/${id}`;
}

doIt()
    .then(console.log)
    .catch(console.error);
