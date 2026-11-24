// mobile/src/screens/SplashScreen.tsx
import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { getAddress, getPin } from '../services/storageService';
import { COLORS } from '../constants/theme';

export default function SplashScreen({ navigation }: any) {
  useEffect(() => {
    const init = async () => {
      await new Promise((r) => setTimeout(r, 1200));
      const address = await getAddress();
      const pin = await getPin();
      if (address && pin) {
        navigation.replace('PinLogin');
      } else {
        navigation.replace('Welcome');
      }
    };
    init();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>L Wallet</Text>
      <Text style={styles.sub}>Your Crypto, Your Control</Text>
      <ActivityIndicator color={COLORS.primary} style={{ marginTop: 32 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center' },
  logo: { fontSize: 40, fontWeight: '700', color: COLORS.textPrimary, letterSpacing: 1 },
  sub: { fontSize: 16, color: COLORS.textSecondary, marginTop: 8 },
});
