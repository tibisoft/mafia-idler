import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useGameStore } from '../store/gameStore';
import { formatCash, formatNumber } from '../utils/format';
import { Colors } from '../theme/colors';

export function ResourceBar() {
  const { resources, prestigeCount, prestigeMultiplier } = useGameStore();

  const heatColor =
    resources.heat < 20 ? Colors.blue :
    resources.heat < 40 ? Colors.yellow :
    resources.heat < 60 ? Colors.orange :
    resources.heat < 80 ? Colors.redLight : Colors.red;

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <View style={styles.item}>
          <Text style={styles.icon}>💰</Text>
          <Text style={[styles.value, { color: Colors.gold }]}>{formatCash(resources.cash)}</Text>
        </View>
        <View style={styles.item}>
          <Text style={styles.icon}>🌡</Text>
          <Text style={[styles.value, { color: heatColor }]}>{resources.heat.toFixed(1)}%</Text>
        </View>
        <View style={styles.item}>
          <Text style={styles.icon}>🤝</Text>
          <Text style={[styles.value, { color: Colors.purple }]}>{formatNumber(resources.loyalty)}</Text>
        </View>
        <View style={styles.item}>
          <Text style={styles.icon}>⭐</Text>
          <Text style={[styles.value, { color: Colors.yellow }]}>{formatNumber(resources.respect)}</Text>
        </View>
        <View style={styles.item}>
          <Text style={styles.icon}>📁</Text>
          <Text style={[styles.value, { color: Colors.green }]}>{formatNumber(resources.dirt)}</Text>
        </View>
        {prestigeCount > 0 && (
          <View style={styles.item}>
            <Text style={[styles.value, { color: Colors.muted }]}>Run #{prestigeCount + 1}</Text>
            <Text style={[styles.value, { color: Colors.gold }]}>×{prestigeMultiplier.toFixed(1)}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.dark,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  icon: {
    fontSize: 12,
  },
  value: {
    fontFamily: 'monospace',
    fontSize: 13,
    fontWeight: 'bold',
  },
});
