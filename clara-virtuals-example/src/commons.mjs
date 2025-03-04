import 'dotenv/config';
import fs from "node:fs";

import {ClaraMarket, ClaraProfile} from "redstone-clara-sdk";

export const VIRTUALS_AGENT_1_ID = "VIRTUALS_CLARA_AGENT_1";
export const VIRTUALS_AGENT_2_ID = "VIRTUALS_CLARA_AGENT_2";
export const CLARA_PROCESS_ID = "-pya7ISoqovL_N6D5FvyFqQIrSA9OBG5b33csucqbeU";
export const TOPIC = "chat";

function getRedStoneApiUrl({symbol, from, to}) {
  return `https://api.redstone.finance/prices?provider=redstone-primary-prod&symbol=${symbol}&forceInflux=true&fromTimestamp=${from}&toTimestamp=${to}&interval=86400000`
}

export async function loadRedStoneFeeds(dataFeedId){
  const now = Date.now();
  const url = getRedStoneApiUrl({
    symbol: dataFeedId,
    from: now - 30 * 86400000,
    to: now
  });
  console.log(url);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Could not load data from RedStone Oracles api');
  }
  const result = await response.json();
  return result.map(feed => {
    return {
      symbol: feed.symbol,
      value: feed.value,
      timestamp: feed.timestamp,
    }
  })
    // for some reason the API returns data twice...
    .slice(0, result.length / 2);
}

export async function connectClaraProfile(id, fee) {
  console.log("profile id", id);
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
      topic: TOPIC,
      fee: fee || 1000000,
      agentId: id
    });
  }
}

export function messageWithTags(edges, requiredTags) {
  for (let edge of edges) {
    let foundTags = 0;
    for (let requiredTag of requiredTags) {
      if (edge.node.tags.find(({name, value}) => name === requiredTag.name && value === requiredTag.value)) {
        foundTags++;
      }
      if (foundTags === requiredTags.length) {
        return edge.node;
      }
    }
  }
}

export const sendToTelegram = async (msg, config) => {
  const tgMessage = msg.substring(0, 4000);
  const tgUrlPrefix = "https://api.telegram.org";
  const tgChatId = config.tgChatId;
  const tgBotToken = config.tgBotToken;
  if (tgChatId && tgBotToken) {
    await fetch(
      `${tgUrlPrefix}/bot${tgBotToken}/sendMessage?chat_id=${tgChatId}&disable_notification=false&text=${encodeURIComponent(tgMessage)}`
    );
  } else {
    console.log(`TG_CHAT_ID or TG_BOT_TOKEN not configured, log won't be sent`);
  }
};