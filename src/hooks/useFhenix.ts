import { useState, useCallback } from "react";
import { useAccount, useWriteContract, useReadContract, useWaitForTransactionReceipt } from "wagmi";
import { useQuery } from "@tanstack/react-query";
import {
  SHADOW_POOL_ADDRESS,
  SHADOW_POOL_ABI,
  ENCRYPTED_ERC20_ADDRESS,
  ENCRYPTED_ERC20_ABI,
} from "@/lib/wallet-config";
import { encryptOrderInputs, encryptUint64, decryptValue, getCofheClient, getCachedBalance, adjustCachedBalance, cacheBalance, FheTypes } from "@/lib/fhenix";

// ─── Order Submission ──────────────────────────────────────

export const useSubmitOrder = () => {
  const { writeContractAsync, data: hash, isPending: isWritePending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });
  const [isEncrypting, setIsEncrypting] = useState(false);

  const submitOrder = useCallback(
    async (priceVal: bigint, amountVal: bigint, isLong: boolean) => {
      try {
        setIsEncrypting(true);
        const [encPrice, encAmount, encIsLong] = await encryptOrderInputs(priceVal, amountVal, isLong);
        setIsEncrypting(false);

        await writeContractAsync({
          address: SHADOW_POOL_ADDRESS,
          abi: SHADOW_POOL_ABI,
          functionName: "submitOrder",
          args: [encPrice as any, encAmount as any, encIsLong as any],
          gas: 15_000_000n,
        });
      } catch (err) {
        setIsEncrypting(false);
        throw err;
      }
    },
    [writeContractAsync]
  );

  const isPending = isEncrypting || isWritePending;
  return { submitOrder, hash, isPending, isConfirming, isSuccess, error };
};

// ─── Cancel Order ──────────────────────────────────────────

export const useCancelOrder = () => {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const cancelOrder = useCallback(
    (orderId: bigint) => {
      writeContract({
        address: SHADOW_POOL_ADDRESS,
        abi: SHADOW_POOL_ABI,
        functionName: "cancelOrder",
        args: [orderId],
      } as any);
    },
    [writeContract]
  );

  return { cancelOrder, hash, isPending, isConfirming, isSuccess, error };
};

// ─── Close Position ────────────────────────────────────────

export const useClosePosition = () => {
  const { writeContractAsync, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const closePosition = useCallback(
    async (orderId: bigint) => {
      await writeContractAsync({
        address: SHADOW_POOL_ADDRESS,
        abi: SHADOW_POOL_ABI,
        functionName: "closePosition",
        args: [orderId],
        gas: 500_000n,
      });
    },
    [writeContractAsync]
  );

  return { closePosition, hash, isPending, isConfirming, isSuccess, error };
};


// ─── Deposit Margin ────────────────────────────────────────

export const useDepositMargin = () => {
  const { writeContractAsync, data: hash, isPending: isWritePending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });
  const [isEncrypting, setIsEncrypting] = useState(false);

  const depositMargin = useCallback(
    async (amount: bigint) => {
      try {
        setIsEncrypting(true);
        const encAmount = await encryptUint64(amount);
        setIsEncrypting(false);

        await writeContractAsync({
          address: SHADOW_POOL_ADDRESS,
          abi: SHADOW_POOL_ABI,
          functionName: "depositMargin",
          args: [encAmount as any],
        });
      } catch (err) {
        setIsEncrypting(false);
        throw err;
      }
    },
    [writeContractAsync]
  );

  const isPending = isEncrypting || isWritePending;
  return { depositMargin, hash, isPending, isConfirming, isSuccess, error };
};

// ─── USDC Faucet ───────────────────────────────────────────

