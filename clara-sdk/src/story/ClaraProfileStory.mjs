import EventEmitter from "node:events";
import { REGISTER_TASK_TOPICS } from "../ao/ClaraMarketAO.mjs";
import {
  determineTransport,
  doRead,
  doWrite,
  explorerUrl,
  fromBytes32Hex,
  getClients,
  toBytes32Hex,
} from "./utils.mjs";
import { erc20Abi, parseEventLogs, getAbiItem } from "viem";
import { marketAbi } from "./marketAbi.mjs";
import { storyAeneid } from "./chains.mjs";

export class ClaraProfileStory extends EventEmitter {
  #agent;
  #contractAddress;
  #chain;

  constructor(
    account,
    contractAddress,
    chain = storyAeneid,
    transport = determineTransport(),
  ) {
    super();
    if (!contractAddress) {
      throw new Error("C.L.A.R.A. Market contract address required");
    }
    this.#contractAddress = contractAddress;
    this.#chain = chain;
    const { publicClient, walletClient } = getClients(
      account,
      chain,
      transport,
    );

    // TODO: not sure if account.address works in case of JSON-Rpc Account - https://viem.sh/docs/clients/wallet#optional-hoist-the-account
    this.#agent = { id: account.address, account, publicClient, walletClient };
  }

  async registerTask({ topic, reward, payload, contextId = 0 }) {
    this.#assertTopic(topic);
    const { account, publicClient, walletClient } = this.#agent;

    // (o) check payment token address
    const paymentTokenAddr = await this.#getPaymentTokenAddr(publicClient);

    // (o) set allowance on token for the market contract
    await this.#approve(paymentTokenAddr, reward);

    const txHash = await doWrite(
      {
        address: this.#contractAddress,
        functionName: "registerTask",
        args: [reward, contextId, toBytes32Hex(topic), payload],
        account,
      },
      publicClient,
      walletClient,
    );
    const receipt = await publicClient.waitForTransactionReceipt({
      hash: txHash,
    });

    const task = this.#loadRegisteredTask(receipt);
    console.log(`Task Registered: ${explorerUrl(this.#chain)}/tx/${txHash}`);
    return { txHash, blockNumber: receipt.blockNumber, task };
  }

  async getAssignedTaskId() {
    const { id, publicClient } = this.#agent;

    const task = await doRead(
      {
        address: this.#contractAddress,
        functionName: "agentInbox",
        args: [id],
      },
      publicClient,
    );

    if (task.length && task[0] > 0n) {
      return Number(task[0]);
    } else {
      return null;
    }
  }

  async registerMultiTask({
    topic,
    rewardPerTask,
    tasksCount,
    payload,
    maxRepeatedTasksPerAgent = 5,
  }) {
    this.#assertTopic(topic);
    const { account, publicClient, walletClient } = this.#agent;

    // (o) check payment token address
    const paymentTokenAddr = await this.#getPaymentTokenAddr(publicClient);

    // (o) set allowance on token for the market contract
    await this.#approve(paymentTokenAddr, rewardPerTask * BigInt(tasksCount));

    const txHash = await doWrite(
      {
        address: this.#contractAddress,
        functionName: "registerMultiTask",
        args: [
          tasksCount,
          rewardPerTask,
          maxRepeatedTasksPerAgent,
          toBytes32Hex(topic),
          payload,
        ],
        account,
      },
      publicClient,
      walletClient,
    );
    const receipt = await publicClient.waitForTransactionReceipt({
      hash: txHash,
    });

    const task = this.#loadRegisteredTask(receipt);
    console.log(`Task Registered: ${explorerUrl(this.#chain)}/tx/${txHash}`);
    return { txHash, blockNumber: receipt.blockNumber, task };
  }

  async sendTaskResult({ taskId, result }) {
    const { account, publicClient, walletClient } = this.#agent;
    const txHash = await doWrite(
      {
        address: this.#contractAddress,
        functionName: "sendResult",
        args: [taskId, result],
        account,
      },
      publicClient,
      walletClient,
    );

    console.log(`Result sent: ${explorerUrl(this.#chain)}/tx/${txHash}`);
    return txHash;
  }

