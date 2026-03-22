import { useState, useEffect, useCallback } from "react";

interface OrderEntry {
  price: string;
  size: string;
}

interface OrderBookProps {
  symbol?: string; // "BTCUSDC" or "ETHUSDC"
}

/**
 * Real-time order book using Binance REST API.
 * Fetches depth data every 2 seconds for the active market.
 */
const OrderBook = ({ symbol = "BTCUSDC" }: OrderBookProps) => {
  const [asks, setAsks] = useState<OrderEntry[]>([]);
  const [bids, setBids] = useState<OrderEntry[]>([]);
  const [spread, setSpread] = useState("—");

  const fetchOrderBook = useCallback(async () => {
    try {
      const res = await fetch(
        `https://api.binance.com/api/v3/depth?symbol=${symbol}&limit=10`
      );
      const json = await res.json();

      if (json.bids && json.asks) {
        const newBids: OrderEntry[] = json.bids.map(([price, size]: [string, string]) => ({
          price: parseFloat(price).toFixed(2),
          size: parseFloat(size).toFixed(4),
        }));
        const newAsks: OrderEntry[] = json.asks.map(([price, size]: [string, string]) => ({
          price: parseFloat(price).toFixed(2),
          size: parseFloat(size).toFixed(4),
        }));

        setBids(newBids);
        setAsks(newAsks);

        // Calculate spread
        if (newBids.length > 0 && newAsks.length > 0) {
          const bestBid = parseFloat(newBids[0].price);
          const bestAsk = parseFloat(newAsks[0].price);
          setSpread(`$${(bestAsk - bestBid).toFixed(2)}`);
        }
      }
    } catch (err) {
      console.error("Failed to fetch order book:", err);
    }
  }, [symbol]);

  useEffect(() => {
    fetchOrderBook();
    const interval = setInterval(fetchOrderBook, 2000);
    return () => clearInterval(interval);
  }, [fetchOrderBook]);

  return (
    <div className="w-full h-full flex flex-col bg-[#111114] text-gray-300 font-sans">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 pb-2 flex-shrink-0">
        <h3 className="text-sm font-semibold text-gray-200">Order Book</h3>
        <span className="text-xs text-gray-500">Spread {spread}</span>
      </div>

      <div className="grid grid-cols-2 px-4 gap-4 pb-2 text-[10px] text-gray-600 font-semibold uppercase tracking-wider flex-shrink-0">
        <div>Bids</div>
        <div>Asks</div>
      </div>

      <div className="flex-1 overflow-hidden flex min-h-0 px-4 pb-2 gap-4">
        {/* Bids Column */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {bids.map((order, i) => (
            <div key={`bid-${i}`} className="flex justify-between items-center py-1 text-xs font-mono hover:bg-[#1A1A1F] cursor-pointer">
              <span className="text-emerald-500">${order.price}</span>
              <span className="text-gray-400">{order.size}</span>
            </div>
          ))}
        </div>

        {/* Asks Column */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {asks.map((order, i) => (
            <div key={`ask-${i}`} className="flex justify-between items-center py-1 text-xs font-mono hover:bg-[#1A1A1F] cursor-pointer">
              <span className="text-rose-500">${order.price}</span>
              <span className="text-gray-400">{order.size}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="px-4 py-2 bg-[#1A1A1F] text-[10px] text-gray-500 border-t border-[#2A2A30] flex-shrink-0">
        Click a level to prefill Limit Price
      </div>
    </div>
  );
};

export default OrderBook;
