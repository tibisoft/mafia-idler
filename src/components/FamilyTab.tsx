
import { useGameStore } from '../store/gameStore';
import { formatCash } from '../utils/format';
import { CREW_TEMPLATES } from '../data/gameData';
import type { CrewRank } from '../types/game';

export function FamilyTab() {
  const { crewCounts, crew, resources, hireCrew, bailOutCrew } = useGameStore();

  const pinchedMembers = crew.filter(c => c.isPinched);

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-mob-gold font-serif text-lg uppercase tracking-widest text-shadow-gold">
        The Family
      </h2>

      {pinchedMembers.length > 0 && (
        <div className="border border-red-800 rounded bg-red-900/20 p-3">
          <div className="text-red-400 text-xs uppercase tracking-widest mb-2">⚠️ Pinched</div>
          {pinchedMembers.map(member => (
            <div key={member.id} className="flex items-center justify-between py-1">
              <div>
                <span className="text-mob-muted text-xs line-through">{member.name} "{member.nickname}"</span>
                {member.pinchedUntil && (
                  <span className="text-xs text-red-500 ml-2">
                    Free in {Math.max(0, Math.ceil((member.pinchedUntil - Date.now()) / 60000))}m
                  </span>
                )}
              </div>
              <button
                onClick={() => bailOutCrew(member.id)}
                disabled={resources.cash < 500}
                className="text-xs bg-mob-gold/20 text-mob-gold border border-mob-gold/30 px-2 py-0.5 rounded hover:bg-mob-gold/30"
              >
                Bail $500
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="grid gap-3">
        {CREW_TEMPLATES.map(template => {
          const count = crewCounts[template.rank] || 0;
          const canAfford = resources.cash >= template.cashCost && resources.loyalty >= template.loyaltyCost;
          const isUnlocked = resources.cash >= template.unlockCash || count > 0;
          const isMaxed = count >= template.maxCount;

          if (!isUnlocked) {
            return (
              <div key={template.rank} className="border border-mob-border/40 rounded-lg p-3 opacity-40">
                <div className="text-mob-muted text-xs">🔒 Unlock at {formatCash(template.unlockCash)}</div>
              </div>
            );
          }

          return (
            <div key={template.rank} className="border border-mob-border rounded-lg p-3 bg-mob-card">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-mob-gold font-serif text-sm font-bold">{template.title}</span>
                    <span className="text-mob-muted font-mono text-xs bg-mob-black px-1.5 rounded">{count}/{template.maxCount}</span>
                  </div>
                  <div className="text-mob-muted text-xs mt-0.5">{template.specialAbility}</div>
                  <div className="flex gap-3 mt-1">
                    <span className="text-green-400 text-xs font-mono">+{formatCash(template.cashPerSecond * count)}/s</span>
                    {template.heatPerSecond > 0 && (
                      <span className="text-orange-400 text-xs font-mono">🌡+{(template.heatPerSecond * count).toFixed(3)}/s</span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => hireCrew(template.rank as CrewRank)}
                  disabled={!canAfford || isMaxed}
                  className={`ml-3 text-xs px-3 py-1.5 rounded font-mono transition-all ${
                    isMaxed
                      ? 'bg-mob-border text-mob-muted cursor-not-allowed'
                      : canAfford
                      ? 'bg-mob-gold text-mob-black hover:bg-mob-gold-light cursor-pointer font-bold'
                      : 'bg-mob-border text-mob-muted cursor-not-allowed'
                  }`}
                >
                  {isMaxed ? 'MAX' : (
                    <span>
                      {formatCash(template.cashCost)}
                      {template.loyaltyCost > 0 && ` + ${template.loyaltyCost}🤝`}
                    </span>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
