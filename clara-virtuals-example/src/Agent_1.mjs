// Create an agent with the worker
import {GameAgent} from "@virtuals-protocol/game";
import {VirtualsClaraPlugin} from "./clara-plugin/virtualsClaraPlugin.mjs";

const claraPlugin = new VirtualsClaraPlugin();

const agent = new GameAgent("API_KEY", {
  name: "Twitter Bot",
  goal: "increase engagement and grow follower count",
  description: "A bot that can post tweets, reply to tweets, and like tweets",
  workers: [
    claraPlugin.getWorker({
      // Define the functions that the worker can perform, by default it will use the all functions defined in the plugin
      // functions: [
      //   twitterPlugin.searchTweetsFunction,
      //   twitterPlugin.replyTweetFunction,
      //   twitterPlugin.postTweetFunction,
      // ],
      // Define the environment variables that the worker can access, by default it will use the metrics defined in the plugin
      // getEnvironment: async () => ({
      //   ...(await twitterPlugin.getMetrics()),
      //   username: "virtualsprotocol",
      //   token_price: "$100.00",
      // }),
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