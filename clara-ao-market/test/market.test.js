import { test } from 'node:test';
import * as assert from 'node:assert';
import fs from 'fs';
import { loadProcess } from './helper.js';

// MARKET PROCESS
const MARKET_PROCESS_ID = 'market-process-id';
const market = await loadProcess(MARKET_PROCESS_ID);
const market_code = fs.readFileSync('./process/_process.lua', 'utf-8');

// TOKEN PROCESS
const TOKEN_PROCESS_ID = 'iJoi8w1KkSfyN2sKDXma81sOxL2czCb50MheUQ_SoUQ';
const token = await loadProcess(TOKEN_PROCESS_ID);
const token_code = fs.readFileSync('./process/_token.lua', 'utf-8');

// AGENTS
const REQUESTING_OWNER = 'FOOBAR';
const REQUESTING_AGENT_ID = 'requester-agent-id';

const ASSIGNEE_OWNER = 'assignee-owner';
const ASSIGNEE_AGENT_ID = 'assignee-agent-id';

test('should eval market code', async () => {
  const result = await market.send({ action: 'Eval', data: market_code });
  assert.ifError(result.Error);
});

test('should register agent', async () => {
  const agent1 = await market.send({
    action: 'Register-Agent-Profile',
    agentId: REQUESTING_AGENT_ID,
    fee: '4',
  });
  const registered1 = findMessageByTag(agent1.Messages, 'Action', 'Registered');
  assert.equal(registered1.Data, `Agent ${REQUESTING_AGENT_ID} registered in Market`);

  const agent2 = await market.send({
    from: ASSIGNEE_OWNER,
    action: 'Register-Agent-Profile',
    agentId: ASSIGNEE_AGENT_ID,
    topic: 'tweet',
    fee: '4',
  });
  const registered2 = findMessageByTag(agent2.Messages, 'Action', 'Registered');
  assert.equal(registered2.Data, `Agent ${ASSIGNEE_AGENT_ID} registered in Market`);
});

test('should fail to register task - insufficient funds', async () => {
  const result = await market.send({
    action: 'Register-Task',
    agentId: REQUESTING_AGENT_ID,
    topic: 'tweet',
    reward: '4',
  });
  assert.match(result.Error, /Requesting agent \(FOOBAR\) funds \(0\) are insufficient/);
});

test('should eval token code', async () => {
  const result = await token.send({ action: 'Eval', data: token_code });
  assert.ifError(result.Error);
});

test('should check token balance - start', async () => {
  assert.equal(await balance(token), 10000000000000000);
  assert.equal(await balance(market), 0);

  assert.equal(await balance(token, ASSIGNEE_OWNER), 0);
  assert.equal(await balance(market, ASSIGNEE_OWNER), 0);
});

test('should transfer token', async () => {
  const transfer1 = await token.send({ action: 'Transfer', recipient: MARKET_PROCESS_ID, quantity: '100' });
  assert.ifError(transfer1.Error);

  const creditNotice1 = await market.sendResultMessage(creditNotice(transfer1));
  assert.ifError(creditNotice1.Error);

  const transfer2 = await token.send({ action: 'Transfer', recipient: MARKET_PROCESS_ID, quantity: '80' });
  assert.ifError(transfer2.Error);

  const creditNotice2 = await market.sendResultMessage(creditNotice(transfer2));
  assert.ifError(creditNotice2.Error);

  const tokensLocked = findMessageByTag(creditNotice2.Messages, 'Action', 'Tokens-Locked');
  const addedQuantity = findTag(tokensLocked.Tags, 'Added-Quantity').value;
  assert.equal(addedQuantity, '80');

  const newBalance = findTag(tokensLocked.Tags, 'New-Balance').value;
  assert.equal(newBalance, '180');
});

test('should check token balance - after transfer', async () => {
  assert.equal(await balance(token), 9999999999999820);
  assert.equal(await balance(market), 180);

  assert.equal(await balance(token, ASSIGNEE_OWNER), 0);
  assert.equal(await balance(market, ASSIGNEE_OWNER), 0);
});

test('should register task', async () => {
  const result = await market.send({
    action: 'Register-Task',
    agentId: REQUESTING_AGENT_ID,
    topic: 'tweet',
    reward: '104',
  });
  assert.ifError(result.Error);

  const taskAssignment = findMessageByTag(result.Messages, 'Action', 'Task-Assignment');
  const assigned = findTag(taskAssignment.Tags, 'Assigned-Agent-Id').value;
  assert.equal(assigned, ASSIGNEE_AGENT_ID);
});

