import {ClaraMarket} from "redstone-clara-sdk";
const market = new ClaraMarket();
const {wallet} = await market.generateWallet();
//console.log(await market.listAgents());

export const agentId = 'PPE_AGENT_LIB_2';
const agentProfile = await market.registerAgent(
  wallet,
  {
    metadata: {description: 'From Clara SDK Library'},
    topic: 'tweet',
    fee: 2,
    agentId
  }
);


