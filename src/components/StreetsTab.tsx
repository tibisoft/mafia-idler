import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useGameStore, calculateRacketEfficiency } from '../store/gameStore';
import { formatCash } from '../utils/format';
import { Colors } from '../theme/colors';

export function StreetsTab() {
  const { neighborhoods, resources, crewCounts, crew, acquireTerritory, upgradeRacket } = useGameStore();

  const totalStreetKidsRequired = neighborhoods
    .filter(n => n.owned)
    .reduce((sum, n) => sum + n.rackets.reduce((s, r) => s + r.streetKidsRequired, 0), 0);
  const racketEfficiency = calculateRacketEfficiency(crewCounts, crew, neighborhoods);
  const activeStreetKids = Math.max(0, (crewCounts.street_kid || 0) - crew.filter(c => c.rank === 'street_kid' && c.isPinched).length);
  const efficiencyPct = Math.round(racketEfficiency * 100);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>The Streets</Text>
      <Text style={styles.subtitle}>Your territory across the city</Text>

      {totalStreetKidsRequired > 0 && (
        <View style={[styles.efficiencyBanner, racketEfficiency < 1 ? styles.efficiencyBannerWarn : styles.efficiencyBannerOk]}>
          <Text style={styles.efficiencyLabel}>
            Street Runners: {activeStreetKids}/{totalStreetKidsRequired} active · Racket efficiency: {efficiencyPct}%
          </Text>
        </View>
      )}

      {neighborhoods.map(neighborhood => (
        <View
          key={neighborhood.id}
          style={[styles.card, neighborhood.owned ? styles.cardOwned : styles.cardUnowned]}
        >
          <View style={styles.cardHeader}>
            <View>
              <View style={styles.nameRow}>
                <View style={[styles.dot, { backgroundColor: neighborhood.owned ? Colors.gold : Colors.muted }]} />
                <Text style={styles.neighborhoodName}>{neighborhood.name}</Text>
              </View>
              {!neighborhood.owned && neighborhood.rivalFamily && (
                <Text style={styles.rivalText}>Held by: {neighborhood.rivalFamily}</Text>
              )}
            </View>
            {!neighborhood.owned && (
              <TouchableOpacity
                onPress={() => acquireTerritory(neighborhood.id)}
                disabled={resources.cash < (neighborhood.tributeCost || 0)}
                style={[
                  styles.acquireBtn,
                  resources.cash >= (neighborhood.tributeCost || 0)
                    ? styles.acquireBtnEnabled
                    : styles.acquireBtnDisabled,
                ]}
              >
                <Text style={[
                  styles.acquireBtnText,
                  resources.cash >= (neighborhood.tributeCost || 0)
                    ? styles.acquireBtnTextEnabled
                    : styles.acquireBtnTextDisabled,
                ]}>
                  {formatCash(neighborhood.tributeCost || 0)} to Muscle In
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {neighborhood.owned && (
            <View style={styles.rackets}>
              {neighborhood.rackets.map(racket => (
                <View key={racket.type} style={styles.racketRow}>
                  <View style={styles.racketInfo}>
                    <Text style={styles.racketName}>{racket.name}</Text>
                    <Text style={styles.racketStats}>
                      Lvl {racket.level} · {formatCash(racket.cashPerSecond * racket.level)}/s · 🌡+{(racket.heatPerSecond * racket.level).toFixed(3)}/s
                    </Text>
                    <Text style={styles.racketKids}>
                      👦 Needs {racket.streetKidsRequired} street kids
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => upgradeRacket(neighborhood.id, racket.type)}
                    disabled={resources.cash < racket.upgradeCost}
                    style={[
                      styles.upgradeBtn,
                      resources.cash >= racket.upgradeCost
                        ? styles.upgradeBtnEnabled
                        : styles.upgradeBtnDisabled,
                    ]}
                  >
                    <Text style={[
                      styles.upgradeBtnText,
                      resources.cash >= racket.upgradeCost
                        ? styles.upgradeBtnTextEnabled
                        : styles.upgradeBtnTextDisabled,
                    ]}>
                      ↑ {formatCash(racket.upgradeCost)}
                    </Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.black,
  },
  content: {
    padding: 16,
    gap: 12,
  },
  title: {
    color: Colors.gold,
    fontSize: 18,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 3,
    marginBottom: 4,
  },
  subtitle: {
    color: Colors.muted,
    fontSize: 11,
    marginBottom: 4,
  },
  card: {
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  cardOwned: {
    borderColor: Colors.gold + '66',
    backgroundColor: Colors.card,
  },
  cardUnowned: {
    borderColor: Colors.border,
    backgroundColor: Colors.dark,
    opacity: 0.8,
  },
  cardHeader: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  neighborhoodName: {
    color: Colors.text,
    fontSize: 13,
    fontWeight: 'bold',
  },
  rivalText: {
    color: Colors.muted,
    fontSize: 11,
    marginTop: 2,
  },
  acquireBtn: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 4,
  },
  acquireBtnEnabled: {
    backgroundColor: Colors.gold,
  },
  acquireBtnDisabled: {
    backgroundColor: Colors.border,
  },
  acquireBtnText: {
    fontSize: 11,
    fontFamily: 'monospace',
  },
  acquireBtnTextEnabled: {
    color: Colors.black,
  },
  acquireBtnTextDisabled: {
    color: Colors.muted,
  },
  rackets: {
    paddingHorizontal: 12,
    paddingBottom: 12,
    gap: 8,
  },
  racketRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 4,
    padding: 8,
  },
  racketInfo: {
    flex: 1,
  },
  racketName: {
    color: Colors.text,
    fontSize: 11,
    fontFamily: 'monospace',
  },
  racketStats: {
    color: Colors.muted,
    fontSize: 10,
    marginTop: 2,
  },
  racketKids: {
    color: Colors.muted,
    fontSize: 10,
    marginTop: 2,
  },
  upgradeBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
  },
  upgradeBtnEnabled: {
    backgroundColor: Colors.gold + '33',
    borderColor: Colors.gold + '4d',
  },
  upgradeBtnDisabled: {
    backgroundColor: Colors.border + '33',
    borderColor: Colors.border,
  },
  upgradeBtnText: {
    fontSize: 11,
    fontFamily: 'monospace',
  },
  upgradeBtnTextEnabled: {
    color: Colors.gold,
  },
  upgradeBtnTextDisabled: {
    color: Colors.muted,
  },
  efficiencyBanner: {
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 4,
    borderWidth: 1,
  },
  efficiencyBannerOk: {
    backgroundColor: Colors.gold + '1a',
    borderColor: Colors.gold + '4d',
  },
  efficiencyBannerWarn: {
    backgroundColor: '#8b1a1a33',
    borderColor: '#cc222266',
  },
  efficiencyLabel: {
    color: Colors.text,
    fontSize: 11,
    fontFamily: 'monospace',
  },
});
