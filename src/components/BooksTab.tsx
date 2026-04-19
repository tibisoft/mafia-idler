import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useGameStore } from '../store/gameStore';
import { formatCash } from '../utils/format';
import { CREW_TEMPLATES, FALL_HEAT_THRESHOLD, FALL_MIN_CASH_EARNED } from '../data/gameData';
import { Colors } from '../theme/colors';
import type { Objective } from '../types/game';

export function BooksTab() {
  const {
    upgrades, resources, purchaseUpgrade, crewCounts, crew, neighborhoods,
    prestigeMultiplier, prestige, totalCashEarned, prestigeCount,
    objectives, prestigeUpgrades, claimObjective, purchasePrestigeUpgrade, stats,
  } = useGameStore();

  let totalCashPerSec = 0;
  let totalHeatPerSec = 0;
  for (const template of CREW_TEMPLATES) {
    const count = crewCounts[template.rank] || 0;
    if (count === 0) continue;
    const activeCrew = count - crew.filter(c => c.rank === template.rank && c.isPinched).length;
    if (activeCrew <= 0) continue;
    totalCashPerSec += template.cashPerSecond * activeCrew;
    totalHeatPerSec += template.heatPerSecond * activeCrew;
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

  // Objectives by tier
  const tier1 = objectives.filter(o => o.tier === 1);
  const tier2 = objectives.filter(o => o.tier === 2);
  const tier3 = objectives.filter(o => o.tier === 3);
  const tier1Done = tier1.filter(o => o.completed).length;
  const tier2Done = tier2.filter(o => o.completed).length;
  const showTier2 = tier1Done >= 3;
  const showTier3 = tier2Done >= 4;

  const pendingClaims = objectives.filter(o => o.completed && !o.claimed).length;

  // Prestige upgrades
  const availablePrestigeUpgrades = prestigeUpgrades.filter(u => !u.purchased);
  const purchasedPrestigeUpgrades = prestigeUpgrades.filter(u => u.purchased);

  function renderObjective(obj: Objective) {
    const claimable = obj.completed && !obj.claimed;
    const done = obj.claimed;
    const rewardStr = [
      obj.reward.cash ? `+${formatCash(obj.reward.cash)}` : null,
      obj.reward.respect ? `+${obj.reward.respect} rep` : null,
      obj.reward.loyalty ? `+${obj.reward.loyalty} loyalty` : null,
    ].filter(Boolean).join(', ');

    return (
      <View
        key={obj.id}
        style={[
          styles.objectiveRow,
          claimable && styles.objectiveClaimable,
          done && styles.objectiveDone,
        ]}
      >
        <Text style={[styles.objectiveIcon, done && styles.objectiveIconDone]}>
          {done ? '✓' : obj.completed ? '●' : '○'}
        </Text>
        <View style={styles.objectiveBody}>
          <Text style={[styles.objectiveTitle, done && styles.objectiveTitleDone]}>
            {obj.title}
          </Text>
          {!done && (
            <Text style={styles.objectiveDesc}>{obj.description}</Text>
          )}
        </View>
        {claimable && (
          <TouchableOpacity onPress={() => claimObjective(obj.id)} style={styles.claimBtn}>
            <Text style={styles.claimBtnText}>{rewardStr}</Text>
          </TouchableOpacity>
        )}
        {done && (
          <Text style={styles.objectiveRewardDone}>{rewardStr}</Text>
        )}
      </View>
    );
  }

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

      {/* Objectives */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionLabel}>Objectives</Text>
        {pendingClaims > 0 && (
          <View style={styles.claimBadge}>
            <Text style={styles.claimBadgeText}>{pendingClaims} to claim</Text>
          </View>
        )}
      </View>

      <View style={styles.objectivesBox}>
        <Text style={styles.chapterTitle}>Chapter I — The Neighbourhood</Text>
        {tier1.map(renderObjective)}

        {showTier2 && (
          <>
            <Text style={[styles.chapterTitle, styles.chapterTitleMid]}>Chapter II — The Family</Text>
            {tier2.map(renderObjective)}
          </>
        )}
        {!showTier2 && (
          <Text style={styles.chapterLocked}>
            Complete {3 - tier1Done} more Chapter I objective{3 - tier1Done !== 1 ? 's' : ''} to unlock Chapter II
          </Text>
        )}

        {showTier3 && (
          <>
            <Text style={[styles.chapterTitle, styles.chapterTitleLate]}>Chapter III — The Commission</Text>
            {tier3.map(renderObjective)}
          </>
        )}
        {showTier2 && !showTier3 && (
          <Text style={styles.chapterLocked}>
            Complete {4 - tier2Done} more Chapter II objective{4 - tier2Done !== 1 ? 's' : ''} to unlock Chapter III
          </Text>
        )}
      </View>

      {/* The Fall */}
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

      {/* Prestige Upgrades */}
      {prestigeCount >= 1 && (
        <>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>Prestige Upgrades</Text>
            <Text style={styles.respectBalance}>{resources.respect.toFixed(0)} rep available</Text>
          </View>

          {availablePrestigeUpgrades.map(upgrade => {
            const isCommissionLocked = upgrade.requires === 'the_commission_obj' &&
              !objectives.find(o => o.id === 'the_commission')?.claimed;
            const requiresOtherUpgrade = upgrade.requires && upgrade.requires !== 'the_commission_obj' &&
              !prestigeUpgrades.find(u => u.id === upgrade.requires)?.purchased;
            const locked = isCommissionLocked || !!requiresOtherUpgrade;
            const canAfford = resources.respect >= upgrade.respectCost && !locked;

            return (
              <View
                key={upgrade.id}
                style={[
                  styles.upgradeCard,
                  locked ? styles.upgradeCardLocked :
                  canAfford ? styles.upgradeCardAffordable : styles.upgradeCardDefault,
                ]}
              >
                <View style={styles.upgradeInner}>
                  <View style={styles.upgradeInfo}>
                    <Text style={styles.upgradeName}>{upgrade.name}</Text>
                    <Text style={styles.upgradeDesc}>{upgrade.description}</Text>
                    {isCommissionLocked && (
                      <Text style={styles.upgradeRequires}>Requires: Complete "The Commission"</Text>
                    )}
                    {requiresOtherUpgrade && (
                      <Text style={styles.upgradeRequires}>
                        Requires: {prestigeUpgrades.find(u => u.id === upgrade.requires)?.name}
                      </Text>
                    )}
                  </View>
                  <TouchableOpacity
                    onPress={() => purchasePrestigeUpgrade(upgrade.id)}
                    disabled={!canAfford}
                    style={[
                      styles.purchaseBtn,
                      canAfford ? styles.purchaseBtnEnabled : styles.purchaseBtnDisabled,
                    ]}
                  >
                    <Text style={[
                      styles.purchaseBtnText,
                      canAfford ? styles.purchaseBtnTextEnabled : styles.purchaseBtnTextDisabled,
                    ]}>
                      {upgrade.respectCost} rep
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}

          {purchasedPrestigeUpgrades.map(upgrade => (
            <View key={upgrade.id} style={styles.purchasedCard}>
              <Text style={styles.checkmark}>✓</Text>
              <Text style={styles.purchasedName}>{upgrade.name}</Text>
            </View>
          ))}
        </>
      )}

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

  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionLabel: {
    color: Colors.gold + 'cc',
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 2,
    flex: 1,
  },
  claimBadge: {
    backgroundColor: Colors.gold,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  claimBadgeText: { color: Colors.black, fontSize: 9, fontWeight: 'bold' },
  respectBalance: { color: Colors.muted, fontSize: 10 },

  objectivesBox: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 12,
    backgroundColor: Colors.dark,
    gap: 6,
  },
  chapterTitle: {
    color: Colors.gold,
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
    marginTop: 2,
  },
  chapterTitleMid: { color: Colors.amber, marginTop: 10 },
  chapterTitleLate: { color: Colors.redBright, marginTop: 10 },
  chapterLocked: { color: Colors.muted, fontSize: 10, fontStyle: 'italic', marginTop: 8 },

  objectiveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  objectiveClaimable: {
    borderWidth: 1,
    borderColor: Colors.gold + '60',
    borderRadius: 6,
    padding: 6,
    backgroundColor: Colors.gold + '0d',
    marginVertical: 2,
  },
  objectiveDone: { opacity: 0.45 },
  objectiveIcon: { color: Colors.muted, fontSize: 12, width: 14 },
  objectiveIconDone: { color: Colors.gold },
  objectiveBody: { flex: 1 },
  objectiveTitle: { color: Colors.text, fontSize: 12 },
  objectiveTitleDone: { color: Colors.muted },
  objectiveDesc: { color: Colors.muted, fontSize: 10, marginTop: 1 },
  claimBtn: {
    backgroundColor: Colors.gold,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  claimBtnText: { color: Colors.black, fontSize: 10, fontWeight: 'bold' },
  objectiveRewardDone: { color: Colors.muted, fontSize: 10 },

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
