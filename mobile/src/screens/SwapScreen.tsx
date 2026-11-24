// src/screens/SwapScreen.tsx
import React from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';

export default function SwapScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Swap Cryptocurrencies</Text>
      {/* Token selectors, amount input, quote button */}
      <Button title="Get Quote" onPress={() => {}} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#101827' },
  title: { fontSize: 24, color: '#F8FAFC', marginBottom: 20 },
});