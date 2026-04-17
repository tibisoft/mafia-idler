# Mafia Idler

A mafia-themed idle/incremental game built with React Native and Expo.

## Gameplay

Build your criminal empire from street corners to organized crime. Manage your crew, acquire territory, and keep your heat level under control.

- 🗺️ **The Streets** — Acquire neighborhoods and upgrade rackets
- 👥 **The Family** — Hire crew members from street kids to the Don  
- 📒 **The Books** — Track your stats and buy upgrades
- 📡 **The Wire** — Monitor events and FBI activity
- 📞 **Favors** — Call in favors through your Consigliere

## Tech Stack

- **React Native + Expo** — Cross-platform mobile app
- **TypeScript** — Type safety
- **Zustand** — State management with AsyncStorage persistence
- **React Navigation** — Tab-based navigation

## Running Locally

```bash
npm install
npm start
```

Then scan the QR code with the Expo Go app on your phone, or press `a` for Android emulator / `i` for iOS simulator.

## Building

```bash
# Install EAS CLI
npm install -g eas-cli

# Build for Android
eas build --platform android

# Build for iOS
eas build --platform ios
```
