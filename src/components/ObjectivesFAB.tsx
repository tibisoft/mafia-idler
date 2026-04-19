import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useGameStore } from '../store/gameStore';
import { formatCash } from '../utils/format';
import { Colors } from '../theme/colors';
import type { Objective } from '../types/game';

export function ObjectivesFAB() {
  const [visible, setVisible] = useState(false);
  const { objectives, claimObjective } = useGameStore();

  const pendingClaims = objectives.filter(o => o.completed && !o.claimed).length;

  const tier1 = objectives.filter(o => o.tier === 1);
  const tier2 = objectives.filter(o => o.tier === 2);
  const tier3 = objectives.filter(o => o.tier === 3);
  const tier1Done = tier1.filter(o => o.completed).length;
  const tier2Done = tier2.filter(o => o.completed).length;
  const showTier2 = tier1Done >= 3;
  const showTier3 = tier2Done >= 4;

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
    <>
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setVisible(true)}
        activeOpacity={0.85}
      >
        <Ionicons name="trophy-outline" size={22} color={Colors.black} />
        {pendingClaims > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{pendingClaims}</Text>
          </View>
        )}
      </TouchableOpacity>

      <Modal
        visible={visible}
        animationType="slide"
        transparent
        onRequestClose={() => setVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Objectives</Text>
              {pendingClaims > 0 && (
                <View style={styles.headerBadge}>
                  <Text style={styles.headerBadgeText}>{pendingClaims} to claim</Text>
                </View>
              )}
              <TouchableOpacity
                onPress={() => setVisible(false)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close" size={20} color={Colors.muted} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalContent}>
              <View style={styles.objectivesBox}>
                <Text style={styles.chapterTitle}>Chapter I — The Neighbourhood</Text>
                {tier1.map(renderObjective)}

                {showTier2 ? (
                  <>
                    <Text style={[styles.chapterTitle, styles.chapterTitleMid]}>
                      Chapter II — The Family
                    </Text>
                    {tier2.map(renderObjective)}
                  </>
                ) : (
                  <Text style={styles.chapterLocked}>
                    Complete {3 - tier1Done} more Chapter I objective{3 - tier1Done !== 1 ? 's' : ''} to unlock Chapter II
                  </Text>
                )}

                {showTier3 && (
                  <>
                    <Text style={[styles.chapterTitle, styles.chapterTitleLate]}>
                      Chapter III — The Commission
                    </Text>
                    {tier3.map(renderObjective)}
                  </>
                )}
                {showTier2 && !showTier3 && (
                  <Text style={styles.chapterLocked}>
                    Complete {4 - tier2Done} more Chapter II objective{4 - tier2Done !== 1 ? 's' : ''} to unlock Chapter III
                  </Text>
                )}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

const TAB_BAR_HEIGHT = Platform.OS === 'ios' ? 88 : 60;

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 16,
    bottom: TAB_BAR_HEIGHT + 12,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 8,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.redBright,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: Colors.dark,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: 'bold',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: Colors.dark,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '75%',
    borderTopWidth: 1,
    borderColor: Colors.border,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    color: Colors.gold,
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 2,
    flex: 1,
  },
  headerBadge: {
    backgroundColor: Colors.gold,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  headerBadgeText: { color: Colors.black, fontSize: 9, fontWeight: 'bold' },
  modalContent: {
    padding: 12,
  },

  objectivesBox: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 12,
    backgroundColor: Colors.card,
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
});