test('should register task result', async () => {
  const result = await market.send({
    from: ASSIGNEE_OWNER,
    action: 'Send-Result',
    agentId: ASSIGNEE_AGENT_ID,
    taskId: '1234xyxfoo',
    topic: 'tweet',
  });
  assert.ifError(result.Error);

  const taskResult = findMessageByTag(result.Messages, 'Action', 'Task-Result');
  assert.equal(findTag(taskResult.Tags, 'Fee').value, '4');

  const transfer = transferMessage(result);
  assert.equal(findTag(transfer.Tags, 'Recipient').value, ASSIGNEE_OWNER);
  assert.equal(findTag(transfer.Tags, 'Quantity').value, '4');

  const tokenResponse = await token.sendResultMessage(transfer);
  const debiNotice = findMessageByTag(tokenResponse.Messages, 'Action', 'Debit-Notice');
  assert.equal(findTag(debiNotice.Tags, 'Quantity').value, '4');
  assert.equal(findTag(debiNotice.Tags, 'Recipient').value, ASSIGNEE_OWNER);

  const creditNotice = findMessageByTag(tokenResponse.Messages, 'Action', 'Credit-Notice');
  assert.equal(findTag(creditNotice.Tags, 'Quantity').value, '4');
});

test('should check token balance - after task result', async () => {
  assert.equal(await balance(token), 9999999999999820);
  assert.equal(await balance(market), 176);

  assert.equal(await balance(token, ASSIGNEE_OWNER), 4);
  assert.equal(await balance(market, ASSIGNEE_OWNER), 0);
});

test('should claim funds on market', async () => {
  const marketBalance = await market.send({ action: 'Balance', recipient: REQUESTING_OWNER });
  assert.ifError(marketBalance.Error);
  const balanceMessage = findMessageByTag(marketBalance.Messages, 'Action', 'Balance');
  assert.equal(findTag(balanceMessage.Tags, 'Balance').value, '176');

  const claimResult = await market.send({ action: 'Claim-Reward', quantity: '140' });
  assert.ifError(claimResult.Error);
  const transferMes = transferMessage(claimResult);
  assert.equal(findTag(transferMes.Tags, 'Quantity').value, '140');

  const transferResult = await token.sendResultMessage(transferMes);
  assert.ifError(transferResult.Error);
});

test('should not claim funds on market - insufficient funds', async () => {
  const claimResult = await market.send({ action: 'Claim-Reward', quantity: '140' });
  assert.ifError(claimResult.Error);
  const errorMessage = findMessageByTag(claimResult.Messages, 'Action', 'Claim-Reward-Failed');
  assert.equal(findTag(errorMessage.Tags, 'Balance').value, '36');
});

test('should claim all funds on market', async () => {
  const claimResult = await market.send({ action: 'Claim-Reward-All' });
  assert.ifError(claimResult.Error);
  const transferMes = transferMessage(claimResult);
  assert.equal(findTag(transferMes.Tags, 'Quantity').value, '36');

  const transferRes = await token.sendResultMessage(transferMes);
  assert.ifError(transferRes.Error);
});

test('should check token balance - after claim', async () => {
  assert.equal(await balance(token), 9999999999999996);
  assert.equal(await balance(market), 0);

  assert.equal(await balance(token, ASSIGNEE_OWNER), 4);
  assert.equal(await balance(market, ASSIGNEE_OWNER), 0);
});

function transferMessage(result) {
  const transfer = findMessageByTag(result.Messages, 'Action', 'Transfer');
  assert.equal(transfer.Target, TOKEN_PROCESS_ID);

  transfer.Owner = MARKET_PROCESS_ID;
  transfer.From = MARKET_PROCESS_ID;
  return transfer;
}

function creditNotice(result) {
  const creditNotice = findMessageByTag(result.Messages, 'Action', 'Credit-Notice');
  assert.equal(creditNotice.Target, MARKET_PROCESS_ID);

  creditNotice.Owner = TOKEN_PROCESS_ID;
  creditNotice.From = TOKEN_PROCESS_ID;
  return creditNotice;
}

function findMessageByTag(messages, tag, value) {
  return messages.find((m) => findTag(m.Tags, tag).value === value);
}

function findTag(tags, tag) {
  return tags.find((t) => t.name === tag);
}

async function balance(process, recipient) {
  const marketBalance = await process.send({ action: 'Balance', recipient });
  assert.ifError(marketBalance.Error);
  return findTag(marketBalance.Messages[0].Tags, 'Balance').value;
}
