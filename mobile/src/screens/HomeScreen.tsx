// src/screens/HomeScreen.tsx
import React from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';

export default function HomeScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your Assets</Text>
      {/* Balance components will go here */}
      <Button title="Send" onPress={() => navigation.navigate('Send')} />
      <Button title="Receive" onPress={() => navigation.navigate('Receive')} />
      <Button title="Swap" onPress={() => navigation.navigate('Swap')} />
      <Button title="History" onPress={() => navigation.navigate('History')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#101827' },
  title: { fontSize: 24, color: '#F8FAFC', marginBottom: 20 },
});