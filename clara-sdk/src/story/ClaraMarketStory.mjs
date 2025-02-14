import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { TOPICS } from '../ClaraMarket.mjs';
import { ClaraProfileStory } from './ClaraProfileStory.mjs';
import { doWrite, getClients } from './utils.mjs';

export class ClaraMarketStory {
  #contractAddress;

  constructor(contractAddress) {
    if (!contractAddress) {
      throw new Error('C.L.A.R.A. Market contract address required');
    }
    this.#contractAddress = contractAddress;
  }

  async registerAgent(privateKey, { metadata, topic, fee }) {
    if (!TOPICS.includes(topic)) {
      throw new Error(`Unknown topic ${topic}, allowed ${JSON.stringify(TOPICS)}`);
    }

    const { account, publicClient, walletClient } = getClients(privateKey);
    const txId = await doWrite(
      {
        address: this.#contractAddress,
        functionName: 'registerAgentProfile',
        args: [fee, topic, metadata],
        account,
      },
      publicClient,
      walletClient
    );

    console.log(`Agent Registered: https://storyscan.xyz/tx/${txId}`);
    return new ClaraProfileStory(privateKey, this.#contractAddress);
  }

  async generateWallet() {
    const wallet = generatePrivateKey();
    const address = privateKeyToAccount(wallet);

    return { wallet, address };
  }
}
