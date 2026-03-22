import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Shield, Zap, CheckCircle2, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/ToastNotification";
import { useAccount, usePublicClient } from "wagmi";
import EncryptionAnimation from "@/components/trading/EncryptionAnimation";
import { useSubmitOrder, useEncryptedBalance } from "@/hooks/useFhenix";
import { useMarketData } from "@/hooks/useMarketData";
import { getCofheClient, decryptValue, FheTypes, requestFhenixPermit } from "@/lib/fhenix";
import { ENCRYPTED_ERC20_ADDRESS, ENCRYPTED_ERC20_ABI } from "@/lib/wallet-config";

interface TradingPair {
  symbol: string;
  label: string;
  tvSymbol: string;
}

interface TradeFormProps {
  activePair: TradingPair;
}

const LEVERAGE_MARKS = [1, 2, 5, 10, 20, 50];

const TradeForm = ({ activePair }: TradeFormProps) => {
  const [side, setSide] = useState<"long" | "short">("long");
  const [orderType, setOrderType] = useState<"market" | "limit">("market");
  const [price, setPrice] = useState("");
  const [amount, setAmount] = useState("");
  const [leverage, setLeverage] = useState(5);
  const [tpPrice, setTpPrice] = useState("");
  const [slPrice, setSlPrice] = useState("");
  const [showEncryptionAnim, setShowEncryptionAnim] = useState(false);
  const [txSuccess, setTxSuccess] = useState(false);
  const [balanceRefreshKey, setBalanceRefreshKey] = useState(0);
  const { address, isConnected } = useAccount();
  const { submitOrder, isPending, isConfirming, isSuccess, error } = useSubmitOrder();
  const { showToast } = useToast();
  const publicClient = usePublicClient();
  
  const marketData = useMarketData(activePair.label);
  
  // Use the robust React Query hook for encrypted balance
  const { data: availableBalance, isLoading: isBalanceLoading, refetch: refetchBalance } = useEncryptedBalance(
    address,
    publicClient
  );

  // Auto-refetch when user forces a refresh
  useEffect(() => {
    if (balanceRefreshKey > 0) refetchBalance();
  }, [balanceRefreshKey, refetchBalance]);

  // Refetch explicitly after a successful trade submission
  useEffect(() => {
    if (isSuccess) {
      setTimeout(() => refetchBalance(), 1500);
      setTimeout(() => refetchBalance(), 4000); // Check again to catch block inclusion
    }
  }, [isSuccess, refetchBalance]);

  const handleRevealBalance = async () => {
    try {
      await requestFhenixPermit(address);
      // Small delay to let the permit propagate, then refetch
      setTimeout(() => refetchBalance(), 500);
    } catch (e: any) {
      console.error(e);
      showToast(`Permit Rejected: ${e?.message || "Failed to sign Fhenix permit"}`, "error");
    }
  };

  const isEncrypting = isPending || isConfirming;

  // Auto-update price for market orders when live data arrives
  useEffect(() => {
    if (orderType === "market" && marketData.price > 0) {
      setPrice(marketData.price.toString());
    }
  }, [marketData.price, orderType]);

  // Show success indicator and auto-clear inputs when tx confirms
  useEffect(() => {
    if (isSuccess) {
      setTxSuccess(true);
      setShowEncryptionAnim(false);
      // Auto-clear all inputs
      setAmount("");
      setTpPrice("");
      setSlPrice("");
      const timer = setTimeout(() => setTxSuccess(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isSuccess]);

  // Margin = size / leverage (since size IS in USDC)
  const margin = amount
    ? (parseFloat(amount) / leverage).toFixed(2)
    : "0.00";

  // Fee = 0.06% of notional
  const fee = price && amount
    ? (parseFloat(amount) * 0.0006).toFixed(2)
    : "0.00";

  // Liquidation price (simplified: 100%/leverage distance from entry)
  const liqPrice = price && amount && parseFloat(price) > 0
    ? side === "long"
      ? (parseFloat(price) * (1 - 1 / leverage)).toFixed(2)
      : (parseFloat(price) * (1 + 1 / leverage)).toFixed(2)
    : null;

  const numAmount = parseFloat(amount || "0");
  const numPrice = parseFloat(price || "0");
  const isValid = isConnected && numAmount > 0 && numPrice > 0;

  const handleSubmitOrder = useCallback(async () => {
    if (!isValid) return;

    setShowEncryptionAnim(true);

    try {
      // Convert to scaled integers (price and amount in base units)
      const priceVal = BigInt(Math.round(parseFloat(price) * 100)); // 2 decimal precision
      const amountVal = BigInt(Math.round(parseFloat(amount) * 1e6)); // 6 decimal precision
      const isLong = side === "long";

      await submitOrder(priceVal, amountVal, isLong);
      showToast("Order submitted successfully!", "success");
    } catch (err: any) {
      console.error("Order submission failed:", err);
      showToast(err?.message || "Order submission failed", "error");
      setShowEncryptionAnim(false);
    }
  }, [isValid, amount, price, side, submitOrder, showToast]);

  const pairBase = activePair.label.split("/")[0];
  const pairQuote = activePair.label.split("/")[1];

  const sideColor = side === "long" ? "bg-emerald-500 hover:bg-emerald-600" : "bg-rose-500 hover:bg-rose-600";
  const sideTextColor = side === "long" ? "text-emerald-500" : "text-rose-500";

  return (
    <div className="w-full h-full flex flex-col relative bg-[#111114] text-gray-300 font-sans p-4 space-y-3 overflow-hidden">
      {/* Encryption Animation Overlay */}
      <AnimatePresence>
        {showEncryptionAnim && (
          <EncryptionAnimation isComplete={!isEncrypting} />
        )}
      </AnimatePresence>

      {/* Top Long/Short Tabs */}
      <div className="flex gap-2 w-full">
        <button
          onClick={() => setSide("long")}
          className={`flex-1 py-1.5 rounded text-sm font-semibold transition-colors ${
            side === "long" ? "bg-emerald-500 text-white" : "bg-[#1C1C21] text-gray-400 hover:bg-[#2A2A30]"
          }`}
        >
          Long
        </button>
        <button
          onClick={() => setSide("short")}
          className={`flex-1 py-1.5 rounded text-sm font-semibold transition-colors ${
            side === "short" ? "bg-rose-500 text-white" : "bg-[#1C1C21] text-gray-400 hover:bg-[#2A2A30]"
          }`}
        >
          Short
        </button>
      </div>

      {/* Order Type Tabs */}
      <div className="flex gap-4 border-b border-[#2A2A30] pb-1">
        {(["market", "limit"] as const).map((type) => (
          <button
            key={type}
            onClick={() => setOrderType(type)}
            className={`capitalize text-sm font-medium transition-colors relative ${
              orderType === type
                ? "text-white"
                : "text-gray-500 hover:text-gray-300"
            }`}
          >
            {type}
            {orderType === type && (
              <div className="absolute -bottom-[5px] left-0 right-0 h-0.5 bg-indigo-500 rounded-full" />
            )}
          </button>
        ))}
      </div>

      <div className="space-y-2.5">
        {/* Price Input */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-gray-500 uppercase">Price ({pairQuote})</span>
            {marketData.isLoading && <Loader2 className="w-3 h-3 animate-spin text-gray-500" />}
          </div>
          <div className="relative">
            <Input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              disabled={orderType === "market"}
              className="w-full bg-[#1A1A1F] border border-[#2A2A30] text-white focus-visible:ring-indigo-500 focus-visible:ring-1 h-9 pr-12 text-sm font-mono disabled:opacity-50"
            />
          </div>
        </div>

        {/* Size Input */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-gray-500 uppercase">Size ({pairQuote})</span>
            <span className="text-gray-400 text-[11px] flex items-center gap-1">
              Available: {isBalanceLoading && !availableBalance ? (
                <Loader2 className="w-3 h-3 animate-spin text-gray-500 inline" />
              ) : availableBalance === "NeedsPermit" ? (
                <button
                  onClick={handleRevealBalance}
                  className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 font-medium bg-indigo-500/10 px-1.5 py-0.5 rounded cursor-pointer transition-colors"
                  title="Sign Permit to Reveal Balance"
                >
                  <Lock className="w-3 h-3" /> Reveal
                </button>
              ) : availableBalance ? (
                `$${availableBalance} USDC`
              ) : (
                "Encrypted USDC"
              )}
              <button
                onClick={() => setBalanceRefreshKey((k) => k + 1)}
                className="text-indigo-400 hover:text-indigo-300"
                title="Refresh balance"
              >
                <RefreshCw className="w-3 h-3" />
              </button>
            </span>
          </div>
          <div className="relative">
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full bg-[#1A1A1F] border border-[#2A2A30] text-white focus-visible:ring-indigo-500 focus-visible:ring-1 h-9 pr-14 text-sm font-mono"
            />
            <button className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-indigo-400 hover:text-indigo-300">
              MAX
            </button>
          </div>
        </div>

        {/* Leverage Slider */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-xs">
            <span className="text-gray-500 font-medium">LEVERAGE: {leverage}x</span>
          </div>
          <div className="flex justify-between gap-1">
            {LEVERAGE_MARKS.map((lev) => (
              <button
                key={lev}
                onClick={() => setLeverage(lev)}
                className={`flex-1 py-1.5 rounded text-xs transition-colors border ${
                  leverage === lev
                    ? "bg-indigo-600 border-indigo-500 text-white font-semibold"
                    : "bg-[#1A1A1F] border-[#2A2A30] text-gray-400 hover:bg-[#2A2A30]"
                }`}
              >
                {lev}x
              </button>
            ))}
          </div>
        </div>

        {/* Take Profit / Stop Loss */}
        <div className="space-y-1">
          <span className="text-xs text-gray-500">Take Profit / Stop Loss</span>
          <div className="grid grid-cols-[1fr_1fr] gap-2">
            <Input
              type="number"
              value={tpPrice}
              onChange={(e) => setTpPrice(e.target.value)}
              placeholder="TP Price"
              className="bg-[#1A1A1F] border border-[#2A2A30] text-gray-300 h-8 text-xs focus-visible:ring-indigo-500 focus-visible:ring-1 font-mono"
            />
            <div className="bg-[#1A1A1F] border border-[#2A2A30] rounded flex items-center px-3 h-8 text-xs text-gray-500 font-mono">
              {tpPrice && numPrice > 0 ? (side === "long" ? (((parseFloat(tpPrice) - numPrice) / numPrice) * 100) : (((numPrice - parseFloat(tpPrice)) / numPrice) * 100)).toFixed(2) + "%" : "Gain %"}
            </div>
            <Input
              type="number"
              value={slPrice}
              onChange={(e) => setSlPrice(e.target.value)}
              placeholder="SL Price"
              className="bg-[#1A1A1F] border border-[#2A2A30] text-gray-300 h-8 text-xs focus-visible:ring-indigo-500 focus-visible:ring-1 font-mono"
            />
            <div className="bg-[#1A1A1F] border border-[#2A2A30] rounded flex items-center px-3 h-8 text-xs text-gray-500 font-mono">
              {slPrice && numPrice > 0 ? (side === "long" ? (((parseFloat(slPrice) - numPrice) / numPrice) * 100) : (((numPrice - parseFloat(slPrice)) / numPrice) * 100)).toFixed(2) + "%" : "Loss %"}
            </div>
          </div>
          <div className="flex justify-between text-[10px] text-indigo-400 pt-0.5">
            <button onClick={() => setTpPrice("")} className="hover:text-indigo-300">Clear TP</button>
            <button onClick={() => setSlPrice("")} className="hover:text-indigo-300">Clear SL</button>
          </div>
        </div>

        {/* Order Summary Details */}
        <div className="space-y-1 pt-1 border-t border-[#2A2A30] text-xs">
          <div className="flex justify-between">
            <span className="text-gray-500">Entry Price</span>
            <span className="text-gray-200 font-mono">${price || "0.00"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Liquidation Price</span>
            <span className="text-gray-200 font-mono">{liqPrice ? `$${liqPrice}` : "-"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Fee (0.06%)</span>
            <span className="text-gray-200 font-mono">{fee !== "0.00" ? `$${fee}` : "-"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Margin</span>
            <span className="text-gray-200 font-mono">{margin !== "0.00" ? `$${margin}` : "-"}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-500">Privacy</span>
            <div className="flex items-center gap-2">
               <Lock className="w-3 h-3 text-indigo-400" />
               <span className="text-indigo-400 font-medium">FHE Encrypted</span>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="mt-auto pt-1">
          <Button
            disabled={!isValid || isEncrypting}
            onClick={handleSubmitOrder}
            className={`w-full py-4 text-sm font-bold text-white shadow-lg transition-transform hover:scale-[1.02] active:scale-[0.98] ${sideColor}`}
          >
          {txSuccess ? (
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Order Confirmed on Sepolia!
            </span>
          ) : isEncrypting ? (
              <span className="flex items-center gap-2">
                <Lock className="w-4 h-4 animate-pulse" />
                {isConfirming ? "Confirming on Sepolia..." : "Encrypting Order..."}
              </span>
            ) : (
              <>
                Open {side === "long" ? "Long" : "Short"} {activePair.label}
              </>
            )}
          </Button>
        </div>
        

      </div>
    </div>
  );
};

export default TradeForm;
