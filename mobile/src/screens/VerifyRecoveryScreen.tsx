// src/screens/VerifyRecoveryScreen.tsx
import React from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';

export default function VerifyRecoveryScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Verify Recovery Phrase</Text>
      {/* UI to let user select words in correct order */}
      <Button title="Confirm" onPress={() => {}} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#101827' },
  title: { fontSize: 24, color: '#F8FAFC', marginBottom: 20 },
});