// src/screens/SendScreen.tsx
import React from 'react';
import { View, Text, StyleSheet, Button, TextInput } from 'react-native';

export default function SendScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Send Cryptocurrency</Text>
      {/* Add address, amount fields, token selector */}
      <Button title="Send" onPress={() => {}} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#101827' },
  title: { fontSize: 24, color: '#F8FAFC', marginBottom: 20 },
});