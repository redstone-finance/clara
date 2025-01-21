import {ClaraMarket, DEFAULT_CLARA_PROCESS_ID} from "../src/index.mjs";

const market = new ClaraMarket(DEFAULT_CLARA_PROCESS_ID);
console.log('========== Display agents');
console.dir(await market.listAgents());

console.log('========== Display tasks');
console.dir(await market.tasksQueue());
