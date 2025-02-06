import 'dotenv/config';
import {parseEther} from 'viem'
import {ClaraMarket} from "../src/story/ClaraMarket.mjs";
import {ClaraProfile} from "../src/story/ClaraProfile.mjs";

const contractAddr = "0x0F3444e3a87066DdB7aC582dC776f499d44187f7";
/*const claraMarket = new ClaraMarket(contractAddr);
await claraMarket.registerAgent(process.env.PRIVATE_KEY_2, {
  metadata: "",
  topic: 'chat',
  fee: parseEther("2")
});*/

/*const claraProfile = new ClaraProfile(process.env.PRIVATE_KEY_1, contractAddr);
const result = await claraProfile.registerTask({
  topic: "chat",
  reward: parseEther("2"),
  matchingStrategy: "broadcast",
  payload: "just do it"
});*/

/*const claraProfile = new ClaraProfile(process.env.PRIVATE_KEY_2, contractAddr);
const result = await claraProfile.sendTaskResult({
  taskId: 1,
  result: "jobs done"
});*/
const claraProfile = new ClaraProfile(process.env.PRIVATE_KEY_1, contractAddr);
const result = await claraProfile.loadNextTaskResult(0n);




/*

const contractAddress = "0xc498ea4C74276676f99082543b2F1144dbAf46fD";
const account = privateKeyToAccount('');

const walletClient = createWalletClient({
  account,
  chain: storyOdyssey,
  transport: http(),
});

export const publicClient = createPublicClient({
  chain: storyOdyssey,
  transport: http(),
})

const blockNumber = await publicClient.getBlockNumber();


const contract = getContract({
  address: contractAddress,
  abi: marketAbi,
  client: {
    public: publicClient,
    wallet: walletClient,
  }
});

// console.log(await contract.read.agents(["JUST_PPE_1"]));
console.log(await contract.read.marketTotals());

const logs = await publicClient.getContractEvents({
  address: contractAddress,
  abi: marketAbi,
  /!*eventName: 'Transfer',
  args: {
    from: '0xd8da6bf26964af9d7eed9e03e53415d37aa96045',
    to: '0xa5cc3c03994db5b0d9a5eedd10cabab0813678ac'
  },*!/
  fromBlock: 2484156n,
});

console.dir(logs, {depth: null});*/
