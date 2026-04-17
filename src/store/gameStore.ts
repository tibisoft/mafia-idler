import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { GameState, CrewRank, FavorType, Tab, Notification } from '../types/game';
import { CREW_TEMPLATES, INITIAL_NEIGHBORHOODS, UPGRADES, FAVORS, generateCrewName } from '../data/gameData';

const INITIAL_STATE: GameState = {
  resources: {
    cash: 10,
    heat: 0,
    loyalty: 0,
    respect: 0,
    dirt: 0,
  },
  crew: [],
  neighborhoods: INITIAL_NEIGHBORHOODS.map(n => ({ ...n, rackets: n.rackets.map(r => ({ ...r })) })),
  upgrades: UPGRADES.map(u => ({ ...u })),
  notifications: [],
  activeTab: 'streets',
  prestigeCount: 0,
  prestigeMultiplier: 1,
  isFalling: false,
  fallTimer: 0,
  lastTick: Date.now(),
  gameStarted: true,
  activeFavors: [],
  favorCooldowns: {},
  crewCounts: {
    street_kid: 0,
    runner: 0,
    enforcer: 0,
    soldier: 0,
    capo: 0,
    underboss: 0,
    consigliere: 0,
    don: 0,
  },
  totalCashEarned: 0,
  raidWarningActive: false,
};

