// src/screens/PinLoginScreen.tsx
import React from 'react';
import { View, Text, StyleSheet, Button, TextInput } from 'react-native';

export default function PinLoginScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Enter PIN</Text>
      <TextInput secureTextEntry placeholder="PIN" style={styles.input} />
      <Button title="Unlock" onPress={() => {}} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#101827' },
  title: { fontSize: 24, color: '#F8FAFC', marginBottom: 20 },
  input: { width: '80%', padding: 10, marginVertical: 8, backgroundColor: '#182438', color: '#F8FAFC', borderRadius: 5 },
});