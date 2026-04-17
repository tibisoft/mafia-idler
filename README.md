# Mafia Idler

A mafia-themed idle/incremental game built with React, TypeScript, Vite, Tailwind CSS, and Zustand.

## Gameplay

Build your criminal empire from the ground up:

- **The Streets** — Acquire neighborhoods and upgrade rackets (numbers running, loan sharking, smuggling, gambling dens, protection)
- **The Family** — Hire crew from Street Kids up to the Don (8 ranks), each generating passive income
- **The Books** — Purchase upgrades, track stats, and trigger **The Fall** (prestige mechanic)
- **The Wire** — Activity log showing all events, warnings, and notifications
- **Favors** — Call your Consigliere for one-time boosts: tips, bribes, bail-outs, shipments, and more

### Heat System
Every racket and crew member generates **heat**. As heat rises you progress through tiers:
- 🟦 Clean → 🟡 Street Cops → 🟠 Detectives → 🔴 FBI → 🆘 RICO

At RICO levels, expect crew to get pinched and raids if you don't cool down in time. Spend **Dirt** to reduce heat.

### Prestige — The Fall
Voluntarily "take the fall" (go to prison) to reset with a permanent income multiplier. Each run grants a higher reputation bonus.

## Tech Stack

- **React + TypeScript** — UI and type safety
- **Vite** — Build tool and dev server
- **Tailwind CSS v3** — Styling with a custom mafia color palette
- **Zustand** — State management with localStorage persistence

## Running Locally

```bash
npm install
npm run dev
```

Build for production:

```bash
npm run build
```
