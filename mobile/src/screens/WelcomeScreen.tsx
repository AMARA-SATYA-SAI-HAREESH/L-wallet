// mobile/src/screens/WelcomeScreen.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS } from '../constants/theme';

export default function WelcomeScreen({ navigation }: any) {
  return (
    <View style={styles.container}>
      <View style={styles.logoBox}>
        <Text style={styles.logo}>⬡</Text>
      </View>
      <Text style={styles.title}>L Wallet</Text>
      <Text style={styles.subtitle}>
        A simple, secure non-custodial wallet{'\n'}for BNB Smart Chain
      </Text>

      <View style={styles.buttons}>
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => navigation.navigate('CreateWallet')}
        >
          <Text style={styles.primaryBtnText}>Create New Wallet</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={() => navigation.navigate('ImportWallet')}
        >
          <Text style={styles.secondaryBtnText}>Import Existing Wallet</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.disclaimer}>
        Your keys stay on your device.{'\n'}We never see your recovery phrase.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: COLORS.background,
    justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24,
  },
  logoBox: {
    width: 80, height: 80, borderRadius: 24,
    backgroundColor: COLORS.card, justifyContent: 'center', alignItems: 'center', marginBottom: 20,
  },
  logo: { fontSize: 48, color: COLORS.primary },
  title: { fontSize: 32, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 12 },
  subtitle: { fontSize: 16, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 24 },
  buttons: { width: '100%', marginTop: 48, gap: 16 },
  primaryBtn: {
    backgroundColor: COLORS.primary, paddingVertical: 16,
    borderRadius: 12, alignItems: 'center',
  },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  secondaryBtn: {
    backgroundColor: COLORS.card, paddingVertical: 16,
    borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border,
  },
  secondaryBtnText: { color: COLORS.textPrimary, fontSize: 16, fontWeight: '600' },
  disclaimer: {
    marginTop: 32, fontSize: 12, color: COLORS.textSecondary,
    textAlign: 'center', lineHeight: 20,
  },
});
