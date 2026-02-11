import {
  Search,
  Settings,
  Star,
  Zap,
  LayoutGrid,
  TrendingUp,
  Activity,
  Calculator,
  RefreshCw,
  Newspaper,
  Target
} from 'lucide-react';

export type TabId = 'alpha' | 'market' | 'watchlist' | 'heatmap' | 'whales' | 'news' | 'calculator' | 'sentiment';

const NAV_ITEMS = [
  { id: 'alpha', label: 'Alpha Terminal', icon: Target },
  { id: 'market', label: 'Market Overview', icon: LayoutGrid },
  { id: 'watchlist', label: 'My Watchlist', icon: Star },
  { id: 'heatmap', label: 'RSI Heatmap', icon: Zap },
  { id: 'whales', label: 'Whale Alert', icon: Activity },
  { id: 'news', label: 'News Feed', icon: Newspaper },
  { id: 'calculator', label: 'Profit Calculator', icon: Calculator },
];

interface SidebarProps {
  activeTab: TabId;
  setActiveTab: (id: TabId) => void;
}

export function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  return (
    <div className="w-64 h-screen bg-white border-r border-slate-200 flex flex-col sticky top-0 left-0 overflow-y-auto">
      <div className="p-6 border-b border-slate-100">
        <h1 className="text-xl font-bold flex items-center gap-2 text-slate-900">
          <TrendingUp className="text-blue-600" />
          <span>Crypto<span className="text-blue-600">Edge</span></span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">Professional Trading Dashboard</p>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id as TabId)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
              activeTab === item.id
                ? 'bg-blue-50 text-blue-700'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <item.icon size={18} />
            {item.label}
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-100">
        <div className="bg-slate-50 rounded-lg p-4 mb-4">
          <div className="text-xs font-semibold text-slate-500 uppercase mb-2">Market Status</div>
          <div className="flex items-center gap-2 text-sm text-green-600 font-medium">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            Live Feed Active
          </div>
        </div>
        <button className="w-full flex items-center gap-3 px-4 py-2 text-slate-500 hover:text-slate-900 text-sm font-medium transition-colors">
          <Settings size={18} />
          Settings
        </button>
      </div>
    </div>
  );
}

export function Header({ title }: { title: string }) {
  return (
    <header className="sticky top-0 z-10 bg-slate-50/80 backdrop-blur-md border-b border-slate-200 px-8 py-4 flex items-center justify-between">
      <h2 className="text-2xl font-bold text-slate-800">{title}</h2>
      <div className="flex items-center gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input 
            type="text" 
            placeholder="Search coin..." 
            className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 w-64 transition-all"
          />
        </div>
        <button className="p-2 bg-white border border-slate-200 rounded-lg text-slate-500 hover:text-slate-700 hover:border-slate-300 transition-colors">
            <RefreshCw size={18} />
        </button>
      </div>
    </header>
  );
}
