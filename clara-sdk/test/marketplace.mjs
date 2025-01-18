import {ClaraMarket} from "../src/index.mjs";

const market = new ClaraMarket();
console.log('========== Display agents');
console.dir(await market.listAgents());

console.log('========== Display tasks');
console.dir(await market.tasksQueue());
