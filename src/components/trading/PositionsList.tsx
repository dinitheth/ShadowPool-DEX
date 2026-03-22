import { Lock, Loader2, Eye, EyeOff, X as CloseIcon, RefreshCw } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { useAccount, usePublicClient } from "wagmi";
import { useTraderOrders, useClosePosition, useSettlePosition } from "@/hooks/useFhenix";
import { getCofheClient, decryptValue, FheTypes } from "@/lib/fhenix";
import { SHADOW_POOL_ADDRESS, SHADOW_POOL_ABI } from "@/lib/wallet-config";

interface RevealedData {
  isLong: boolean;
  size: number;      // USDC margin amount (e.g. 100 = $100 USDC)
  entryPrice: number; // USD price (e.g. 2161.58)
  leverage: number;
  timestamp: string;
}

interface OrderStatus {
  isActive: boolean;
  isClosed: boolean;
  timestamp: number;
}

interface PositionsListProps {
  binanceSymbol?: string;
}

const PositionsList = ({ binanceSymbol = "ETHUSDC" }: PositionsListProps) => {
  const [activeTab, setActiveTab] = useState("positions");
  const [revealedOrders, setRevealedOrders] = useState<Record<string, RevealedData>>({});
  const [orderStatuses, setOrderStatuses] = useState<Record<string, OrderStatus>>({});
  const [revealingId, setRevealingId] = useState<string | null>(null);
  const [closingId, setClosingId] = useState<string | null>(null);
  const [markPrice, setMarkPrice] = useState<number>(0);
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { data: traderOrderIds, refetch, isLoading } = useTraderOrders(address);
  const { closePosition, isPending: isClosePending } = useClosePosition();
  const { settlePosition } = useSettlePosition();

  // Fetch live mark price from Binance API
  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const res = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${binanceSymbol}`);
        const data = await res.json();
        if (data.price) setMarkPrice(parseFloat(data.price));
      } catch { /* silent */ }
    };
    fetchPrice();
    const interval = setInterval(fetchPrice, 2000);
    return () => clearInterval(interval);
  }, [binanceSymbol]);

  // Auto-refresh order list every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (address) refetch();
    }, 5000);
    return () => clearInterval(interval);
  }, [address, refetch]);

  const orderIds: bigint[] = Array.isArray(traderOrderIds) ? (traderOrderIds as bigint[]) : [];

  // Fetch real order statuses from blockchain
  const fetchStatuses = useCallback(async () => {
    if (!publicClient || orderIds.length === 0) return;
    const newStatuses: Record<string, OrderStatus> = {};
    for (const orderId of orderIds) {
      const key = orderId.toString();
      try {
        const data = (await publicClient.readContract({
          address: SHADOW_POOL_ADDRESS,
          abi: SHADOW_POOL_ABI as any,
          functionName: "orders",
          args: [orderId],
        })) as unknown as any[];
        const [, , , , timestamp, isActive, isClosed] = data;
        newStatuses[key] = {
          isActive: !!isActive,
          isClosed: !!isClosed,
          timestamp: Number(timestamp),
        };
      } catch { /* skip */ }
    }
    setOrderStatuses(newStatuses);
  }, [publicClient, orderIds.length]);

  useEffect(() => { fetchStatuses(); }, [fetchStatuses]);

  // Refresh statuses every 5s to catch close updates faster
  useEffect(() => {
    const interval = setInterval(fetchStatuses, 5000);
    return () => clearInterval(interval);
  }, [fetchStatuses]);

  // Active = not closed, Closed = for history
  const activeOrderIds = orderIds.filter((id) => {
    const s = orderStatuses[id.toString()];
    return !s || (s.isActive && !s.isClosed);
  });
  const closedOrderIds = orderIds.filter((id) => {
    const s = orderStatuses[id.toString()];
    return s && s.isClosed;
  });

  const handleReveal = async (orderId: bigint) => {
    const key = orderId.toString();
    if (revealedOrders[key]) {
      setRevealedOrders((p) => { const c = { ...p }; delete c[key]; return c; });
      return;
    }
    setRevealingId(key);
    try {
      const orderData = (await publicClient!.readContract({
        address: SHADOW_POOL_ADDRESS,
        abi: SHADOW_POOL_ABI as any,
        functionName: "orders",
        args: [orderId],
      })) as unknown as any[];

      const [priceHandle, amountHandle, isLongHandle, , timestamp] = orderData;
      const ts = Number(timestamp);
      const timeStr = ts > 0 ? new Date(ts * 1000).toLocaleString() : "—";

      // Decrypt using CoFHE SDK (official pattern: no extra args needed)
      let isLong = true, rawAmount = 0n, rawPrice = 0n;
      const client = getCofheClient();
      if (client) {
        try {
          const v = await decryptValue(isLongHandle, FheTypes.Bool);
          if (v !== null && v !== "NeedsPermit") isLong = !!v;
        } catch { /* skip */ }
        try {
          const v = await decryptValue(amountHandle, FheTypes.Uint64);
          if (v !== null && v !== "NeedsPermit" && typeof v === "bigint") rawAmount = v;
        } catch { /* skip */ }
        try {
          const v = await decryptValue(priceHandle, FheTypes.Uint64);
          if (v !== null && v !== "NeedsPermit" && typeof v === "bigint") rawPrice = v;
        } catch { /* skip */ }
      }

      // size = USDC amount (divided by 1e6 for 6-decimal scaling)
      // entryPrice = USD price (divided by 100 for 2-decimal scaling)
      const size = Number(rawAmount) / 1e6;
      const entryPrice = Number(rawPrice) / 100;

      setRevealedOrders((p) => ({
        ...p,
        [key]: { isLong, size, entryPrice, leverage: 5, timestamp: timeStr },
      }));
    } catch (err) {
      console.error("[Reveal]", err);
    }
    setRevealingId(null);
  };

  const handleClose = async (orderId: bigint, r?: RevealedData) => {
    const key = orderId.toString();
    setClosingId(key);
    try {
      // 1. Close the position
      await closePosition(orderId);

      // 2. Auto-settle immediately if revealed data is available
      if (r) {
        const pnl = calcPnL(r);
        let returnUsdc = r.size + pnl.pnl;
        if (returnUsdc < 0) returnUsdc = 0; // Liquidation, returns 0

        const returnAmountBaseUnits = BigInt(Math.floor(returnUsdc * 1e6));
        const isProfit = pnl.pnl >= 0;

        await settlePosition(orderId, returnAmountBaseUnits, isProfit);
      }

      // Immediately refetch and refresh statuses
      setTimeout(async () => {
        await refetch();
        await fetchStatuses();
      }, 2000);
    } catch (err) {
      console.error("[Close]", err);
    }
    setClosingId(null);
  };

  const handleRefreshAll = async () => {
    await refetch();
    await fetchStatuses();
  };

  /**
   * PnL calculation:
   * - size = USDC margin (e.g. 100 USDC)
   * - notional = size * leverage (e.g. 100 * 5 = 500 USDC)
   * - ethQty = notional / entryPrice
   * - pnl = ethQty * (markPrice - entryPrice) for long, opposite for short
   * - pnlPct = pnl / size * 100 (relative to margin)
   */
  const calcPnL = (r: RevealedData) => {
    if (!markPrice || !r.entryPrice || !r.size) return { pnl: 0, pnlPct: 0 };
    const notional = r.size * r.leverage;
    const ethQty = notional / r.entryPrice;
    const priceDiff = r.isLong ? (markPrice - r.entryPrice) : (r.entryPrice - markPrice);
    const pnl = ethQty * priceDiff;
    const pnlPct = r.size > 0 ? (pnl / r.size) * 100 : 0;
    return { pnl, pnlPct };
  };

  const market = binanceSymbol === "BTCUSDC" ? "BTC-USD" : "ETH-USD";

  const tabCls = (t: string) =>
    `py-2.5 text-xs font-medium transition-colors border-b-2 ${
      activeTab === t ? "text-white border-white" : "text-gray-500 border-transparent hover:text-gray-300"
    }`;

  return (
    <div className="w-full h-full flex flex-col bg-[#111114] text-gray-300 font-sans border border-[#2A2A30] rounded overflow-hidden">
      {/* Tabs */}
      <div className="flex items-center justify-between px-4 border-b border-[#2A2A30] flex-shrink-0">
        <div className="flex gap-6">
          <button onClick={() => setActiveTab("positions")} className={tabCls("positions")}>Positions ({activeOrderIds.length})</button>
          <button onClick={() => setActiveTab("orders")} className={tabCls("orders")}>Orders</button>
          <button onClick={() => setActiveTab("history")} className={tabCls("history")}>History</button>
        </div>
        <button onClick={handleRefreshAll} className="text-xs font-semibold text-blue-500 hover:text-blue-400 flex items-center gap-1">
          {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <><RefreshCw className="w-3 h-3" /> Refresh</>}
        </button>
      </div>

      <div className="overflow-auto flex-1 min-h-0 bg-[#0A0A0C]">

        {/* ── Positions ── */}
        {activeTab === "positions" && (
          !address ? (
            <div className="flex items-center justify-center h-full text-sm text-gray-500">Connect wallet to view positions</div>
          ) : activeOrderIds.length === 0 ? (
            <div className="flex items-center justify-center h-full text-sm text-gray-500">No open positions</div>
          ) : (
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-[#0A0A0C] z-10 border-b border-[#2A2A30]">
                <tr className="text-gray-500 uppercase tracking-wider text-[10px]">
                  <th className="text-left py-2 px-3 font-semibold">Market</th>
                  <th className="text-right py-2 px-3 font-semibold">Size (USDC)</th>
                  <th className="text-right py-2 px-3 font-semibold">Leverage</th>
                  <th className="text-right py-2 px-3 font-semibold">Entry Price</th>
                  <th className="text-right py-2 px-3 font-semibold">Mark Price</th>
                  <th className="text-right py-2 px-3 font-semibold">PnL</th>
                  <th className="text-center py-2 px-3 font-semibold">Privacy</th>
                  <th className="text-right py-2 px-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {activeOrderIds.map((orderId, i) => {
                  const key = orderId.toString();
                  const r = revealedOrders[key];
                  const revealing = revealingId === key;
                  const closing = closingId === key;
                  const pnl = r ? calcPnL(r) : null;
                  return (
                    <tr key={i} className="border-b border-[#1C1C21] hover:bg-[#1A1A1F] transition-colors">
                      {/* Market */}
                      <td className="py-2 px-3">
                        <span className="text-gray-100 font-semibold">{market}</span>
                        {r ? (
                          <span className={`ml-1.5 text-[10px] font-bold ${r.isLong ? "text-emerald-400" : "text-rose-400"}`}>
                            {r.isLong ? "LONG" : "SHORT"}
                          </span>
                        ) : (
                          <span className="ml-1.5 text-[10px] text-indigo-400"><Lock className="w-2.5 h-2.5 inline" /></span>
                        )}
                      </td>
                      {/* Size — dynamic equity (margin + pnl) */}
                      <td className="py-2 px-3 text-right font-mono text-gray-200">
                        {r ? (
                          <span className={pnl && pnl.pnl < 0 ? "text-rose-400/90" : pnl && pnl.pnl > 0 ? "text-emerald-400/90" : ""}>
                            ${((r.size) + (pnl ? pnl.pnl : 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        ) : <Lock className="w-3 h-3 text-indigo-400/60 inline" />}
                      </td>
                      {/* Leverage */}
                      <td className="py-2 px-3 text-right font-mono text-gray-200">
                        {r ? `${r.leverage}x` : <Lock className="w-3 h-3 text-indigo-400/60 inline" />}
                      </td>
                      {/* Entry */}
                      <td className="py-2 px-3 text-right font-mono text-gray-200">
                        {r ? `$${r.entryPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : <Lock className="w-3 h-3 text-indigo-400/60 inline" />}
                      </td>
                      {/* Mark — live from Binance */}
                      <td className="py-2 px-3 text-right font-mono text-gray-200">
                        {markPrice > 0 ? `$${markPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : "—"}
                      </td>
                      {/* PnL */}
                      <td className="py-2 px-3 text-right font-mono">
                        {r && pnl ? (
                          <span className={pnl.pnl >= 0 ? "text-emerald-400" : "text-rose-400"}>
                            {pnl.pnl >= 0 ? "+" : ""}{pnl.pnl.toFixed(2)} <span className="text-[10px]">({pnl.pnlPct >= 0 ? "+" : ""}{pnl.pnlPct.toFixed(2)}%)</span>
                          </span>
                        ) : <Lock className="w-3 h-3 text-indigo-400/60 inline" />}
                      </td>
                      {/* Privacy */}
                      <td className="py-2 px-3 text-center">
                        {r ? (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Revealed</span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">Encrypted</span>
                        )}
                      </td>
                      {/* Actions */}
                      <td className="py-2 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleReveal(orderId)}
                            disabled={revealing}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/20 disabled:opacity-50"
                          >
                            {revealing ? <Loader2 className="w-3 h-3 animate-spin" /> : r ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                            {revealing ? "..." : r ? "Hide" : "Reveal"}
                          </button>
                          <button
                            onClick={() => handleClose(orderId, r)}
                            disabled={closing || isClosePending}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 disabled:opacity-50"
                          >
                            {closing ? <Loader2 className="w-3 h-3 animate-spin" /> : <CloseIcon className="w-3 h-3" />}
                            Close
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )
        )}

        {/* ── Orders ── */}
        {activeTab === "orders" && (
          !address ? (
            <div className="flex items-center justify-center h-full text-sm text-gray-500">Connect wallet to view orders</div>
          ) : activeOrderIds.length === 0 ? (
            <div className="flex items-center justify-center h-full text-sm text-gray-500">No pending orders</div>
          ) : (
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-[#0A0A0C] z-10 border-b border-[#2A2A30]">
                <tr className="text-gray-500 uppercase tracking-wider text-[10px]">
                  <th className="text-left py-2 px-3 font-semibold">Order ID</th>
                  <th className="text-left py-2 px-3 font-semibold">Market</th>
                  <th className="text-left py-2 px-3 font-semibold">Type</th>
                  <th className="text-left py-2 px-3 font-semibold">Time</th>
                  <th className="text-left py-2 px-3 font-semibold">Status</th>
                  <th className="text-left py-2 px-3 font-semibold">Privacy</th>
                </tr>
              </thead>
              <tbody>
                {activeOrderIds.map((id, i) => {
                  const key = id.toString();
                  const s = orderStatuses[key];
                  const ts = s?.timestamp;
                  return (
                    <tr key={i} className="border-b border-[#1C1C21] hover:bg-[#1A1A1F]">
                      <td className="py-2 px-3 text-gray-400 font-mono">#{key}</td>
                      <td className="py-2 px-3 text-gray-200 font-semibold">{market}</td>
                      <td className="py-2 px-3 text-gray-400">Encrypted Order</td>
                      <td className="py-2 px-3 text-gray-400">{ts && ts > 0 ? new Date(ts * 1000).toLocaleString() : "—"}</td>
                      <td className="py-2 px-3"><span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Active</span></td>
                      <td className="py-2 px-3"><span className="text-[10px] text-indigo-400 inline-flex items-center gap-1"><Lock className="w-2.5 h-2.5" /> FHE</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )
        )}

        {/* ── History ── */}
        {activeTab === "history" && (
          !address ? (
            <div className="flex items-center justify-center h-full text-sm text-gray-500">Connect wallet to view history</div>
          ) : closedOrderIds.length === 0 && activeOrderIds.length === 0 ? (
            <div className="flex items-center justify-center h-full text-sm text-gray-500">No trade history</div>
          ) : (
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-[#0A0A0C] z-10 border-b border-[#2A2A30]">
                <tr className="text-gray-500 uppercase tracking-wider text-[10px]">
                  <th className="text-left py-2 px-3 font-semibold">Order ID</th>
                  <th className="text-left py-2 px-3 font-semibold">Market</th>
                  <th className="text-left py-2 px-3 font-semibold">Time</th>
                  <th className="text-left py-2 px-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {closedOrderIds.map((id, i) => {
                  const s = orderStatuses[id.toString()];
                  return (
                    <tr key={i} className="border-b border-[#1C1C21] hover:bg-[#1A1A1F]">
                      <td className="py-2 px-3 text-gray-400 font-mono">#{id.toString()}</td>
                      <td className="py-2 px-3 text-gray-200 font-semibold">{market}</td>
                      <td className="py-2 px-3 text-gray-400">{s?.timestamp && s.timestamp > 0 ? new Date(s.timestamp * 1000).toLocaleString() : "—"}</td>
                      <td className="py-2 px-3"><span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">Closed</span></td>
                    </tr>
                  );
                })}
                {activeOrderIds.map((id, i) => {
                  const s = orderStatuses[id.toString()];
                  return (
                    <tr key={closedOrderIds.length + i} className="border-b border-[#1C1C21] hover:bg-[#1A1A1F]">
                      <td className="py-2 px-3 text-gray-400 font-mono">#{id.toString()}</td>
                      <td className="py-2 px-3 text-gray-200 font-semibold">{market}</td>
                      <td className="py-2 px-3 text-gray-400">{s?.timestamp && s.timestamp > 0 ? new Date(s.timestamp * 1000).toLocaleString() : "—"}</td>
                      <td className="py-2 px-3"><span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Confirmed</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )
        )}

      </div>
    </div>
  );
};

export default PositionsList;