interface GameStore extends GameState {
  tick: () => void;
  hireCrew: (rank: CrewRank) => void;
  upgradeRacket: (neighborhoodId: string, racketType: string) => void;
  acquireTerritory: (neighborhoodId: string) => void;
  purchaseUpgrade: (upgradeId: string) => void;
  useFavor: (favorType: FavorType) => void;
  bailOutCrew: (crewId: string) => void;
  setActiveTab: (tab: Tab) => void;
  prestige: () => void;
  spendDirt: (amount: number) => void;
  addNotification: (message: string, type: Notification['type']) => void;
  dismissRaid: () => void;
}

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      ...INITIAL_STATE,

      addNotification: (message: string, type: Notification['type']) => {
        const notification: Notification = {
          id: `notif_${Date.now()}_${Math.random()}`,
          timestamp: Date.now(),
          message,
          type,
        };
        set(state => ({
          notifications: [notification, ...state.notifications].slice(0, 50),
        }));
      },

      tick: () => {
        const state = get();
        const now = Date.now();
        const deltaMs = now - state.lastTick;
        const deltaS = deltaMs / 1000;

        if (deltaS <= 0) return;

        // If in "The Fall" (prestige countdown), handle that
        if (state.isFalling) {
          const newFallTimer = state.fallTimer - deltaMs;
          if (newFallTimer <= 0) {
            // Complete prestige
            const newPrestigeCount = state.prestigeCount + 1;
            const newMultiplier = 1 + newPrestigeCount * 0.5;
            get().addNotification(`You did your time. Back on the streets with a ${(newMultiplier * 100).toFixed(0)}% reputation multiplier.`, 'success');
            set({
              ...INITIAL_STATE,
              neighborhoods: INITIAL_NEIGHBORHOODS.map(n => ({ ...n, rackets: n.rackets.map(r => ({ ...r })) })),
              upgrades: UPGRADES.map(u => ({ ...u })),
              prestigeCount: newPrestigeCount,
              prestigeMultiplier: newMultiplier,
              resources: { cash: 50 * newMultiplier, heat: 0, loyalty: 0, respect: state.resources.respect + 10, dirt: 0 },
              isFalling: false,
              fallTimer: 0,
              lastTick: now,
            });
            return;
          }
          set({ fallTimer: newFallTimer, lastTick: now });
          return;
        }

        // Calculate income from crew
        let cashIncome = 0;
        let heatIncome = 0;
        let loyaltyIncome = 0;
        let respectIncome = 0;

        const crewCounts = state.crewCounts;
        const activeFavorTypes = state.activeFavors
          .filter(f => f.expiresAt > now)
          .map(f => f.type);

        const cashMultiplier = activeFavorTypes.includes('the_tip') ? 2 : 1;
        const loyaltyMultiplier = activeFavorTypes.includes('go_to_mattresses') ? 2 : 1;
        const heatFrozen = activeFavorTypes.includes('the_inside_man');

        for (const template of CREW_TEMPLATES) {
          const count = crewCounts[template.rank] || 0;
          if (count === 0) continue;
          const activeCrew = count - state.crew.filter(c => c.rank === template.rank && c.isPinched).length;
          if (activeCrew <= 0) continue;
          cashIncome += template.cashPerSecond * activeCrew;
          heatIncome += template.heatPerSecond * activeCrew;
          loyaltyIncome += template.loyaltyPerSecond * activeCrew;
          respectIncome += template.respectPerSecond * activeCrew;
        }

        // Income from rackets (owned neighborhoods)
        for (const neighborhood of state.neighborhoods) {
          if (!neighborhood.owned) continue;
          for (const racket of neighborhood.rackets) {
            cashIncome += racket.cashPerSecond * racket.level;
            heatIncome += racket.heatPerSecond * racket.level;
            loyaltyIncome += racket.loyaltyPerSecond * racket.level;
          }
        }

        // Apply upgrades
        let globalCashMult = 1;
        let heatReduction = 0;
        let heatDecayMult = 1;

        for (const upgrade of state.upgrades) {
          if (!upgrade.purchased) continue;
          if (upgrade.effect.cashMultiplier) globalCashMult += upgrade.effect.cashMultiplier;
          if (upgrade.effect.heatReduction) heatReduction += upgrade.effect.heatReduction;
          if (upgrade.effect.heatDecayMultiplier) heatDecayMult = upgrade.effect.heatDecayMultiplier;
          if (upgrade.effect.globalMultiplier) globalCashMult += upgrade.effect.globalMultiplier;
        }

        // Check consigliere heat bonus
        if (crewCounts.consigliere > 0) heatReduction += 0.2;

        cashIncome *= globalCashMult * cashMultiplier * state.prestigeMultiplier;
        loyaltyIncome *= loyaltyMultiplier;
        if (!heatFrozen) {
          heatIncome *= (1 - heatReduction);
        } else {
          heatIncome = 0;
        }

        // Heat decay (natural cooling)
        const heatDecay = 0.01 * heatDecayMult; // per second
        const currentHeat = state.resources.heat;
        const newHeat = Math.max(0, Math.min(100, currentHeat + (heatIncome - heatDecay) * deltaS));
        
        const newCash = Math.max(0, state.resources.cash + cashIncome * deltaS);
        const newLoyalty = Math.min(200, state.resources.loyalty + loyaltyIncome * deltaS);
        const newRespect = state.resources.respect + respectIncome * deltaS;
        const newDirt = Math.min(50, state.resources.dirt + 0.001 * deltaS);

        const cashEarned = cashIncome * deltaS;

        // Check if any pinched crew should be released
        const updatedCrew = state.crew.map(member => {
          if (member.isPinched && member.pinchedUntil && now >= member.pinchedUntil) {
            get().addNotification(`${member.name} "${member.nickname}" is back on the streets.`, 'info');
            return { ...member, isPinched: false, pinchedUntil: undefined };
          }
          return member;
        });

        // Heat consequences
        let updatedCrewFinal = updatedCrew;
        
        // FBI tier - chance to pinch crew member
        if (newHeat >= 60 && Math.random() < 0.0002 * deltaS) {
          const activeCrew = updatedCrew.filter(c => !c.isPinched);
          if (activeCrew.length > 0) {
            const victim = activeCrew[Math.floor(Math.random() * activeCrew.length)];
            const pinchedDuration = 30 * 60 * 1000 + Math.random() * 30 * 60 * 1000; // 30-60 min
            updatedCrewFinal = updatedCrew.map(c =>
              c.id === victim.id
                ? { ...c, isPinched: true, pinchedUntil: now + pinchedDuration }
                : c
            );
            get().addNotification(`${victim.name} "${victim.nickname}" got pinched! Heat is too high.`, 'danger');
          }
        }

        // RICO warning
        let raidWarningActive = state.raidWarningActive;
        let raidTimer = state.raidTimer;
        
        if (newHeat >= 95 && !state.raidWarningActive) {
          raidWarningActive = true;
          raidTimer = now + 60 * 1000; // 60 seconds
          get().addNotification('⚠️ RICO INVESTIGATION — You have 60 seconds! Spend Dirt to avoid a raid!', 'danger');
        }

        // RICO raid hits
        if (state.raidWarningActive && state.raidTimer && now >= state.raidTimer) {
          // Raid! Lose half cash, all crew pinched
          const ricoProtection = state.upgrades.find(u => u.id === 'offshore_accounts' && u.purchased)
            ? 0.5 : 1;
          get().addNotification('🚨 RAID! The feds swept your operation. You lost cash and crew!', 'danger');
          set({
            resources: {
              ...state.resources,
              cash: newCash * (1 - ricoProtection),
              heat: 40,
              loyalty: Math.max(0, state.resources.loyalty - 20),
            },
            crew: updatedCrewFinal.map(c => ({
              ...c,
              isPinched: true,
              pinchedUntil: now + 60 * 60 * 1000,
            })),
            raidWarningActive: false,
            raidTimer: undefined,
            lastTick: now,
          });
          return;
        }

        // Clean up expired favors
        const activeFavors = state.activeFavors.filter(f => f.expiresAt > now);

        set({
          resources: {
            cash: newCash,
            heat: newHeat,
            loyalty: newLoyalty,
            respect: newRespect,
            dirt: newDirt,
          },
          crew: updatedCrewFinal,
          activeFavors,
          totalCashEarned: state.totalCashEarned + cashEarned,
          lastTick: now,
          raidWarningActive,
          raidTimer,
        });
      },

      hireCrew: (rank: CrewRank) => {
        const state = get();
        const template = CREW_TEMPLATES.find(t => t.rank === rank);
        if (!template) return;

        const currentCount = state.crewCounts[rank] || 0;
        if (currentCount >= template.maxCount) {
          get().addNotification(`You already have the maximum number of ${template.title}s.`, 'warning');
          return;
        }

        if (state.resources.cash < template.cashCost) {
          get().addNotification(`Not enough cash to hire a ${template.title}.`, 'warning');
          return;
        }

        if (state.resources.loyalty < template.loyaltyCost) {
          get().addNotification(`Not enough loyalty to hire a ${template.title}.`, 'warning');
          return;
        }

        const { name, nickname } = generateCrewName();
        const newMember = {
          id: `crew_${Date.now()}_${Math.random()}`,
          rank,
          name,
          nickname,
          isPinched: false,
        };

        set(state => ({
          resources: {
            ...state.resources,
            cash: state.resources.cash - template.cashCost,
            loyalty: state.resources.loyalty - template.loyaltyCost,
          },
          crew: [...state.crew, newMember],
          crewCounts: {
            ...state.crewCounts,
            [rank]: (state.crewCounts[rank] || 0) + 1,
          },
        }));

        get().addNotification(`${name} "${nickname}" joined the family as a ${template.title}.`, 'success');
      },

      upgradeRacket: (neighborhoodId: string, racketType: string) => {
        const state = get();
        const neighborhood = state.neighborhoods.find(n => n.id === neighborhoodId);
        if (!neighborhood || !neighborhood.owned) return;
        const racket = neighborhood.rackets.find(r => r.type === racketType);
        if (!racket) return;

        if (state.resources.cash < racket.upgradeCost) {
          get().addNotification(`Not enough cash to upgrade this racket.`, 'warning');
          return;
        }

        const newNeighborhoods = state.neighborhoods.map(n => {
          if (n.id !== neighborhoodId) return n;
          return {
            ...n,
            rackets: n.rackets.map(r => {
              if (r.type !== racketType) return r;
              const nextLevel = r.level + 1;
              return {
                ...r,
                level: nextLevel,
                cashPerSecond: r.cashPerSecond * 1.5,
                heatPerSecond: r.heatPerSecond * 1.3,
                loyaltyPerSecond: r.loyaltyPerSecond * 1.4,
                upgradeCost: Math.floor(r.upgradeCost * 2.5),
              };
            }),
          };
        });

        set(state => ({
          neighborhoods: newNeighborhoods,
          resources: {
            ...state.resources,
            cash: state.resources.cash - racket.upgradeCost,
          },
        }));

        get().addNotification(`Upgraded ${racket.name} in ${neighborhood.name} to level ${racket.level + 1}.`, 'success');
      },

      acquireTerritory: (neighborhoodId: string) => {
        const state = get();
        const neighborhood = state.neighborhoods.find(n => n.id === neighborhoodId);
        if (!neighborhood || neighborhood.owned) return;

        const cost = neighborhood.tributeCost || 0;
        if (state.resources.cash < cost) {
          get().addNotification(`Not enough cash to move on ${neighborhood.name}.`, 'warning');
          return;
        }

        const newHeat = Math.min(100, state.resources.heat + 10);
        set(state => ({
          neighborhoods: state.neighborhoods.map(n =>
            n.id === neighborhoodId ? { ...n, owned: true, rivalFamily: undefined } : n
          ),
          resources: {
            ...state.resources,
            cash: state.resources.cash - cost,
            heat: newHeat,
          },
        }));

        get().addNotification(`${neighborhood.name} is now under your control. The ${neighborhood.rivalFamily} won't be happy.`, 'success');
      },

      purchaseUpgrade: (upgradeId: string) => {
        const state = get();
        const upgrade = state.upgrades.find(u => u.id === upgradeId);
        if (!upgrade || upgrade.purchased) return;

        if (upgrade.requires) {
          const required = state.upgrades.find(u => u.id === upgrade.requires);
          if (!required?.purchased) {
            get().addNotification(`You need "${required?.name}" first.`, 'warning');
            return;
          }
        }

        if (state.resources.cash < upgrade.cashCost) {
          get().addNotification('Not enough cash for this upgrade.', 'warning');
          return;
        }

        if (state.resources.respect < upgrade.respectCost) {
          get().addNotification('Not enough respect for this upgrade.', 'warning');
          return;
        }

        set(state => ({
          upgrades: state.upgrades.map(u =>
            u.id === upgradeId ? { ...u, purchased: true } : u
          ),
          resources: {
            ...state.resources,
            cash: state.resources.cash - upgrade.cashCost,
            respect: state.resources.respect - upgrade.respectCost,
          },
        }));

        get().addNotification(`"${upgrade.name}" acquired.`, 'success');
      },

      useFavor: (favorType: FavorType) => {
        const state = get();
        const favor = FAVORS.find(f => f.type === favorType);
        if (!favor) return;

        const now = Date.now();
        const lastUsed = state.favorCooldowns[favorType];
        if (lastUsed && now - lastUsed < favor.cooldown) return;

        // Apply favor effect
        const newState: Partial<GameState> = {
          favorCooldowns: {
            ...state.favorCooldowns,
            [favorType]: now,
          },
        };

        if (favorType === 'the_tip' || favorType === 'the_inside_man' || favorType === 'go_to_mattresses') {
          newState.activeFavors = [
            ...state.activeFavors.filter(f => f.type !== favorType),
            { type: favorType, expiresAt: now + (favor.duration || 0) },
          ];
        } else if (favorType === 'the_bribe') {
          newState.resources = {
            ...state.resources,
            heat: state.resources.heat * 0.75,
          };
        } else if (favorType === 'the_shipment') {
          // 5 minutes of income
          const cashBonus = calculateTotalIncome(state) * 300;
          newState.resources = {
            ...state.resources,
            cash: state.resources.cash + cashBonus,
          };
        } else if (favorType === 'the_bailout') {
          const pinchedMember = state.crew.find(c => c.isPinched);
          if (pinchedMember) {
            set(s => ({
              crew: s.crew.map(c =>
                c.id === pinchedMember.id ? { ...c, isPinched: false, pinchedUntil: undefined } : c
              ),
              favorCooldowns: { ...s.favorCooldowns, [favorType]: now },
            }));
            get().addNotification(`${pinchedMember.name} "${pinchedMember.nickname}" bailed out.`, 'success');
            return;
          }
        }

        set(newState);
        get().addNotification(`Favor activated: ${favor.rewardDescription}`, 'success');
      },

      bailOutCrew: (crewId: string) => {
        const state = get();
        const member = state.crew.find(c => c.id === crewId);
        if (!member || !member.isPinched) return;

        const bailCost = 500;
        if (state.resources.cash < bailCost) {
          get().addNotification('Not enough cash to post bail.', 'warning');
          return;
        }

        set(s => ({
          resources: { ...s.resources, cash: s.resources.cash - bailCost },
          crew: s.crew.map(c =>
            c.id === crewId ? { ...c, isPinched: false, pinchedUntil: undefined } : c
          ),
        }));
        get().addNotification(`${member.name} bailed out for $500.`, 'info');
      },

      setActiveTab: (tab: Tab) => set({ activeTab: tab }),

      prestige: () => {
        const state = get();
        if (state.isFalling) return;
        
        get().addNotification('⚖️ The gavel falls. You\'re going inside. Time to do your time...', 'warning');
        set({
          isFalling: true,
          fallTimer: 10 * 1000, // 10 second wait (shortened for gameplay)
        });
      },

      spendDirt: (amount: number) => {
        const state = get();
        if (state.resources.dirt < amount) return;

        const heatReduction = amount * 5;
        set(s => ({
          resources: {
            ...s.resources,
            dirt: s.resources.dirt - amount,
            heat: Math.max(0, s.resources.heat - heatReduction),
          },
          raidWarningActive: false,
          raidTimer: undefined,
        }));
        get().addNotification(`Dirt spent — heat reduced by ${heatReduction.toFixed(0)}.`, 'info');
      },

      dismissRaid: () => {
        set({ raidWarningActive: false, raidTimer: undefined });
      },
    }),
    {
      name: 'mafia-idler-save',
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

function calculateTotalIncome(state: GameState): number {
  let cashIncome = 0;
  for (const template of CREW_TEMPLATES) {
    const count = state.crewCounts[template.rank] || 0;
    if (count === 0) continue;
    cashIncome += template.cashPerSecond * count;
  }
  for (const neighborhood of state.neighborhoods) {
    if (!neighborhood.owned) continue;
    for (const racket of neighborhood.rackets) {
      cashIncome += racket.cashPerSecond * racket.level;
    }
  }
  return cashIncome * state.prestigeMultiplier;
}
