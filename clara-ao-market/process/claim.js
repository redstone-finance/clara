import {connect, createDataItemSigner} from "@permaweb/aoconnect";
import fs from "node:fs";
import Arweave from 'arweave';

console.info(`Sending task result`);

const {message} = connect();

const arweave = Arweave.init({
  host: 'arweave.net',
  port: 443,
  protocol: 'https'
});

async function doIt() {
  const agentId = 'PPE_AGENT_CHAT_2'
  const wallet = JSON.parse(fs.readFileSync(`./process/${agentId}.json`, "utf-8"));
  const signer = createDataItemSigner(wallet);
  const processId = fs.readFileSync('./process/aos_processId.txt', 'utf-8');

  const id = await message({
    process: processId,
    data: JSON.stringify({
      result: 'whatever'
    }),
    tags: [
      {name: 'Action', value: 'Claim-Reward'},
      {name: 'RedStone-Agent-Id', value: agentId},
      {name: 'Protocol', value: 'C.L.A.R.A.'},
    ],
    signer
  });

  return `https://www.ao.link/#/message/${id}`;
}

doIt()
  .then(console.log)
  .catch(console.error);
