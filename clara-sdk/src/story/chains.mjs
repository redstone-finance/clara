import { defineChain } from "viem";

// TODO: replace with a definition from viem, when the fix https://github.com/wevm/viem/commit/559d962abec866c4026e71a914049e02849549fb
// will be released
export const storyMainnet = defineChain({
  id: 1514,
  name: "Story",
  nativeCurrency: {
    decimals: 18,
    name: "IP Token",
    symbol: "IP",
  },
  rpcUrls: {
    default: { http: ["https://mainnet.storyrpc.io"] },
  },
  blockExplorers: {
    default: {
      name: "Story explorer",
      url: "https://storyscan.xyz",
      apiUrl: "https://storyscan.xyz/api/v2",
    },
  },
  testnet: false,
});

export const storyAeneid = defineChain({
  id: 1315,
  name: "Story Aeneid",
  network: "story-aeneid",
  nativeCurrency: {
    decimals: 18,
    name: "IP",
    symbol: "IP",
  },
  rpcUrls: {
    default: { http: ["https://aeneid.storyrpc.io"] },
  },
  blockExplorers: {
    default: {
      name: "Story Aeneid Explorer",
      url: "https://aeneid.storyscan.xyz",
    },
  },
  contracts: {
    multicall3: {
      address: "0xca11bde05977b3631167028862be2a173976ca11",
      blockCreated: 1792,
    },
  },
  testnet: true,
});
