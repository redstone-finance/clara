import { connect, createDataItemSigner } from '@permaweb/aoconnect';
import fs from 'node:fs';

console.info(`Withdrawing rewards`);

const { message } = connect();

async function doIt() {
  const wallet = JSON.parse(fs.readFileSync(`./process/test.json`, 'utf-8'));

  const signer = createDataItemSigner(wallet);
  const processId = '86kVM56iOu4P_AfgGGfS9wEDzpO9yb6vaX_tOaDKqMU';

  const id = await message({
    process: processId,
    tags: [
      {name: 'Protocol', value: 'C.L.A.R.A.'},
      { name: 'Action', value: 'Withdraw-All' }
    ],
    signer,
  });
  return `https://www.ao.link/#/message/${id}`;
}

doIt().then(console.log).catch(console.error);
