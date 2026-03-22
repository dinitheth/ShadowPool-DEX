import { useState, useEffect } from "react";
import { usePublicClient, useWalletClient } from "wagmi";
import { initCofheClient } from "@/lib/fhenix";
import Navbar from "@/components/layout/Navbar";
import OrderBook from "@/components/trading/OrderBook";
import TradeForm from "@/components/trading/TradeForm";
import TradeHistory from "@/components/trading/TradeHistory";
import PriceChart from "@/components/trading/PriceChart";
import PositionsList from "@/components/trading/PositionsList";

interface TradingPair {
  symbol: string;
  label: string;
  tvSymbol: string;
}

const TRADING_PAIRS: TradingPair[] = [
  { symbol: "ETHUSDC", label: "ETH/USDC", tvSymbol: "BINANCE:ETHUSDC" },
  { symbol: "WBTCUSDC", label: "WBTC/USDC", tvSymbol: "BINANCE:BTCUSDC" },
];

const Dashboard = () => {
  const [activePair, setActivePair] = useState(TRADING_PAIRS[0]);

  // Map the trading pair to a Binance symbol for the OrderBook/Trades
  const binanceSymbol = activePair.symbol === "WBTCUSDC" ? "BTCUSDC" : "ETHUSDC";
  
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();

  useEffect(() => {
    if (publicClient && walletClient) {
      initCofheClient(publicClient, walletClient);
    }
  }, [publicClient, walletClient]);

  return (
    <div className="h-screen w-screen flex flex-col bg-background overflow-hidden text-foreground">
      <Navbar />

      {/* Main Content — begins after the 48px navbar */}
      <div className="flex-1 mt-12 flex flex-col gap-2 p-2 overflow-hidden bg-black/95">
        
        {/* Upper Section: 3 Columns */}
        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[1fr_300px_340px] gap-2">
          
          {/* Left: Chart */}
          <div className="min-h-0 rounded-lg border border-border bg-card/50 overflow-hidden flex flex-col">
            <PriceChart
              pairs={TRADING_PAIRS}
              activePair={activePair}
              onPairChange={setActivePair}
            />
          </div>

          {/* Middle: Order Book & Trades */}
          <div className="hidden lg:flex flex-col gap-2 min-h-0">
            <div className="flex-1 min-h-0 rounded-lg border border-border bg-card/50 overflow-hidden flex flex-col">
              <OrderBook symbol={binanceSymbol} />
            </div>
            <div className="flex-1 min-h-0 rounded-lg border border-border bg-card/50 overflow-hidden flex flex-col">
              <TradeHistory symbol={binanceSymbol} />
            </div>
          </div>

          {/* Right: Trade Form */}
          <div className="min-h-0 rounded-lg border border-border bg-card/80 overflow-y-auto">
            <TradeForm activePair={activePair} />
          </div>

        </div>

        {/* Lower Section: Positions (Full Width) */}
        <div className="h-[280px] flex-shrink-0 rounded-lg border border-border bg-card/50 overflow-hidden flex flex-col">
          <PositionsList binanceSymbol={binanceSymbol} />
        </div>
        
      </div>
    </div>
  );
};

export default Dashboard;
