// src/screens/SettingsScreen.tsx
import React from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';

export default function SettingsScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>
      {/* Options: Change PIN, Export Wallet, Delete Wallet */}
      <Button title="Change PIN" onPress={() => {}} />
      <Button title="Export Recovery Phrase" onPress={() => {}} />
      <Button title="Delete Wallet" onPress={() => {}} color="red" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#101827' },
  title: { fontSize: 24, color: '#F8FAFC', marginBottom: 20 },
});