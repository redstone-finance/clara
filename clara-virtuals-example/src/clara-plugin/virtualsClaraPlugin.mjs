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
    const jwk = fs.existsSync(`./profiles/${this.#id}`)
      ? JSON.parse(fs.readFileSync(`./profiles/${this.#id}.json`, "utf-8"))
      : this.#claraMarket.generateWallet();
    this.#claraProfile = new ClaraProfile({id: this.#id, jwk});
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
    return {
    };
  }

  get postPricesDataFunction() {
    return new GameFunction({});
  }

  get searchForPricesRequest() {
    return new GameFunction({});
  }

}