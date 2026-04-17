import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useGameStore } from '../store/gameStore';
import { Colors } from '../theme/colors';

export function WireTab() {
  const { notifications } = useGameStore();
  const now = Date.now();

  function timeAgo(timestamp: number): string {
    const diff = now - timestamp;
    if (diff < 60000) return 'just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    return `${Math.floor(diff / 3600000)}h ago`;
  }

  const typeTextColors: Record<string, string> = {
    info: Colors.blue,
    warning: Colors.yellow,
    danger: Colors.redLight,
    success: Colors.green,
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>The Wire</Text>
      <Text style={styles.subtitle}>Intel from the streets</Text>

      {notifications.length === 0 ? (
        <Text style={styles.empty}>Nothing to report... yet.</Text>
      ) : (
        notifications.map(notif => (
          <View
            key={notif.id}
            style={[styles.notifRow, { borderLeftColor: typeTextColors[notif.type] }]}
          >
            <Text style={[styles.notifMessage, { color: typeTextColors[notif.type] }]}>
              {notif.message}
            </Text>
            <Text style={styles.notifTime}>{timeAgo(notif.timestamp)}</Text>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.black },
  content: { padding: 16, gap: 8 },
  title: {
    color: Colors.gold,
    fontSize: 18,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 3,
    marginBottom: 4,
  },
  subtitle: { color: Colors.muted, fontSize: 11, marginBottom: 4 },
  empty: {
    color: Colors.muted,
    fontSize: 11,
    textAlign: 'center',
    paddingVertical: 32,
  },
  notifRow: {
    borderLeftWidth: 2,
    paddingLeft: 12,
    paddingVertical: 4,
  },
  notifMessage: { fontSize: 12 },
  notifTime: { color: Colors.muted, fontSize: 10, opacity: 0.6, marginTop: 2 },
});
