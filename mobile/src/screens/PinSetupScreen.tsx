// src/screens/PinSetupScreen.tsx
import React from 'react';
import { View, Text, StyleSheet, Button, TextInput } from 'react-native';

export default function PinSetupScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Set a PIN</Text>
      <TextInput secureTextEntry placeholder="Enter PIN" style={styles.input} />
      <TextInput secureTextEntry placeholder="Confirm PIN" style={styles.input} />
      <Button title="Save PIN" onPress={() => {}} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#101827' },
  title: { fontSize: 24, color: '#F8FAFC', marginBottom: 20 },
  input: { width: '80%', padding: 10, marginVertical: 8, backgroundColor: '#182438', color: '#F8FAFC', borderRadius: 5 },
});