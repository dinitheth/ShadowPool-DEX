import { useState, useEffect } from "react";

// Binance API symbols for our supported pairs
const TOKEN_IDS: Record<string, string> = {
  "ETH/USDC": "ETHUSDC",
  "WBTC/USDC": "BTCUSDC",
};

export interface MarketData {
  price: number;
  change24h: number;
  isLoading: boolean;
}

/**
 * Fetch real token prices from CoinGecko API
 */
export const useMarketData = (activePairLabel: string) => {
  const [data, setData] = useState<MarketData>({
    price: 0,
    change24h: 0,
    isLoading: true,
  });

  useEffect(() => {
    let mounted = true;
    const fetchPrice = async () => {
      setData((prev) => ({ ...prev, isLoading: true }));
      try {
        const tokenId = TOKEN_IDS[activePairLabel] || "ETHUSDC";
        
        // Binance API is extremely fast and doesn't have strict CORS/rate limits for basic price
        const res = await fetch(
          `https://api.binance.com/api/v3/ticker/24hr?symbol=${tokenId}`
        );
        const json = await res.json();
        
        if (mounted && json.lastPrice) {
          setData({
            price: parseFloat(json.lastPrice),
            change24h: parseFloat(json.priceChangePercent),
            isLoading: false,
          });
        }
      } catch (err) {
        console.error("Failed to fetch market data", err);
        if (mounted) {
          setData((prev) => ({ ...prev, isLoading: false }));
        }
      }
    };

    fetchPrice();
    const interval = setInterval(fetchPrice, 30000); // 30s update
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [activePairLabel]);

  return data;
};
