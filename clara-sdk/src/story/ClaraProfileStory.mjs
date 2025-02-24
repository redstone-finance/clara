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
import {
  erc20Abi,
  parseEventLogs,
  getAbiItem,
  formatEther,
  encodeFunctionData,
} from "viem";
import { marketAbi } from "./marketAbi.mjs";
import { storyAeneid } from "./chains.mjs";
import { wipAbi } from "./wipAbi.mjs";
import { ipAccountImplAbi } from "./ipAccountAbi.mjs";

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
    const paymentTokenAddr = await this.#getRevenueTokenAddr(publicClient);

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
    const paymentTokenAddr = await this.#getRevenueTokenAddr(publicClient);

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
    const txHash = await doWrite(
      {
        address: this.#contractAddress,
        functionName: "updateAgentFee",
        args: [newFee],
        account,
      },
      publicClient,
      walletClient,
    );

    console.log(`Fee updated: ${explorerUrl(this.#chain)}/tx/${txHash}`);
  }

  async updateTopic(newTopic) {
    const { account, publicClient, walletClient } = this.#agent;
    const txHash = await doWrite(
      {
        address: this.#contractAddress,
        functionName: "updateAgentTopic",
        args: [toBytes32Hex(newTopic)],
        account,
      },
      publicClient,
      walletClient,
    );

    console.log(`Fee updated: ${explorerUrl(this.#chain)}/tx/${txHash}`);
  }

  async loadNextTask() {
    const { id, account, publicClient, walletClient } = this.#agent;
    if (await this.isAgentPaused()) {
      console.log("Agent paused, returning");
      return;
    }

    const unassignedTasks = await doRead(
      {
        address: this.#contractAddress,
        functionName: "unassignedTasks",
        account: id,
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
    if (agentInbox.length === 0 || agentInbox[0] === 0n) {
      return null;
    }

    const outputs = getAbiItem({
      abi: marketAbi,
      args,
      name: "agentInbox",
    }).outputs;
    let task = {};
    for (let i = 0; i < outputs.length; i++) {
      task[outputs[i].name] = agentInbox[i];
    }
    this.#stringifyTopic(task);
    return task;
  }

  async withdrawUnusedRewards() {
    const { id, account, publicClient, walletClient } = this.#agent;
    const txHash = await doWrite(
      {
        address: this.#contractAddress,
        functionName: "withdraw",
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
      eventName: "RewardWithdrawn",
      logs: receipt.logs,
    });

    if (logs.length > 0) {
      const amount = logs[0].args.amount;
      console.log(`${formatEther(amount)} transferred back to ${id}`);
      return amount;
    } else {
      return null;
    }
  }

  async withdrawEarnedRewards(unwrapWipToIp = true) {
    const { id, account, publicClient, walletClient } = this.#agent;

    const amount = await this.earnedRewards();
    if (amount === 0n) {
      return null;
    }

    const transferFnData = encodeFunctionData({
      abi: wipAbi,
      functionName: "transfer",
      args: [id, amount],
    });

    const agent = await this.agentData();

    const revenueTokenAddress = await this.#getRevenueTokenAddr(publicClient);
    const txHash = await doWrite(
      {
        abi: ipAccountImplAbi,
        address: agent.ipAssetId,
        functionName: "execute",
        args: [revenueTokenAddress, 0n, transferFnData],
        account,
      },
      publicClient,
      walletClient,
    );

    const receipts = [];
    const receipt1 = await publicClient.waitForTransactionReceipt({
      hash: txHash,
    });
    receipts.push(receipt1);

    if (unwrapWipToIp) {
      const txHash = await doWrite(
        {
          abi: wipAbi,
          address: revenueTokenAddress,
          functionName: "withdraw",
          args: [amount],
          account,
        },
        publicClient,
        walletClient,
      );

      const receipt2 = await publicClient.waitForTransactionReceipt({
        hash: txHash,
      });
      receipts.push(receipt2);
    }

    return {
      receipts,
      withdrawned: amount,
      unwrapped: unwrapWipToIp ? amount : 0,
    };
  }

  async isAgentPaused() {
    const { id, publicClient } = this.#agent;
    const isAgentPaused = await doRead(
      {
        address: this.#contractAddress,
        functionName: "isAgentPaused",
        account: id,
      },
      publicClient,
    );
    return isAgentPaused;
  }

  async updateAgentPaused(isPaused) {
    const { account, publicClient, walletClient } = this.#agent;
    const txHash = await doWrite(
      {
        address: this.#contractAddress,
        functionName: "updateAgentPaused",
        args: [isPaused],
        account,
      },
      publicClient,
      walletClient,
    );
    const receipt = await publicClient.waitForTransactionReceipt({
      hash: txHash,
    });

    console.log(
      `Agent Paused updated: ${explorerUrl(this.#chain)}/tx/${txHash}`,
    );

    return receipt;
  }

  async mintWIPs(amount) {
    const { account, publicClient, walletClient } = this.#agent;
    const revenueTokenAddr = await this.#getRevenueTokenAddr(publicClient);

    const txHash = await doWrite(
      {
        abi: wipAbi,
        address: revenueTokenAddr,
        functionName: "deposit",
        value: amount,
        account,
      },
      publicClient,
      walletClient,
    );

    console.log(`WIPs minted: ${explorerUrl(this.#chain)}/tx/${txHash}`);

    const receipt = await publicClient.waitForTransactionReceipt({
      hash: txHash,
    });

    return receipt;
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

  async agentData() {
    const { id, publicClient } = this.#agent;
    const args = [id];
    const agentData = await doRead(
      {
        address: this.#contractAddress,
        functionName: "agents",
        args,
      },
      publicClient,
    );

    if (agentData.length === 0 || agentData[0] === false) {
      return null;
    }

    const outputs = getAbiItem({
      abi: marketAbi,
      args,
      name: "agents",
    }).outputs;
    let agent = {};
    for (let i = 0; i < outputs.length; i++) {
      agent[outputs[i].name] = agentData[i];
    }
    this.#stringifyTopic(agent);

    return agent;
  }

  // note: we could simply return here "rewards" from "agentTotals"
  // but checking directly on WIP token via Agent's IP Assets seems
  // more legit
  async earnedRewards() {
    const { id, publicClient } = this.#agent;

    // (o) check this agent IP Asset
    const { ipAssetId } = await this.agentData();

    // (o) check payment token address
    const revenueTokenAddr = await this.#getRevenueTokenAddr(publicClient);

    // (o) check balance
    const balance = await doRead(
      {
        abi: wipAbi,
        address: revenueTokenAddr,
        functionName: "balanceOf",
        args: [ipAssetId],
      },
      publicClient,
    );

    console.log(
      `Agent ${id} IP Asset ${ipAssetId} has ${formatEther(balance)} WIPs`,
    );
    return balance;
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
    const allowanceTxHash = await doWrite(
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
      `Allowance set: ${explorerUrl(this.#chain)}/tx/${allowanceTxHash}`,
    );

    await publicClient.waitForTransactionReceipt({ hash: allowanceTxHash });
  }

  async #getRevenueTokenAddr(publicClient) {
    const revenueTokenAddr = await doRead(
      {
        address: this.#contractAddress,
        functionName: "getPaymentsAddr",
      },
      publicClient,
    );
    console.log("Payment token: ", revenueTokenAddr);
    return revenueTokenAddr;
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

  #stringifyTopic(input) {
    if (input) {
      input.topic = fromBytes32Hex(input.topic);
    }
  }
}
