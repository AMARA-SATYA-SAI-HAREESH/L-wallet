// mobile/src/screens/PinSetupScreen.tsx
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, ActivityIndicator,
} from 'react-native';
import { storePin } from '../services/storageService';
import { LoadingOverlay } from '../components/LoadingOverlay';
import { COLORS } from '../constants/theme';

export default function PinSetupScreen({ navigation }: any) {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const onSave = async () => {
    setErrorMessage('');
    if (pin.length < 4) {
      setErrorMessage('PIN must be at least 4 digits.');
      return;
    }
    if (pin !== confirmPin) {
      setErrorMessage('PINs do not match. Please re-enter.');
      setConfirmPin('');
      return;
    }
    setSaving(true);
    try {
      await storePin(pin);
      navigation.replace('Home');
    } catch (e: any) {
      setErrorMessage(e.message || 'Failed to save PIN.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <LoadingOverlay visible={saving} message="Securing your wallet…" />

      <Text style={styles.title}>Set a PIN</Text>
      <Text style={styles.subtitle}>
        You'll use this PIN to unlock your wallet. Keep it private.
      </Text>

      {errorMessage ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>⚠️ {errorMessage}</Text>
        </View>
      ) : null}

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Enter PIN</Text>
        <TextInput
          style={styles.input}
          secureTextEntry
          placeholder="4–6 digits"
          placeholderTextColor={COLORS.textSecondary}
          keyboardType="numeric"
          maxLength={6}
          value={pin}
          onChangeText={(v) => { setPin(v); setErrorMessage(''); }}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Confirm PIN</Text>
        <TextInput
          style={styles.input}
          secureTextEntry
          placeholder="Re-enter PIN"
          placeholderTextColor={COLORS.textSecondary}
          keyboardType="numeric"
          maxLength={6}
          value={confirmPin}
          onChangeText={(v) => { setConfirmPin(v); setErrorMessage(''); }}
        />
      </View>

      <TouchableOpacity
        style={[styles.primaryBtn, saving && styles.disabledBtn]}
        onPress={onSave}
        disabled={saving}
      >
        {saving
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.primaryBtnText}>Save PIN & Open Wallet →</Text>}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: COLORS.background,
    padding: 24, justifyContent: 'center',
  },
  title: { fontSize: 26, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 10 },
  subtitle: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 22, marginBottom: 28 },
  errorBox: {
    backgroundColor: '#2D0A0A', borderWidth: 1, borderColor: COLORS.error,
    borderRadius: 10, padding: 12, marginBottom: 20,
  },
  errorText: { color: '#FF6B6B', fontSize: 13, textAlign: 'center' },
  inputGroup: { marginBottom: 20 },
  label: { color: COLORS.textSecondary, fontSize: 13, marginBottom: 8 },
  input: {
    backgroundColor: COLORS.inputBg, borderRadius: 10, padding: 14,
    color: COLORS.textPrimary, fontSize: 20, letterSpacing: 8,
    borderWidth: 1, borderColor: COLORS.border,
  },
  primaryBtn: {
    backgroundColor: COLORS.primary, paddingVertical: 16,
    borderRadius: 12, alignItems: 'center', marginTop: 12,
  },
  disabledBtn: { opacity: 0.6 },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
