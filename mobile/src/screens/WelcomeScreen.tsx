import React from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';

export default function WelcomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to L Wallet</Text>
      <Button title="Create Wallet" onPress={() => {}} />
      <Button title="Import Wallet" onPress={() => {}} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#101827' },
  title: { fontSize: 24, color: '#F8FAFC', marginBottom: 20 },
});
