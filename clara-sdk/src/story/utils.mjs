import { privateKeyToAccount } from 'viem/accounts';
import {
  BaseError,
  ContractFunctionRevertedError,
  createPublicClient,
  createWalletClient,
  defineChain,
  http,
} from 'viem';
import { marketAbi } from './marketAbi.mjs';

export const storyChain = defineChain({
  id: 1514,
  name: 'Story',
  nativeCurrency: {
    decimals: 18,
    name: 'IP',
    symbol: 'IP',
  },
  rpcUrls: {
    default: { http: ['https://mainnet.storyrpc.io'] },
  },
  blockExplorers: {
    default: {
      name: 'Story Mainnet Explorer',
      url: 'https://storyscan.xyz/',
    },
  },
  testnet: false,
});

export function getClients(privateKey) {
  const account = privateKeyToAccount(privateKey);

  const walletClient = createWalletClient({
    account,
    chain: storyChain,
    transport: http(),
  });

  const publicClient = createPublicClient({
    chain: storyChain,
    transport: http(),
  });

  return {
    account,
    walletClient,
    publicClient,
  };
}

export async function doWrite(callParams, publicClient, walletClient) {
  try {
    if (!callParams.abi) {
      callParams.abi = marketAbi;
    }

    const { request } = await publicClient.simulateContract(callParams);

    return walletClient.writeContract(request);
  } catch (err) {
    if (err instanceof BaseError) {
      const revertError = err.walk((err) => err instanceof ContractFunctionRevertedError);
      if (revertError instanceof ContractFunctionRevertedError) {
        const reason = revertError.reason ? revertError.reason : `${err.shortMessage} (${err.details})`;
        throw new Error('Action reverted:' + reason);
      }
    }
    throw err;
  }
}

export async function doRead(callParams, publicClient) {
  return publicClient.readContract({
    ...callParams,
    abi: marketAbi,
  });
}

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function waitForConfirmation(publicClient, txHash) {
  let confirmations = 0n;
  do {
    await sleep(1000);
    confirmations = await publicClient.getTransactionConfirmations({
      hash: txHash,
    });
  } while (confirmations == 0n);
}
