import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { TOPICS } from "../ao/ClaraMarketAO.mjs";
import { ClaraProfileStory } from "./ClaraProfileStory.mjs";
import {
  determineTransport,
  doWrite,
  explorerUrl,
  getClients,
  storyAeneid,
} from "./utils.mjs";
import {stringToHex} from "viem";

export class ClaraMarketStory {
  #contractAddress;
  #chain;
  #transport;

  constructor(
    contractAddress,
    chain = storyAeneid,
    transport = determineTransport(),
  ) {
    if (!contractAddress) {
      throw new Error("C.L.A.R.A. Market contract address required");
    }
    this.#contractAddress = contractAddress;
    this.#chain = chain;
    this.#transport = transport;
  }

  async registerAgent(account, { metadata, topic, fee }) {
    if (!TOPICS.includes(topic)) {
      throw new Error(
        `Unknown topic ${topic}, allowed ${JSON.stringify(TOPICS)}`,
      );
    }

    const { publicClient, walletClient } = getClients(
      account,
      this.#chain,
      this.#transport,
    );

    const txId = await doWrite(
      {
        address: this.#contractAddress,
        functionName: "registerAgentProfile",
        args: [fee, stringToHex(topic, {size: 32}), metadata],
        account,
      },
      publicClient,
      walletClient,
    );

    console.log(`Profile Registered: ${explorerUrl(this.#chain)}/tx/${txId}`);
    return new ClaraProfileStory(
      account,
      this.#contractAddress,
      this.#chain,
      this.#transport,
    );
  }

  async registerClient(account, { metadata }) {
    return this.registerAgent(account, { metadata, topic: "none", fee: 0n });
  }

  async generateAccount() {
    const privateKey = generatePrivateKey();
    const account = privateKeyToAccount(privateKey);

    return { privateKey, account };
  }
}
