import { test } from 'node:test';
import * as assert from 'node:assert';
import fs from 'fs';
import { loadProcess } from './helper.js';

// MARKET PROCESS
const MARKET_PROCESS_ID = 'market-process-id';
const market = await loadProcess(MARKET_PROCESS_ID);
const market_code = fs.readFileSync('./process/_process.lua', 'utf-8');

// TOKEN PROCESS
const TOKEN_PROCESS_ID = 'gmOKw5tEjPLfxZFsnRmfIFjU_Vz4DB16b-hNnV62sXA';
const token = await loadProcess(TOKEN_PROCESS_ID);
const token_code = fs.readFileSync('./process/_token.lua', 'utf-8');

const agent1 = 'ASIA_AGENTKA_1';
const agent2 = 'ASIA_AGENTKA_2';
const agent3 = 'ASIA_AGENTKA_3';
const agent4 = 'ASIA_AGENTKA_4';
const agentDelagator = 'ASIA_DELEGATORKA';

test('should eval market code', async () => {
  const result = await market.send({ action: 'Eval', data: market_code });
  assert.ifError(result.Error);
});

test('should register agent delegator', async () => {
  const result = await market.send({
    action: 'Register-Agent-Profile',
    fee: '1000',
    topic: 'tweet',
    agentId: agentDelagator,
  });
  assert.equal(result.Messages[0].Data, `Agent ${agentDelagator} registered in Market`);
});

test('should eval token code', async () => {
  const result = await token.send({ action: 'Eval', data: token_code });
  assert.ifError(result.Error);
});

test('should transfer token', async () => {
  const transfer1 = await token.send({
    action: 'Transfer',
    recipient: MARKET_PROCESS_ID,
    quantity: '100',
    agentId: agentDelagator,
  });
  assert.ifError(transfer1.Error);
  const creditNotice1 = await market.sendResultMessage(creditNotice(transfer1));
  assert.ifError(creditNotice1.Error);
});

test('should not register broadcast task when there are no agents', async () => {
  const result = await market.send({
    action: 'Register-Task',
    topic: 'chat',
    reward: '5',
    strategy: 'broadcast',
    agentId: agentDelagator,
  });
  assert.match(result.Error, /No agents to choose from/);
});

test('should register agents', async () => {
  const result1 = await market.send({ action: 'Register-Agent-Profile', fee: '1', agentId: agent1 });
  assert.equal(result1.Messages[0].Data, `Agent ${agent1} registered in Market`);

  const result2 = await market.send({ action: 'Register-Agent-Profile', fee: '1', agentId: agent2 });
  assert.equal(result2.Messages[0].Data, `Agent ${agent2} registered in Market`);

  const result3 = await market.send({ action: 'Register-Agent-Profile', fee: '1', agentId: agent3 });
  assert.equal(result3.Messages[0].Data, `Agent ${agent3} registered in Market`);

  const result4 = await market.send({ action: 'Register-Agent-Profile', fee: '1', agentId: agent4 });
  assert.equal(result4.Messages[0].Data, `Agent ${agent4} registered in Market`);
});

test('should eval token code', async () => {
  const result = await token.send({ action: 'Eval', data: token_code });
  assert.ifError(result.Error);
});

test('should transfer token', async () => {
  const transfer1 = await token.send({
    action: 'Transfer',
    recipient: MARKET_PROCESS_ID,
    quantity: '100',
    agentId: agentDelagator,
  });
  assert.ifError(transfer1.Error);
  const creditNotice1 = await market.sendResultMessage(creditNotice(transfer1));
  assert.ifError(creditNotice1.Error);
});

test('should register broadcast task', async () => {
  const result = await market.send({
    action: 'Register-Task',
    topic: 'chat',
    reward: '5',
    strategy: 'broadcast',
    agentId: agentDelagator,
  });
  assert.ifError(result.Error);
});

test('should list agents tasks', async () => {
  const result = await market.send({
    action: 'List-Agents',
  });
  const parsedResult = JSON.parse(result.Messages[0].Data);
  const agentInboxTasks1 = parsedResult.find((r) => r.id == agent1).tasks.inbox;
  const agentInboxTasks2 = parsedResult.find((r) => r.id == agent2).tasks.inbox;
  const agentInboxTasks3 = parsedResult.find((r) => r.id == agent3).tasks.inbox;
  const agentInboxTasks4 = parsedResult.find((r) => r.id == agent4).tasks.inbox;

  assert.equal(agentInboxTasks1['1234xyxfoo_ASIA_AGENTKA_1'].agentId, agent1);
  assert.equal(agentInboxTasks1['1234xyxfoo_ASIA_AGENTKA_1'].requesterId, agentDelagator);
  assert.equal(agentInboxTasks2['1234xyxfoo_ASIA_AGENTKA_2'].agentId, agent2);
  assert.equal(agentInboxTasks2['1234xyxfoo_ASIA_AGENTKA_2'].requesterId, agentDelagator);
  assert.equal(agentInboxTasks3['1234xyxfoo_ASIA_AGENTKA_3'].agentId, agent3);
  assert.equal(agentInboxTasks3['1234xyxfoo_ASIA_AGENTKA_3'].requesterId, agentDelagator);
  assert.equal(agentInboxTasks4['1234xyxfoo_ASIA_AGENTKA_4'].agentId, agent4);
  assert.equal(agentInboxTasks4['1234xyxfoo_ASIA_AGENTKA_4'].requesterId, agentDelagator);

  assert.ifError(result.Error);
});

test('should correctly send task results', async () => {
  await market.send({
    action: 'Send-Result',
    agentId: agent1,
    taskId: '1234xyxfoo_ASIA_AGENTKA_1',
    data: JSON.stringify('hey agent'),
  });
  const result = await market.send({
    action: 'List-Agents',
  });
  const parsedResult = JSON.parse(result.Messages[0].Data);
  const agentInboxTasks = parsedResult.find((r) => r.id == agent1).tasks.inbox;
  assert.equal(agentInboxTasks.length, 0);
});

test('should correctly load task results', async () => {
  const result = await market.send({
    action: 'Load-Next-Task-Result',
    agentId: agentDelagator,
  });
  assert.equal(JSON.parse(result.Messages[0].Data).result, 'hey agent');
});

function creditNotice(result) {
  const creditNotice = findByTag(result.Messages, 'Action', 'Credit-Notice');
  assert.equal(creditNotice.Target, MARKET_PROCESS_ID);

  creditNotice.Owner = TOKEN_PROCESS_ID;
  creditNotice.From = TOKEN_PROCESS_ID;
  return creditNotice;
}

function findByTag(messages, tag, value) {
  return messages.find((m) => m.Tags.find((t) => t.name === tag).value === value);
}
