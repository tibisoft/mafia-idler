import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useGameStore } from '../store/gameStore';
import { HEAT_TIERS } from '../data/gameData';
import { Colors } from '../theme/colors';

export function HeatMeter() {
  const { resources, spendDirt, raidWarningActive, raidTimer } = useGameStore();
  const heat = resources.heat;

  const currentTier = [...HEAT_TIERS].reverse().find(t => heat >= t.min) || HEAT_TIERS[0];
  const tierIndex = HEAT_TIERS.indexOf(currentTier);

  const tierBarColors = ['#1e3a5f', '#78350f', '#7c2d12', '#7f1d1d', '#991b1b'];
  const barColor = tierBarColors[tierIndex] || tierBarColors[0];

  const now = Date.now();
  const raidSecondsLeft = raidTimer ? Math.max(0, Math.ceil((raidTimer - now) / 1000)) : 0;

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>Heat Level</Text>
        <Text style={[styles.tierName, { color: currentTier.color }]}>{currentTier.name}</Text>
      </View>

      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: `${heat}%` as any, backgroundColor: barColor }]} />
      </View>

      {raidWarningActive && (
        <View style={styles.raidWarning}>
          <Text style={styles.raidText}>⚠️ RICO RAID IN {raidSecondsLeft}s</Text>
          <TouchableOpacity
            onPress={() => spendDirt(5)}
            disabled={resources.dirt < 5}
            style={[styles.btn, resources.dirt < 5 && styles.btnDisabled]}
          >
            <Text style={styles.btnText}>Spend 5 Dirt (-25 Heat)</Text>
          </TouchableOpacity>
        </View>
      )}

      {resources.dirt > 0 && !raidWarningActive && heat > 30 && (
        <TouchableOpacity
          onPress={() => spendDirt(1)}
          style={styles.dirtBtn}
        >
          <Text style={styles.dirtBtnText}>
            Spend 1 Dirt (-5 Heat) [{resources.dirt.toFixed(1)} available]
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border + '80',
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  label: {
    color: Colors.muted,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  tierName: {
    fontSize: 10,
    fontFamily: 'monospace',
  },
  barTrack: {
    height: 10,
    backgroundColor: Colors.black,
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 6,
  },
  barFill: {
    height: '100%',
    borderRadius: 5,
  },
  raidWarning: {
    marginTop: 6,
    padding: 8,
    borderWidth: 1,
    borderColor: '#991b1b',
    borderRadius: 4,
    backgroundColor: 'rgba(153,27,27,0.3)',
    alignItems: 'center',
  },
  raidText: {
    color: '#f87171',
    fontSize: 11,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  btn: {
    marginTop: 4,
    backgroundColor: '#7f1d1d',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 4,
  },
  btnDisabled: {
    opacity: 0.5,
  },
  btnText: {
    color: Colors.text,
    fontSize: 11,
  },
  dirtBtn: {
    marginTop: 4,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  dirtBtnText: {
    color: Colors.muted,
    fontSize: 11,
    textAlign: 'center',
  },
});
