import { useState, useEffect, useCallback } from "react";

interface Trade {
  time: string;
  price: string;
  size: string;
  side: "buy" | "sell";
}

interface TradeHistoryProps {
  symbol?: string; // "BTCUSDC" or "ETHUSDC"
}

/**
 * Real-time recent trades using Binance REST API.
 * Fetches the latest 15 trades every 3 seconds for the active market.
 */
const TradeHistory = ({ symbol = "BTCUSDC" }: TradeHistoryProps) => {
  const [trades, setTrades] = useState<Trade[]>([]);

  const fetchTrades = useCallback(async () => {
    try {
      const res = await fetch(
        `https://api.binance.com/api/v3/trades?symbol=${symbol}&limit=15`
      );
      const json = await res.json();

      if (Array.isArray(json)) {
        const newTrades: Trade[] = json.reverse().map((t: any) => ({
          time: new Date(t.time).toLocaleTimeString("en-US", {
            hour12: true,
            hour: "numeric",
            minute: "2-digit",
            second: "2-digit",
          }),
          price: parseFloat(t.price).toFixed(2),
          size: parseFloat(t.qty).toFixed(4),
          side: t.isBuyerMaker ? "sell" : "buy",
        }));
        setTrades(newTrades);
      }
    } catch (err) {
      console.error("Failed to fetch trades:", err);
    }
  }, [symbol]);

  useEffect(() => {
    fetchTrades();
    const interval = setInterval(fetchTrades, 3000);
    return () => clearInterval(interval);
  }, [fetchTrades]);

  return (
    <div className="w-full h-full flex flex-col bg-[#111114] text-gray-300 font-sans border-t border-[#2A2A30]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 flex-shrink-0 border-b border-[#2A2A30]">
        <h3 className="text-sm font-semibold text-gray-200">Trades</h3>
        <span className="text-xs text-gray-500">15 recent</span>
      </div>

      <div className="grid grid-cols-3 px-4 py-2 text-[10px] text-gray-600 font-semibold uppercase tracking-wider flex-shrink-0">
        <span>Price</span>
        <span className="text-right">Size</span>
        <span className="text-right">Time</span>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0 px-4 pb-2">
        {trades.map((trade, i) => (
          <div
            key={`${trade.time}-${i}`}
            className="grid grid-cols-3 py-1.5 text-xs font-mono hover:bg-[#1A1A1F] cursor-pointer"
          >
            <span className={trade.side === "buy" ? "text-emerald-500" : "text-rose-500"}>
              ${trade.price}
            </span>
            <span className="text-right text-gray-300">
              {trade.size}
            </span>
            <span className="text-right text-gray-500">
              {trade.time}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TradeHistory;
