import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useGameStore } from '../store/gameStore';
import { formatCash } from '../utils/format';
import { CREW_TEMPLATES, FALL_HEAT_THRESHOLD, FALL_MIN_CASH_EARNED } from '../data/gameData';
import { Colors } from '../theme/colors';

export function BooksTab() {
  const { upgrades, resources, purchaseUpgrade, crewCounts, neighborhoods, prestigeMultiplier, prestige, totalCashEarned, prestigeCount } = useGameStore();

  let totalCashPerSec = 0;
  let totalHeatPerSec = 0;
  for (const template of CREW_TEMPLATES) {
    const count = crewCounts[template.rank] || 0;
    totalCashPerSec += template.cashPerSecond * count;
    totalHeatPerSec += template.heatPerSecond * count;
  }
  for (const n of neighborhoods) {
    if (!n.owned) continue;
    for (const r of n.rackets) {
      totalCashPerSec += r.cashPerSecond * r.level;
      totalHeatPerSec += r.heatPerSecond * r.level;
    }
  }
  totalCashPerSec *= prestigeMultiplier;

  const purchasedUpgrades = upgrades.filter(u => u.purchased);
  const availableUpgrades = upgrades.filter(u => !u.purchased);
  const nextPrestigeMultiplier = 1 + (prestigeCount + 1) * 0.5;

  const canTakeFall = resources.heat >= FALL_HEAT_THRESHOLD;
  const willEarnMultiplier = totalCashEarned >= FALL_MIN_CASH_EARNED;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>The Books</Text>

      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Cash/sec</Text>
          <Text style={[styles.statValue, { color: Colors.statusGreen }]}>{formatCash(totalCashPerSec)}/s</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Heat/sec</Text>
          <Text style={[styles.statValue, { color: Colors.statusOrange }]}>+{totalHeatPerSec.toFixed(4)}/s</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Total Earned</Text>
          <Text style={[styles.statValue, { color: Colors.gold }]}>{formatCash(totalCashEarned)}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Rep Mult</Text>
          <Text style={[styles.statValue, { color: Colors.statusYellow }]}>×{prestigeMultiplier.toFixed(1)}</Text>
        </View>
      </View>

      <View style={styles.fallBox}>
        <Text style={styles.fallTitle}>⚖️ The Fall</Text>
        <Text style={styles.fallDesc}>
          Go down voluntarily. Do your time. Come back stronger with a higher reputation multiplier.{'\n'}
          Next run: ×{nextPrestigeMultiplier.toFixed(1)} multiplier
        </Text>
        {!canTakeFall && (
          <Text style={styles.fallWarningMuted}>
            Heat too low — you need at least {FALL_HEAT_THRESHOLD} heat before you can take the fall. ({resources.heat.toFixed(1)}/{FALL_HEAT_THRESHOLD})
          </Text>
        )}
        {canTakeFall && !willEarnMultiplier && (
          <Text style={styles.fallWarningYellow}>
            ⚠️ You haven't earned enough yet — taking the fall now won't increase your multiplier.
          </Text>
        )}
        <TouchableOpacity
          onPress={prestige}
          disabled={!canTakeFall}
          style={[styles.fallBtn, !canTakeFall && styles.fallBtnDisabled]}
        >
          <Text style={[styles.fallBtnText, !canTakeFall && styles.fallBtnTextDisabled]}>Take The Fall</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionLabel}>Upgrades</Text>

      {availableUpgrades.map(upgrade => {
        const canAfford = resources.cash >= upgrade.cashCost && resources.respect >= upgrade.respectCost;
        const requiresMet = !upgrade.requires || upgrades.find(u => u.id === upgrade.requires)?.purchased;

        return (
          <View
            key={upgrade.id}
            style={[
              styles.upgradeCard,
              !requiresMet ? styles.upgradeCardLocked :
              canAfford ? styles.upgradeCardAffordable : styles.upgradeCardDefault,
            ]}
          >
            <View style={styles.upgradeInner}>
              <View style={styles.upgradeInfo}>
                <Text style={styles.upgradeName}>{upgrade.name}</Text>
                <Text style={styles.upgradeDesc}>{upgrade.description}</Text>
                {upgrade.requires && !requiresMet && (
                  <Text style={styles.upgradeRequires}>
                    Requires: {upgrades.find(u => u.id === upgrade.requires)?.name}
                  </Text>
                )}
              </View>
              <TouchableOpacity
                onPress={() => purchaseUpgrade(upgrade.id)}
                disabled={!canAfford || !requiresMet}
                style={[
                  styles.purchaseBtn,
                  canAfford && requiresMet ? styles.purchaseBtnEnabled : styles.purchaseBtnDisabled,
                ]}
              >
                <Text style={[
                  styles.purchaseBtnText,
                  canAfford && requiresMet ? styles.purchaseBtnTextEnabled : styles.purchaseBtnTextDisabled,
                ]}>
                  {formatCash(upgrade.cashCost)}{upgrade.respectCost > 0 ? ` + ${upgrade.respectCost}⭐` : ''}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      })}

      {purchasedUpgrades.map(upgrade => (
        <View key={upgrade.id} style={styles.purchasedCard}>
          <Text style={styles.checkmark}>✓</Text>
          <Text style={styles.purchasedName}>{upgrade.name}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.black },
  content: { padding: 16, gap: 12 },
  title: {
    color: Colors.gold,
    fontSize: 18,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 3,
    marginBottom: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 4,
    padding: 12,
  },
  statLabel: { color: Colors.muted, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 },
  statValue: { fontFamily: 'monospace', fontSize: 14, fontWeight: 'bold', marginTop: 2 },
  fallBox: {
    borderWidth: 1,
    borderColor: Colors.red + '80',
    borderRadius: 8,
    padding: 12,
    backgroundColor: Colors.red + '1a',
  },
  fallTitle: { color: Colors.text, fontSize: 13, fontWeight: 'bold', marginBottom: 4 },
  fallDesc: { color: Colors.muted, fontSize: 11, marginBottom: 8 },
  fallBtn: {
    borderWidth: 1,
    borderColor: Colors.redBright + '99',
    borderRadius: 4,
    paddingVertical: 8,
    alignItems: 'center',
  },
  fallBtnText: { color: Colors.redBright, fontSize: 13, letterSpacing: 1 },
  fallBtnDisabled: { borderColor: Colors.border, opacity: 0.5 },
  fallBtnTextDisabled: { color: Colors.muted },
  fallWarningMuted: { color: Colors.muted, fontSize: 11, fontStyle: 'italic', marginBottom: 8 },
  fallWarningYellow: { color: Colors.amber, fontSize: 11, fontStyle: 'italic', marginBottom: 8 },
  sectionLabel: {
    color: Colors.gold + 'cc',
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  upgradeCard: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
  },
  upgradeCardLocked: { opacity: 0.4, borderColor: Colors.border, backgroundColor: Colors.dark },
  upgradeCardAffordable: { borderColor: Colors.gold + '4d', backgroundColor: Colors.card },
  upgradeCardDefault: { borderColor: Colors.border, backgroundColor: Colors.dark },
  upgradeInner: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  upgradeInfo: { flex: 1 },
  upgradeName: { color: Colors.text, fontSize: 12, fontWeight: 'bold' },
  upgradeDesc: { color: Colors.muted, fontSize: 11, marginTop: 2 },
  upgradeRequires: { color: Colors.muted, fontSize: 10, marginTop: 2, opacity: 0.6 },
  purchaseBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  purchaseBtnEnabled: { backgroundColor: Colors.gold },
  purchaseBtnDisabled: { backgroundColor: Colors.border },
  purchaseBtnText: { fontFamily: 'monospace', fontSize: 11 },
  purchaseBtnTextEnabled: { color: Colors.black, fontWeight: 'bold' },
  purchaseBtnTextDisabled: { color: Colors.muted },
  purchasedCard: {
    borderWidth: 1,
    borderColor: Colors.gold + '33',
    borderRadius: 8,
    padding: 8,
    opacity: 0.6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkmark: { color: Colors.gold, fontSize: 11 },
  purchasedName: { color: Colors.muted, fontSize: 11 },
});
