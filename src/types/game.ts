export type ResourceType = 'cash' | 'heat' | 'loyalty' | 'respect' | 'dirt';

export interface Resources {
  cash: number;
  heat: number;
  loyalty: number;
  respect: number;
  dirt: number;
}

export type CrewRank =
  | 'street_kid'
  | 'runner'
  | 'enforcer'
  | 'soldier'
  | 'capo'
  | 'underboss'
  | 'consigliere'
  | 'don';

export interface CrewMemberTemplate {
  rank: CrewRank;
  title: string;
  cashCost: number;
  loyaltyCost: number;
  cashPerSecond: number;
  heatPerSecond: number;
  loyaltyPerSecond: number;
  respectPerSecond: number;
  maxCount: number;
  unlockCash: number;
  specialAbility: string;
}

export interface CrewMember {
  id: string;
  rank: CrewRank;
  name: string;
  nickname: string;
  isPinched: boolean;
  pinchedUntil?: number;
}

export type RacketType =
  | 'numbers_running'
  | 'loan_sharking'
  | 'protection'
  | 'smuggling'
  | 'gambling_den';

export interface Racket {
  type: RacketType;
  name: string;
  level: number;
  cashPerSecond: number;
  heatPerSecond: number;
  loyaltyPerSecond: number;
  upgradeCost: number;
  /** Crew types (and counts) needed to run this racket at full efficiency. */
  crewRequired: Partial<Record<CrewRank, number>>;
}

export interface Neighborhood {
  id: string;
  name: string;
  owned: boolean;
  rivalFamily?: string;
  rackets: Racket[];
  tributeCost?: number;
}

export type HeatTier = 'clean' | 'street_cops' | 'detectives' | 'fbi' | 'rico';

export interface Upgrade {
  id: string;
  name: string;
  description: string;
  cashCost: number;
  respectCost: number;
  purchased: boolean;
  effect: Record<string, number>;
  requires?: string;
}

export type FavorType =
  | 'the_tip'
  | 'the_bailout'
  | 'the_bribe'
  | 'the_shipment'
  | 'the_inside_man'
  | 'go_to_mattresses';

export interface Favor {
  type: FavorType;
  name: string;
  description: string;
  rewardDescription: string;
  duration?: number;
  cooldown: number;
  lastUsed?: number;
}

export type Tab = 'streets' | 'family' | 'books' | 'wire' | 'favors';

export interface Notification {
  id: string;
  timestamp: number;
  message: string;
  type: 'info' | 'warning' | 'danger' | 'success';
}

// Objective requirement types — what must be true for the objective to complete
export type ObjectiveRequirement =
  | { type: 'cashEarned'; amount: number }
  | { type: 'lifetimeCash'; amount: number }
  | { type: 'crewRankHired'; rank: CrewRank }
  | { type: 'totalCrew'; count: number }
  | { type: 'territoriesOwned'; count: number }
  | { type: 'allTerritoriesOwned' }
  | { type: 'heatReached'; heat: number }
  | { type: 'raidsSurvived'; count: number }
  | { type: 'prestigeCount'; count: number }
  | { type: 'upgradesPurchased'; count: number }
  | { type: 'cashPerSec'; amount: number }
  | { type: 'compound'; all: ObjectiveRequirement[] };

export interface Objective {
  id: string;
  title: string;
  description: string;
  flavour: string;
  tier: 1 | 2 | 3;
  reward: { cash?: number; respect?: number; loyalty?: number };
  requirement: ObjectiveRequirement;
  completed: boolean;
  claimed: boolean;
}

export interface PrestigeUpgrade {
  id: string;
  name: string;
  description: string;
  respectCost: number;
  purchased: boolean;
  requires?: string;
  effect: {
    startingCashMultiplier?: number;
    globalCashMultiplier?: number;
    heatDecayBonus?: number;
    bailCostReduction?: number;
    crewIncomeBonus?: number;
  };
}

export interface RetaliationEvent {
  neighborhoodId: string;
  rivalFamily: string;
  executeAt: number;
  type: 'message_sent' | 'shakedown' | 'heat_up' | 'full_retaliation';
}

export interface GameStats {
  lifetimeCashEarned: number;
  raidsSurvived: number;
  highestHeat: number;
}

export interface GameState {
  resources: Resources;
  crew: CrewMember[];
  neighborhoods: Neighborhood[];
  upgrades: Upgrade[];
  notifications: Notification[];
  activeTab: Tab;
  prestigeCount: number;
  prestigeMultiplier: number;
  isFalling: boolean;
  fallTimer: number;
  lastTick: number;
  gameStarted: boolean;
  activeFavors: Array<{ type: FavorType; expiresAt: number }>;
  favorCooldowns: Partial<Record<FavorType, number>>;
  crewCounts: Record<CrewRank, number>;
  totalCashEarned: number;
  raidTimer?: number;
  raidWarningActive: boolean;
  objectives: Objective[];
  prestigeUpgrades: PrestigeUpgrade[];
  pendingRetaliations: RetaliationEvent[];
  stats: GameStats;
}
