// src/screens/ReceiveScreen.tsx
import React from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';

export default function ReceiveScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Receive Cryptocurrency</Text>
      {/* QR code component will go here */}
      <Button title="Copy Address" onPress={() => {}} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#101827' },
  title: { fontSize: 24, color: '#F8FAFC', marginBottom: 20 },
});