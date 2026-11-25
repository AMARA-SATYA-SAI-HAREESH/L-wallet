// mobile/src/screens/ImportWalletScreen.tsx
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, ScrollView, ActivityIndicator,
} from 'react-native';
import { validateMnemonic, deriveWalletFromMnemonic } from '../services/walletService';
import { addAccount, getPin } from '../services/storageService';
import { useWalletStore } from '../store/walletStore';
import { LoadingOverlay } from '../components/LoadingOverlay';
import { COLORS } from '../constants/theme';

export default function ImportWalletScreen({ navigation }: any) {
  const [walletName, setWalletName] = useState('');
  const [phrase, setPhrase] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const onImport = () => {
    setErrorMessage('');
    const cleaned = phrase.trim().toLowerCase();
    if (!validateMnemonic(cleaned)) {
      setErrorMessage('Invalid recovery phrase. Please enter a valid 12-word BIP-39 mnemonic.');
      return;
    }
    setLoading(true);
    setTimeout(async () => {
      try {
        const { address, privateKey } = deriveWalletFromMnemonic(cleaned);
        await addAccount({
          name: walletName.trim() || 'Imported Wallet',
          address,
          mnemonic: cleaned,
          privateKey,
        });
        await useWalletStore.getState().loadAccounts();

        const pin = await getPin();
        if (pin) {
          navigation.replace('Home');
        } else {
          navigation.navigate('SetupPin');
        }
      } catch (e: any) {
        setErrorMessage(e.message || 'Failed to import wallet.');
      } finally {
        setLoading(false);
      }
    }, 60);
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <LoadingOverlay visible={loading} message="Validating phrase & deriving wallet…" />

      <Text style={styles.title}>Import Wallet</Text>
      <Text style={styles.subtitle}>
        Enter your 12-word recovery phrase and choose a name for this account.
      </Text>

      {/* Inline Red Error Message */}
      {errorMessage ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>⚠️ {errorMessage}</Text>
        </View>
      ) : null}

      {/* Wallet name */}
      <Text style={styles.fieldLabel}>Wallet Name (optional)</Text>
      <TextInput
        style={styles.nameInput}
        placeholder="e.g. My Old Wallet, Hardware Backup…"
        placeholderTextColor={COLORS.textSecondary}
        value={walletName}
        onChangeText={(v) => { setWalletName(v); setErrorMessage(''); }}
        returnKeyType="next"
        maxLength={30}
      />

      <View style={styles.warningBox}>
        <Text style={styles.warningText}>
          ⚠️  Never enter your recovery phrase on a public device or screenshot it.
        </Text>
      </View>

      {/* Seed phrase */}
      <Text style={styles.fieldLabel}>Recovery Phrase</Text>
      <TextInput
        style={styles.phraseInput}
        placeholder="Enter your 12 words separated by spaces…"
        placeholderTextColor={COLORS.textSecondary}
        multiline
        numberOfLines={4}
        value={phrase}
        onChangeText={(v) => { setPhrase(v); setErrorMessage(''); }}
        autoCapitalize="none"
        autoCorrect={false}
        secureTextEntry={false}
        textAlignVertical="top"
      />
      <Text style={styles.wordCount}>
        {phrase.trim() ? phrase.trim().split(/\s+/).length : 0} / 12 words
      </Text>

      <TouchableOpacity
        style={[styles.primaryBtn, loading && styles.disabledBtn]}
        onPress={onImport}
        disabled={loading}
      >
        {loading
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.primaryBtnText}>Import Wallet →</Text>}
      </TouchableOpacity>

      <TouchableOpacity style={styles.ghostBtn} onPress={() => navigation.goBack()}>
        <Text style={styles.ghostBtnText}>← Back</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: COLORS.background, padding: 24, paddingTop: 56, flexGrow: 1 },
  title: { fontSize: 26, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 12 },
  subtitle: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 22, marginBottom: 16 },
  errorBox: {
    backgroundColor: '#2D0A0A', borderWidth: 1, borderColor: COLORS.error,
    borderRadius: 10, padding: 12, marginBottom: 16,
  },
  errorText: { color: '#FF6B6B', fontSize: 13, textAlign: 'center' },
  fieldLabel: { color: COLORS.textSecondary, fontSize: 12, marginBottom: 6 },
  nameInput: {
    backgroundColor: COLORS.inputBg, borderRadius: 12, padding: 16,
    color: COLORS.textPrimary, fontSize: 15, borderWidth: 1, borderColor: COLORS.border,
    marginBottom: 20,
  },
  warningBox: {
    backgroundColor: '#2D1B00', borderRadius: 10, padding: 14,
    borderWidth: 1, borderColor: COLORS.warning, marginBottom: 20,
  },
  warningText: { color: COLORS.warning, fontSize: 13, lineHeight: 20 },
  phraseInput: {
    backgroundColor: COLORS.inputBg, borderRadius: 12, padding: 16,
    color: COLORS.textPrimary, fontSize: 15, minHeight: 100,
    borderWidth: 1, borderColor: COLORS.border,
  },
  wordCount: { color: COLORS.textSecondary, fontSize: 12, textAlign: 'right', marginTop: 8, marginBottom: 24 },
  primaryBtn: {
    backgroundColor: COLORS.primary, paddingVertical: 16,
    borderRadius: 12, alignItems: 'center', marginBottom: 12,
  },
  disabledBtn: { opacity: 0.6 },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  ghostBtn: { alignItems: 'center', paddingVertical: 12 },
  ghostBtnText: { color: COLORS.textSecondary, fontSize: 14 },
});
