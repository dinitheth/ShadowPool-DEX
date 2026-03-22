/**
 * Fhenix CoFHE SDK integration
 * Uses cofhejs@0.3.1-alpha.0 for FHE encryption/decryption on Sepolia.
 *
 * Balance caching strategy:
 * - On first successful decrypt → save raw bigint to localStorage
 * - On subsequent page loads → show cached balance immediately
 * - Decrypt attempts happen in background → update cache if successful
 * - If decrypt fails (404) → return cached value instead of null
 * - User only needs to "Reveal" (sign permit) ONCE ever
 */
import { cofhejs, Encryptable, FheTypes } from "cofhejs/web";
import init from "tfhe";

// Singleton state
let isInitialized = false;
let isInitializing = false;
let tfhePreInitDone = false;

// ─── localStorage Balance Cache ────────────────────────────

const BALANCE_CACHE_PREFIX = "fhenix_bal_";
const PERMIT_CACHE_PREFIX = "fhenix_permit_";

/** Save the raw decrypted balance (bigint as string) to localStorage */
export function cacheBalance(address: string, rawBigint: bigint): void {
  try {
    const key = BALANCE_CACHE_PREFIX + address.toLowerCase();
    localStorage.setItem(key, rawBigint.toString());
    console.log("[Fhenix] Balance cached for", address, "=", rawBigint.toString());
  } catch { /* localStorage may be unavailable */ }
}

/** Get the cached raw balance (as bigint), or null if not cached */
export function getCachedBalance(address: string): bigint | null {
  try {
    const key = BALANCE_CACHE_PREFIX + address.toLowerCase();
    const val = localStorage.getItem(key);
    if (val != null) return BigInt(val);
  } catch { /* ignore */ }
  return null;
}

/** Mark that a permit has been signed for this address (so we don't show "Reveal" again) */
export function markPermitSigned(address: string): void {
  try {
    const key = PERMIT_CACHE_PREFIX + address.toLowerCase();
    localStorage.setItem(key, Date.now().toString());
  } catch { /* ignore */ }
}

/** Check if user has ever signed a permit (even if the in-memory permit is gone) */
export function hasEverSignedPermit(address: string): boolean {
  try {
    const key = PERMIT_CACHE_PREFIX + address.toLowerCase();
    return localStorage.getItem(key) != null;
  } catch { return false; }
}

/** Update cached balance by a delta (e.g., after mint/trade without re-decrypting) */
export function adjustCachedBalance(address: string, delta: bigint): void {
  const cached = getCachedBalance(address);
  if (cached != null) {
    const newBalance = cached + delta;
    cacheBalance(address, newBalance < 0n ? 0n : newBalance);
  }
}

// ─── TFHE WASM Pre-init ────────────────────────────────────

async function preInitTfhe(): Promise<void> {
  if (tfhePreInitDone) return;
  try {
    await init("/tfhe_bg.wasm");
    tfhePreInitDone = true;
    console.log("[Fhenix] TFHE WASM pre-initialized successfully");
  } catch (err: any) {
    if (err?.message?.includes("already been initialized") || err?.message?.includes("wasm !== undefined")) {
      tfhePreInitDone = true;
      console.log("[Fhenix] TFHE WASM was already initialized");
    } else {
      console.error("[Fhenix] TFHE WASM pre-init failed:", err);
      throw err;
    }
  }
}

// ─── Encrypted Input Type ──────────────────────────────────

export interface EncryptedInput {
  ctHash: bigint;
  securityZone: number;
  utype: number;
  signature: string;
}

// ─── SDK Initialization ────────────────────────────────────

export async function initCofheClient(publicClient: any, walletClient: any) {
  if (isInitialized || isInitializing) return;
  isInitializing = true;

  try {
    console.log("[Fhenix] Initializing cofhejs with TESTNET environment...");

    // Step 1: Pre-init WASM
    await preInitTfhe();

    // Step 2: Initialize cofhejs
    const result = await cofhejs.initializeWithViem({
      viemClient: publicClient,
      viemWalletClient: walletClient,
      environment: "TESTNET",
      ignoreErrors: true,
      generatePermit: false,
    });

    if (result.success) {
      isInitialized = true;
      console.log("[Fhenix] cofhejs initialized successfully");
    } else {
      const err = result.error as any;
      console.error("[Fhenix] cofhejs init failed:", err?.message || err?.code || err);
    }
  } catch (error: any) {
    console.error("[Fhenix] cofhejs init exception:", error?.message || error);
  }
  isInitializing = false;
}

export function getCofheClient() {
  return isInitialized ? cofhejs : null;
}

// ─── Encryption Functions ──────────────────────────────────

export async function encryptOrderInputs(
  priceVal: bigint,
  amountVal: bigint,
  isLong: boolean
): Promise<[EncryptedInput, EncryptedInput, EncryptedInput]> {
  if (!isInitialized) throw new Error("[Fhenix] cofhejs not initialized.");

  const result = await cofhejs.encrypt([
    Encryptable.uint64(priceVal),
    Encryptable.uint64(amountVal),
    Encryptable.bool(isLong),
  ]);

  if (!result.success) throw new Error(`[Fhenix] encrypt failed: ${result.error}`);
  return result.data as [EncryptedInput, EncryptedInput, EncryptedInput];
}

