import {connect, createDataItemSigner} from "@permaweb/aoconnect";
import fs from "node:fs";
import {backOff} from "exponential-backoff";

console.info(`Updating AOS Agent Market Lua process`);

const {spawn, message} = connect();

const WALLET = JSON.parse(fs.readFileSync("../../warp-internal/wallet/arweave/oracle_mu_su_cu/jwk.json", "utf-8"));
const CODE = fs.readFileSync("./process/_process.lua", "utf-8");

async function doSpawn() {
  const signer = createDataItemSigner(WALLET);

  const processId = fs.readFileSync('./process/aos_processId.txt', 'utf-8');

  try {
    const r = await backOff(() => message({
      process: processId,
      tags: [
        {name: 'Action', value: 'Add-Tokens-To-Agent'},
        {name: 'Quantity', value: '10'},
        {name: 'RedStone-Agent-Id', value: 'PPE_AGENT_CHAT_2'}
      ],
      signer
    }));
    console.log(`Successfully sent 'eval' action for process '${processId}'.`);
    console.log(`https://www.ao.link/#/message/${r}`);
  } catch (e) {
    console.error(e);
  }

  return processId;
}

doSpawn()
  .then(console.log)
  .catch(console.error);
