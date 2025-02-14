import "dotenv/config"
import { createPublicClient, createWalletClient, defineChain, http, parseEther } from "viem"
import { privateKeyToAccount } from "viem/accounts"
import { wipAbi } from "./wipAbi.mjs"

console.log("starting")
const account = privateKeyToAccount(process.env.PRIVATE_KEY)
const wipAddr = "0x1514000000000000000000000000000000000000"

export const storyChain = defineChain({
    id: 1514,
    name: "Story",
    nativeCurrency: {
        decimals: 18,
        name: "IP",
        symbol: "IP",
    },
    rpcUrls: {
        default: { http: ["https://mainnet.storyrpc.io"] },
    },
    blockExplorers: {
        default: {
            name: "Story Mainnet Explorer",
            url: "https://storyscan.xyz/",
        },
    },
    testnet: false,
})

const walletClient = createWalletClient({
    account,
    chain: storyChain,
    transport: http(),
})

export const publicClient = createPublicClient({
    chain: storyChain,
    transport: http(),
})

const { request } = await publicClient.simulateContract({
    abi: wipAbi,
    address: wipAddr,
    functionName: "deposit",
    args: [],
    value: parseEther("0.05"),
    account,
})

const txHash = await walletClient.writeContract(request)
console.log(txHash)
