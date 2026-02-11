// app/client-page.tsx
"use client";

import { useState, useEffect } from "react";
import { Sidebar, Header, TabId } from "../components/layout-shell";
import { MetricCard } from "../components/ui-components";
import { MarketTable } from "../components/market-table-client";
import { Heatmap } from "../components/heatmap";
import { WhaleWatch } from "../components/whale-watch"; 
import { NewsFeed } from "../components/news-feed";
import { AlphaTerminal } from "../components/alpha-terminal";
import { Activity, Zap, BarChart3, Database } from "lucide-react";
import { Asset } from "../lib/coincap";
import { motion, AnimatePresence } from "framer-motion";

import { formatCompactNumber } from "../lib/utils";

interface MarketStats {
  marketCap: number;
  marketCapChange: number;
  volume: number;
  btcDominance: number;
  fngValue: string;
  fngClassification: string;
}

export default function ClientPage({ initialAssets }: { initialAssets: Asset[] }) {
  const [activeTab, setActiveTab] = useState<TabId>('alpha');
  const [assets, setAssets] = useState<Asset[]>(initialAssets);
  const [stats, setStats] = useState<MarketStats | null>(null);
  const [isLoading, setIsLoading] = useState(initialAssets.length === 0);

  useEffect(() => {
    // 1. Fetch Asset List (if missing)
    if (initialAssets.length === 0) {
      fetch('/api/assets')
        .then(res => res.json())
        .then(data => {
           if (data && data.data) setAssets(data.data);
        })
        .catch(err => console.error("Client fetch failed:", err))
        .finally(() => setIsLoading(false));
    }

    // 2. Fetch Global Stats (Always)
    fetch('/api/stats')
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(console.error);
  }, [initialAssets.length]);

  return (
    <div className="flex h-screen bg-slate-50 text-slate-800 font-sans antialiased overflow-hidden">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <Header title={activeTab.charAt(0).toUpperCase() + activeTab.slice(1) + (activeTab === 'market' ? ' Overview' : '')} />

        <main className="flex-1 overflow-y-auto p-8 space-y-8 relative">
          {isLoading && (
            <div className="absolute inset-0 z-50 bg-slate-50 flex flex-col items-center justify-center text-slate-400">
               <div className="w-12 h-12 border-4 border-blue-100 border-t-blue-500 rounded-full animate-spin mb-4"></div>
               <p className="font-medium text-slate-600">Connecting to Market Data Feed...</p>
               <p className="text-xs mt-2 text-slate-400">Fetching live prices via Vercel Proxy</p>
            </div>
          )}
          
          {!isLoading && (
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="h-full" // Ensure full height for scrollable children
            >
              {activeTab === 'alpha' && <AlphaTerminal />}

              {activeTab === 'market' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <MetricCard 
                      label="Total Market Cap" 
                      value={stats ? `$${formatCompactNumber(stats.marketCap)}` : "—"} 
                      trend={stats && stats.marketCapChange >= 0 ? "up" : "down"} 
                      trendValue={stats ? `${Math.abs(stats.marketCapChange).toFixed(2)}%` : ""} 
                      subtext="in last 24h" 
                      icon={<Database size={20} />} 
                      onClick={() => setActiveTab('market')}
                    />
                    <MetricCard 
                      label="24h Volume" 
                      value={stats ? `$${formatCompactNumber(stats.volume)}` : "—"} 
                      trend="neutral" 
                      subtext="Global" 
                      icon={<Activity size={20} />} 
                      onClick={() => setActiveTab('heatmap')}
                    />
                    <MetricCard 
                      label="BTC Dominance" 
                      value={stats ? `${stats.btcDominance.toFixed(1)}%` : "—"} 
                      trend="neutral" 
                      subtext="Market Share" 
                      icon={<BarChart3 size={20} />} 
                      onClick={() => setActiveTab('market')}
                    />
                    <MetricCard 
                      label="Fear & Greed" 
                      value={stats ? stats.fngValue : "—"} 
                      subtext={stats ? stats.fngClassification : "Loading..."} 
                      trend={stats && parseInt(stats.fngValue) > 50 ? "up" : "down"} 
                      icon={<Zap size={20} />} 
                      onClick={() => window.open('https://alternative.me/crypto/fear-and-greed-index/', '_blank')}
                    />
                  </div>
                  
                  <MarketTable key={assets.length} initialData={assets} />
                </div>
              )}

              {activeTab === 'heatmap' && (
                <Heatmap key={assets.length} initialAssets={assets} />
              )}
              
              {activeTab === 'whales' && (
                 <WhaleWatch key={assets.length} initialAssets={assets} />
              )}

              {activeTab === 'news' && (
                 <NewsFeed />
              )}
              
              {/* Other tabs remain placeholders */}
              {activeTab === 'watchlist' && (
                 <div className="bg-white rounded-xl shadow-sm border border-slate-100 min-h-[400px] flex flex-col items-center justify-center text-slate-400 p-8">
                    <h3 className="text-lg font-medium text-slate-600">Watchlist Empty</h3>
                    <p className="text-sm">Star coins in the market view to track them here.</p>
                 </div>
              )}
              {activeTab === 'calculator' && (
                 <div className="bg-white rounded-xl shadow-sm border border-slate-100 min-h-[400px] flex flex-col items-center justify-center text-slate-400 p-8">
                    <h3 className="text-lg font-medium text-slate-600">Profit Calculator</h3>
                    <p className="text-sm">Calculate potential gains and risk/reward ratios.</p>
                 </div>
              )}
            </motion.div>
          </AnimatePresence>
          )}
        </main>
      </div>
    </div>
  );
}
