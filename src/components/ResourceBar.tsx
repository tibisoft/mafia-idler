import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useGameStore } from '../store/gameStore';
import { formatCash, formatNumber } from '../utils/format';
import { Colors } from '../theme/colors';

interface ResourceBarProps {
  onSettingsPress: () => void;
}

export function ResourceBar({ onSettingsPress }: ResourceBarProps) {
  const { resources } = useGameStore();

  const heatColor =
    resources.heat < 20 ? Colors.statusBlue :
    resources.heat < 40 ? Colors.statusYellow :
    resources.heat < 60 ? Colors.statusOrange :
    resources.heat < 80 ? Colors.statusRed : Colors.redBright;

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <View style={styles.item}>
          <Text style={styles.icon}>💵</Text>
          <Text style={[styles.value, { color: Colors.gold }]}>{formatCash(resources.cash)}</Text>
        </View>
        <View style={styles.item}>
          <Text style={styles.icon}>🔥</Text>
          <Text style={[styles.value, { color: heatColor }]}>{resources.heat.toFixed(1)}%</Text>
        </View>
        <View style={styles.item}>
          <Text style={styles.icon}>🤝</Text>
          <Text style={[styles.value, { color: Colors.statusPurple }]}>{formatNumber(resources.loyalty)}</Text>
        </View>
        <View style={styles.item}>
          <Text style={styles.icon}>👑</Text>
          <Text style={[styles.value, { color: Colors.statusYellow }]}>{formatNumber(resources.respect)}</Text>
        </View>
        <View style={styles.item}>
          <Text style={styles.icon}>🗂️</Text>
          <Text style={[styles.value, { color: Colors.statusGreen }]}>{formatNumber(resources.dirt)}</Text>
        </View>
        <TouchableOpacity onPress={onSettingsPress} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="settings-outline" size={18} color={Colors.muted} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.dark,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 4,
  },
  item: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  icon: {
    fontSize: 12,
    textAlign: 'center',
  },
  value: {
    fontFamily: 'monospace',
    fontSize: 11,
    fontWeight: 'bold',
    flexShrink: 1,
  },
});
