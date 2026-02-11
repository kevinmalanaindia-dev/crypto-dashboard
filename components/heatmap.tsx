// components/heatmap.tsx
import { Asset } from "@/lib/coincap";
import { motion } from "framer-motion";
import { formatPercent } from "@/lib/utils";
import { useState } from "react";

interface HeatmapProps {
  initialAssets: Asset[];
}

export function Heatmap({ initialAssets }: HeatmapProps) {
  const [assets] = useState<Asset[]>(initialAssets);

  // Recalculate 24h change dynamically based on live price vs vwap/open?
  // CoinCap WS only sends PRICE, not 24h change. 
  // So for the heatmap, we will rely on the initial 24h change + live price delta.
  // Actually, for simplicity and stability, let's stick to the initial 24h change for color buckets,
  // but update the displayed PRICE label if we want.
  // Better: Sort assets based on performance.
  
  const sortedAssets = [...assets].sort((a, b) => parseFloat(b.changePercent24Hr) - parseFloat(a.changePercent24Hr));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-slate-100">
        <h3 className="text-lg font-medium text-slate-800">24h Momentum Heatmap</h3>
        <div className="flex gap-4 text-xs font-medium text-slate-500">
          <div className="flex items-center gap-2"><div className="w-4 h-4 bg-red-500 rounded"></div> &lt; -10% (Oversold)</div>
          <div className="flex items-center gap-2"><div className="w-4 h-4 bg-slate-100 rounded border border-slate-200"></div> Neutral</div>
          <div className="flex items-center gap-2"><div className="w-4 h-4 bg-green-500 rounded"></div> &gt; +10% (Overbought)</div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
        {sortedAssets.map((asset, i) => {
          const change = parseFloat(asset.changePercent24Hr);
          const bgClass = getHeatmapColor(change);
          
          return (
            <motion.div
              key={asset.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.01 }}
              whileHover={{ scale: 1.05, zIndex: 10 }}
              className={`${bgClass} rounded-xl p-4 flex flex-col justify-between shadow-sm hover:shadow-md cursor-pointer transition-all aspect-square relative overflow-hidden group`}
            >
              <div className="z-10 flex justify-between w-full">
                <span className="font-bold text-slate-900/80 text-lg tracking-tight">{asset.symbol}</span>
              </div>
              
              <div className="z-10 flex flex-col items-end">
                <span className="text-2xl font-bold text-slate-900/90 tracking-tighter">
                  {formatPercent(change)}
                </span>
                <span className="text-xs text-slate-600 font-medium bg-white/50 px-1.5 py-0.5 rounded-md mt-1 backdrop-blur-sm">
                   ${parseFloat(asset.priceUsd) < 1 ? parseFloat(asset.priceUsd).toFixed(4) : parseFloat(asset.priceUsd).toFixed(2)}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function getHeatmapColor(change: number): string {
  if (change >= 15) return "bg-green-500";   // Strong Pump
  if (change >= 5) return "bg-green-400";    // Pump
  if (change >= 2) return "bg-green-200";    // Mild Pump
  if (change > 0) return "bg-green-100";     // Neutral Up
  if (change <= -15) return "bg-red-500";    // Crash
  if (change <= -5) return "bg-red-400";     // Dump
  if (change <= -2) return "bg-red-200";     // Mild Dump
  if (change < 0) return "bg-red-100";       // Neutral Down
  return "bg-slate-50";
}
