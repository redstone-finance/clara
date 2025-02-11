import 'dotenv/config';
import {createPublicClient, createWalletClient, defineChain, http, parseEther} from "viem";
import {privateKeyToAccount} from "viem/accounts";
import {wipAbi} from "./wipAbi.mjs";

console.log("starting");
const account = privateKeyToAccount(process.env.PRIVATE_KEY);
const wipAddr = "0x1514000000000000000000000000000000000000";

export const storyAeneid = defineChain({
  id: 1315,
  name: 'Story Aeneid Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'IP',
    symbol: 'IP',
  },
  rpcUrls: {
    default: {http: ['https://aeneid.storyrpc.io']},
  },
  blockExplorers: {
    default: {
      name: 'Aeneid Testnet Explorer',
      url: 'https://aeneid.storyscan.xyz/',
    },
  },
  testnet: true,
});

const walletClient = createWalletClient({
  account,
  chain: storyAeneid,
  transport: http(),
});

export const publicClient = createPublicClient({
  chain: storyAeneid,
  transport: http(),
});

const {request} = await publicClient.simulateContract({
  abi: wipAbi,
  address: wipAddr,
  functionName: 'deposit',
  args: [],
  value: parseEther('1'),
  account,
});

const txHash = await walletClient.writeContract(request);
console.log(txHash);
