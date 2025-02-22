import {performTaskLog, taskKey, workflow} from "../agents/Clara_Twitter_Agent.mjs";
import {BASE_MODEL} from "../constants.mjs";

export const clara_send_task_result_tool = {
  type: 'function',
  function: {
    name: 'clara_send_task_result',
    description: 'Sends a result generated for the task back to CLARA MARKET',
    parameters: {
      type: 'object',
      required: ['result', 'taskId'],
      properties: {
        result: {type: 'string', description: 'The result generated for a requested task'},
        taskId: {type: 'string', description: 'The id of the task loaded from CLARA Market'},
      }
    }
  },
}

async function sentTweetAndToMarket(twitterClient, task, db, claraProfile) {
  const tweetSendResult = await sendTweet(
    twitterClient,
    task,
    db);
  if (tweetSendResult) {
    return await sendToMarket(task, twitterClient, claraProfile, db);
  } else {
    return "Error while sending tweet";
  }
}

export async function claraSendTaskResult(
  claraProfile, db, twitterClient, args, oldTask) {
  performTaskLog.info("====== claraSendTaskResult =======")
  performTaskLog.info(JSON.stringify(args, null, 2));

  try {
    if (oldTask) {
      if (oldTask.workflowStep == workflow["generated"]) {
        return await sentTweetAndToMarket(twitterClient, oldTask, db, claraProfile);
      }

      if (oldTask.workflowStep == workflow["tweetSent"]) {
        return await sendToMarket(oldTask, twitterClient, claraProfile, db);
      }
    } else {
      const task = db.get(taskKey);
      const modelTaskId = Number(args.taskId);
      if (modelTaskId !== Number(task.id)) {
        throw new Error(`Model task id  ${modelTaskId} different from db ${task.id}`);
      }
      task.workflowStep = workflow["generated"];
      task.generatedText = args.result;
      await db.put(taskKey, task);
      return await sentTweetAndToMarket(twitterClient, task, db, claraProfile);
    }

  } catch (error) {
    performTaskLog.error(error.message);
    return `Error: ${error.message}`;
  }

}

async function sendTweet(twitterClient, task, db) {
  const tweetId = await doSendTweet(twitterClient, task.generatedText);
  performTaskLog.info(`Tweet id ${tweetId}`);
  if (tweetId) {
    task.tweetId = tweetId;
    task.workflowStep = workflow["tweetSent"];
    await db.put(taskKey, task);
    return tweetId;
  } else {
    return false;
  }
}

async function sendToMarket(task, twitterClient, claraProfile, db) {
  const me = await twitterClient.me();
  const txHash = await claraProfile.sendTaskResult({
    taskId: Number(task.id),
    result: JSON.stringify({
      data: task.generatedText,
      model: BASE_MODEL,
      tweetId: task.tweetId,
      link: `https://x.com/${me.username}/status/${task.tweetId}`
    }),
  });
  await db.remove(taskKey);
  return `Task sent ${txHash}`;
}

async function doSendTweet(twitterClient, content) {
  const result = await twitterClient.sendTweet(content);

  const body = await result.json();
  if (body.errors) {
    const error = body.errors[0];
    performTaskLog.error(
      `Twitter API error (${error.code}): ${error.message}`
    );
    return null;
  }

  // Check for successful tweet creation
  if (!body?.data?.create_tweet?.tweet_results?.result) {
    performTaskLog.error("Failed to post tweet: No tweet result in response");
    return null;
  }

  return body?.data?.create_tweet?.tweet_results?.result.rest_id;
}