export const useClaimFaucet = (userAddress?: `0x${string}`) => {
  const { writeContractAsync, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const claimFaucet = useCallback(async () => {
    await writeContractAsync({
      address: ENCRYPTED_ERC20_ADDRESS,
      abi: ENCRYPTED_ERC20_ABI,
      functionName: "claimFaucet",
      gas: 15_000_000n,
    });
    // Auto-update cached balance: faucet gives 10,000 USDC = 10_000_000_000 raw (6 decimals)
    if (userAddress) {
      const FAUCET_AMOUNT = 10_000_000_000n; // 10,000 USDC
      adjustCachedBalance(userAddress, FAUCET_AMOUNT);
      console.log("[Fhenix] Cached balance adjusted +10,000 USDC after faucet claim");
    }
  }, [writeContractAsync, userAddress]);

  return { claimFaucet, hash, isPending, isConfirming, isSuccess, error };
};

export const useFaucetCooldown = (userAddress: `0x${string}` | undefined) => {
  return useReadContract({
    address: ENCRYPTED_ERC20_ADDRESS,
    abi: ENCRYPTED_ERC20_ABI,
    functionName: "faucetCooldownRemaining",
    args: userAddress ? [userAddress] : undefined,
    query: { enabled: !!userAddress, refetchInterval: 30000 },
  });
};

export const useEncryptedBalance = (userAddress: `0x${string}` | undefined, publicClient: any) => {
  return useQuery({
    queryKey: ["encryptedBalance", userAddress],
    enabled: !!userAddress && !!publicClient,
    refetchInterval: (query) => {
      const data = query.state.data;
      // Don't auto-poll if permit needed
      if (data === "NeedsPermit") return false;
      // Poll every 60s to try background refresh
      return 60000;
    },
    retry: false,
    staleTime: 15000,
    queryFn: async () => {
      // Step 1: Check localStorage cache first — instant display
      if (userAddress) {
        const cached = getCachedBalance(userAddress);
        if (cached != null) {
          const bal = Number(cached) / 1e6;
          const formatted = bal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
          
          // Try background decrypt to refresh cache (don't block on it)
          tryBackgroundDecrypt(userAddress, publicClient).catch(() => {});
          
          return formatted;
        }
      }

      // Step 2: No cache — try live decrypt
      const balanceHandle = await publicClient.readContract({
        address: ENCRYPTED_ERC20_ADDRESS,
        abi: ENCRYPTED_ERC20_ABI as any,
        functionName: "balanceOf",
        args: [userAddress],
      });

      const ZERO_BYTES32 = "0x0000000000000000000000000000000000000000000000000000000000000000";
      if (
        !balanceHandle ||
        balanceHandle === ZERO_BYTES32 ||
        balanceHandle === 0n ||
        BigInt(balanceHandle as any) === 0n
      ) {
        return "0.00";
      }

      const client = getCofheClient();
      if (!client) throw new Error("CofHE Client not initialized yet");

      const decrypted = await decryptValue(balanceHandle, FheTypes.Uint64, userAddress);
      if (decrypted === "NeedsPermit") {
        return "NeedsPermit";
      }
      if (decrypted === null || typeof decrypted !== "bigint") {
        // Check if we have cached from a previous session
        if (userAddress && getCachedBalance(userAddress) != null) {
          const cached = getCachedBalance(userAddress)!;
          const bal = Number(cached) / 1e6;
          return bal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        }
        return "NeedsPermit";
      }

      const bal = Number(decrypted) / 1e6;
      return bal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    },
  });
};

/** Background decrypt attempt — updates cache silently without blocking UI */
async function tryBackgroundDecrypt(userAddress: string, publicClient: any): Promise<void> {
  try {
    const client = getCofheClient();
    if (!client) return;

    const balanceHandle = await publicClient.readContract({
      address: ENCRYPTED_ERC20_ADDRESS,
      abi: ENCRYPTED_ERC20_ABI as any,
      functionName: "balanceOf",
      args: [userAddress],
    });

    const ZERO_BYTES32 = "0x0000000000000000000000000000000000000000000000000000000000000000";
    if (!balanceHandle || balanceHandle === ZERO_BYTES32 || BigInt(balanceHandle as any) === 0n) return;

    const decrypted = await decryptValue(balanceHandle, FheTypes.Uint64, userAddress);
    if (typeof decrypted === "bigint") {
      console.log("[Fhenix] Background decrypt succeeded, cache updated");
    }
  } catch {
    // Silent failure — cache stays as-is
  }
}

// ─── Mint Test Tokens ──────────────────────────────────────

export const useMintTestTokens = () => {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const mint = useCallback(
    (amount: number) => {
      writeContract({
        address: ENCRYPTED_ERC20_ADDRESS,
        abi: ENCRYPTED_ERC20_ABI,
        functionName: "mint",
        args: [BigInt(amount)],
      } as any);
    },
    [writeContract]
  );

  return { mint, hash, isPending, isConfirming, isSuccess, error };
};

// ─── Read Hooks ────────────────────────────────────────────

export const useOrderCount = () => {
  return useReadContract({
    address: SHADOW_POOL_ADDRESS,
    abi: SHADOW_POOL_ABI,
    functionName: "orderCount",
  });
};

export const useMatchCount = () => {
  return useReadContract({
    address: SHADOW_POOL_ADDRESS,
    abi: SHADOW_POOL_ABI,
    functionName: "matchCount",
  });
};

export const useTraderOrders = (trader: `0x${string}` | undefined) => {
  return useReadContract({
    address: SHADOW_POOL_ADDRESS,
    abi: SHADOW_POOL_ABI,
    functionName: "getTraderOrders",
    args: trader ? [trader] : undefined,
    query: { enabled: !!trader },
  });
};

export const useOrder = (orderId: bigint | undefined) => {
  return useReadContract({
    address: SHADOW_POOL_ADDRESS,
    abi: SHADOW_POOL_ABI,
    functionName: "orders",
    args: orderId !== undefined ? [orderId] : undefined,
    query: { enabled: orderId !== undefined },
  });
};

export const useIsOrderClosed = (orderId: bigint | undefined) => {
  return useReadContract({
    address: SHADOW_POOL_ADDRESS,
    abi: SHADOW_POOL_ABI,
    functionName: "isOrderClosed",
    args: orderId !== undefined ? [orderId] : undefined,
    query: { enabled: orderId !== undefined },
  });
};

export const useMatch = (matchId: bigint | undefined) => {
  return useReadContract({
    address: SHADOW_POOL_ADDRESS,
    abi: SHADOW_POOL_ABI,
    functionName: "matches",
    args: matchId !== undefined ? [matchId] : undefined,
    query: { enabled: matchId !== undefined },
  });
};

export const usePosition = (trader: `0x${string}` | undefined) => {
  return useReadContract({
    address: SHADOW_POOL_ADDRESS,
    abi: SHADOW_POOL_ABI,
    functionName: "positions",
    args: trader ? [trader] : undefined,
    query: { enabled: !!trader },
  });
};

export const useTokenTotalSupply = () => {
  return useReadContract({
    address: ENCRYPTED_ERC20_ADDRESS,
    abi: ENCRYPTED_ERC20_ABI,
    functionName: "totalSupply",
  });
};

// ─── Settlement Hooks (Owner) ──────────────────────────────

export const useSettlePosition = () => {
  const { writeContractAsync, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const settlePosition = useCallback(
    async (orderId: bigint, pnlAmount: bigint, isProfit: boolean) => {
      await writeContractAsync({
        address: SHADOW_POOL_ADDRESS,
        abi: SHADOW_POOL_ABI,
        functionName: "settlePosition",
        args: [orderId, pnlAmount, isProfit],
        gas: 500_000n,
      } as any);
    },
    [writeContractAsync]
  );

  return { settlePosition, hash, isPending, isConfirming, isSuccess, error };
};

export const useFundPool = () => {
  const { writeContractAsync, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const fundPool = useCallback(
    async (amount: bigint) => {
      await writeContractAsync({
        address: SHADOW_POOL_ADDRESS,
        abi: SHADOW_POOL_ABI,
        functionName: "fundPool",
        args: [amount],
        gas: 500_000n,
      } as any);
    },
    [writeContractAsync]
  );

  return { fundPool, hash, isPending, isConfirming, isSuccess, error };
};

export const usePoolBalance = () => {
  return useReadContract({
    address: SHADOW_POOL_ADDRESS,
    abi: SHADOW_POOL_ABI,
    functionName: "poolBalance",
    query: { refetchInterval: 15_000 },
  });
};

export const useIsOrderSettled = (orderId: bigint | undefined) => {
  return useReadContract({
    address: SHADOW_POOL_ADDRESS,
    abi: SHADOW_POOL_ABI,
    functionName: "isOrderSettled",
    args: orderId !== undefined ? [orderId] : undefined,
    query: { enabled: orderId !== undefined },
  });
};
