
import { useGameStore } from '../store/gameStore';

export function FallScreen() {
  const { isFalling, fallTimer } = useGameStore();

  if (!isFalling) return null;

  const secondsLeft = Math.ceil(fallTimer / 1000);

  return (
    <div className="fixed inset-0 bg-black/95 flex flex-col items-center justify-center z-50">
      <div className="text-center max-w-sm mx-auto px-6">
        <div className="text-6xl mb-6 grayscale">⚖️</div>
        <div className="text-mob-text font-serif text-xl mb-2">The Gavel Falls</div>
        <div className="text-mob-muted text-sm mb-6 italic">
          "Guilty on all counts. The court sentences you to..."
        </div>
        <div className="text-mob-gold font-mono text-4xl font-bold mb-2">{secondsLeft}s</div>
        <div className="text-mob-muted text-xs uppercase tracking-widest">Doing Your Time</div>
        <div className="mt-6 text-mob-muted text-xs">
          You'll come out stronger. The streets don't forget.
        </div>
      </div>
    </div>
  );
}
