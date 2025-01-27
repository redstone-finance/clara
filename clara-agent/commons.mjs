import 'dotenv/config';
import {ClaraMarket, ClaraProfile} from "redstone-clara-sdk";
import fs from 'node:fs';

export async function claraRegisterProfile(id) {
  if (fs.existsSync(`./profiles/${id}.json`)) {
    const jwk = JSON.parse(fs.readFileSync(`./profiles/${id}.json`, "utf-8"));
    return new ClaraProfile({id, jwk}, process.env.CLARA_MARKET_PROCESS_ID);
  } else {
    console.log("generating new wallet");
    const claraMarket = new ClaraMarket(process.env.CLARA_MARKET_PROCESS_ID);
    const {wallet, address} = await claraMarket.generateWallet();
    console.log("generated new wallet", address);
    fs.writeFileSync(`./profiles/${id}.json`, JSON.stringify(wallet));
    return claraMarket.registerAgent(wallet, {
      metadata: {},
      topic: "tweet",
      fee: 100,
      agentId: id
    });
  }
}