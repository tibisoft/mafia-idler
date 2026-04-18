import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal, StyleSheet } from 'react-native';
import { InterstitialAd, AdEventType, TestIds } from '../utils/ads';
import type { InterstitialAdInstance } from '../utils/ads';
import { useGameStore } from '../store/gameStore';
import { FAVORS } from '../data/gameData';
import type { FavorType } from '../types/game';
import { formatTime } from '../utils/format';
import { Colors } from '../theme/colors';

const AD_UNIT_ID = __DEV__ ? TestIds.INTERSTITIAL : 'ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX';

export function FavorsTab() {
  const { favorCooldowns, useFavor, crew } = useGameStore();
  const [phoneRinging, setPhoneRinging] = useState<FavorType | null>(null);
  const [pendingFavor, setPendingFavor] = useState<FavorType | null>(null);
  const [adLoaded, setAdLoaded] = useState(false);

  const interstitialAdRef = useRef<InterstitialAdInstance | null>(null);
  const pendingRewardRef = useRef<FavorType | null>(null);
  const useFavorRef = useRef(useFavor);
  useFavorRef.current = useFavor;

  useEffect(() => {
    const ad = InterstitialAd.createForAdRequest(AD_UNIT_ID);
    interstitialAdRef.current = ad;

    const unsubLoaded = ad.addAdEventListener(AdEventType.LOADED, () => {
      setAdLoaded(true);
    });

    const unsubClosed = ad.addAdEventListener(AdEventType.CLOSED, () => {
      setAdLoaded(false);
      if (pendingRewardRef.current) {
        useFavorRef.current(pendingRewardRef.current);
        pendingRewardRef.current = null;
      }
      ad.load();
    });

    const unsubError = ad.addAdEventListener(AdEventType.ERROR, () => {
      setAdLoaded(false);
      if (pendingRewardRef.current) {
        useFavorRef.current(pendingRewardRef.current);
        pendingRewardRef.current = null;
      }
      ad.load();
    });

    ad.load();

    return () => {
      unsubLoaded();
      unsubClosed();
      unsubError();
    };
  }, []);

  const now = Date.now();
  const hasPinchedCrew = crew.some(c => c.isPinched);

  function handleFavorClick(favorType: FavorType) {
    setPhoneRinging(favorType);
    setPendingFavor(favorType);
  }

  function handleAccept() {
    if (!pendingFavor) {
      setPhoneRinging(null);
      return;
    }
    setPhoneRinging(null);
    setPendingFavor(null);
    if (adLoaded && interstitialAdRef.current) {
      pendingRewardRef.current = pendingFavor;
      interstitialAdRef.current.show();
    } else {
      useFavor(pendingFavor);
    }
  }

  function handleHangUp() {
    setPhoneRinging(null);
    setPendingFavor(null);
  }

  const pendingFavorData = pendingFavor ? FAVORS.find(f => f.type === pendingFavor) : null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Favors</Text>
      <Text style={styles.subtitle}>Pull strings through your Consigliere. Each favor costs nothing — just your patience.</Text>

      <Modal visible={!!phoneRinging && !!pendingFavorData} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.phoneIcon}>📞</Text>
            <Text style={styles.callerLabel}>Consigliere Calling...</Text>
            <Text style={styles.favorName}>{pendingFavorData?.name}</Text>
            <Text style={styles.favorDesc}>"{pendingFavorData?.description}"</Text>
            <Text style={styles.rewardDesc}>→ {pendingFavorData?.rewardDescription}</Text>
            <View style={styles.modalBtns}>
              <TouchableOpacity onPress={handleHangUp} style={styles.hangUpBtn}>
                <Text style={styles.hangUpText}>Hang Up</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleAccept} style={styles.acceptBtn}>
                <Text style={styles.acceptText}>Accept</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {FAVORS.map(favor => {
        const lastUsed = favorCooldowns[favor.type];
        const cooldownRemaining = lastUsed ? Math.max(0, favor.cooldown - (now - lastUsed)) : 0;
        const isOnCooldown = cooldownRemaining > 0;
        const isDisabled = isOnCooldown || (favor.type === 'the_bailout' && !hasPinchedCrew);

        return (
          <View
            key={favor.type}
            style={[styles.favorCard, isDisabled ? styles.favorCardDisabled : styles.favorCardEnabled]}
          >
            <View style={styles.favorInner}>
              <View style={styles.favorInfo}>
                <Text style={styles.favorTitle}>{favor.name}</Text>
                <Text style={styles.favorDescription}>{favor.description}</Text>
                <Text style={styles.rewardText}>→ {favor.rewardDescription}</Text>
                {favor.type === 'the_bailout' && !hasPinchedCrew && (
                  <Text style={styles.noPinchedText}>No one's pinched right now</Text>
                )}
              </View>
              <View>
                {isOnCooldown ? (
                  <Text style={styles.cooldownText}>{formatTime(cooldownRemaining)}</Text>
                ) : (
                  <TouchableOpacity
                    onPress={() => handleFavorClick(favor.type)}
                    disabled={isDisabled}
                    style={[styles.callBtn, isDisabled ? styles.callBtnDisabled : styles.callBtnEnabled]}
                  >
                    <Text style={[styles.callBtnText, isDisabled ? styles.callBtnTextDisabled : styles.callBtnTextEnabled]}>
                      Call
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        );
      })}

      <Text style={styles.footer}>Favors are limited — cap of 5 per day. Choose wisely.</Text>
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
  subtitle: { color: Colors.muted, fontSize: 11, marginBottom: 4 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 32,
  },
  modalCard: {
    backgroundColor: Colors.dark,
    borderWidth: 1,
    borderColor: Colors.gold + '66',
    borderRadius: 12,
    padding: 24,
    width: '90%',
    alignItems: 'center',
  },
  phoneIcon: { fontSize: 48, marginBottom: 12 },
  callerLabel: {
    color: Colors.gold,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 4,
  },
  favorName: { color: Colors.text, fontSize: 15, fontWeight: 'bold', marginBottom: 8 },
  favorDesc: { color: Colors.muted, fontSize: 12, fontStyle: 'italic', textAlign: 'center', marginBottom: 12 },
  rewardDesc: { color: Colors.statusGreen, fontSize: 13, fontFamily: 'monospace', marginBottom: 20 },
  modalBtns: { flexDirection: 'row', gap: 12, width: '100%' },
  hangUpBtn: {
    flex: 1,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#991b1b',
    borderRadius: 8,
    alignItems: 'center',
  },
  hangUpText: { color: '#f87171', fontSize: 13 },
  acceptBtn: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: Colors.gold,
    borderRadius: 8,
    alignItems: 'center',
  },
  acceptText: { color: Colors.black, fontSize: 13, fontWeight: 'bold' },
  favorCard: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
  },
  favorCardEnabled: { borderColor: Colors.gold + '4d', backgroundColor: Colors.card },
  favorCardDisabled: { borderColor: Colors.border, opacity: 0.6 },
  favorInner: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  favorInfo: { flex: 1 },
  favorTitle: { color: Colors.text, fontSize: 13, fontWeight: 'bold' },
  favorDescription: { color: Colors.muted, fontSize: 11, marginTop: 2 },
  rewardText: { color: Colors.statusGreen, fontSize: 11, fontFamily: 'monospace', marginTop: 4 },
  noPinchedText: { color: Colors.muted, fontSize: 10, fontStyle: 'italic', marginTop: 4 },
  cooldownText: { color: Colors.muted, fontSize: 11, fontFamily: 'monospace' },
  callBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  callBtnEnabled: { backgroundColor: Colors.gold },
  callBtnDisabled: { backgroundColor: Colors.border },
  callBtnText: { fontFamily: 'monospace', fontSize: 11 },
  callBtnTextEnabled: { color: Colors.black, fontWeight: 'bold' },
  callBtnTextDisabled: { color: Colors.muted },
  footer: { color: Colors.muted, fontSize: 10, textAlign: 'center', opacity: 0.6, paddingVertical: 8 },
});
