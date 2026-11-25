// mobile/src/screens/PinLoginScreen.tsx
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, ActivityIndicator,
} from 'react-native';
import { getPin } from '../services/storageService';
import { COLORS } from '../constants/theme';

export default function PinLoginScreen({ navigation }: any) {
  const [pin, setPin] = useState('');
  const [checking, setChecking] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const onUnlock = async () => {
    setErrorMessage('');
    if (!pin) {
      setErrorMessage('Please enter your PIN.');
      return;
    }
    setChecking(true);
    try {
      const savedPin = await getPin();
      if (savedPin && pin === savedPin) {
        navigation.replace('Home');
      } else {
        setErrorMessage('Incorrect PIN. Please try again.');
        setPin('');
      }
    } finally {
      setChecking(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>⬡</Text>
      <Text style={styles.title}>L Wallet</Text>
      <Text style={styles.subtitle}>Enter your PIN to unlock</Text>

      {errorMessage ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>⚠️ {errorMessage}</Text>
        </View>
      ) : null}

      <TextInput
        style={styles.input}
        secureTextEntry
        placeholder="••••••"
        placeholderTextColor={COLORS.textSecondary}
        keyboardType="numeric"
        maxLength={6}
        value={pin}
        onChangeText={(v) => { setPin(v); setErrorMessage(''); }}
        onSubmitEditing={onUnlock}
      />

      <TouchableOpacity
        style={[styles.primaryBtn, checking && styles.disabledBtn]}
        onPress={onUnlock}
        disabled={checking}
      >
        {checking
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.primaryBtnText}>Unlock</Text>}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: COLORS.background,
    justifyContent: 'center', alignItems: 'center', padding: 24,
  },
  logo: { fontSize: 56, color: COLORS.primary, marginBottom: 12 },
  title: { fontSize: 28, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 8 },
  subtitle: { fontSize: 14, color: COLORS.textSecondary, marginBottom: 30 },
  errorBox: {
    width: '75%', backgroundColor: '#2D0A0A', borderWidth: 1, borderColor: COLORS.error,
    borderRadius: 10, padding: 12, marginBottom: 16,
  },
  errorText: { color: '#FF6B6B', fontSize: 13, textAlign: 'center' },
  input: {
    width: '70%', backgroundColor: COLORS.inputBg,
    borderRadius: 10, padding: 14,
    color: COLORS.textPrimary, fontSize: 24, letterSpacing: 10,
    textAlign: 'center', borderWidth: 1, borderColor: COLORS.border, marginBottom: 20,
  },
  primaryBtn: {
    width: '70%', backgroundColor: COLORS.primary,
    paddingVertical: 16, borderRadius: 12, alignItems: 'center',
  },
  disabledBtn: { opacity: 0.6 },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
