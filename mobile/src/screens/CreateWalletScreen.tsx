// mobile/src/screens/CreateWalletScreen.tsx
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, ActivityIndicator, TextInput,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { generateMnemonic, deriveWalletFromMnemonic } from '../services/walletService';
import { addAccount } from '../services/storageService';
import { useWalletStore } from '../store/walletStore';
import { LoadingOverlay } from '../components/LoadingOverlay';
import { COLORS } from '../constants/theme';

type Step = 'name' | 'phrase';

export default function CreateWalletScreen({ navigation }: any) {
  const [step, setStep] = useState<Step>('name');
  const [walletName, setWalletName] = useState('');
  const [mnemonic, setMnemonic] = useState<string[]>([]);
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  /* ── Step 1 → Step 2: generate wallet ─────────────────────────── */
  const onGeneratePhrase = () => {
    setErrorMessage('');
    const name = walletName.trim();
    if (!name) {
      setErrorMessage('Please enter a name for your wallet before continuing.');
      return;
    }
    setLoading(true);
    setTimeout(async () => {
      try {
        const phrase = generateMnemonic();
        const { address: addr } = deriveWalletFromMnemonic(phrase);
        setMnemonic(phrase.split(' '));
        setAddress(addr);
        setStep('phrase');
      } catch (e: any) {
        setErrorMessage(e.message || 'Failed to generate wallet.');
      } finally {
        setLoading(false);
      }
    }, 60);
  };

  /* ── Copy seed phrase to clipboard ────────────────────────────── */
  const onCopy = async () => {
    await Clipboard.setStringAsync(mnemonic.join(' '));
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  /* ── Step 2 → store & navigate ────────────────────────────────── */
  const onContinue = async () => {
    setErrorMessage('');
    setLoading(true);
    try {
      const phrase = mnemonic.join(' ');
      const { address: addr, privateKey } = deriveWalletFromMnemonic(phrase);
      await addAccount({
        name: walletName.trim() || 'My Wallet',
        address: addr,
        mnemonic: phrase,
        privateKey,
      });
      await useWalletStore.getState().loadAccounts();
      navigation.navigate('VerifyRecovery');
    } catch (e: any) {
      setErrorMessage(e.message || 'Failed to save wallet.');
    } finally {
      setLoading(false);
    }
  };

  /* ── Render: Step 1 — Name input ──────────────────────────────── */
  if (step === 'name') {
    return (
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <LoadingOverlay visible={loading} message="Generating secure wallet…" />

        <Text style={styles.title}>Create New Wallet</Text>
        <Text style={styles.subtitle}>
          Give your wallet a memorable name so you can identify it later when managing multiple accounts.
        </Text>

        {errorMessage ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>⚠️ {errorMessage}</Text>
          </View>
        ) : null}

        <Text style={styles.label}>Wallet Name</Text>
        <TextInput
          style={styles.nameInput}
          placeholder="e.g. Main Wallet, Trading, Savings…"
          placeholderTextColor={COLORS.textSecondary}
          value={walletName}
          onChangeText={(v) => { setWalletName(v); setErrorMessage(''); }}
          autoFocus
          returnKeyType="done"
          onSubmitEditing={onGeneratePhrase}
          maxLength={30}
        />
        <Text style={styles.charCount}>{walletName.length} / 30</Text>

        <TouchableOpacity
          style={[styles.primaryBtn, loading && styles.disabledBtn]}
          onPress={onGeneratePhrase}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.primaryBtnText}>Generate Recovery Phrase →</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={styles.ghostBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.ghostBtnText}>← Back</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  /* ── Render: Step 2 — Show phrase ─────────────────────────────── */
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <LoadingOverlay visible={loading} message="Saving wallet securely…" />

      <Text style={styles.title}>Recovery Phrase</Text>
      <Text style={styles.subtitle}>
        Write these 12 words in order and store them somewhere safe. You will need them to recover your wallet.
      </Text>

      {errorMessage ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>⚠️ {errorMessage}</Text>
        </View>
      ) : null}

      {/* Warning */}
      <View style={styles.warningBox}>
        <Text style={styles.warningText}>
          ⚠️  Never share your recovery phrase with anyone. L Wallet will never ask for it.
        </Text>
      </View>

      {/* Word grid */}
      <View style={styles.phraseGrid}>
        {mnemonic.map((word, i) => (
          <View key={i} style={styles.wordChip}>
            <Text style={styles.wordIndex}>{i + 1}</Text>
            <Text style={styles.wordText}>{word}</Text>
          </View>
        ))}
      </View>

      {/* Copy button */}
      <TouchableOpacity
        style={[styles.copyBtn, copied && styles.copiedBtn]}
        onPress={onCopy}
        activeOpacity={0.75}
      >
        <Text style={[styles.copyBtnText, copied && styles.copiedBtnText]}>
          {copied ? '✅  Copied to Clipboard!' : '📋  Copy Seed Phrase'}
        </Text>
      </TouchableOpacity>

      {/* Wallet address preview */}
      <View style={styles.addressBox}>
        <Text style={styles.label}>Wallet Name</Text>
        <Text style={styles.addressText}>{walletName}</Text>
        <Text style={[styles.label, { marginTop: 10 }]}>Wallet Address</Text>
        <Text style={styles.addressText}>{address}</Text>
      </View>

      <TouchableOpacity style={styles.primaryBtn} onPress={onContinue} disabled={loading}>
        {loading
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.primaryBtnText}>I've Written It Down →</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: COLORS.background, padding: 24, paddingTop: 56, flexGrow: 1 },
  title: { fontSize: 26, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 12 },
  subtitle: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 22, marginBottom: 20 },
  errorBox: {
    backgroundColor: '#2D0A0A', borderWidth: 1, borderColor: COLORS.error,
    borderRadius: 10, padding: 12, marginBottom: 16,
  },
  errorText: { color: '#FF6B6B', fontSize: 13, textAlign: 'center' },
  label: { color: COLORS.textSecondary, fontSize: 12, marginBottom: 6 },
  nameInput: {
    backgroundColor: COLORS.inputBg, borderRadius: 12, padding: 16,
    color: COLORS.textPrimary, fontSize: 16, borderWidth: 1, borderColor: COLORS.border,
    marginBottom: 4,
  },
  charCount: { color: COLORS.textSecondary, fontSize: 11, textAlign: 'right', marginBottom: 24 },
  warningBox: {
    backgroundColor: '#2D1B00', borderRadius: 10, padding: 14,
    borderWidth: 1, borderColor: COLORS.warning, marginBottom: 20,
  },
  warningText: { color: COLORS.warning, fontSize: 13, lineHeight: 20 },
  phraseGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  wordChip: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.card, borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 8, minWidth: '28%',
    borderWidth: 1, borderColor: COLORS.border,
  },
  wordIndex: { color: COLORS.textSecondary, fontSize: 11, marginRight: 6 },
  wordText: { color: COLORS.textPrimary, fontSize: 14, fontWeight: '600' },
  copyBtn: {
    borderWidth: 1.5, borderColor: COLORS.primary, borderRadius: 12,
    paddingVertical: 13, alignItems: 'center', marginBottom: 16,
  },
  copiedBtn: { backgroundColor: '#0D2B1F', borderColor: COLORS.success },
  copyBtnText: { color: COLORS.primary, fontSize: 14, fontWeight: '600' },
  copiedBtnText: { color: COLORS.success },
  addressBox: {
    backgroundColor: COLORS.card, borderRadius: 10, padding: 14, marginBottom: 24,
  },
  addressText: { color: COLORS.textPrimary, fontSize: 13, letterSpacing: 0.5 },
  primaryBtn: {
    backgroundColor: COLORS.primary, paddingVertical: 16,
    borderRadius: 12, alignItems: 'center', marginBottom: 12,
  },
  disabledBtn: { opacity: 0.6 },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  ghostBtn: { alignItems: 'center', paddingVertical: 12 },
  ghostBtnText: { color: COLORS.textSecondary, fontSize: 14 },
});
