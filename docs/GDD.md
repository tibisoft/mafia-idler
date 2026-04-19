# Mafia Idler — Game Design Document

> **Genre:** Incremental idle game  
> **Platform:** Mobile (React Native / Expo)  
> **Core loop:** Earn cash → hire crew → take territory → manage heat → prestige → repeat with a higher multiplier

---

## 1. Vision

You are a street-level nobody trying to build a crime empire from nothing. The game answers "why are you doing this?" through the Objectives system: a series of tiered milestones that document your rise from running errands to earning a seat at The Commission — the national body of organised crime. There is no single win state; the game rewards you for optimising each run and growing a permanent legacy through the Prestige system.

---

## 2. Resources (5 currencies)

| Resource | Cap | Purpose | Primary source | Primary sink |
|----------|-----|---------|---------------|-------------|
| **Cash** | ∞ | Main currency | Crew + rackets | Hiring, upgrades, territory, bail |
| **Heat** | 100% | Risk meter | Crew + rackets | Decays naturally; dirt spend |
| **Loyalty** | 200 | Enables senior hires | Crew + rackets | Hiring higher-rank crew |
| **Respect** | ∞ | Long-term progression | Crew (high ranks) + objectives | Upgrades, prestige upgrades |
| **Dirt** | 50 | Emergency heat relief | Passive 0.001/s | 1 dirt = 5% heat reduction |

**Key tensions:**
- Loyalty caps at 200, so hiring Dons (500 loyalty cost) requires prestige to reset it — prestige is *structurally required*, not just optional.
- Dirt regenerates very slowly (83 min per use) — it's a panic button, not a steady tool.
- Respect survives prestige and unlocks permanent upgrades, giving veteran players an advantage.

---

## 3. Crew System

Eight ranks unlock progressively as the player's total cash earned grows.

| Rank | Cash cost | Loyalty cost | Income | Max | Unlock at |
|------|-----------|-------------|--------|-----|----------|
| Street Kid | $10 | 0 | $0.10/s | 50 | $0 |
| Runner | $100 | 0 | $0.50/s | 30 | $50 |
| Enforcer | $500 | 5 | $2.00/s | 20 | $400 |
| Soldier | $2,000 | 20 | $8.00/s | 15 | $1,500 |
| Capo | $10,000 | 50 | $30.00/s | 8 | $7,500 |
| Underboss | $200,000 | 100 | $100.00/s | 3 | $150,000 |
| Consigliere | $1,500,000 | 200 | $300.00/s | 1 | $1,000,000 |
| Don | $10,000,000 | 500 | $1,000.00/s | 1 | $8,000,000 |

**Special abilities (mechanical):**
- Consigliere: −20% heat generation from all sources
- Don: Global 2× income multiplier (handled via upgrade-style effect in tick)

**Pinch mechanic:** At heat ≥ 60%, there is a 0.0002%/s chance per tick that a random active crew member gets arrested. They are unavailable for 30–60 minutes unless bailed out.

**Bail costs:** $50 → $500 → $2,500 → $10,000 → $50,000 → $250,000 → $1,000,000 → $5,000,000 by rank. Reduced 25% if "Iron Will" prestige upgrade is purchased.

---

## 4. Territory & Rackets

Five neighborhoods, one owned at start. Acquiring a territory costs a one-time tribute and increases heat by 10%. Each owned neighborhood provides passive income from its rackets.

| Neighborhood | Rival | Tribute | Rackets | Retaliation |
|-------------|-------|---------|---------|------------|
| Little Italy | — (owned) | — | Numbers Running | — |
| The Docks | Moretti Family | $500 | Smuggling | Crew pinched |
| Midtown | Bianchi Crew | $12,000 | Gambling Den, Loan Sharking | Cash shakedown |
| The Waterfront | Calabrese Outfit | $100,000 | Smuggling, Protection | Heat spike |
| Uptown | Vitale Syndicate | $1,000,000 | Gambling Den, Loan Sharking, Numbers Running | Full retaliation |

**Rival retaliation:** 60–120 seconds after you take a territory, the displaced family strikes back:
- `message_sent`: One active crew member pinched for 30 min
- `shakedown`: Lose 10% current cash (min $100)
- `heat_up`: Heat +25%
- `full_retaliation`: Heat +20%, cash −5%, one crew pinched

**Racket multipliers by type:**

| Type | Cash mult | Heat mult | Loyalty mult | Crew required |
|------|-----------|----------|-------------|--------------|
| Numbers Running | 1.0× | 0.5× | 0.3× | 2× Street Kid |
| Loan Sharking | 1.5× | 0.8× | 1.2× | 2× Street Kid, 1× Enforcer |
| Protection | 1.2× | 0.7× | 0.8× | 1× Runner, 1× Enforcer |
| Smuggling | 2.0× | 1.5× | 0.5× | 2× Runner, 1× Soldier |
| Gambling Den | 1.8× | 1.2× | 0.7× | 2× Street Kid, 1× Runner, 1× Capo |

**Racket upgrades:** Each level costs 2.5× more than the last. Income grows 1.5×, heat 1.3×, loyalty 1.4× per level.

