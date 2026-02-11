import { motion } from 'framer-motion';

interface MetricCardProps {
  label: string;
  value: string;
  subtext?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  icon?: React.ReactNode;
  onClick?: () => void;
}

export function MetricCard({ label, value, subtext, trend, trendValue, icon, onClick }: MetricCardProps) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      onClick={onClick}
      className={`bg-white rounded-xl shadow-sm p-6 border border-slate-100 hover:border-slate-300 transition-all ${onClick ? 'cursor-pointer hover:bg-slate-50' : 'cursor-default'}`}
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wide">{label}</h3>
        {icon && <div className="text-slate-400 opacity-50">{icon}</div>}
      </div>
      <div className="text-3xl font-bold text-slate-900 mb-1">{value}</div>
      {(subtext || trendValue) && (
        <div className="flex items-center gap-2 text-sm">
          {trendValue && (
            <span
              className={`font-semibold ${
                trend === 'up'
                  ? 'text-green-600'
                  : trend === 'down'
                  ? 'text-red-600'
                  : 'text-slate-500'
              }`}
            >
              {trend === 'up' ? '+' : ''}{trendValue}
            </span>
          )}
          {subtext && <span className="text-slate-400">{subtext}</span>}
        </div>
      )}
    </motion.div>
  );
}
