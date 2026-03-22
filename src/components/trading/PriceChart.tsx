import { useEffect, useRef } from "react";

interface TradingPair {
  symbol: string;
  label: string;
  tvSymbol: string;
}

interface PriceChartProps {
  pairs: readonly TradingPair[];
  activePair: TradingPair;
  onPairChange: (pair: TradingPair) => void;
}

const TICKERS = [
  { pair: "BTC-USD", price: "69,946.88", change: "+0.32%", isPositive: true },
  { pair: "ETH-USD", price: "3,111.05", change: "+0.10%", isPositive: true },
];

const PriceChart = ({ activePair, onPairChange, pairs }: PriceChartProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const widgetContainer = containerRef.current;
    widgetContainer.innerHTML = "";

    const widgetDiv = document.createElement("div");
    widgetDiv.className = "tradingview-widget-container__widget";
    widgetDiv.style.height = "100%";
    widgetDiv.style.width = "100%";
    widgetContainer.appendChild(widgetDiv);

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: activePair.tvSymbol,
      interval: "15",
      timezone: "Etc/UTC",
      theme: "dark",
      style: "1",
      locale: "en",
      backgroundColor: "#111114",
      gridColor: "#1A1A1F",
      allow_symbol_change: false,
      hide_top_toolbar: false,
      hide_legend: false,
      save_image: false,
      hide_side_toolbar: true,
      calendar: false,
      support_host: "https://www.tradingview.com",
    });
    widgetContainer.appendChild(script);

    return () => {
      widgetContainer.innerHTML = "";
    };
  }, [activePair.tvSymbol]);

  return (
    <div className="w-full h-full flex flex-col bg-[#111114] border border-[#2A2A30] rounded overflow-hidden">
      {/* Ticker Tape Header */}
      <div className="flex items-center gap-6 px-4 py-2 border-b border-[#2A2A30] bg-[#111114] flex-shrink-0 overflow-x-auto whitespace-nowrap scrollbar-hide">
        {TICKERS.map((ticker, i) => (
          <button
            key={i}
            onClick={() => {
              const pair = pairs.find(p => p.label.includes(ticker.pair.split('-')[0]));
              if (pair) onPairChange(pair);
            }}
            className={`flex items-center gap-2 text-xs font-semibold ${activePair.label.includes(ticker.pair.split('-')[0]) ? 'text-white' : 'text-gray-400 hover:text-gray-200'} transition-colors`}
          >
            <span>{ticker.pair}</span>
            <span className="font-mono">{ticker.price}</span>
            <span className={ticker.isPositive ? "text-emerald-500" : "text-rose-500"}>
              {ticker.change}
            </span>
          </button>
        ))}
      </div>
      
      {/* TradingView Chart Container */}
      <div
        ref={containerRef}
        className="tradingview-widget-container flex-1 min-h-0 bg-[#111114]"
      />
    </div>
  );
};

export default PriceChart;
