
import { useGameStore } from '../store/gameStore';
import { HEAT_TIERS } from '../data/gameData';

export function HeatMeter() {
  const { resources, spendDirt, raidWarningActive, raidTimer } = useGameStore();
  const heat = resources.heat;
  
  const currentTier = [...HEAT_TIERS].reverse().find(t => heat >= t.min) || HEAT_TIERS[0];
  
  const tierColors = [
    'from-blue-900 to-blue-700',
    'from-yellow-900 to-yellow-600',
    'from-orange-900 to-orange-600',
    'from-red-900 to-red-700',
    'from-red-900 to-red-500',
  ];
  
  const tierIndex = HEAT_TIERS.indexOf(currentTier);
  const gradient = tierColors[tierIndex] || tierColors[0];

  const now = Date.now();
  const raidSecondsLeft = raidTimer ? Math.max(0, Math.ceil((raidTimer - now) / 1000)) : 0;

  return (
    <div className="p-3">
      <div className="text-xs uppercase tracking-widest text-mob-muted mb-2 flex justify-between">
        <span>Heat Level</span>
        <span className="font-mono" style={{ color: currentTier.color }}>{currentTier.name}</span>
      </div>
      
      <div className="h-3 bg-mob-black rounded-full overflow-hidden mb-2">
        <div
          className={`h-full bg-gradient-to-r ${gradient} transition-all duration-500 ${heat > 80 ? 'animate-pulse' : ''}`}
          style={{ width: `${heat}%` }}
        />
      </div>

      {raidWarningActive && (
        <div className="mt-2 p-2 border border-red-600 rounded bg-red-900/30 text-center animate-pulse">
          <div className="text-red-400 text-xs font-bold uppercase tracking-widest">⚠️ RICO RAID IN {raidSecondsLeft}s</div>
          <button
            onClick={() => spendDirt(5)}
            className="mt-1 text-xs bg-red-800 hover:bg-red-700 text-white px-3 py-1 rounded"
            disabled={resources.dirt < 5}
          >
            Spend 5 Dirt (-25 Heat)
          </button>
        </div>
      )}

      {resources.dirt > 0 && !raidWarningActive && heat > 30 && (
        <button
          onClick={() => spendDirt(1)}
          className="mt-1 w-full text-xs text-mob-muted hover:text-mob-text border border-mob-border rounded px-2 py-1 transition-colors"
        >
          Spend 1 Dirt (-5 Heat) [{resources.dirt.toFixed(1)} available]
        </button>
      )}
    </div>
  );
}
