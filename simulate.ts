import { createPublicClient, http, encodeFunctionData } from 'viem';
import { sepolia } from 'viem/chains';
import { SHADOW_POOL_ADDRESS, SHADOW_POOL_ABI } from './src/lib/wallet-config.js';
import { createCofheConfig, createCofheClient } from '@cofhe/sdk/node';
import { chains } from '@cofhe/sdk/chains';
import { Encryptable } from '@cofhe/sdk';

async function main() {
  console.log("Starting simulation...");
  try {
    const config = createCofheConfig({
      supportedChains: [chains.sepolia],
    });
    const cofheClient = createCofheClient(config);
    console.log("CoFHE client created");

    const publicClient = createPublicClient({
      chain: sepolia,
      transport: http()
    });
    console.log("Public client created");

    // We can use any valid Sepolia sender
    const SENDER = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"; // vitalik.eth

    // We pass a dummy wallet client just to satisfy connect
    const walletClient = {
      getAddresses: async () => [SENDER]
    };
    await cofheClient.connect(publicClient, walletClient as any);
    console.log("CoFHE client connected");

    const priceVal = 6900000n; // $69,000 * 100
    const amountVal = 1000000n; // 1 * 1e6
    const isLong = true;

    const [encPrice, encAmount, encIsLong] = await cofheClient
      .encryptInputs([
        Encryptable.uint64(priceVal),
        Encryptable.uint64(amountVal),
        Encryptable.bool(isLong)
      ])
      .execute();
      
    console.log("Encrypted values:", encPrice, encAmount, encIsLong);

    // Simulate the transaction
    console.log("Simulating contract call to address:", SHADOW_POOL_ADDRESS);
    
    const { request, result } = await publicClient.simulateContract({
      account: SENDER,
      address: SHADOW_POOL_ADDRESS as `0x${string}`,
      abi: SHADOW_POOL_ABI,
      functionName: "submitOrder",
      args: [encPrice, encAmount, encIsLong],
    });

    console.log("Simulation SUCCESS!");
    console.log(result);

  } catch (err: any) {
    console.error("Simulation FAILED!");
    console.error(err.shortMessage || err.message);
    if (err.cause) {
      console.error("Cause:", err.cause.message);
    }
    if (err.metaMessages) {
      console.error(...err.metaMessages);
    }
  }
}

main();
