import { connect, createDataItemSigner } from '@permaweb/aoconnect';
import fs from 'node:fs';
import Arweave from 'arweave';

console.info(`Claiming rewards`);

const { message } = connect();

async function doIt() {
  const wallet = JSON.parse(fs.readFileSync(`./process/test.json`, 'utf-8'));

  const signer = createDataItemSigner(wallet);
  const processId = '86kVM56iOu4P_AfgGGfS9wEDzpO9yb6vaX_tOaDKqMU';

  const id = await message({
    process: processId,
    tags: [{ name: 'Action', value: 'Claim-Reward-All' }],
    signer,
  });
  return `https://www.ao.link/#/message/${id}`;
}

doIt().then(console.log).catch(console.error);