**Family crew dependency:** Each racket requires a specific mix of crew ranks to run at full capacity. The overall racket efficiency is the average of per-rank coverage ratios across all owned rackets:

> `per-rank coverage = clamp(activeOfRank / totalRequiredOfRank, 0, 1)`
> `racket efficiency = average of all per-rank coverages`

A crew rank with zero active members contributes 0 to coverage, pulling overall efficiency down proportionally — directly linking family size to street income and making "The Fall" a more attractive exit.

---

## 5. Heat & Law Enforcement

Heat is generated by crew and rackets and decays naturally at 0.01/s (modified by upgrades and prestige upgrades).

| Tier | Heat range | Effect |
|------|-----------|--------|
| Clean | 0–20% | No consequences |
| Street Cops | 20–40% | Increased surveillance (flavour) |
| Detectives | 40–60% | Active investigation (flavour) |
| FBI | 60–80% | Crew pinch chance active |
| RICO | 80–100% | Raid warning at 95% |

**RICO raid sequence:**
1. Heat reaches 95% → 60-second countdown warning
2. Spend dirt or reduce heat to cancel
3. If timer expires: lose 50% cash (or 100% without Offshore Accounts), lose 20 loyalty, all crew pinched for 1 hour, heat resets to 40%
4. `raidsSurvived` stat increments — counts toward the "Survivor" objective

**Offline raids:** If offline > 30 seconds on return, chance of a raid proportional to heat level × offline duration (up to 60% at 4+ hours with max heat).

---

## 6. Prestige — "The Fall"

**Why prestige?** The game structurally forces prestige because:
- Loyalty caps at 200, making Dons impossible to hire without resetting
- Heat accumulates naturally, and the only reliable sink at scale is prestige
- The prestige multiplier compounds, making each run dramatically faster

**Requirements to prestige:**
- Heat ≥ 75%
- Must have earned ≥ $1,000 this run (for multiplier increase)

**What resets:**
- Cash, heat, loyalty, dirt
- Crew and crew counts
- Neighborhoods (back to Little Italy only)
- Run upgrades (back to unpurchased)
- `totalCashEarned` (per-run counter)
- `stats.highestHeat`

**What persists:**
- `respect` (+ 10 bonus on prestige)
- `prestigeCount` and `prestigeMultiplier`
- `objectives` (completion and claim state)
- `prestigeUpgrades` (purchased state)
- `stats.lifetimeCashEarned` and `stats.raidsSurvived`

**Multiplier formula:** `1 + prestigeCount × 0.5`  
Run 1: 1.0× → Run 2: 1.5× → Run 3: 2.0× → Run 4: 2.5× etc.

**Starting cash:** `50 × prestigeMultiplier × startingCashMultiplier`  
The `startingCashMultiplier` is 2× if "Blood Money" prestige upgrade is purchased.

---

## 7. Run Upgrades (8 total)

One-time purchases per run. Reset on prestige.

| Upgrade | Cost | Effect | Requires |
|---------|------|--------|---------|
| Better Ledgers | $500 | Cash income +25% | — |
| Street Network | $1,000 | Street Kid income +50% | — |
| Crooked Cop on Payroll | $3,000 | Heat generation −15% | — |
| Loyalty Oaths | $5,000 + 1 respect | Crew pinch rate −50% | Better Ledgers |
| Judges in Your Pocket | $75,000 + 5 respect | Heat decay 2×, FBI threshold +10% | Crooked Cop |
| Offshore Accounts | $500,000 + 10 respect | RICO takes only 50% cash | Judges |
| Capo Network | $150,000 + 8 respect | Capo income 2× | — |
| The Family Name | $2,000,000 + 25 respect | All income +50% | Capo Network |

---

## 8. Prestige Upgrades (6 total)

Permanent bonuses purchased with Respect. Survive all prestige resets.

| Upgrade | Respect cost | Effect | Requires |
|---------|-------------|--------|---------|
| Blood Money | 10 | Starting cash 2× | — |
| The Network | 25 | All crew income permanently +10% | — |
| Street Wisdom | 40 | Heat decays 25% faster permanently | — |
| Iron Will | 60 | Bail costs −25% permanently | — |
| Family Legacy | 85 | Global income +25% permanently | The Network |
| A Seat at the Table | 150 | Global income +50% permanently | "The Commission" objective claimed |

---

## 9. Favors (Active Powers)

Six special powers with long cooldowns (ad-gated in production).

| Favor | Cooldown | Effect |
|-------|---------|--------|
| The Tip | 4h | 2× cash for 30 min |
| The Bailout | 2h | Instantly release one pinched crew member |
| The Bribe | 3h | Reduce heat by 25% |
| The Shipment | 6h | Lump sum = 5 minutes of current income |
| The Inside Man | 8h | Freeze heat generation for 1 hour |
| Go to the Mattresses | 12h | 2× loyalty generation for 2 hours |

---

## 10. Objectives System

Tiered milestones that give direction and reward cash/respect. Objectives persist across prestige. Claim buttons appear when completed.

