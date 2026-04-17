import React from 'react';
import { View, Text, Modal, StyleSheet } from 'react-native';
import { useGameStore } from '../store/gameStore';
import { Colors } from '../theme/colors';

export function FallScreen() {
  const { isFalling, fallTimer } = useGameStore();
  const secondsLeft = Math.ceil(fallTimer / 1000);

  return (
    <Modal visible={isFalling} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.content}>
          <Text style={styles.icon}>⚖️</Text>
          <Text style={styles.title}>The Gavel Falls</Text>
          <Text style={styles.subtitle}>
            "Guilty on all counts. The court sentences you to..."
          </Text>
          <Text style={styles.timer}>{secondsLeft}s</Text>
          <Text style={styles.label}>Doing Your Time</Text>
          <Text style={styles.footer}>
            You'll come out stronger. The streets don't forget.
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 24,
    maxWidth: 320,
  },
  icon: {
    fontSize: 56,
    marginBottom: 20,
  },
  title: {
    color: Colors.text,
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  subtitle: {
    color: Colors.muted,
    fontSize: 13,
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 20,
  },
  timer: {
    color: Colors.gold,
    fontFamily: 'monospace',
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  label: {
    color: Colors.muted,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  footer: {
    color: Colors.muted,
    fontSize: 11,
    marginTop: 20,
    textAlign: 'center',
  },
});
