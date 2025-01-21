import 'dotenv/config';
// Create a worker with the functions
import TwitterPlugin from "@virtuals-protocol/game-twitter-plugin";
import {GameAgent} from "@virtuals-protocol/game";

const twitterPlugin = new TwitterPlugin.default({
  credentials: {
    apiKey: process.env.X_API_KEY,
    apiSecretKey: process.env.X_API_KEY_SECRET,
    accessToken: process.env.X_ACCESS_TOKEN,
    accessTokenSecret: process.env.X_ACCESS_TOKEN_SECRET,
  },
});

const agent = new GameAgent(process.env.VIRTUALS_AGENT_API_KEY, {
  name: "Twitter Bot",
  goal: "increase engagement and grow follower count",
  description: "A bot that can post tweets, reply to tweets, and like tweets",
  workers: [
    twitterPlugin.getWorker({
      // Define the functions that the worker can perform, by default it will use the all functions defined in the plugin
      functions: [
        twitterPlugin.searchTweetsFunction,
        twitterPlugin.replyTweetFunction,
        twitterPlugin.postTweetFunction,
      ],
      getEnvironment: async () => ({
        ...(await twitterPlugin.getMetrics()),
        username: "ppe",
        token_price: "$100.00",
      }),
    }),
  ],
});

(async () => {
  agent.setLogger((agent, message) => {
    console.log(`-----[${agent.name}]-----`);
    console.log(message);
    console.log("\n");
  });

  await agent.init();

  while (true) {
    await agent.step({
      verbose: true,
    });
  }
})();