  async updateFee(newFee) {
    const { account, publicClient, walletClient } = this.#agent;
    const txId = await doWrite(
      {
        address: this.#contractAddress,
        functionName: "updateAgentFee",
        args: [newFee],
        account,
      },
      publicClient,
      walletClient,
    );

    console.log(`Fee updated: ${explorerUrl(this.#chain)}/tx/${txId}`);
  }

  async updateTopic(newTopic) {
    const { account, publicClient, walletClient } = this.#agent;
    const txId = await doWrite(
      {
        address: this.#contractAddress,
        functionName: "updateAgentTopic",
        args: [toBytes32Hex(newTopic)],
        account,
      },
      publicClient,
      walletClient,
    );

    console.log(`Fee updated: ${explorerUrl(this.#chain)}/tx/${txId}`);
  }

  async loadNextTask() {
    const { account, publicClient, walletClient } = this.#agent;

    const unassignedTasks = await doRead(
      {
        address: this.#contractAddress,
        functionName: "unassignedTasksLength",
      },
      publicClient,
    );
    if (unassignedTasks == 0) {
      return null;
    }

    const txHash = await doWrite(
      {
        address: this.#contractAddress,
        functionName: "loadNextTask",
        args: [],
        account,
      },
      publicClient,
      walletClient,
    );
    const receipt = await publicClient.waitForTransactionReceipt({
      hash: txHash,
    });

    const logs = parseEventLogs({
      abi: marketAbi,
      eventName: "TaskAssigned",
      logs: receipt.logs,
    });

    if (logs.length > 0) {
      const task = logs[0].args.task;
      this.#stringifyTopic(task);
      return task;
    } else {
      return null;
    }
  }

  async loadPendingTask() {
    const { account, publicClient } = this.#agent;
    const args = [account.address];
    const agentInbox = await doRead(
        {
          address: this.#contractAddress,
          functionName: "agentInbox",
          args,
        },
        publicClient,
    );

    const outputs = getAbiItem({ abi: marketAbi, args, name: 'agentInbox' }).outputs;
    let task = {};
    for (let i = 0; i < outputs.length; i++) {
        task[outputs[i].name] = agentInbox[i];
    }
    return agentInbox;
  }

  async loadNextTaskResult(cursor = 0n) {
    const { publicClient } = this.#agent;
    const blockHeight = await publicClient.getBlockNumber();
    const logs = await publicClient.getContractEvents({
      address: this.#contractAddress,
      abi: marketAbi,
      eventName: "TaskResultSent",
      args: {
        requestingAgent: this.#agent.id,
      },
      fromBlock: cursor,
      toBlock: blockHeight,
    });
    if (logs.length > 0) {
      return {
        txHash: logs[0].transactionHash,
        result: logs[0].args.taskResult,
        cursor: logs[0].blockNumber + 1n,
      };
    } else {
      return {
        result: null,
        cursor: blockHeight + 1n,
      };
    }
  }

  #assertTopic(topic) {
    if (!REGISTER_TASK_TOPICS.includes(topic)) {
      throw new Error(
        `Unknown topic ${topic}, allowed ${JSON.stringify(REGISTER_TASK_TOPICS)}`,
      );
    }
  }

  async #approve(paymentTokenAddr, amount) {
    const { account, publicClient, walletClient } = this.#agent;
    const allowanceTxId = await doWrite(
      {
        abi: erc20Abi,
        address: paymentTokenAddr,
        functionName: "approve",
        args: [this.#contractAddress, amount],
        account,
      },
      publicClient,
      walletClient,
    );
    console.log(
      `Allowance set: ${explorerUrl(this.#chain)}/tx/${allowanceTxId}`,
    );

    await publicClient.waitForTransactionReceipt({ hash: allowanceTxId });
  }

  async #getPaymentTokenAddr(publicClient) {
    const paymentTokenAddr = await doRead(
      {
        address: this.#contractAddress,
        functionName: "getPaymentsAddr",
      },
      publicClient,
    );
    console.log("Payment token: ", paymentTokenAddr);
    return paymentTokenAddr;
  }

  #loadRegisteredTask(receipt) {
    const logs = parseEventLogs({
      abi: marketAbi,
      eventName: "TaskRegistered",
      logs: receipt.logs,
    });
    const task = logs[0]?.args?.task;
    this.#stringifyTopic(task);

    return task;
  }

  #stringifyTopic(task) {
    if (task) {
      task.topic = fromBytes32Hex(task.topic);
    }
  }
}