**Tier unlock logic:**
- Chapter I always visible
- Chapter II unlocks when 3+ Chapter I objectives complete
- Chapter III unlocks when 4+ Chapter II objectives complete

### Chapter I — The Neighbourhood (Tier 1)

| Objective | Requirement | Reward |
|-----------|-------------|--------|
| First Dollar | Earn $100 this run | +$500 |
| Made Man | Hire an Enforcer | +5 respect |
| Expansion | Own 2 territories | +$1,000 |
| Street Heat | Reach 40% heat | +2 respect |
| The Numbers Game | Have 10 crew | +$2,000 |

### Chapter II — The Family (Tier 2)

| Objective | Requirement | Reward |
|-----------|-------------|--------|
| Three Families | Own 3 territories | +15 respect |
| Big Earner | Generate $50/sec | +$10,000 |
| Survivor | Survive 1 RICO raid | +25 respect |
| The First Fall | Prestige once | +30 respect |
| The Boss's Man | Hire a Capo | +10 respect |
| Connected | Purchase 3 run upgrades | +$20,000 |

### Chapter III — The Commission (Tier 3)

| Objective | Requirement | Reward |
|-----------|-------------|--------|
| City Boss | Own all 5 territories | +50 respect |
| The Don | Hire a Don | +75 respect |
| Old Money | Earn $1,000,000 in a run | +100 respect |
| Untouchable | Purchase 6 run upgrades | +50 respect |
| The Commission | All territories + prestige 5× + all 8 upgrades | +500 respect + $50,000 |

Claiming "The Commission" unlocks the "A Seat at the Table" prestige upgrade.

---

## 11. Game Loop Summary

```
Start run → hire Street Kids → earn cash
    → acquire The Docks ($500) → rival retaliates (crew pinched)
    → hire Enforcers (need 5 loyalty) → unlock Soldiers
    → acquire Midtown ($12,000) → rival retaliates (shakedown)
    → buy Better Ledgers (+25% income)
    → heat climbs → need Crooked Cop to manage it
    → acquire Waterfront ($100,000) → heat accelerating
    → buy Judges in Your Pocket (heat decay 2×)
    → hire Capos, Underboss ($200,000 each), Consigliere ($1,500,000)
    → heat still climbs to 75+ → take The Fall (prestige)
    → new run starts with 1.5× multiplier + 10 respect
    → buy Blood Money prestige upgrade (2× starting cash)
    → repeat faster, unlock Tier 2 objectives
    → acquire Uptown ($1,000,000) → hire Don ($10,000,000)
    → prestige 5× + all territories + all upgrades → The Commission
```

---

## 12. Balance Constants

```
FALL_HEAT_THRESHOLD     = 75
FALL_MIN_CASH_EARNED    = 1,000

OFFLINE_THRESHOLD_MS    = 30,000 ms
MAX_OFFLINE_SECONDS     = 14,400 s (4 hours)
OFFLINE_EARNINGS_RATE   = 0.25 (25%)
OFFLINE_RAID_HEAT_THRESHOLD = 30%
MAX_OFFLINE_RAID_CHANCE = 60%

Heat decay base rate    = 0.01/s
Crew pinch chance       = 0.0002%/s at heat ≥ 60%
Crew pinch duration     = 30–60 minutes
RICO warning threshold  = 95%
RICO countdown          = 60 seconds
RICO loyalty penalty    = −20
RICO heat reset         = 40%

Racket upgrade income   = ×1.5 per level
Racket upgrade cost     = ×2.5 per level
Racket upgrade heat     = ×1.3 per level

Prestige multiplier     = 1 + (count × 0.5)
Prestige starting cash  = 50 × multiplier × startingCashMult
Prestige respect bonus  = +10 per prestige
```

---

## 13. Identified Design Gaps & Notes

| Gap | Status | Notes |
|-----|--------|-------|
| Rival retaliation | **Implemented** | 60–120s delay after territory acquisition |
| Objective system | **Implemented** | 3 chapters, 16 objectives |
| Prestige upgrades | **Implemented** | 6 permanent bonuses |
| No per-run stat tracking | **Implemented** | `highestHeat`, `raidsSurvived`, `lifetimeCashEarned` |
| Dirt economy tension | Open | 83 min to generate 1 use; probably too slow for active players. Consider a secondary dirt source tied to rackets. |
| Loyalty cap forcing prestige | By design | The cap is a structural prestige trigger; tuning only if it feels too rigid. |
| Late-game content cliff | Mitigated | Objectives + prestige upgrades extend the arc. "The Commission" is the effective endgame. |
| Crew pinch rate tuning | Open | 0.0002%/s feels low — players may rarely experience it. Consider scaling with heat tier. |
| No active heat management | Partial | Dirt spend exists but is slow. Bribe favor helps. Consider a "Lay Low" mechanic (pause income, reduce heat fast). |
| Crew personality / traits | Open | Names are random but no skill differentiation. Could add rare traits (e.g., "Lucky" = 50% bail cost). |
| Prestige speed feel | Open | 10-second countdown is short. Could add a skip button or extend for drama. |
| Ad integration | Partial | Favors are ad-gated in production but fallback to immediate reward in dev. |
