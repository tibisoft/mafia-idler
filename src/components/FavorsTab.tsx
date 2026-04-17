import { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { FAVORS } from '../data/gameData';
import type { FavorType } from '../types/game';
import { formatTime } from '../utils/format';

export function FavorsTab() {
  const { favorCooldowns, useFavor, crew } = useGameStore();
  const [phoneRinging, setPhoneRinging] = useState<FavorType | null>(null);
  const [pendingFavor, setPendingFavor] = useState<FavorType | null>(null);

  const now = Date.now();

  const hasPinchedCrew = crew.some(c => c.isPinched);

  function handleFavorClick(favorType: FavorType) {
    setPhoneRinging(favorType);
    setPendingFavor(favorType);
  }

  function handleAccept() {
    if (pendingFavor) {
      useFavor(pendingFavor);
    }
    setPhoneRinging(null);
    setPendingFavor(null);
  }

  function handleHangUp() {
    setPhoneRinging(null);
    setPendingFavor(null);
  }

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-mob-gold font-serif text-lg uppercase tracking-widest text-shadow-gold">
        Favors
      </h2>
      <p className="text-mob-muted text-xs">Pull strings through your Consigliere. Each favor costs nothing — just your patience.</p>

      {phoneRinging && pendingFavor && (() => {
        const favor = FAVORS.find(f => f.type === pendingFavor);
        if (!favor) return null;
        return (
          <div className="fixed inset-0 bg-black/80 flex items-end justify-center z-50 pb-8">
            <div className="bg-mob-dark border border-mob-gold/40 rounded-xl p-6 max-w-sm w-full mx-4 text-center">
              <div className="text-5xl mb-4 animate-bounce">📞</div>
              <div className="text-mob-gold font-serif text-sm uppercase tracking-widest mb-1">Consigliere Calling...</div>
              <div className="text-mob-text text-base font-bold mb-2">{favor.name}</div>
              <div className="text-mob-muted text-xs mb-4 italic">"{favor.description}"</div>
              <div className="text-green-400 text-sm mb-6 font-mono">→ {favor.rewardDescription}</div>
              <div className="flex gap-3">
                <button
                  onClick={handleHangUp}
                  className="flex-1 py-3 border border-red-800 text-red-400 rounded-lg text-sm hover:bg-red-900/30 transition-colors"
                >
                  Hang Up
                </button>
                <button
                  onClick={handleAccept}
                  className="flex-1 py-3 bg-mob-gold text-mob-black rounded-lg text-sm font-bold hover:bg-mob-gold-light transition-colors"
                >
                  Accept
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      <div className="space-y-3">
        {FAVORS.map(favor => {
          const lastUsed = favorCooldowns[favor.type];
          const cooldownRemaining = lastUsed ? Math.max(0, favor.cooldown - (now - lastUsed)) : 0;
          const isOnCooldown = cooldownRemaining > 0;
          
          const isDisabled = isOnCooldown || 
            (favor.type === 'the_bailout' && !hasPinchedCrew);

          return (
            <div
              key={favor.type}
              className={`border rounded-lg p-3 transition-all ${
                isDisabled ? 'border-mob-border opacity-60' : 'border-mob-gold/30 bg-mob-card hover:border-mob-gold/60'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <div className="text-mob-text text-sm font-bold font-serif">{favor.name}</div>
                  <div className="text-mob-muted text-xs mt-0.5">{favor.description}</div>
                  <div className="text-green-400 text-xs mt-1 font-mono">→ {favor.rewardDescription}</div>
                  {favor.type === 'the_bailout' && !hasPinchedCrew && (
                    <div className="text-mob-muted text-xs mt-1 italic">No one's pinched right now</div>
                  )}
                </div>
                <div className="text-right">
                  {isOnCooldown ? (
                    <div className="text-mob-muted text-xs font-mono">{formatTime(cooldownRemaining)}</div>
                  ) : (
                    <button
                      onClick={() => handleFavorClick(favor.type)}
                      disabled={isDisabled}
                      className={`text-xs px-3 py-1.5 rounded font-mono transition-all ${
                        !isDisabled
                          ? 'bg-mob-gold text-mob-black hover:bg-mob-gold-light font-bold'
                          : 'bg-mob-border text-mob-muted cursor-not-allowed'
                      }`}
                    >
                      Call
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="text-mob-muted text-xs text-center opacity-60 pt-2">
        Favors are limited — cap of 5 per day. Choose wisely.
      </div>
    </div>
  );
}
