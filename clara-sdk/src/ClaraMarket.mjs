import Arweave from 'arweave';
import { createDataItemSigner, dryrun, message } from '@permaweb/aoconnect';
import { ClaraProfile } from './ClaraProfile.mjs';
import { getMessageResult, messageWithTags } from './commons.mjs';

export const DEFAULT_CLARA_PROCESS_ID = 'CS5biQW6v2PsT3HM19P_f8Fj8UGYnFFNF8O6sfZ1jLc';

export const ACTIONS = ['Task-Assignment'];

export const TOPICS = ['tweet', 'discord', 'telegram', 'nft', 'chat'];

export const MATCHERS = ['cheapest', 'leastOccupied', 'broadcast'];

export class ClaraMarket {
  #processId;

  #arweave = Arweave.init({
    host: 'arweave.net',
    port: 443,
    protocol: 'https',
  });

  constructor(processId) {
    if (!processId) {
      throw new Error('C.L.A.R.A. Market Process Id required');
    }
    this.#processId = processId;
  }

  async registerAgent(jwk, { metadata, topic, fee, agentId }) {
    if (!TOPICS.includes(topic)) {
      throw new Error(`Unknown topic ${topic}, allowed ${JSON.stringify(TOPICS)}`);
    }
    const signer = createDataItemSigner(jwk);
    const id = await message({
      process: this.#processId,
      data: JSON.stringify(metadata),
      tags: [
        { name: 'Action', value: 'Register-Agent-Profile' },
        { name: 'RedStone-Agent-Topic', value: topic },
        { name: 'Protocol', value: 'C.L.A.R.A.' },
        { name: 'Protocol-Version', value: '1.0.0' },
        { name: 'RedStone-Agent-Fee', value: '' + Math.floor(fee) },
        { name: 'RedStone-Agent-Id', value: agentId },
      ],
      signer,
    });

    const result = await getMessageResult(this.#processId, id);
    if (messageWithTags(result, [{ name: 'Action', value: 'Registered' }])) {
      console.log(`Registered Agent Message: https://www.ao.link/#/message/${id}`);
      return new ClaraProfile({ id: agentId, jwk }, this.#processId);
    } else {
      throw new Error(`Agent not registered, reason\n ${JSON.stringify(result, null, 2)}`);
    }
  }

  async listAgents() {
    const result = await dryrun({
      process: this.#processId,
      tags: [{ name: 'Action', value: 'List-Agents' }],
    });

    return JSON.parse(result.Messages[0].Data);
  }

  async tasksQueue() {
    const result = await dryrun({
      process: this.#processId,
      tags: [{ name: 'Action', value: 'Tasks-Queue' }],
    });

    return JSON.parse(result.Messages[0].Data);
  }

  async dispatchTasks() {
    const wallet = this.generateWallet();
    const signer = createDataItemSigner(wallet);
    const id = await message({
      process: this.#processId,
      tags: [{ name: 'Action', value: 'Dispatch-Tasks' }],
      signer,
    });
    console.log(`Dispatch Tasks message: https://www.ao.link/#/message/${id}`);
    return await getMessageResult(this.#processId, id);
  }

  async generateWallet() {
    const wallet = await this.#arweave.wallets.generate();
    const address = await this.#arweave.wallets.jwkToAddress(wallet);

    return { wallet, address };
  }
}
