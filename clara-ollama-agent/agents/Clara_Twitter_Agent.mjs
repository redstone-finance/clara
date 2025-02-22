import 'dotenv/config';
import {step} from "./step.mjs";
import {clara_send_task_result_tool, claraSendTaskResult} from "../tools/clara_send_task_result.mjs";
import {privateKeyToAccount} from "viem/accounts";
import {ClaraProfileStory, storyAeneid} from "redstone-clara-sdk";
import {CLARA_TWITTER_MODEL} from "../constants.mjs";
import {openDb} from "../db.mjs";
import { Scraper } from "agent-twitter-client";
import pino from 'pino';

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Rejection at:', reason.stack || reason)
});

process.on('uncaughtException', (error) => {
  logger.error(`Caught exception: ${error}\n` + `Exception origin: ${error.stack}`);
});

const logger = pino({
  transport: {
    target: 'pino-pretty',
    options: {
      messageFormat: '[{module}]: {msg}',
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname,module',
    }
  },
});

const loadTaskLog = logger.child({module: 'loadTask'});
const modelLog = logger.child({module: 'ollama'});
export const performTaskLog = logger.child({module: 'performTask'});

const twitterClient = new Scraper();
const account = privateKeyToAccount(process.env.AGENT_PRIVATE_KEY);
const contractAddr = process.env.CLARA_MARKET_STORY_CONTRACT;
const claraProfile = new ClaraProfileStory(account, contractAddr, storyAeneid);

export const taskKey = "task";
const db = openDb(contractAddr);

const availableFunctions = {
  clara_send_task_result: claraSendTaskResult.bind(
    null,
    claraProfile,
    db,
    twitterClient)
};

const tools = [
  clara_send_task_result_tool
];

export const workflow = {
  "todo": 1,
  "generated": 2,
  "tweetSent": 3,
}

let llmActive = false;

async function maybeLoadTask() {
  try {
    loadTaskLog.info("searching for new tasks");
    const pendingTask = await claraProfile.loadPendingTask();
    if (pendingTask) {
      if (!db.doesExist(taskKey)) {
        await db.put(taskKey, {
          ...pendingTask,
          workflowStep: workflow["todo"]
        });
      }
      loadTaskLog.info('Has pending task, not loading');
      return;
    }
    // remove if any garbage left in local db
    await db.remove(taskKey);
    const task = await claraProfile.loadNextTask();
    if (task != null) {
      loadTaskLog.debug(task);
      await db.put(taskKey, {
        ...task,
        workflowStep: workflow["todo"]
      });
    } else {
      loadTaskLog.info("no new tasks");
    }
  } catch (error) {
    loadTaskLog.error(error);
  }
}

async function maybePerformTask() {
  try {
    performTaskLog.info("Perform task");
    const task = db.get("task");
    if (!task) {
      performTaskLog.info("No tasks to perform");
      return;
    }
    if (workflow[task.workflowStep] > workflow["generated"]) {
      performTaskLog.info(`Sending for Task ${task.id}: ${task.workflowStep}`);
      await claraSendTaskResult(claraProfile, db, twitterClient, null, task);
      return;
    }

    if (llmActive) {
      performTaskLog.info("Model active, returning");
      return;
    }
    performTaskLog.info("Communicating with model");
    llmActive = true;
    const messages = [];
    let stepNumber = 0;
    const agentStep = step.bind(
      null,
      CLARA_TWITTER_MODEL,
      tools,
      messages,
      availableFunctions,
      modelLog);

    messages.push(
      {
        role: 'user',
        content: `Generate engaging tweet for a task with id ${task.id} about: ${task.payload}`
      });
    await agentStep(++stepNumber);
  } catch (error) {
    performTaskLog.error(error);
  } finally {
    llmActive = false;
  }
}

async function run() {
  logger.info(`🤖 Agent ${account.address} connected to Clara Market ${contractAddr}`)

  await twitterClient.login(
    process.env.TWITTER_USERNAME,
    process.env.TWITTER_PASSWORD,
    process.env.TWITTER_EMAIL);
  if (!(await twitterClient.isLoggedIn())) {
    logger.error("Failed to login to Twitter");
    return false;
  }

  await maybeLoadTask();
  setInterval(maybeLoadTask, 5000);

  await maybePerformTask();
  setInterval(maybePerformTask, 5000);
}

run()
  .catch(error => logger.error("An error occurred:", error));
