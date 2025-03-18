import 'dotenv/config';
import {Scraper} from "agent-twitter-client";
import {addEmbeddings, getChromaCollection} from "./chroma.mjs";
import {SentenceSplitter} from "@llamaindex/core/node-parser";

const twitterClient = new Scraper();
/*console.log(process.env.TWITTER_USERNAME);
await twitterClient.login(process.env.TWITTER_USERNAME, process.env.TWITTER_PASSWORD, process.env.TWITTER_EMAIL);
if (!(await twitterClient.isLoggedIn())) {
  console.log('Failed to login to Twitter');
  process.exit(0);
}*/

const twitterAccounts = [
  'Ben Zhou@benbybit',
  'David Sacks@davidsacks47',
  'CZ 🔶 BNB@cz_binance',
  'mert | helius.dev@0xMert_',
  'vitalik.eth@VitalikButerin'
];//await loadTop5Yapers();

const chromaCollection = await getChromaCollection(
  "kaito_rag",
  "A collection of most valuable tweets based on Kaito yapper ranking");

for (const account of twitterAccounts) {
  const user = account.split("@")[1];
  const tweets = await twitterClient.getTweets(user, 10);

  for await (const tweet of tweets) {
    console.log(tweet.text);
    const splitter = new SentenceSplitter({
      chunkSize: 256,
      chunkOverlap: 32,
    });
    const splittedDocs = splitter.splitText(tweet.text);
    for (const doc of splittedDocs) {
      await addEmbeddings(chromaCollection, doc);
    }
  }
}

console.log("RAG updated");
