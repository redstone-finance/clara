import {
  BaseError,
  ContractFunctionRevertedError,
  createPublicClient,
  createWalletClient,
  custom,
  hexToString,
  http,
  stringToHex,
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
        throw revertError;
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

export function toBytes32Hex(val) {
  return stringToHex(val, { size: 32 });
}

export function fromBytes32Hex(val) {
  return hexToString(val, { size: 32 });
}
