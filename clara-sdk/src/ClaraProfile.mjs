import {createDataItemSigner, dryrun, message} from "@permaweb/aoconnect";
import {DEFAULT_CLARA_PROCESS_ID, MATCHERS, TOPICS} from "./ClaraMarket.mjs";
import {getMessageResult, getTagValue, messageWithTags} from "./commons.mjs";
import EventEmitter from 'node:events';
import Arweave from "arweave";
import {fetchTransactions, loadTxData} from "./gql.mjs";
import {backOff} from "exponential-backoff";

export class ClaraProfile extends EventEmitter {
  #agent;
  #processId;
  #arweave = Arweave.init({
    host: 'arweave.net',
    port: 443,
    protocol: 'https'
  });
  #subscriptionId

  constructor({id, jwk}, processId) {
    super();
    if (!processId) {
      throw new Error("C.L.A.R.A. Market Process Id required");
    }
    this.#processId = processId;
    this.#agent = {id, jwk};
  }

  async profileData() {
    const agentAddress = await this.#arweave.wallets.jwkToAddress(this.#agent.jwk);
    return {
      address: agentAddress,
      id: this.#agent.id
    }
  }

  async subscribe(cursor = "", pollTimeoutMs = 5000) {
    const agentAddress = await this.#arweave.wallets.jwkToAddress(this.#agent.jwk);
    if (this.#subscriptionId) {
      console.warn("Already subscribed");
      return;
    }
    this.#subscriptionId = setInterval(async () => {
      console.log('Polling for new tx from cursor', cursor);
      try {
        const result = await fetchTransactions(agentAddress, this.#processId, cursor);
        console.log(`Received ${result.length} messages`);
        for (let tx of result) {
          cursor = tx.cursor;
          const data = await loadTxData(tx.node.id);
          const event = getTagValue(tx.node.tags, "Action")
          this.emit(event, {
            ...tx.node,
            data,
            cursor
          });
        }

      } catch (error) {
        console.error(error)
      }
    }, pollTimeoutMs);
  }

  unsubscribe() {
    clearInterval(this.#subscriptionId);
    this.#subscriptionId = null;
  }

  async registerTask({topic, reward, matchingStrategy, payload, contextId = null}) {
    if (!TOPICS.includes(topic)) {
      throw new Error(`Unknown topic ${topic}, allowed ${JSON.stringify(TOPICS)}`);
    }
    if (!MATCHERS.includes(matchingStrategy)) {
      throw new Error(`Unknown matcher ${matchingStrategy}, allowed ${JSON.stringify(MATCHERS)}`);
    }

    const signer = createDataItemSigner(this.#agent.jwk);

    const tags = [
      {name: 'Action', value: 'Register-Task'},
      {name: 'RedStone-Agent-Id', value: this.#agent.id},
      {name: 'RedStone-Agent-Topic', value: topic},
      {name: 'Protocol', value: 'C.L.A.R.A.'},
      {name: 'RedStone-Agent-Reward', value: "" + Math.floor(reward)},
      {name: 'RedStone-Agent-Matching', value: matchingStrategy},
    ];
    if (contextId) {
      tags.push({name: 'Context-Id', value: contextId});
    }

    const msgId = await message({
      process: this.#processId,
      data: JSON.stringify(payload),
      tags,
      signer
    });

    console.log('Task ID', msgId);
    console.log(`Register Task message: https://www.ao.link/#/message/${msgId}`);
    const result =  await getMessageResult(this.#processId, msgId);

    const msg = messageWithTags(result, [{
      name: "Action",
      value: "Task-Assignment"
    }, {
      name: "Requesting-Agent-Id",
      value: this.#agent.id
    }, {
      name: 'Task-Id',
      value: msgId
    }]);
    if (msg) {
      console.log('Task assigned');
      return {
        taskId: msgId,
        assignedAgentId: getTagValue(msg.Tags, 'Assigned-Agent-Id'),
        fee: parseInt(JSON.parse(msg.Data).reward)
      }
    } else {
      console.log('Task added to queue');
      return {
        taskId: msgId,
        info: "Task added to queue"
      }
    }
  }

  async sendTaskResult({taskId, result}) {
    const signer = createDataItemSigner(this.#agent.jwk);

    const id = await message({
      process: this.#processId,
      data: JSON.stringify(result),
      tags: [
        {name: 'Action', value: 'Send-Result'},
        {name: 'RedStone-Agent-Id', value: this.#agent.id},
        {name: 'RedStone-Task-Id', value: taskId},
        {name: 'Protocol', value: 'C.L.A.R.A.'},
      ],
      signer
    });

    console.log(`Send Task Result message: https://www.ao.link/#/message/${id}`);
    return (await getMessageResult(this.#processId, id)).Messages[0];
  }

  async declineTask({taskId}) {
    const signer = createDataItemSigner(this.#agent.jwk);

    const id = await message({
      process: this.#processId,
      tags: [
        {name: 'Action', value: 'Decline-Task'},
        {name: 'RedStone-Agent-Id', value: this.#agent.id},
        {name: 'RedStone-Task-Id', value: taskId},
        {name: 'Protocol', value: 'C.L.A.R.A.'},
      ],
      signer
    });

    console.log(`Decline Task message: https://www.ao.link/#/message/${id}`);
    return await getMessageResult(this.#processId, id);
  }

  async loadNextAssignedTask() {
    const signer = createDataItemSigner(this.#agent.jwk);

    const id = await message({
      process: this.#processId,
      tags: [
        {name: 'Action', value: 'Load-Next-Assigned-Task'},
        {name: 'RedStone-Agent-Id', value: this.#agent.id},
        {name: 'Protocol', value: 'C.L.A.R.A.'},
      ],
      signer
    });

    console.log(`Load Next Assigned Task message: https://www.ao.link/#/message/${id}`);
    const result =  await getMessageResult(this.#processId, id);
    if (result.Messages.length === 1) {
      return JSON.parse(result.Messages[0].Data);
    } else {
      return null;
    }
  }
}