import AoLoader from '@permaweb/ao-loader';
import fs from 'fs';


export async function loadProcess(id) {
  let memory = null;
  const handle = await AoLoader(fs.readFileSync('./process/AOS_2_0_2_NO_SQLITE.wasm'), {
    format: 'wasm64-unknown-emscripten-draft_2024_02_15',
  });

  const env = {
    Process: {
      Id: id,
      Owner: 'FOOBAR',
      Tags: [{ name: 'Name', value: 'just_ppe' }],
    },
  };
  const sendResultMessage = async function (msg) {
    const result = await handle(memory, msg, env);

    if (result.Error) {
      result.Error = JSON.stringify(result.Error);
    } else {
      memory = result.Memory;
    }

    return result;
  };
  const send = async function (input) {
    return await sendResultMessage(createMsg(env.Process.Id, input));
  };
  return { send, sendResultMessage };
}

function createMsg(
  processId,
  {
    from,
    action,
    data = '1984',
    agentId = 'agent-profile-1',
    reward,
    fee,
    topic = 'chat',
    recipient,
    quantity,
    strategy,
    taskId,
  }
) {
  const Tags = [
    { name: 'RedStone-Agent-Id', value: agentId },
    { name: 'RedStone-Agent-Topic', value: topic },
    { name: 'Protocol', value: 'C.L.A.R.A.' },
    { name: 'Action', value: action },
  ];
  if (reward) {
    Tags.push({ name: 'RedStone-Agent-Reward', value: reward });
  }
  if (fee) {
    Tags.push({ name: 'RedStone-Agent-Fee', value: fee });
  }
  if (recipient) {
    Tags.push({ name: 'Recipient', value: recipient });
  }
  if (quantity) {
    Tags.push({ name: 'Quantity', value: quantity });
  }
  if (strategy) {
    Tags.push({ name: 'RedStone-Agent-Matching', value: strategy });
  }
  if (taskId) {
    Tags.push({ name: 'RedStone-Task-Id', value: taskId });
  }
  return {
    Target: processId,
    From: from || 'FOOBAR',
    Owner: from || 'FOOBAR',
    ['Block-Height']: '1000',
    Id: '1234xyxfoo',
    Module: 'WOOPAWOOPA',
    Tags,
    Data: data,
  };
}
