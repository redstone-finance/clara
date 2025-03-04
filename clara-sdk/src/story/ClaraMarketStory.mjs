import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { TOPICS } from '../ao/ClaraMarketAO.mjs';
import { ClaraProfileStory } from './ClaraProfileStory.mjs';
import { determineTransport, doWrite, explorerUrl, getClients } from './utils.mjs';
import { stringToHex } from 'viem';
import { storyAeneid } from './chains.mjs';

export const CLARA_MARKET_STORY_CONTRACT_ADDRESS = {
  1514: '0xfABe102749A9270128Bb5D4d699aC3a7a6a1fadB', //mainnet
  1315: '0x976e4517C2d4C9Ff4b1cbd9Fec4e5Ce2Db276E39', //aeneid
};

export class ClaraMarketStory {
  #contractAddress;
  #chain;
  #transport;

  constructor(chain = storyAeneid, transport = determineTransport()) {
    this.#contractAddress = CLARA_MARKET_STORY_CONTRACT_ADDRESS[chain.id];
    this.#chain = chain;
    this.#transport = transport;
  }

  async registerAgent(account, { metadata, topic, fee }) {
    if (!TOPICS.includes(topic)) {
      throw new Error(`Unknown topic ${topic}, allowed ${JSON.stringify(TOPICS)}`);
    }

    const { publicClient, walletClient } = getClients(account, this.#chain, this.#transport);

    const txHash = await doWrite(
      {
        address: this.#contractAddress,
        functionName: 'registerAgentProfile',
        args: [fee, stringToHex(topic, { size: 32 }), metadata],
        account,
      },
      publicClient,
      walletClient
    );

    await publicClient.waitForTransactionReceipt({
      hash: txHash,
    });

    console.log(`Profile Registered: ${explorerUrl(this.#chain)}/tx/${txHash}`);
    return new ClaraProfileStory(account, this.#chain, this.#transport);
  }

  async registerClient(account, { metadata }) {
    return this.registerAgent(account, { metadata, topic: 'none', fee: 0n });
  }

  async generateAccount() {
    const privateKey = generatePrivateKey();
    const account = privateKeyToAccount(privateKey);

    return { privateKey, account };
  }
}
