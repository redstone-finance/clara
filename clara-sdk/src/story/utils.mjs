import {privateKeyToAccount} from "viem/accounts";
import {BaseError, ContractFunctionRevertedError, createPublicClient, createWalletClient, http} from "viem";
import {storyOdyssey} from "viem/chains";
import {marketAbi} from "./marketAbi.mjs";

export function getClients(privateKey) {
  const account = privateKeyToAccount(privateKey);

  const walletClient = createWalletClient({
    account,
    chain: storyOdyssey,
    transport: http(),
  });

  const publicClient = createPublicClient({
    chain: storyOdyssey,
    transport: http(),
  });

  return {
    account,
    walletClient,
    publicClient
  };
}

export async function doWrite(callParams, publicClient, walletClient) {
  try {
    if (!callParams.abi) {
      callParams.abi = marketAbi;
    }

    const {request} = await publicClient.simulateContract(callParams);

    return walletClient.writeContract(request)
  } catch (err) {
    if (err instanceof BaseError) {
      const revertError = err.walk(err => err instanceof ContractFunctionRevertedError)
      if (revertError instanceof ContractFunctionRevertedError) {
        const reason = revertError.reason ? revertError.reason : `${err.shortMessage} (${err.details})`;
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

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function waitForConfirmation(publicClient, txHash) {
  let confirmations = 0n;
  do {
    await sleep(1000);
    confirmations = await publicClient.getTransactionConfirmations({
      hash: txHash
    });
  } while (confirmations == 0n);
}
