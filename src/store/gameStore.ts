import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { GameState, CrewRank, CrewMember, Neighborhood, FavorType, Tab, Notification, ObjectiveRequirement } from '../types/game';
import { CREW_TEMPLATES, INITIAL_NEIGHBORHOODS, UPGRADES, FAVORS, OBJECTIVES, PRESTIGE_UPGRADES, generateCrewName, FALL_HEAT_THRESHOLD, FALL_MIN_CASH_EARNED, getBailCost } from '../data/gameData';
import { formatCash, formatTime } from '../utils/format';

const OFFLINE_THRESHOLD_MS = 30 * 1000;
const MAX_OFFLINE_SECONDS = 8 * 60 * 60;
const OFFLINE_EARNINGS_RATE = 0.5;
const OFFLINE_RAID_HEAT_THRESHOLD = 30;
const MAX_OFFLINE_RAID_CHANCE = 0.60;

const RETALIATION_TYPES: Record<string, 'message_sent' | 'shakedown' | 'heat_up' | 'full_retaliation'> = {
  the_docks: 'message_sent',
  midtown: 'shakedown',
  the_waterfront: 'heat_up',
  uptown: 'full_retaliation',
};

export { getBailCost } from '../data/gameData';

/**
 * Returns the fraction (0–1) of racket income to apply, based on how well the
 * player's active (non-pinched) crew covers each rank required across all owned
 * rackets.
 *
 * For each required crew rank the coverage ratio is:
 *   min(1, activeOfRank / totalRequiredAcrossAllOwnedRackets)
 *
 * The overall efficiency is the average of all per-rank coverage ratios.
 */
export function calculateRacketEfficiency(
  crewCounts: Record<CrewRank, number>,
  crew: CrewMember[],
  neighborhoods: Neighborhood[],
): number {
  // Sum up crew requirements across all owned rackets
  const totalRequired: Partial<Record<CrewRank, number>> = {};
  for (const n of neighborhoods) {
    if (!n.owned) continue;
    for (const r of n.rackets) {
      for (const [rank, count] of Object.entries(r.crewRequired) as [CrewRank, number][]) {
        totalRequired[rank] = (totalRequired[rank] ?? 0) + count;
      }
    }
  }

  const requiredRanks = Object.keys(totalRequired) as CrewRank[];
  if (requiredRanks.length === 0) return 1;

  let totalRatio = 0;
  let ratioCount = 0;

  for (const rank of requiredRanks) {
    const required = totalRequired[rank] ?? 0;
    if (required === 0) continue;
    const hired = crewCounts[rank] || 0;
    const active = Math.max(0, hired - crew.filter(c => c.rank === rank && c.isPinched).length);
    totalRatio += Math.min(1, active / required);
    ratioCount++;
  }

  return ratioCount === 0 ? 1 : totalRatio / ratioCount;
}

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
  objectives: OBJECTIVES.map(o => ({ ...o })),
  prestigeUpgrades: PRESTIGE_UPGRADES.map(u => ({ ...u })),
  pendingRetaliations: [],
  stats: {
    lifetimeCashEarned: 0,
    raidsSurvived: 0,
    highestHeat: 0,
  },
};

interface GameStore extends GameState {
  tick: () => void;
  hireCrew: (rank: CrewRank) => void;
  upgradeRacket: (neighborhoodId: string, racketType: string) => void;
  acquireTerritory: (neighborhoodId: string) => void;
  purchaseUpgrade: (upgradeId: string) => void;
  useFavor: (favorType: FavorType) => void;
  bailOutCrew: (crewId: string) => void;
  bailOutAllCrew: () => void;
  setActiveTab: (tab: Tab) => void;
  prestige: () => void;
  spendDirt: (amount: number) => void;
  addNotification: (message: string, type: Notification['type']) => void;
  dismissRaid: () => void;
  claimObjective: (id: string) => void;
  purchasePrestigeUpgrade: (id: string) => void;
  resetGame: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _checkObjectives: (ctx: any) => void;
}

