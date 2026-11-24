// src/screens/CreateWalletScreen.tsx
import React from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';

export default function CreateWalletScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Wallet</Text>
      {/* UI for generating mnemonic, displaying it, and confirming */}
      <Button title="Generate Recovery Phrase" onPress={() => {}} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#101827' },
  title: { fontSize: 24, color: '#F8FAFC', marginBottom: 20 },
});
