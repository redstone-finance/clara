import EventEmitter from "node:events";
import { REGISTER_TASK_TOPICS } from "../ao/ClaraMarketAO.mjs";
import {
  determineTransport,
  doRead,
  doWrite,
  explorerUrl,
  getClients,
  storyAeneid,
} from "./utils.mjs";
import { erc20Abi, parseEventLogs } from "viem";
import { marketAbi } from "./marketAbi.mjs";

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

  async registerTask({
    topic,
    reward,
    matchingStrategy,
    payload,
    contextId = 0,
  }) {
    if (!REGISTER_TASK_TOPICS.includes(topic)) {
      throw new Error(
        `Unknown topic ${topic}, allowed ${JSON.stringify(REGISTER_TASK_TOPICS)}`,
      );
    }
    const { account, publicClient, walletClient } = this.#agent;

    // (o) check payment token address
    const paymentTokenAddr = await doRead(
      {
        address: this.#contractAddress,
        functionName: "getPaymentsAddr",
      },
      publicClient,
    );
    console.log("Payment token: ", paymentTokenAddr);

    // (o) set allowance on token for the market contract
    const allowanceTxId = await doWrite(
      {
        abi: erc20Abi,
        address: paymentTokenAddr,
        functionName: "approve",
        args: [this.#contractAddress, reward],
        account,
      },
      publicClient,
      walletClient,
    );
    console.log(
      `Allowance set: ${explorerUrl(this.#chain)}/tx/${allowanceTxId}`,
    );

    await publicClient.waitForTransactionReceipt({ hash: allowanceTxId });

    const txHash = await doWrite(
      {
        address: this.#contractAddress,
        functionName: "registerTask",
        args: [reward, contextId, topic, matchingStrategy, payload],
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
    const task = logs[0].args.task;
    console.log(`Task Registered: ${explorerUrl(this.#chain)}/tx/${txHash}`);
    return { txHash, blockNumber: receipt.blockNumber, task };
  }

  async sendTaskResult({ taskId, result }) {
    const { account, publicClient, walletClient } = this.#agent;
    const txId = await doWrite(
      {
        address: this.#contractAddress,
        functionName: "sendResult",
        args: [taskId, result],
        account,
      },
      publicClient,
      walletClient,
    );

    console.log(`Result sent: ${explorerUrl(this.#chain)}/tx/${txId}`);
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

  async loadNextAssignedTask(cursor = 0n) {
    const { publicClient } = this.#agent;
    const blockHeight = await publicClient.getBlockNumber();
    const logs = await publicClient.getContractEvents({
      address: this.#contractAddress,
      abi: marketAbi,
      eventName: "TaskAssigned",
      args: {
        assignedAgent: this.#agent.id,
      },
      fromBlock: cursor,
      toBlock: blockHeight,
    });
    if (logs.length > 0) {
      //eg
      /**
       * id: 1n,
       *         contextId: 1n,
       *         timestamp: 1738855940n,
       *         blockNumber: 2500504n,
       *         reward: 2000000000000000000n,
       *         requester: '0x233f7752AC360Db08618216bc2936DB6416c899b',
       *         agentId: '0x3C69fb1dB1d057d940F7211ef6346F697e44feF8',
       *         matchingStrategy: 'broadcast',
       *         payload: 'just do it',
       *         topic: 'chat'
       */
      return {
        txHash: logs[0].transactionHash,
        result: logs[0].args.task,
        cursor: logs[0].blockNumber + 1n,
      };
    } else {
      return {
        result: null,
        cursor: blockHeight + 1n,
      };
    }
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
      //eg
      /**
       * id: 1n,
       *         timestamp: 1738856877n,
       *         blockNumber: 2500744n,
       *         result: 'jobs done'
       */
      return {
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
}
