import {
  BaseError,
  ContractFunctionRevertedError,
  createPublicClient,
  createWalletClient,
  custom,
  http,
} from "viem";
import { marketAbi } from "./marketAbi.mjs";

export function determineTransport() {
  return globalThis.ethereum ? custom(globalThis.ethereum) : http();
}

export function getClients(account, chain, transport) {
  const walletClient = createWalletClient({
    account,
    chain,
    transport,
  });

  const publicClient = createPublicClient({
    chain,
    transport,
  });

  return {
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
      const revertError = err.walk(
        (err) => err instanceof ContractFunctionRevertedError,
      );
      if (revertError instanceof ContractFunctionRevertedError) {
        const reason = revertError.reason
          ? revertError.reason
          : `${err.shortMessage} (${err.details})`;
        throw new Error("Action reverted:" + reason);
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

export function explorerUrl(chain) {
  return chain.blockExplorers.default.url;
}
