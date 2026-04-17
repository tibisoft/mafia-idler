
import { useGameStore } from '../store/gameStore';
import { formatCash, formatNumber } from '../utils/format';

export function ResourceBar() {
  const { resources, prestigeCount, prestigeMultiplier } = useGameStore();

  const heatColor = 
    resources.heat < 20 ? 'text-blue-400' :
    resources.heat < 40 ? 'text-yellow-400' :
    resources.heat < 60 ? 'text-orange-400' :
    resources.heat < 80 ? 'text-red-400' : 'text-red-600 animate-pulse';

  return (
    <div className="bg-mob-dark border-b border-mob-border px-4 py-2">
      <div className="max-w-4xl mx-auto flex flex-wrap gap-4 items-center justify-between">
        <div className="flex items-center gap-1">
          <span className="text-mob-gold font-mono text-xs uppercase tracking-widest">💰</span>
          <span className="text-mob-gold font-mono text-sm font-bold">{formatCash(resources.cash)}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-xs uppercase tracking-widest">🌡</span>
          <span className={`font-mono text-sm font-bold ${heatColor}`}>{resources.heat.toFixed(1)}%</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-xs uppercase tracking-widest">🤝</span>
          <span className="text-purple-400 font-mono text-sm">{formatNumber(resources.loyalty)}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-xs uppercase tracking-widest">⭐</span>
          <span className="text-yellow-500 font-mono text-sm">{formatNumber(resources.respect)}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-xs uppercase tracking-widest">📁</span>
          <span className="text-green-500 font-mono text-sm">{formatNumber(resources.dirt)}</span>
        </div>
        {prestigeCount > 0 && (
          <div className="flex items-center gap-1">
            <span className="text-xs text-mob-muted">Run #{prestigeCount + 1}</span>
            <span className="text-mob-gold text-xs">×{prestigeMultiplier.toFixed(1)}</span>
          </div>
        )}
      </div>
    </div>
  );
}
