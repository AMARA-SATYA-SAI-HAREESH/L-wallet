// mobile/src/screens/WelcomeScreen.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useWalletStore } from '../store/walletStore';
import { COLORS } from '../constants/theme';

export default function WelcomeScreen({ navigation }: any) {
  const accounts = useWalletStore((s) => s.accounts);
  const hasAccounts = accounts.length > 0;

  return (
    <View style={styles.container}>
      {hasAccounts && (
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.navigate('Home')}>
          <Text style={styles.backBtnText}>← Back to Wallet</Text>
        </TouchableOpacity>
      )}

      <View style={styles.logoBox}>
        <Text style={styles.logo}>⬡</Text>
      </View>
      <Text style={styles.title}>{hasAccounts ? 'Add Account' : 'L Wallet'}</Text>
      <Text style={styles.subtitle}>
        {hasAccounts
          ? 'Create a new account or import an existing recovery phrase.'
          : 'A simple, secure non-custodial wallet\nfor BNB Smart Chain'}
      </Text>

      <View style={styles.buttons}>
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => navigation.navigate('CreateWallet')}
        >
          <Text style={styles.primaryBtnText}>
            {hasAccounts ? 'Create New Account' : 'Create New Wallet'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={() => navigation.navigate('ImportWallet')}
        >
          <Text style={styles.secondaryBtnText}>
            {hasAccounts ? 'Import Existing Account' : 'Import Existing Wallet'}
          </Text>
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
  backBtn: {
    position: 'absolute', top: 56, left: 24,
    paddingVertical: 8, paddingHorizontal: 12,
  },
  backBtnText: { color: COLORS.primary, fontSize: 15, fontWeight: '600' },
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
