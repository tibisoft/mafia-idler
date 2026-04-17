import { useEffect, useRef } from 'react';
import { useGameStore } from './store/gameStore';
import { ResourceBar } from './components/ResourceBar';
import { HeatMeter } from './components/HeatMeter';
import { LittleBlackBook } from './components/LittleBlackBook';
import { StreetsTab } from './components/StreetsTab';
import { FamilyTab } from './components/FamilyTab';
import { BooksTab } from './components/BooksTab';
import { WireTab } from './components/WireTab';
import { FavorsTab } from './components/FavorsTab';
import { FallScreen } from './components/FallScreen';

function App() {
  const { tick, activeTab, resources } = useGameStore();
  const tickRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    tickRef.current = window.setInterval(tick, 100);
    return () => window.clearInterval(tickRef.current);
  }, [tick]);

  const heatVignette = 
    resources.heat > 80 ? 'shadow-[inset_0_0_80px_rgba(204,34,34,0.4)]' :
    resources.heat > 60 ? 'shadow-[inset_0_0_60px_rgba(139,26,26,0.2)]' :
    resources.heat > 40 ? 'shadow-[inset_0_0_40px_rgba(184,134,11,0.1)]' : '';

  return (
    <div className={`min-h-screen bg-mob-black flex flex-col relative ${heatVignette}`}>
      <FallScreen />
      
      {/* Header */}
      <header className="bg-mob-dark border-b border-mob-border py-2 px-4 flex items-center justify-between">
        <div className="font-serif text-mob-gold text-base tracking-[0.2em] uppercase text-shadow-gold">
          Mafia Idler
        </div>
        <div className="text-mob-muted text-xs font-mono tracking-wider opacity-70">
          {new Date().toLocaleTimeString()}
        </div>
      </header>

      {/* Resource Bar */}
      <ResourceBar />

      {/* Heat Meter */}
      <div className="px-4 pt-2 border-b border-mob-border/50">
        <HeatMeter />
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-4">
        {activeTab === 'streets' && <StreetsTab />}
        {activeTab === 'family' && <FamilyTab />}
        {activeTab === 'books' && <BooksTab />}
        {activeTab === 'wire' && <WireTab />}
        {activeTab === 'favors' && <FavorsTab />}
      </main>

      {/* Navigation */}
      <LittleBlackBook />
    </div>
  );
}

export default App;
