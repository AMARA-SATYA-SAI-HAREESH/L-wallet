// mobile/src/screens/ImportWalletScreen.tsx
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, Alert, ScrollView, ActivityIndicator,
} from 'react-native';
import { validateMnemonic, deriveWalletFromMnemonic } from '../services/walletService';
import { storeMnemonic, storeAddress, storePrivateKey } from '../services/storageService';
import { COLORS } from '../constants/theme';

export default function ImportWalletScreen({ navigation }: any) {
  const [phrase, setPhrase] = useState('');
  const [loading, setLoading] = useState(false);

  const onImport = async () => {
    const cleaned = phrase.trim().toLowerCase();
    if (!validateMnemonic(cleaned)) {
      Alert.alert('Invalid Phrase', 'Please enter a valid 12-word BIP-39 recovery phrase.');
      return;
    }
    setLoading(true);
    try {
      const { address, privateKey } = deriveWalletFromMnemonic(cleaned);
      await storeMnemonic(cleaned);
      await storeAddress(address);
      await storePrivateKey(privateKey);
      navigation.navigate('SetupPin');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to import wallet');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Import Wallet</Text>
      <Text style={styles.subtitle}>
        Enter your 12-word recovery phrase separated by spaces. Make sure you are in a private location.
      </Text>

      <View style={styles.warningBox}>
        <Text style={styles.warningText}>
          ⚠️  Never enter your recovery phrase on a public device or screenshot it.
        </Text>
      </View>

      <TextInput
        style={styles.phraseInput}
        placeholder="Enter your 12 words here..."
        placeholderTextColor={COLORS.textSecondary}
        multiline
        numberOfLines={4}
        value={phrase}
        onChangeText={setPhrase}
        autoCapitalize="none"
        autoCorrect={false}
        secureTextEntry={false}
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: COLORS.background, padding: 24, flexGrow: 1 },
  title: { fontSize: 26, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 12 },
  subtitle: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 22, marginBottom: 20 },
  warningBox: {
    backgroundColor: '#2D1B00', borderRadius: 10, padding: 14,
    borderWidth: 1, borderColor: COLORS.warning, marginBottom: 20,
  },
  warningText: { color: COLORS.warning, fontSize: 13, lineHeight: 20 },
  phraseInput: {
    backgroundColor: COLORS.inputBg, borderRadius: 12, padding: 16,
    color: COLORS.textPrimary, fontSize: 15, minHeight: 100,
    textAlignVertical: 'top', borderWidth: 1, borderColor: COLORS.border,
  },
  wordCount: { color: COLORS.textSecondary, fontSize: 12, textAlign: 'right', marginTop: 8, marginBottom: 24 },
  primaryBtn: {
    backgroundColor: COLORS.primary, paddingVertical: 16,
    borderRadius: 12, alignItems: 'center',
  },
  disabledBtn: { opacity: 0.6 },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
