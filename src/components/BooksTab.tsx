
import { useGameStore } from '../store/gameStore';
import { formatCash } from '../utils/format';
import { CREW_TEMPLATES } from '../data/gameData';

export function BooksTab() {
  const { upgrades, resources, purchaseUpgrade, crewCounts, neighborhoods, prestigeMultiplier, prestige, totalCashEarned, prestigeCount } = useGameStore();

  // Calculate total income per second
  let totalCashPerSec = 0;
  let totalHeatPerSec = 0;
  for (const template of CREW_TEMPLATES) {
    const count = crewCounts[template.rank] || 0;
    totalCashPerSec += template.cashPerSecond * count;
    totalHeatPerSec += template.heatPerSecond * count;
  }
  for (const n of neighborhoods) {
    if (!n.owned) continue;
    for (const r of n.rackets) {
      totalCashPerSec += r.cashPerSecond * r.level;
      totalHeatPerSec += r.heatPerSecond * r.level;
    }
  }
  totalCashPerSec *= prestigeMultiplier;

  const purchasedUpgrades = upgrades.filter(u => u.purchased);
  const availableUpgrades = upgrades.filter(u => !u.purchased);
  const nextPrestigeMultiplier = 1 + (prestigeCount + 1) * 0.5;

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-mob-gold font-serif text-lg uppercase tracking-widest text-shadow-gold">
        The Books
      </h2>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-mob-card border border-mob-border rounded p-3">
          <div className="text-mob-muted text-xs uppercase tracking-wider">Cash/sec</div>
          <div className="text-green-400 font-mono text-base font-bold">{formatCash(totalCashPerSec)}/s</div>
        </div>
        <div className="bg-mob-card border border-mob-border rounded p-3">
          <div className="text-mob-muted text-xs uppercase tracking-wider">Heat/sec</div>
          <div className="text-orange-400 font-mono text-base font-bold">+{totalHeatPerSec.toFixed(4)}/s</div>
        </div>
        <div className="bg-mob-card border border-mob-border rounded p-3">
          <div className="text-mob-muted text-xs uppercase tracking-wider">Total Earned</div>
          <div className="text-mob-gold font-mono text-base font-bold">{formatCash(totalCashEarned)}</div>
        </div>
        <div className="bg-mob-card border border-mob-border rounded p-3">
          <div className="text-mob-muted text-xs uppercase tracking-wider">Rep Mult</div>
          <div className="text-yellow-400 font-mono text-base font-bold">×{prestigeMultiplier.toFixed(1)}</div>
        </div>
      </div>

      {/* The Fall */}
      <div className="border border-mob-red/50 rounded-lg p-3 bg-mob-red/10">
        <div className="text-mob-text font-serif text-sm font-bold mb-1">⚖️ The Fall</div>
        <div className="text-mob-muted text-xs mb-2">
          Go down voluntarily. Do your time. Come back stronger with a higher reputation multiplier.
          Next run: ×{nextPrestigeMultiplier.toFixed(1)} multiplier
        </div>
        <button
          onClick={prestige}
          className="w-full text-sm py-2 rounded border border-mob-red/60 text-mob-red hover:bg-mob-red/20 transition-colors font-serif tracking-wider"
        >
          Take The Fall
        </button>
      </div>

      {/* Upgrades */}
      <div>
        <h3 className="text-mob-gold/80 text-xs uppercase tracking-widest mb-2">Upgrades</h3>
        <div className="space-y-2">
          {availableUpgrades.map(upgrade => {
            const canAfford = resources.cash >= upgrade.cashCost && resources.respect >= upgrade.respectCost;
            const requiresMet = !upgrade.requires || upgrades.find(u => u.id === upgrade.requires)?.purchased;

            return (
              <div
                key={upgrade.id}
                className={`border rounded-lg p-3 transition-all ${
                  !requiresMet ? 'opacity-40 border-mob-border' :
                  canAfford ? 'border-mob-gold/30 bg-mob-card' : 'border-mob-border bg-mob-dark'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="text-mob-text text-xs font-bold">{upgrade.name}</div>
                    <div className="text-mob-muted text-xs mt-0.5">{upgrade.description}</div>
                    {upgrade.requires && !requiresMet && (
                      <div className="text-mob-muted text-xs mt-0.5 opacity-60">
                        Requires: {upgrades.find(u => u.id === upgrade.requires)?.name}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => purchaseUpgrade(upgrade.id)}
                    disabled={!canAfford || !requiresMet}
                    className={`text-xs px-2 py-1 rounded font-mono whitespace-nowrap transition-all ${
                      canAfford && requiresMet
                        ? 'bg-mob-gold text-mob-black hover:bg-mob-gold-light font-bold'
                        : 'bg-mob-border text-mob-muted cursor-not-allowed'
                    }`}
                  >
                    {formatCash(upgrade.cashCost)}
                    {upgrade.respectCost > 0 && ` + ${upgrade.respectCost}⭐`}
                  </button>
                </div>
              </div>
            );
          })}
          {purchasedUpgrades.map(upgrade => (
            <div key={upgrade.id} className="border border-mob-gold/20 rounded-lg p-2 opacity-60">
              <div className="flex items-center gap-2">
                <span className="text-mob-gold text-xs">✓</span>
                <span className="text-mob-muted text-xs">{upgrade.name}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
