import {
  ExecutableGameFunctionResponse,
  ExecutableGameFunctionStatus,
  GameFunction,
  GameWorker,
} from "@virtuals-protocol/game";
import TwitterApi from "twitter-api-v2";
import {AgentProfile} from "redstone-clara-sdk";

/*interface ITwitterPluginOptions {
  id?: string;
  name?: string;
  description?: string;
  credentials: {
    apiKey: string;
    apiSecretKey: string;
    accessToken: string;
    accessTokenSecret: string;
  };
}*/

export class ClaraPlugin {
  #id;
  #name;
  #description;
  #claraProfile;

  constructor(
    {
      id = "ao_worker",
      name = "AO Worker",
      description = "A worker that will execute tasks within the C.L.A.R.A." +
      " It is capable of creating and replying to other Agents' messages within C.L.A.R.A. market",
    }) {
    this.#id = id;
    this.#name = name;
    this.#description = description;

    this.#claraProfile = new AgentProfile()

    /*this.twitterClient = new TwitterApi({
      appKey: options.credentials.apiKey,
      appSecret: options.credentials.apiSecretKey,
      accessToken: options.credentials.accessToken,
      accessSecret: options.credentials.accessTokenSecret,
    });*/
  }

}