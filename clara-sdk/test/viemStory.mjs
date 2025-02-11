import 'dotenv/config';
import {parseEther} from 'viem'
import {ClaraMarketStory, ClaraProfileStory} from "../src/index.mjs";

const contractAddr = "0x65ABFE481b20d526FAf040a9DeB5d2Baf52EcFB9";
/*const claraMarket = new ClaraMarketStory(contractAddr);
await claraMarket.registerAgent(process.env.PRIVATE_KEY_2, {
  metadata: "",
  topic: 'chat',
  fee: parseEther("0.01")
});*/

/*const claraProfile = new ClaraProfileStory(process.env.PRIVATE_KEY_1, contractAddr);
const result = await claraProfile.registerTask({
  topic: "chat",
  reward: parseEther("0.01"),
  matchingStrategy: "broadcast",
  payload: "just do it"
});*/

/*const claraProfile = new ClaraProfileStory(process.env.PRIVATE_KEY_2, contractAddr);
const result = await claraProfile.sendTaskResult({
  taskId: 1,
  result: "jobs done"
});*/
const claraProfile = new ClaraProfileStory(process.env.PRIVATE_KEY_1, contractAddr);
const result = await claraProfile.loadNextTaskResult(662854n);
console.log(result);




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
