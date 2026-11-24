// mobile/src/screens/CreateWalletScreen.tsx
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { generateMnemonic, deriveWalletFromMnemonic } from '../services/walletService';
import { storeMnemonic, storeAddress, storePrivateKey } from '../services/storageService';
import { COLORS } from '../constants/theme';

export default function CreateWalletScreen({ navigation }: any) {
  const [mnemonic, setMnemonic] = useState<string[]>([]);
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);

  const onGenerate = async () => {
    setLoading(true);
    try {
      const phrase = generateMnemonic();
      const { address: addr, privateKey } = deriveWalletFromMnemonic(phrase);
      setMnemonic(phrase.split(' '));
      setAddress(addr);
      await storeMnemonic(phrase);
      await storeAddress(addr);
      await storePrivateKey(privateKey);
      setGenerated(true);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to generate wallet');
    } finally {
      setLoading(false);
    }
  };

  const onContinue = () => {
    navigation.navigate('VerifyRecovery');
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Create New Wallet</Text>
      <Text style={styles.subtitle}>
        A 12-word recovery phrase will be generated for your wallet. Write it down and keep it safe.
      </Text>

      {!generated ? (
        <TouchableOpacity style={styles.primaryBtn} onPress={onGenerate} disabled={loading}>
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.primaryBtnText}>Generate Recovery Phrase</Text>}
        </TouchableOpacity>
      ) : (
        <>
          <View style={styles.warningBox}>
            <Text style={styles.warningText}>
              ⚠️  Write these words down in order. Never share them with anyone.
            </Text>
          </View>

          <View style={styles.phraseGrid}>
            {mnemonic.map((word, i) => (
              <View key={i} style={styles.wordChip}>
                <Text style={styles.wordIndex}>{i + 1}</Text>
                <Text style={styles.wordText}>{word}</Text>
              </View>
            ))}
          </View>

          <View style={styles.addressBox}>
            <Text style={styles.label}>Wallet Address</Text>
            <Text style={styles.addressText}>{address}</Text>
          </View>

          <TouchableOpacity style={styles.primaryBtn} onPress={onContinue}>
            <Text style={styles.primaryBtnText}>I've Written It Down →</Text>
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: COLORS.background, padding: 24, flexGrow: 1 },
  title: { fontSize: 26, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 12 },
  subtitle: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 22, marginBottom: 28 },
  warningBox: {
    backgroundColor: '#2D1B00', borderRadius: 10, padding: 14,
    borderWidth: 1, borderColor: COLORS.warning, marginBottom: 20,
  },
  warningText: { color: COLORS.warning, fontSize: 13, lineHeight: 20 },
  phraseGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24,
  },
  wordChip: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.card, borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 8, minWidth: '28%',
    borderWidth: 1, borderColor: COLORS.border,
  },
  wordIndex: { color: COLORS.textSecondary, fontSize: 11, marginRight: 6 },
  wordText: { color: COLORS.textPrimary, fontSize: 14, fontWeight: '600' },
  addressBox: {
    backgroundColor: COLORS.card, borderRadius: 10, padding: 14, marginBottom: 24,
  },
  label: { color: COLORS.textSecondary, fontSize: 12, marginBottom: 6 },
  addressText: { color: COLORS.textPrimary, fontSize: 13, letterSpacing: 0.5 },
  primaryBtn: {
    backgroundColor: COLORS.primary, paddingVertical: 16,
    borderRadius: 12, alignItems: 'center', marginBottom: 12,
  },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