function checkRequirement(req: ObjectiveRequirement, ctx: {
  totalCashEarned: number;
  lifetimeCashEarned: number;
  crewCounts: Record<CrewRank, number>;
  totalCrew: number;
  territoriesOwned: number;
  allTerritoriesOwned: boolean;
  highestHeat: number;
  raidsSurvived: number;
  prestigeCount: number;
  upgradesPurchased: number;
  cashPerSec: number;
}): boolean {
  switch (req.type) {
    case 'cashEarned': return ctx.totalCashEarned >= req.amount;
    case 'lifetimeCash': return ctx.lifetimeCashEarned >= req.amount;
    case 'crewRankHired': return (ctx.crewCounts[req.rank] || 0) > 0;
    case 'totalCrew': return ctx.totalCrew >= req.count;
    case 'territoriesOwned': return ctx.territoriesOwned >= req.count;
    case 'allTerritoriesOwned': return ctx.allTerritoriesOwned;
    case 'heatReached': return ctx.highestHeat >= req.heat;
    case 'raidsSurvived': return ctx.raidsSurvived >= req.count;
    case 'prestigeCount': return ctx.prestigeCount >= req.count;
    case 'upgradesPurchased': return ctx.upgradesPurchased >= req.count;
    case 'cashPerSec': return ctx.cashPerSec >= req.amount;
    case 'compound': return req.all.every(r => checkRequirement(r, ctx));
  }
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

        const isOffline = deltaMs > OFFLINE_THRESHOLD_MS;
        const effectiveDeltaS = isOffline ? Math.min(deltaS, MAX_OFFLINE_SECONDS) : deltaS;

        if (state.isFalling) {
          const newFallTimer = state.fallTimer - deltaMs;
          if (newFallTimer <= 0) {
            const earnedMultiplier = state.totalCashEarned >= FALL_MIN_CASH_EARNED;
            const newPrestigeCount = earnedMultiplier ? state.prestigeCount + 1 : state.prestigeCount;
            const newMultiplier = earnedMultiplier ? 1 + newPrestigeCount * 0.5 : state.prestigeMultiplier;
            if (earnedMultiplier) {
              get().addNotification(`You did your time. Back on the streets with a ${(newMultiplier * 100).toFixed(0)}% reputation multiplier.`, 'success');
            } else {
              get().addNotification('You did your time, but you didn\'t earn enough to build a reputation. Back to square one.', 'warning');
            }

            // Calculate starting cash — base bonus × prestige upgrades multiplier
            const startMultiplier = state.prestigeUpgrades
              .filter(u => u.purchased && u.effect.startingCashMultiplier)
              .reduce((acc, u) => acc * (u.effect.startingCashMultiplier ?? 1), 1);
            const startingCash = 50 * newMultiplier * startMultiplier;

            set({
              ...INITIAL_STATE,
              neighborhoods: INITIAL_NEIGHBORHOODS.map(n => ({ ...n, rackets: n.rackets.map(r => ({ ...r })) })),
              upgrades: UPGRADES.map(u => ({ ...u })),
              prestigeCount: newPrestigeCount,
              prestigeMultiplier: newMultiplier,
              resources: { cash: startingCash, heat: 0, loyalty: 0, respect: state.resources.respect + 10, dirt: 0 },
              isFalling: false,
              fallTimer: 0,
              lastTick: now,
              // Preserved across prestige
              objectives: state.objectives,
              prestigeUpgrades: state.prestigeUpgrades,
              pendingRetaliations: [],
              stats: {
                lifetimeCashEarned: state.stats.lifetimeCashEarned,
                raidsSurvived: state.stats.raidsSurvived,
                highestHeat: 0,
              },
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

        // Prestige upgrade bonuses
        let prestigeCrewBonus = 0;
        let prestigeGlobalCashMult = 0;
        let prestigeHeatDecayBonus = 0;
        for (const pu of state.prestigeUpgrades) {
          if (!pu.purchased) continue;
          if (pu.effect.crewIncomeBonus) prestigeCrewBonus += pu.effect.crewIncomeBonus;
          if (pu.effect.globalCashMultiplier) prestigeGlobalCashMult += pu.effect.globalCashMultiplier;
          if (pu.effect.heatDecayBonus) prestigeHeatDecayBonus += pu.effect.heatDecayBonus;
        }

        for (const template of CREW_TEMPLATES) {
          const count = crewCounts[template.rank] || 0;
          if (count === 0) continue;
          const activeCrew = count - state.crew.filter(c => c.rank === template.rank && c.isPinched).length;
          if (activeCrew <= 0) continue;
          cashIncome += template.cashPerSecond * activeCrew * (1 + prestigeCrewBonus);
          heatIncome += template.heatPerSecond * activeCrew;
          loyaltyIncome += template.loyaltyPerSecond * activeCrew;
          respectIncome += template.respectPerSecond * activeCrew;
        }

        // Income from rackets (owned neighborhoods), scaled by street kid availability
        const racketEfficiency = calculateRacketEfficiency(crewCounts, state.crew, state.neighborhoods);

        for (const neighborhood of state.neighborhoods) {
          if (!neighborhood.owned) continue;
          for (const racket of neighborhood.rackets) {
            cashIncome += racket.cashPerSecond * racket.level * racketEfficiency;
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

        // Prestige upgrade global multiplier stacks on top
        globalCashMult += prestigeGlobalCashMult;

        // Check consigliere heat bonus
        if (crewCounts.consigliere > 0) heatReduction += 0.2;

        cashIncome *= globalCashMult * cashMultiplier * state.prestigeMultiplier;
        loyaltyIncome *= loyaltyMultiplier;
        if (!heatFrozen) {
          heatIncome *= (1 - heatReduction);
        } else {
          heatIncome = 0;
        }

        // Heat decay (natural cooling + prestige bonus)
        const heatDecay = (0.01 + prestigeHeatDecayBonus) * heatDecayMult;
        const currentHeat = state.resources.heat;
        const newHeat = Math.max(0, Math.min(100, currentHeat + (heatIncome - heatDecay) * effectiveDeltaS));

        const offlineEarningsRate = isOffline ? OFFLINE_EARNINGS_RATE : 1;
        const newCash = Math.max(0, state.resources.cash + cashIncome * effectiveDeltaS * offlineEarningsRate);
        const newLoyalty = Math.min(200, state.resources.loyalty + loyaltyIncome * effectiveDeltaS * offlineEarningsRate);
        const newRespect = state.resources.respect + respectIncome * effectiveDeltaS * offlineEarningsRate;
        const newDirt = Math.min(50, state.resources.dirt + 0.001 * effectiveDeltaS);

        const cashEarned = cashIncome * effectiveDeltaS * offlineEarningsRate;

        // Update stats
        const newHighestHeat = Math.max(state.stats.highestHeat, newHeat);
        const newLifetimeCash = state.stats.lifetimeCashEarned + cashEarned;

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

        if (!isOffline && newHeat >= 60 && Math.random() < 0.0002 * effectiveDeltaS) {
          const activeCrew = updatedCrew.filter(c => !c.isPinched);
          if (activeCrew.length > 0) {
            const victim = activeCrew[Math.floor(Math.random() * activeCrew.length)];
            const pinchedDuration = 30 * 60 * 1000 + Math.random() * 30 * 60 * 1000;
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

        if (!isOffline && newHeat >= 95 && !state.raidWarningActive) {
          raidWarningActive = true;
          raidTimer = now + 60 * 1000;
          get().addNotification('⚠️ RICO INVESTIGATION — You have 60 seconds! Spend Dirt to avoid a raid!', 'danger');
        }

        // RICO raid hits
        let newRaidsSurvived = state.stats.raidsSurvived;
        if (state.raidWarningActive && state.raidTimer && now >= state.raidTimer) {
          const ricoProtection = state.upgrades.find(u => u.id === 'offshore_accounts' && u.purchased)
            ? 0.5 : 1;
          get().addNotification('🚨 RAID! The feds swept your operation. You lost cash and crew!', 'danger');
          newRaidsSurvived += 1;
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
            stats: { ...state.stats, raidsSurvived: newRaidsSurvived, highestHeat: newHighestHeat },
          });
          // Check objectives after raid (raidsSurvived incremented)
          get()._checkObjectives({
            totalCashEarned: state.totalCashEarned + cashEarned,
            lifetimeCashEarned: newLifetimeCash,
            crewCounts,
            totalCrew: state.crew.length,
            territoriesOwned: state.neighborhoods.filter(n => n.owned).length,
            allTerritoriesOwned: state.neighborhoods.every(n => n.owned),
            highestHeat: newHighestHeat,
            raidsSurvived: newRaidsSurvived,
            prestigeCount: state.prestigeCount,
            upgradesPurchased: state.upgrades.filter(u => u.purchased).length,
            cashPerSec: cashIncome,
          });
          return;
        }

        // Process pending retaliations
        const now2 = now;
        const dueRetaliations = state.pendingRetaliations.filter(r => r.executeAt <= now2);
        let remainingRetaliations = state.pendingRetaliations.filter(r => r.executeAt > now2);
        let retaliationCashHit = 0;
        let retaliationHeatHit = 0;
        let retaliationPinchedCrewId: string | undefined;

        for (const retaliation of dueRetaliations) {
          switch (retaliation.type) {
            case 'message_sent': {
              const active = updatedCrewFinal.filter(c => !c.isPinched);
              if (active.length > 0) {
                const victim = active[Math.floor(Math.random() * active.length)];
                retaliationPinchedCrewId = victim.id;
                get().addNotification(`The ${retaliation.rivalFamily} sent a message — ${victim.name} got roughed up and pinched for 30 minutes.`, 'danger');
              } else {
                get().addNotification(`The ${retaliation.rivalFamily} sent a message. They're watching your operation.`, 'warning');
              }
              break;
            }
            case 'shakedown': {
              retaliationCashHit += Math.max(100, newCash * 0.10);
              get().addNotification(`The ${retaliation.rivalFamily} shook down one of your spots. You lost ${formatCash(Math.max(100, newCash * 0.10))}.`, 'danger');
              break;
            }
            case 'heat_up': {
              retaliationHeatHit += 25;
              get().addNotification(`The ${retaliation.rivalFamily} tipped off the cops. Heat +25%.`, 'danger');
              break;
            }
            case 'full_retaliation': {
              retaliationHeatHit += 20;
              retaliationCashHit += Math.max(100, newCash * 0.05);
              const active = updatedCrewFinal.filter(c => !c.isPinched);
              if (active.length > 0) {
                const victim = active[Math.floor(Math.random() * active.length)];
                retaliationPinchedCrewId = victim.id;
                get().addNotification(`The ${retaliation.rivalFamily} hit back hard — heat spiked and ${victim.name} got pinched.`, 'danger');
              } else {
                get().addNotification(`The ${retaliation.rivalFamily} hit back hard — heat spiked.`, 'danger');
              }
              break;
            }
          }
        }

        // Apply retaliation effects to crew if needed
        if (retaliationPinchedCrewId) {
          const pinchedDuration = 30 * 60 * 1000;
          updatedCrewFinal = updatedCrewFinal.map(c =>
            c.id === retaliationPinchedCrewId
              ? { ...c, isPinched: true, pinchedUntil: now + pinchedDuration }
              : c
          );
        }

        // Clean up expired favors
        const activeFavors = state.activeFavors.filter(f => f.expiresAt > now);

        // Offline raid check
        if (isOffline && !state.raidWarningActive) {
          const heatFactor = Math.max(0, (newHeat - OFFLINE_RAID_HEAT_THRESHOLD) / (100 - OFFLINE_RAID_HEAT_THRESHOLD));
          const offlineHoursFactor = Math.min(1, effectiveDeltaS / (4 * 3600));
          const raidChance = heatFactor * offlineHoursFactor * MAX_OFFLINE_RAID_CHANCE;
          const offlineTimeStr = formatTime(effectiveDeltaS * 1000);
          if (Math.random() < raidChance) {
            const ricoProtection = state.upgrades.find(u => u.id === 'offshore_accounts' && u.purchased)
              ? 0.5 : 1;
            const cashLost = newCash * ricoProtection;
            newRaidsSurvived += 1;
            get().addNotification(`🚨 While you were away (${offlineTimeStr}), the authorities raided your operation! Lost ${formatCash(cashLost)} and crew pinched.`, 'danger');
            set({
              resources: {
                cash: newCash * (1 - ricoProtection),
                heat: 40,
                loyalty: Math.max(0, newLoyalty - 20),
                respect: newRespect,
                dirt: newDirt,
              },
              crew: updatedCrewFinal.map(c => ({
                ...c,
                isPinched: true,
                pinchedUntil: now + 60 * 60 * 1000,
              })),
              activeFavors,
              totalCashEarned: state.totalCashEarned + cashEarned,
              lastTick: now,
              raidWarningActive: false,
              raidTimer: undefined,
              pendingRetaliations: remainingRetaliations,
              stats: { lifetimeCashEarned: newLifetimeCash, raidsSurvived: newRaidsSurvived, highestHeat: newHighestHeat },
            });
            return;
          }
          get().addNotification(
            `You were away for ${offlineTimeStr}. Your operation earned ${formatCash(cashEarned)} at ${Math.round(OFFLINE_EARNINGS_RATE * 100)}% efficiency.`,
            'info',
          );
        }

        // Apply retaliation adjustments to final resource values
        const finalCash = Math.max(0, newCash - retaliationCashHit);
        const finalHeat = Math.min(100, newHeat + retaliationHeatHit);

        set({
          resources: {
            cash: finalCash,
            heat: finalHeat,
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
          pendingRetaliations: remainingRetaliations,
          stats: { lifetimeCashEarned: newLifetimeCash, raidsSurvived: newRaidsSurvived, highestHeat: newHighestHeat },
        });

        // Check objectives with updated values
        get()._checkObjectives({
          totalCashEarned: state.totalCashEarned + cashEarned,
          lifetimeCashEarned: newLifetimeCash,
          crewCounts,
          totalCrew: state.crew.length,
          territoriesOwned: state.neighborhoods.filter(n => n.owned).length,
          allTerritoriesOwned: state.neighborhoods.every(n => n.owned),
          highestHeat: newHighestHeat,
          raidsSurvived: newRaidsSurvived,
          prestigeCount: state.prestigeCount,
          upgradesPurchased: state.upgrades.filter(u => u.purchased).length,
          cashPerSec: cashIncome,
        });
      },

      // Internal — check and mark objectives complete; not part of public GameStore interface
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      _checkObjectives: (ctx: any) => {
        const state = get();
        let changed = false;
        const updatedObjectives = state.objectives.map(obj => {
          if (obj.completed) return obj;
          if (checkRequirement(obj.requirement, ctx)) {
            changed = true;
            get().addNotification(`Objective complete: "${obj.title}" — ${obj.flavour}`, 'success');
            return { ...obj, completed: true };
          }
          return obj;
        });
        if (changed) {
          set({ objectives: updatedObjectives });
        }
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

        // Check crew-related objectives immediately
        const s = get();
        get()._checkObjectives({
          totalCashEarned: s.totalCashEarned,
          lifetimeCashEarned: s.stats.lifetimeCashEarned,
          crewCounts: s.crewCounts,
          totalCrew: s.crew.length,
          territoriesOwned: s.neighborhoods.filter(n => n.owned).length,
          allTerritoriesOwned: s.neighborhoods.every(n => n.owned),
          highestHeat: s.stats.highestHeat,
          raidsSurvived: s.stats.raidsSurvived,
          prestigeCount: s.prestigeCount,
          upgradesPurchased: s.upgrades.filter(u => u.purchased).length,
          cashPerSec: 0,
        });
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

        // Schedule rival retaliation
        const retaliationType = RETALIATION_TYPES[neighborhoodId];
        const newRetaliation = retaliationType ? [{
          neighborhoodId,
          rivalFamily: neighborhood.rivalFamily || 'Rival Family',
          executeAt: Date.now() + (60 + Math.random() * 60) * 1000,
          type: retaliationType,
        }] : [];

        set(state => ({
          neighborhoods: state.neighborhoods.map(n =>
            n.id === neighborhoodId ? { ...n, owned: true, rivalFamily: undefined } : n
          ),
          resources: {
            ...state.resources,
            cash: state.resources.cash - cost,
            heat: newHeat,
          },
          pendingRetaliations: [...state.pendingRetaliations, ...newRetaliation],
        }));

        get().addNotification(`${neighborhood.name} is now under your control. The ${neighborhood.rivalFamily} won't be happy.`, 'success');
        if (retaliationType) {
          get().addNotification(`Expect retaliation from the ${neighborhood.rivalFamily} soon.`, 'warning');
        }

        // Check territory objectives
        const s = get();
        get()._checkObjectives({
          totalCashEarned: s.totalCashEarned,
          lifetimeCashEarned: s.stats.lifetimeCashEarned,
          crewCounts: s.crewCounts,
          totalCrew: s.crew.length,
          territoriesOwned: s.neighborhoods.filter(n => n.owned).length,
          allTerritoriesOwned: s.neighborhoods.every(n => n.owned),
          highestHeat: s.stats.highestHeat,
          raidsSurvived: s.stats.raidsSurvived,
          prestigeCount: s.prestigeCount,
          upgradesPurchased: s.upgrades.filter(u => u.purchased).length,
          cashPerSec: 0,
        });
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

        // Check upgrade-related objectives
        const s = get();
        get()._checkObjectives({
          totalCashEarned: s.totalCashEarned,
          lifetimeCashEarned: s.stats.lifetimeCashEarned,
          crewCounts: s.crewCounts,
          totalCrew: s.crew.length,
          territoriesOwned: s.neighborhoods.filter(n => n.owned).length,
          allTerritoriesOwned: s.neighborhoods.every(n => n.owned),
          highestHeat: s.stats.highestHeat,
          raidsSurvived: s.stats.raidsSurvived,
          prestigeCount: s.prestigeCount,
          upgradesPurchased: s.upgrades.filter(u => u.purchased).length,
          cashPerSec: 0,
        });
      },

      useFavor: (favorType: FavorType) => {
        const state = get();
        const favor = FAVORS.find(f => f.type === favorType);
        if (!favor) return;

        const now = Date.now();
        const lastUsed = state.favorCooldowns[favorType];
        if (lastUsed && now - lastUsed < favor.cooldown) return;

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

        const bailReduction = state.prestigeUpgrades.find(u => u.id === 'iron_will' && u.purchased)?.effect.bailCostReduction ?? 1;
        const bailCost = Math.floor(getBailCost(member.rank) * bailReduction);

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
        get().addNotification(`${member.name} bailed out for ${formatCash(bailCost)}.`, 'info');
      },

      bailOutAllCrew: () => {
        const state = get();
        const pinchedMembers = state.crew.filter(c => c.isPinched);
        if (pinchedMembers.length === 0) return;

        const bailReduction = state.prestigeUpgrades.find(u => u.id === 'iron_will' && u.purchased)?.effect.bailCostReduction ?? 1;
        const totalCost = pinchedMembers.reduce((sum, m) => sum + Math.floor(getBailCost(m.rank) * bailReduction), 0);

        if (state.resources.cash < totalCost) {
          get().addNotification(`Not enough cash to bail everyone out. Need ${formatCash(totalCost)}.`, 'warning');
          return;
        }

        set(s => ({
          resources: { ...s.resources, cash: s.resources.cash - totalCost },
          crew: s.crew.map(c =>
            c.isPinched ? { ...c, isPinched: false, pinchedUntil: undefined } : c
          ),
        }));
        get().addNotification(`All ${pinchedMembers.length} crew bailed out for ${formatCash(totalCost)}.`, 'info');
      },

      setActiveTab: (tab: Tab) => set({ activeTab: tab }),

      prestige: () => {
        const state = get();
        if (state.isFalling) return;

        if (state.resources.heat < FALL_HEAT_THRESHOLD) {
          get().addNotification('The heat isn\'t high enough. You need at least 75 heat before you can take the fall.', 'warning');
          return;
        }

        get().addNotification('⚖️ The gavel falls. You\'re going inside. Time to do your time...', 'warning');
        set({
          isFalling: true,
          fallTimer: 10 * 1000,
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

      resetGame: () => {
        set({
          ...INITIAL_STATE,
          neighborhoods: INITIAL_NEIGHBORHOODS.map(n => ({ ...n, rackets: n.rackets.map(r => ({ ...r })) })),
          upgrades: UPGRADES.map(u => ({ ...u })),
          objectives: OBJECTIVES.map(o => ({ ...o })),
          prestigeUpgrades: PRESTIGE_UPGRADES.map(u => ({ ...u })),
          lastTick: Date.now(),
        });
      },

      claimObjective: (id: string) => {
        const state = get();
        const objective = state.objectives.find(o => o.id === id);
        if (!objective || !objective.completed || objective.claimed) return;

        const rewardParts: string[] = [];
        const resourceUpdates: Partial<typeof state.resources> = {};
        if (objective.reward.cash) {
          resourceUpdates.cash = (state.resources.cash + objective.reward.cash);
          rewardParts.push(formatCash(objective.reward.cash));
        }
        if (objective.reward.respect) {
          resourceUpdates.respect = (state.resources.respect + objective.reward.respect);
          rewardParts.push(`${objective.reward.respect} respect`);
        }
        if (objective.reward.loyalty) {
          resourceUpdates.loyalty = Math.min(200, state.resources.loyalty + objective.reward.loyalty);
          rewardParts.push(`${objective.reward.loyalty} loyalty`);
        }

        set(s => ({
          objectives: s.objectives.map(o => o.id === id ? { ...o, claimed: true } : o),
          resources: { ...s.resources, ...resourceUpdates },
        }));
        get().addNotification(`Claimed "${objective.title}": +${rewardParts.join(', ')}`, 'success');

        // Check if "The Seat" prestige upgrade is now unlockable (requires commission objective)
        if (id === 'the_commission') {
          const s = get();
          const theSeat = s.prestigeUpgrades.find(u => u.id === 'the_seat');
          if (theSeat && !theSeat.purchased) {
            set(ps => ({
              prestigeUpgrades: ps.prestigeUpgrades.map(u =>
                u.id === 'the_seat' ? { ...u, requires: undefined } : u
              ),
            }));
            get().addNotification('A Seat at the Table is now available in Prestige Upgrades.', 'info');
          }
        }
      },

      purchasePrestigeUpgrade: (id: string) => {
        const state = get();
        const upgrade = state.prestigeUpgrades.find(u => u.id === id);
        if (!upgrade || upgrade.purchased) return;

        // 'the_seat' requires the_commission objective to be claimed
        if (upgrade.requires === 'the_commission_obj') {
          const commissionClaimed = state.objectives.find(o => o.id === 'the_commission')?.claimed;
          if (!commissionClaimed) {
            get().addNotification('Complete and claim "The Commission" objective first.', 'warning');
            return;
          }
        } else if (upgrade.requires) {
          const required = state.prestigeUpgrades.find(u => u.id === upgrade.requires);
          if (!required?.purchased) {
            get().addNotification(`You need "${required?.name}" first.`, 'warning');
            return;
          }
        }

        if (state.resources.respect < upgrade.respectCost) {
          get().addNotification(`Not enough respect. Need ${upgrade.respectCost} respect.`, 'warning');
          return;
        }

        set(s => ({
          prestigeUpgrades: s.prestigeUpgrades.map(u => u.id === id ? { ...u, purchased: true } : u),
          resources: { ...s.resources, respect: s.resources.respect - upgrade.respectCost },
        }));
        get().addNotification(`"${upgrade.name}" permanently unlocked.`, 'success');
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
    const activeCrew = count - state.crew.filter(c => c.rank === template.rank && c.isPinched).length;
    if (activeCrew <= 0) continue;
    cashIncome += template.cashPerSecond * activeCrew;
  }
  const racketEfficiency = calculateRacketEfficiency(state.crewCounts, state.crew, state.neighborhoods);
  for (const neighborhood of state.neighborhoods) {
    if (!neighborhood.owned) continue;
    for (const racket of neighborhood.rackets) {
      cashIncome += racket.cashPerSecond * racket.level * racketEfficiency;
    }
  }
  return cashIncome * state.prestigeMultiplier;
}
