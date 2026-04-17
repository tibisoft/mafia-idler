
import { useGameStore } from '../store/gameStore';
import { formatCash } from '../utils/format';

export function StreetsTab() {
  const { neighborhoods, resources, acquireTerritory, upgradeRacket } = useGameStore();

  return (
    <div className="p-4 space-y-3">
      <h2 className="text-mob-gold font-serif text-lg uppercase tracking-widest text-shadow-gold">
        The Streets
      </h2>
      <p className="text-mob-muted text-xs">Your territory across the city</p>

      <div className="grid gap-3">
        {neighborhoods.map(neighborhood => (
          <div
            key={neighborhood.id}
            className={`border rounded-lg overflow-hidden transition-all ${
              neighborhood.owned
                ? 'border-mob-gold/40 bg-mob-card'
                : 'border-mob-border bg-mob-dark opacity-80'
            }`}
          >
            <div className="px-3 py-2 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${neighborhood.owned ? 'bg-mob-gold' : 'bg-mob-muted'}`} />
                  <span className="font-serif text-sm font-bold text-mob-text">{neighborhood.name}</span>
                </div>
                {!neighborhood.owned && neighborhood.rivalFamily && (
                  <div className="text-xs text-mob-muted mt-0.5">Held by: {neighborhood.rivalFamily}</div>
                )}
              </div>
              {!neighborhood.owned && (
                <button
                  onClick={() => acquireTerritory(neighborhood.id)}
                  disabled={resources.cash < (neighborhood.tributeCost || 0)}
                  className={`text-xs px-3 py-1 rounded font-mono transition-all ${
                    resources.cash >= (neighborhood.tributeCost || 0)
                      ? 'bg-mob-gold text-mob-black hover:bg-mob-gold-light cursor-pointer'
                      : 'bg-mob-border text-mob-muted cursor-not-allowed'
                  }`}
                >
                  {formatCash(neighborhood.tributeCost || 0)} to Muscle In
                </button>
              )}
            </div>

            {neighborhood.owned && (
              <div className="px-3 pb-3 space-y-2">
                {neighborhood.rackets.map(racket => (
                  <div key={racket.type} className="flex items-center justify-between bg-mob-black/40 rounded p-2">
                    <div>
                      <div className="text-xs font-mono text-mob-text">{racket.name}</div>
                      <div className="text-xs text-mob-muted">
                        Lvl {racket.level} · {formatCash(racket.cashPerSecond * racket.level)}/s · 🌡+{(racket.heatPerSecond * racket.level).toFixed(3)}/s
                      </div>
                    </div>
                    <button
                      onClick={() => upgradeRacket(neighborhood.id, racket.type)}
                      disabled={resources.cash < racket.upgradeCost}
                      className={`text-xs px-2 py-1 rounded font-mono transition-all ${
                        resources.cash >= racket.upgradeCost
                          ? 'bg-mob-gold/20 text-mob-gold hover:bg-mob-gold/30 border border-mob-gold/30'
                          : 'bg-mob-border/20 text-mob-muted border border-mob-border'
                      }`}
                    >
                      ↑ {formatCash(racket.upgradeCost)}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
