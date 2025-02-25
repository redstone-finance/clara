import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { TOPICS } from '../ao/ClaraMarketAO.mjs';
import { ClaraProfileStory } from './ClaraProfileStory.mjs';
import { determineTransport, doWrite, explorerUrl, getClients } from './utils.mjs';
import { stringToHex } from 'viem';
import { storyAeneid } from './chains.mjs';

export const CLARA_MARKET_STORY_CONTRACT_ADDRESS = {
  1514: '0xfABe102749A9270128Bb5D4d699aC3a7a6a1fadB', //mainnet
  1315: '0x056DFB62F3272b54136bd9F388Ef2cFFb19D46d0', //aeneid
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
    return new ClaraProfileStory(account, this.#contractAddress, this.#chain, this.#transport);
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
