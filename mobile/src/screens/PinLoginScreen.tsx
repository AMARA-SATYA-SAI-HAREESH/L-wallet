// mobile/src/screens/PinLoginScreen.tsx
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, Alert,
} from 'react-native';
import { getPin } from '../services/storageService';
import { COLORS } from '../constants/theme';

export default function PinLoginScreen({ navigation }: any) {
  const [pin, setPin] = useState('');

  const onUnlock = async () => {
    const savedPin = await getPin();
    if (savedPin && pin === savedPin) {
      navigation.replace('Home');
    } else {
      Alert.alert('Incorrect PIN', 'The PIN you entered is incorrect. Please try again.');
      setPin('');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>⬡</Text>
      <Text style={styles.title}>L Wallet</Text>
      <Text style={styles.subtitle}>Enter your PIN to unlock</Text>

      <TextInput
        style={styles.input}
        secureTextEntry
        placeholder="••••••"
        placeholderTextColor={COLORS.textSecondary}
        keyboardType="numeric"
        maxLength={6}
        value={pin}
        onChangeText={setPin}
        onSubmitEditing={onUnlock}
      />

      <TouchableOpacity style={styles.primaryBtn} onPress={onUnlock}>
        <Text style={styles.primaryBtnText}>Unlock</Text>
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
  subtitle: { fontSize: 14, color: COLORS.textSecondary, marginBottom: 40 },
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
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
