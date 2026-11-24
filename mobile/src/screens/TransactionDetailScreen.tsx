// src/screens/TransactionDetailScreen.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function TransactionDetailScreen({ route }) {
  const { txHash } = route.params;
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Transaction Detail</Text>
      <Text style={styles.hash}>Hash: {txHash}</Text>
      {/* Additional info (status, amounts) will be displayed here */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#101827' },
  title: { fontSize: 24, color: '#F8FAFC', marginBottom: 12 },
  hash: { color: '#F8FAFC', fontFamily: 'monospace' },
});