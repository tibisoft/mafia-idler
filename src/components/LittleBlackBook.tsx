
import { useGameStore } from '../store/gameStore';
import type { Tab } from '../types/game';

const TABS: Array<{ id: Tab; label: string; icon: string }> = [
  { id: 'streets', label: 'The Streets', icon: '🗺️' },
  { id: 'family', label: 'The Family', icon: '👥' },
  { id: 'books', label: 'The Books', icon: '📒' },
  { id: 'wire', label: 'The Wire', icon: '📡' },
  { id: 'favors', label: 'Favors', icon: '📞' },
];

export function LittleBlackBook() {
  const { activeTab, setActiveTab, notifications } = useGameStore();
  
  const newNotifications = notifications.slice(0, 3);

  return (
    <nav className="flex border-t border-mob-border bg-mob-dark">
      {TABS.map(tab => {
        const isActive = tab.id === activeTab;
        const hasBadge = tab.id === 'wire' && newNotifications.length > 0;
        
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-3 flex flex-col items-center gap-0.5 transition-all relative ${
              isActive
                ? 'text-mob-gold border-t-2 border-mob-gold bg-mob-card'
                : 'text-mob-muted hover:text-mob-text border-t-2 border-transparent'
            }`}
          >
            <span className="text-base">{tab.icon}</span>
            <span className="text-xs tracking-wide hidden sm:block">
              {tab.label.split(' ').pop()}
            </span>
            {hasBadge && (
              <span className="absolute top-1 right-2 w-2 h-2 bg-red-500 rounded-full" />
            )}
          </button>
        );
      })}
    </nav>
  );
}
