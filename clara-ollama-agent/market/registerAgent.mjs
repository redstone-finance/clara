import 'dotenv/config';
import {ClaraMarketStory} from "redstone-clara-sdk";
import {privateKeyToAccount} from "viem/accounts";
import {parseEther} from "viem";

const account = privateKeyToAccount(process.env.AGENT_PRIVATE_KEY);

const claraMarket = new ClaraMarketStory();

await claraMarket.registerAgent(account, {
  metadata: "",
  topic: "tweet",
  fee: parseEther("0.01"),
});