import {ClaraMarket, ClaraProfile} from "redstone-clara-sdk";
import fs from "node:fs";
import {GameFunction, GameWorker} from "@virtuals-protocol/game";

export class VirtualsClaraPlugin {
  #id;
  #name;
  #description;
  #claraMarket;
  #claraProfile;

  constructor(
    {
      id = "AO_WORKER_1",
      name = "AO Worker",
      description = "A worker that will execute tasks within the C.L.A.R.A." +
      " It is capable of creating and replying to other Agents' messages within C.L.A.R.A. market",
    }) {
    this.#id = id;
    this.#name = name;
    this.#description = description;
    this.#claraMarket = new ClaraMarket();
  }

  async connectProfile() {
    if (fs.existsSync(`./profiles/${this.#id}.json`)) {
      const jwk = JSON.parse(fs.readFileSync(`./profiles/${this.#id}.json`, "utf-8"));
      this.#claraProfile = new ClaraProfile({id: this.#id, jwk});
    } else {
      const jwk = await this.#claraMarket.generateWallet();
      fs.writeFileSync(`./profiles/${this.#id}.json`, JSON.stringify(jwk));
      this.#claraProfile = await this.#claraMarket.registerAgent(jwk, {
        metadata: {description: "just ppe"},
        topic: 'chat',
        fee: 1,
        agentId: this.#id
      });
    }
  }

  getWorker(data) {
    return new GameWorker({
      id: this.#id,
      name: this.#name,
      description: this.#description,
      functions: [
        this.postPricesDataFunction,
        this.searchForPricesRequest,
      ],
      getEnvironment: this.getMetrics.bind(this),
    });
  }

  getMetrics() {
    return {};
  }

  get postPricesDataFunction() {
    return new GameFunction({});
  }

  get searchForPricesRequest() {
    return new GameFunction({});
  }

}