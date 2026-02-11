// components/whale-watch.tsx
import { Asset } from "@/lib/coincap";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Activity } from "lucide-react";
import { formatCurrency, formatCompactNumber } from "@/lib/utils";

interface WhaleAlert {
  id: string;
  coinId: string;
  symbol: string;
  price: number;
  amount: number;
  value: number;
  type: 'buy' | 'sell' | 'unknown';
  timestamp: Date;
}

interface WhaleWatchProps {
  initialAssets: Asset[];
}

export function WhaleWatch({ initialAssets }: WhaleWatchProps) {
  const [alerts, setAlerts] = useState<WhaleAlert[]>([]);
  const [threshold, setThreshold] = useState(50000); // Start at $50k
  const [status, setStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');

  useEffect(() => {
    if (!initialAssets.length) return;

    let ws: WebSocket;
    let reconnectTimer: NodeJS.Timeout;

    const connect = () => {
        // Use global trade stream
        ws = new WebSocket("wss://ws.coincap.io/trades");

        ws.onopen = () => setStatus('connected');
        
        ws.onclose = () => {
            setStatus('disconnected');
            // Try to reconnect in 3s
            reconnectTimer = setTimeout(connect, 3000);
        };
        
        ws.onerror = () => {
            setStatus('disconnected');
            ws.close();
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                // data example: { base: 'bitcoin', quote: 'tether', direction: 'sell', price: 63000, volume: 0.01, timestamp: 16... }
                
                const knownAsset = initialAssets.find(a => a.id === data.base);
                if (!knownAsset) return;

                const value = data.price * data.volume;
                
                if (value >= threshold) {
                  const newAlert: WhaleAlert = {
                    id: Math.random().toString(36).substr(2, 9),
                    coinId: data.base,
                    symbol: knownAsset.symbol,
                    price: data.price,
                    amount: data.volume,
                    value: value,
                    type: data.direction || 'unknown',
                    timestamp: new Date(data.timestamp)
                  };

                  setAlerts(prev => [newAlert, ...prev].slice(0, 50));
                }
            } catch {
                // Silent
            }
        };
    };

    connect();

    return () => {
        if (ws) ws.close();
        clearTimeout(reconnectTimer);
    };
  }, [initialAssets, threshold]);

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4 shrink-0">
        <div>
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Activity className="text-blue-500" />
            Live Whale Feed
            <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider ${
              status === 'connected' ? 'bg-green-100 text-green-700' : 
              status === 'connecting' ? 'bg-yellow-100 text-yellow-700' : 
              'bg-red-100 text-red-700'
            }`}>
              {status}
            </span>
          </h3>
          <p className="text-sm text-slate-500">
            Detecting large trades &gt; {formatCompactNumber(threshold)} (Global).
          </p>
        </div>
        
        <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-slate-600">Min Value:</label>
            <select 
                value={threshold} 
                onChange={(e) => { setAlerts([]); setThreshold(Number(e.target.value)); }}
                className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-shadow cursor-pointer"
            >
                <option value={10000}>$10k (Very Noisy)</option>
                <option value={50000}>$50k (Active)</option>
                <option value={100000}>$100k (Big Players)</option>
                <option value={500000}>$500k (Whales)</option>
                <option value={1000000}>$1M (Market Movers)</option>
            </select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden flex-1 flex flex-col relative min-h-[500px]">
        {/* Fixed Header */}
        <div className="grid grid-cols-5 px-6 py-3 bg-slate-50 text-xs font-semibold text-slate-500 uppercase border-b border-slate-200 shrink-0">
            <div className="col-span-1">Time</div>
            <div className="col-span-1">Asset</div>
            <div className="col-span-1 text-right">Size</div>
            <div className="col-span-1 text-right">Price</div>
            <div className="col-span-1 text-right">Value</div>
        </div>

        {/* Scrollable List Area */}
        <div className="flex-1 overflow-y-auto relative">
           <div className="absolute inset-0"> {/* Wrapper for absolute scrolling */}
            <AnimatePresence initial={false}>
            {alerts.map((alert) => (
                <motion.div
                key={alert.id}
                layout
                initial={{ opacity: 0, x: -20, backgroundColor: "rgba(239, 246, 255, 0.5)" }}
                animate={{ opacity: 1, x: 0, backgroundColor: "rgba(255, 255, 255, 0)" }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-5 px-6 py-3 border-b border-slate-50 items-center hover:bg-slate-50 transition-colors text-sm"
                >
                <div className="text-slate-400 font-mono text-xs">
                    {alert.timestamp.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit' })}
                </div>
                <div className="font-bold text-slate-800 flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] overflow-hidden shrink-0 relative">
                       <img 
                          src={`https://assets.coincap.io/assets/icons/${alert.symbol.toLowerCase()}@2x.png`}
                          alt={alert.symbol}
                          className="w-full h-full object-cover"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                       />
                    </div>
                    {alert.symbol}
                </div>
                <div className={`text-right font-medium ${alert.type === 'buy' ? 'text-green-600' : alert.type === 'sell' ? 'text-red-600' : 'text-slate-600'}`}>
                    {alert.type === 'buy' ? 'BUY' : alert.type === 'sell' ? 'SELL' : ''} {formatCompactNumber(alert.amount)}
                </div>
                <div className="text-right text-slate-500 font-mono text-xs">
                    {formatCurrency(alert.price)}
                </div>
                <div className="text-right font-bold text-slate-900 font-mono">
                    {formatCurrency(alert.value)}
                </div>
                </motion.div>
            ))}
            </AnimatePresence>
            
            {alerts.length === 0 && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 pointer-events-none">
                    <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mb-4 animate-pulse">
                        <Activity size={24} className="text-blue-400" />
                    </div>
                    <p>Scanning Global Markets for trades &gt; {formatCompactNumber(threshold)}...</p>
                </div>
            )}
        </div>
      </div>
    </div>
    </div>
  );
}
