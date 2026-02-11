// components/market-table-client.tsx
"use client";

import { useState, useEffect } from "react";
import { Asset, subscribeToPrices, getTopAssets } from "../lib/coincap";
import { Star, ArrowUpRight, ArrowDownRight } from "lucide-react";
import Image from "next/image";

interface MarketTableProps {
  initialData: Asset[];
}

export function MarketTable({ initialData }: MarketTableProps) {
  const [assets, setAssets] = useState<Asset[]>(initialData);
  const [prices, setPrices] = useState<Record<string, string>>({});
  const [watchlist, setWatchlist] = useState<Set<string>>(new Set());

  // Fetch assets client-side if server failed
  useEffect(() => {
    if (assets.length === 0) {
      getTopAssets().then(setAssets);
    }
  }, [assets.length]);

  // Subscribe to live prices for all assets
  useEffect(() => {
    if (assets.length === 0) return;
    
    const ids = assets.map(a => a.id);
    const ws = subscribeToPrices(ids, (newPrices) => {
      setPrices(prev => ({ ...prev, ...newPrices }));
    });

    return () => ws.close();
  }, [assets]);

  const toggleWatchlist = (id: string) => {
    const newWatchlist = new Set(watchlist);
    if (newWatchlist.has(id)) {
      newWatchlist.delete(id);
    } else {
      newWatchlist.add(id);
    }
    setWatchlist(newWatchlist);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200 text-xs text-slate-500 uppercase">
            <tr>
              <th className="px-6 py-3 text-left font-medium">#</th>
              <th className="px-6 py-3 text-left font-medium">Asset</th>
              <th className="px-6 py-3 text-right font-medium">Price</th>
              <th className="px-6 py-3 text-right font-medium">24h Change</th>
              <th className="px-6 py-3 text-right font-medium">Market Cap</th>
              <th className="px-6 py-3 text-center font-medium">Watch</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {assets.map((asset) => {
              const livePrice = prices[asset.id] ? parseFloat(prices[asset.id]) : parseFloat(asset.priceUsd);
              const change = parseFloat(asset.changePercent24Hr);
              const isUp = change >= 0;
              
              // Simple flash logic: if live price differs from stored base, highlight
              const priceClass = prices[asset.id] 
                ? (parseFloat(prices[asset.id]) > parseFloat(asset.priceUsd) ? "text-green-600" : "text-red-600")
                : "text-slate-900";

              return (
                <tr key={asset.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4 text-slate-400 font-medium">{asset.rank}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-100 relative">
                        <Image 
                            src={`https://assets.coincap.io/assets/icons/${asset.symbol.toLowerCase()}@2x.png`}
                            alt={asset.name}
                            fill
                            className="object-cover"
                            onError={(e) => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${asset.symbol}&background=random` }}
                        />
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900">{asset.name}</div>
                        <div className="text-xs text-slate-500">{asset.symbol}</div>
                      </div>
                    </div>
                  </td>
                  <td className={`px-6 py-4 text-right font-mono font-medium ${priceClass}`}>
                    ${livePrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                  </td>
                  <td className={`px-6 py-4 text-right font-medium ${isUp ? 'text-green-600' : 'text-red-600'}`}>
                    <div className="flex items-center justify-end gap-1">
                      {isUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                      {Math.abs(change).toFixed(2)}%
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right text-slate-600">
                    ${(parseFloat(asset.marketCapUsd) / 1e9).toFixed(2)}B
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => toggleWatchlist(asset.id)}
                      className={`p-2 rounded-lg transition-colors ${
                        watchlist.has(asset.id)
                          ? "text-yellow-500 bg-yellow-50"
                          : "text-slate-300 hover:text-yellow-500 hover:bg-slate-100"
                      }`}
                    >
                      <Star size={18} fill={watchlist.has(asset.id) ? "currentColor" : "none"} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