export async function encryptUint64(value: bigint): Promise<EncryptedInput> {
  if (!isInitialized) throw new Error("[Fhenix] cofhejs not initialized.");
  const result = await cofhejs.encrypt([Encryptable.uint64(value)]);
  if (!result.success) throw new Error(`[Fhenix] encrypt failed: ${result.error}`);
  return result.data[0] as EncryptedInput;
}

export async function encryptBool(value: boolean): Promise<EncryptedInput> {
  if (!isInitialized) throw new Error("[Fhenix] cofhejs not initialized.");
  const result = await cofhejs.encrypt([Encryptable.bool(value)]);
  if (!result.success) throw new Error(`[Fhenix] encrypt failed: ${result.error}`);
  return result.data[0] as EncryptedInput;
}

// ─── Decryption with Cache Fallback ────────────────────────

/**
 * Decrypt an encrypted value using cofhejs.unseal().
 *
 * Strategy:
 *   1. If no permit → check if user has EVER signed one (localStorage)
 *      - If yes, try to re-create permit silently
 *      - If no, return "NeedsPermit" (first time ever)
 *   2. Try unseal → if success, cache balance, return value
 *   3. If unseal fails (404) → return cached balance if available
 *   4. If no cache → return "NeedsPermit" so user can try Reveal
 *
 * @param userAddress - The connected user's address (for caching)
 */
export async function decryptValue(
  ctHash: bigint | string,
  utype: number,
  userAddress?: string,
): Promise<bigint | boolean | null | "NeedsPermit"> {
  if (!isInitialized) {
    // Not initialized — try returning cached balance
    if (userAddress) {
      const cached = getCachedBalance(userAddress);
      if (cached != null) return cached;
    }
    return null;
  }

  // Check if we have an active permit
  const permitResult = cofhejs.getPermit();
  if (!permitResult.success) {
    // No in-memory permit. If user has ever signed one, return cached balance
    if (userAddress && hasEverSignedPermit(userAddress)) {
      const cached = getCachedBalance(userAddress);
      if (cached != null) {
        console.log("[Fhenix] No active permit but have cached balance, returning cached");
        return cached;
      }
    }
    return "NeedsPermit";
  }

  // Try to unseal with retries (server is flaky, 404 intermittent)
  const ctHashBigInt = typeof ctHash === "string" ? BigInt(ctHash) : ctHash;
  const MAX_RETRIES = 3;
  
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const result = await cofhejs.unseal(ctHashBigInt, utype);

      if (result.success) {
        const value = (result as any).data;
        if (userAddress && typeof value === "bigint") {
          cacheBalance(userAddress, value);
        }
        console.log("[Fhenix] unseal succeeded on attempt", attempt);
        return value;
      }

      console.warn(`[Fhenix] unseal attempt ${attempt}/${MAX_RETRIES} failed`);
    } catch (err: any) {
      console.warn(`[Fhenix] unseal attempt ${attempt}/${MAX_RETRIES} error:`, err?.message || err);
    }

    // Wait before retrying (except on last attempt)
    if (attempt < MAX_RETRIES) {
      await new Promise(r => setTimeout(r, 2000));
    }
  }

  // All retries failed — return cached balance if available
  if (userAddress) {
    const cached = getCachedBalance(userAddress);
    if (cached != null) {
      console.log("[Fhenix] All unseal attempts failed. Returning cached balance:", cached.toString());
      return cached;
    }
  }

  return null;
}

// ─── Permit Management ─────────────────────────────────────

/**
 * Request a Fhenix self-permit (triggers MetaMask signature).
 * Called from the "Reveal" button. Only needed ONCE — the balance
 * is cached in localStorage after the first successful decrypt.
 */
export async function requestFhenixPermit(userAddress?: string): Promise<boolean> {
  if (!isInitialized) throw new Error("cofhejs not initialized yet");

  try {
    // Remove any old permit
    try {
      const existing = cofhejs.getPermit();
      if (existing.success) {
        cofhejs.removePermit(existing.data.getHash(), true);
      }
    } catch { /* ignore */ }

    // Create a fresh permit — triggers MetaMask EIP-712 signature
    const result = await cofhejs.createPermit({
      type: "self",
    } as any);

    if (!result.success) {
      console.error("[Fhenix] createPermit failed:", result.error);
      return false;
    }

    // Mark that this user has signed a permit (persists across refreshes)
    if (userAddress) {
      markPermitSigned(userAddress);
    }

    console.log("[Fhenix] Self-permit created successfully");
    return true;
  } catch (err) {
    console.error("[Fhenix] requestFhenixPermit error:", err);
    return false;
  }
}

export { FheTypes, Encryptable };
