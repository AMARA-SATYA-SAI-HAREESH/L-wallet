// mobile/src/screens/PinSetupScreen.tsx
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, Alert,
} from 'react-native';
import { storePin } from '../services/storageService';
import { COLORS } from '../constants/theme';

export default function PinSetupScreen({ navigation }: any) {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');

  const onSave = async () => {
    if (pin.length < 4) {
      Alert.alert('Too Short', 'PIN must be at least 4 digits.');
      return;
    }
    if (pin !== confirmPin) {
      Alert.alert('Mismatch', 'PINs do not match. Please try again.');
      setConfirmPin('');
      return;
    }
    await storePin(pin);
    navigation.navigate('Home');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Set a PIN</Text>
      <Text style={styles.subtitle}>
        You'll use this PIN to unlock your wallet. Keep it private.
      </Text>

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
          onChangeText={setPin}
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
          onChangeText={setConfirmPin}
        />
      </View>

      <TouchableOpacity style={styles.primaryBtn} onPress={onSave}>
        <Text style={styles.primaryBtnText}>Save PIN & Open Wallet →</Text>
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
  subtitle: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 22, marginBottom: 36 },
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
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
