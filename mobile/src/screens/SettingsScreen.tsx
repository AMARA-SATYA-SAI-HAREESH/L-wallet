// mobile/src/screens/SettingsScreen.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { clearWallet } from '../services/storageService';
import { COLORS } from '../constants/theme';

export default function SettingsScreen({ navigation }: any) {
  const onRemoveWallet = () => {
    Alert.alert(
      'Remove Wallet',
      'This will delete your wallet from this device. Make sure you have your recovery phrase before proceeding. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove Wallet',
          style: 'destructive',
          onPress: async () => {
            await clearWallet();
            navigation.replace('Welcome');
          },
        },
      ],
    );
  };

  const onLock = () => {
    navigation.replace('PinLogin');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Settings</Text>
        <View style={{ width: 32 }} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Wallet</Text>

        <TouchableOpacity style={styles.row} onPress={onLock}>
          <Text style={styles.rowText}>🔒  Lock Wallet</Text>
          <Text style={styles.rowArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.row} onPress={() => navigation.navigate('VerifyRecovery')}>
          <Text style={styles.rowText}>📝  Backup Recovery Phrase</Text>
          <Text style={styles.rowArrow}>›</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Network</Text>
        <View style={styles.row}>
          <Text style={styles.rowText}>⬡  BNB Smart Chain (BSC)</Text>
          <Text style={styles.networkBadge}>Mainnet</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <View style={styles.row}>
          <Text style={styles.rowText}>L Wallet</Text>
          <Text style={styles.rowArrow}>v0.1.0</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.dangerBtn} onPress={onRemoveWallet}>
        <Text style={styles.dangerBtnText}>⚠️  Remove Wallet from Device</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: 20 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 32, paddingTop: 20,
  },
  back: { fontSize: 24, color: COLORS.textPrimary },
  title: { fontSize: 20, fontWeight: '700', color: COLORS.textPrimary },
  section: { marginBottom: 24 },
  sectionTitle: { color: COLORS.textSecondary, fontSize: 12, marginBottom: 8, letterSpacing: 1 },
  row: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: COLORS.card, borderRadius: 10, padding: 16,
    marginBottom: 2, borderWidth: 1, borderColor: COLORS.border,
  },
  rowText: { color: COLORS.textPrimary, fontSize: 15 },
  rowArrow: { color: COLORS.textSecondary, fontSize: 15 },
  networkBadge: {
    backgroundColor: '#1A2D45', color: COLORS.primary,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12, fontSize: 11,
  },
  dangerBtn: {
    marginTop: 'auto', backgroundColor: '#1A0000', borderWidth: 1,
    borderColor: COLORS.error, borderRadius: 12, paddingVertical: 16, alignItems: 'center',
  },
  dangerBtnText: { color: COLORS.error, fontWeight: '600', fontSize: 15 },
});
