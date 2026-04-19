import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useGameStore } from '../store/gameStore';
import { formatCash } from '../utils/format';
import { Colors } from '../theme/colors';

interface SettingsTabProps {
  visible: boolean;
  onClose: () => void;
}

export function SettingsTab({ visible, onClose }: SettingsTabProps) {
  const { resetGame, prestigeCount, prestigeMultiplier, stats, objectives, prestigeUpgrades } = useGameStore();
  const [confirmVisible, setConfirmVisible] = useState(false);

  const objectivesComplete = objectives?.filter(o => o.claimed).length ?? 0;
  const prestigeUpgradesBought = prestigeUpgrades?.filter(u => u.purchased).length ?? 0;

  function handleReset() {
    resetGame();
    setConfirmVisible(false);
    onClose();
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close" size={22} color={Colors.muted} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          {/* Career stats */}
          <Text style={styles.sectionLabel}>Your Career</Text>
          <View style={styles.statsBox}>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Prestige count</Text>
              <Text style={styles.statValue}>{prestigeCount}×</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Current multiplier</Text>
              <Text style={[styles.statValue, { color: Colors.statusYellow }]}>×{prestigeMultiplier.toFixed(1)}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Lifetime earnings</Text>
              <Text style={[styles.statValue, { color: Colors.statusGreen }]}>{formatCash(stats?.lifetimeCashEarned ?? 0)}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Raids survived</Text>
              <Text style={[styles.statValue, { color: Colors.statusRed }]}>{stats?.raidsSurvived ?? 0}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Objectives claimed</Text>
              <Text style={[styles.statValue, { color: Colors.gold }]}>{objectivesComplete} / {objectives?.length ?? 0}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Prestige upgrades</Text>
              <Text style={[styles.statValue, { color: Colors.statusPurple }]}>{prestigeUpgradesBought} / {prestigeUpgrades?.length ?? 0}</Text>
            </View>
          </View>

          {/* Danger zone */}
          <Text style={styles.sectionLabel}>Danger Zone</Text>
          <View style={styles.dangerBox}>
            <Text style={styles.dangerTitle}>Reset Game</Text>
            <Text style={styles.dangerDesc}>
              Wipes all progress — cash, crew, territories, objectives, prestige count, and permanent upgrades. This cannot be undone.
            </Text>
            <TouchableOpacity style={styles.resetBtn} onPress={() => setConfirmVisible(true)}>
              <Text style={styles.resetBtnText}>Reset All Progress</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Confirm modal */}
        <Modal
          visible={confirmVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setConfirmVisible(false)}
        >
          <View style={styles.overlay}>
            <View style={styles.modal}>
              <Text style={styles.modalTitle}>Are you sure?</Text>
              <Text style={styles.modalDesc}>
                This will erase everything. Your prestige count, all objectives, and all permanent upgrades will be gone.
              </Text>
              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setConfirmVisible(false)}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.confirmBtn} onPress={handleReset}>
                  <Text style={styles.confirmBtnText}>Wipe It</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.black },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    color: Colors.gold,
    fontSize: 18,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 3,
  },
  content: { padding: 16, gap: 12 },
  sectionLabel: {
    color: Colors.gold + 'cc',
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  statsBox: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  statLabel: { color: Colors.muted, fontSize: 12 },
  statValue: { color: Colors.text, fontSize: 12, fontWeight: 'bold', fontFamily: 'monospace' },
  divider: { height: 1, backgroundColor: Colors.border },
  dangerBox: {
    borderWidth: 1,
    borderColor: Colors.redBright + '60',
    borderRadius: 8,
    padding: 12,
    backgroundColor: Colors.red + '1a',
    gap: 8,
  },
  dangerTitle: { color: Colors.statusRed, fontSize: 13, fontWeight: 'bold' },
  dangerDesc: { color: Colors.muted, fontSize: 11, lineHeight: 16 },
  resetBtn: {
    borderWidth: 1,
    borderColor: Colors.redBright,
    borderRadius: 4,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 4,
  },
  resetBtnText: { color: Colors.redBright, fontSize: 13, fontWeight: 'bold', letterSpacing: 1 },
  overlay: {
    flex: 1,
    backgroundColor: '#000000cc',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  modal: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.redBright + '60',
    borderRadius: 8,
    padding: 20,
    width: '100%',
    gap: 12,
  },
  modalTitle: { color: Colors.statusRed, fontSize: 16, fontWeight: 'bold' },
  modalDesc: { color: Colors.muted, fontSize: 12, lineHeight: 18 },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  cancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 4,
    paddingVertical: 10,
    alignItems: 'center',
  },
  cancelBtnText: { color: Colors.muted, fontSize: 13 },
  confirmBtn: {
    flex: 1,
    backgroundColor: Colors.redBright,
    borderRadius: 4,
    paddingVertical: 10,
    alignItems: 'center',
  },
  confirmBtnText: { color: Colors.text, fontSize: 13, fontWeight: 'bold' },
});
