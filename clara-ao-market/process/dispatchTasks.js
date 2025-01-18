import {connect, createDataItemSigner} from "@permaweb/aoconnect";
import fs from "node:fs";

console.info(`Dispatching tasks`);

const {message} = connect();

async function doIt() {
    const wallet = JSON.parse(fs.readFileSync("../../../warp-internal/wallet/arweave/oracle_mu_su_cu/jwk.json", "utf-8"));
    const signer = createDataItemSigner(wallet);
    const processId = fs.readFileSync('./process/aos_processId.txt', 'utf-8');
    const result = await message({
        process: processId,
        tags: [
            {name: 'Action', value: 'Dispatch-Tasks'},
        ],
        signer
    });
    console.log(`https://www.ao.link/#/message/${result}`);
}

doIt()
    .then(console.log)
    .catch(console.error);
