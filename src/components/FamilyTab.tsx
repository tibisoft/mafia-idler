import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useGameStore } from '../store/gameStore';
import { formatCash } from '../utils/format';
import { CREW_TEMPLATES } from '../data/gameData';
import type { CrewRank } from '../types/game';
import { Colors } from '../theme/colors';

export function FamilyTab() {
  const { crewCounts, crew, resources, hireCrew, bailOutCrew } = useGameStore();
  const pinchedMembers = crew.filter(c => c.isPinched);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>The Family</Text>

      {pinchedMembers.length > 0 && (
        <View style={styles.pinchedBox}>
          <Text style={styles.pinchedHeader}>⚠️ Pinched</Text>
          {pinchedMembers.map(member => (
            <View key={member.id} style={styles.pinchedRow}>
              <View>
                <Text style={styles.pinchedName}>{member.name} "{member.nickname}"</Text>
                {member.pinchedUntil && (
                  <Text style={styles.pinchedTimer}>
                    Free in {Math.max(0, Math.ceil((member.pinchedUntil - Date.now()) / 60000))}m
                  </Text>
                )}
              </View>
              <TouchableOpacity
                onPress={() => bailOutCrew(member.id)}
                disabled={resources.cash < 500}
                style={[styles.bailBtn, resources.cash < 500 && styles.bailBtnDisabled]}
              >
                <Text style={styles.bailBtnText}>Bail $500</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {CREW_TEMPLATES.map(template => {
        const count = crewCounts[template.rank] || 0;
        const activeCrew = count - crew.filter(c => c.rank === template.rank && c.isPinched).length;
        const canAfford = resources.cash >= template.cashCost && resources.loyalty >= template.loyaltyCost;
        const isUnlocked = resources.cash >= template.unlockCash || count > 0;
        const isMaxed = count >= template.maxCount;

        if (!isUnlocked) {
          return (
            <View key={template.rank} style={styles.lockedCard}>
              <Text style={styles.lockedText}>🔒 Unlock at {formatCash(template.unlockCash)}</Text>
            </View>
          );
        }

        return (
          <View key={template.rank} style={styles.card}>
            <View style={styles.cardInner}>
              <View style={styles.cardLeft}>
                <View style={styles.cardTitleRow}>
                  <Text style={styles.cardTitle}>{template.title}</Text>
                  <View style={styles.countBadge}>
                    <Text style={styles.countText}>{count}/{template.maxCount}</Text>
                  </View>
                </View>
                <Text style={styles.cardAbility}>{template.specialAbility}</Text>
                <View style={styles.cardStats}>
                  <Text style={styles.cashStat}>+{formatCash(template.cashPerSecond * activeCrew)}/s</Text>
                  {template.heatPerSecond > 0 && (
                    <Text style={styles.heatStat}>🌡+{(template.heatPerSecond * activeCrew).toFixed(3)}/s</Text>
                  )}
                </View>
              </View>
              <TouchableOpacity
                onPress={() => hireCrew(template.rank as CrewRank)}
                disabled={!canAfford || isMaxed}
                style={[
                  styles.hireBtn,
                  isMaxed ? styles.hireBtnMaxed :
                  canAfford ? styles.hireBtnEnabled : styles.hireBtnDisabled,
                ]}
              >
                <Text style={[
                  styles.hireBtnText,
                  canAfford && !isMaxed ? styles.hireBtnTextEnabled : styles.hireBtnTextDisabled,
                ]}>
                  {isMaxed ? 'MAX' : `${formatCash(template.cashCost)}${template.loyaltyCost > 0 ? ` + ${template.loyaltyCost}🤝` : ''}`}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      })}
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
  pinchedBox: {
    borderWidth: 1,
    borderColor: '#991b1b',
    borderRadius: 8,
    backgroundColor: 'rgba(153,27,27,0.2)',
    padding: 12,
  },
  pinchedHeader: {
    color: '#f87171',
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 8,
  },
  pinchedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  pinchedName: { color: Colors.muted, fontSize: 11, textDecorationLine: 'line-through' },
  pinchedTimer: { color: Colors.redBright, fontSize: 11 },
  bailBtn: {
    backgroundColor: Colors.gold + '33',
    borderWidth: 1,
    borderColor: Colors.gold + '4d',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  bailBtnDisabled: { opacity: 0.5 },
  bailBtnText: { color: Colors.gold, fontSize: 11 },
  lockedCard: {
    borderWidth: 1,
    borderColor: Colors.border + '66',
    borderRadius: 8,
    padding: 12,
    opacity: 0.4,
  },
  lockedText: { color: Colors.muted, fontSize: 11 },
  card: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    backgroundColor: Colors.card,
    padding: 12,
  },
  cardInner: { flexDirection: 'row', alignItems: 'flex-start' },
  cardLeft: { flex: 1 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardTitle: { color: Colors.gold, fontSize: 13, fontWeight: 'bold' },
  countBadge: {
    backgroundColor: Colors.black,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
  },
  countText: { color: Colors.muted, fontSize: 10, fontFamily: 'monospace' },
  cardAbility: { color: Colors.muted, fontSize: 11, marginTop: 2 },
  cardStats: { flexDirection: 'row', gap: 12, marginTop: 4 },
  cashStat: { color: Colors.statusGreen, fontSize: 11, fontFamily: 'monospace' },
  heatStat: { color: Colors.statusOrange, fontSize: 11, fontFamily: 'monospace' },
  hireBtn: {
    marginLeft: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  hireBtnEnabled: { backgroundColor: Colors.gold },
  hireBtnMaxed: { backgroundColor: Colors.border },
  hireBtnDisabled: { backgroundColor: Colors.border },
  hireBtnText: { fontSize: 11, fontFamily: 'monospace' },
  hireBtnTextEnabled: { color: Colors.black, fontWeight: 'bold' },
  hireBtnTextDisabled: { color: Colors.muted },
});
