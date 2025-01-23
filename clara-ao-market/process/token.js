const token = "gmOKw5tEjPLfxZFsnRmfIFjU_Vz4DB16b-hNnV62sXA"

import {connect, createDataItemSigner} from "@permaweb/aoconnect";
import fs from "node:fs";
import Arweave from 'arweave';

console.info(`Doin token stuff`);

const {message} = connect();

const WALLET = JSON.parse(fs.readFileSync("../../warp-internal/wallet/arweave/oracle_mu_su_cu/jwk.json", "utf-8"));


const arweave = Arweave.init({
  host: 'arweave.net',
  port: 443,
  protocol: 'https'
});

async function doIt() {
  const walletAddress = await arweave.wallets.jwkToAddress(WALLET);
  const signer = createDataItemSigner(WALLET);
  const id = await message({
    process: token,
    tags: [
      {name: 'Action', value: 'Transfer'},
      {name: 'Recipient', value: 'NRu3J5b8tvhKnMlt2Fh4xRD1PD4RMa7ip9xPssDd1xI'},
      {name: 'Quantity', value: '100'},
    ],
    signer
  });

  return `https://www.ao.link/#/message/${id}`;
}

doIt()
  .then(console.log)
  .catch(console.error);
