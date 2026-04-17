
import { useGameStore } from '../store/gameStore';

export function WireTab() {
  const { notifications } = useGameStore();
  const now = Date.now();

  function timeAgo(timestamp: number): string {
    const diff = now - timestamp;
    if (diff < 60000) return 'just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    return `${Math.floor(diff / 3600000)}h ago`;
  }

  const typeColor = {
    info: 'border-blue-800 text-blue-300',
    warning: 'border-yellow-800 text-yellow-400',
    danger: 'border-red-800 text-red-400',
    success: 'border-green-800 text-green-400',
  };

  return (
    <div className="p-4 space-y-3">
      <h2 className="text-mob-gold font-serif text-lg uppercase tracking-widest text-shadow-gold">
        The Wire
      </h2>
      <p className="text-mob-muted text-xs">Intel from the streets</p>

      {notifications.length === 0 ? (
        <div className="text-mob-muted text-xs text-center py-8">Nothing to report... yet.</div>
      ) : (
        <div className="space-y-2">
          {notifications.map(notif => (
            <div
              key={notif.id}
              className={`border-l-2 pl-3 py-1 ${typeColor[notif.type]}`}
            >
              <div className="text-xs">{notif.message}</div>
              <div className="text-mob-muted text-xs opacity-60">{timeAgo(notif.timestamp)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
