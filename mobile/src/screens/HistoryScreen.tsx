// src/screens/HistoryScreen.tsx
import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';

export default function HistoryScreen({ navigation }) {
  // Placeholder data
  const data = [];
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Transaction History</Text>
      <FlatList
        data={data}
        keyExtractor={(item) => item.txHash}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => navigation.navigate('TransactionDetail', { txHash: item.txHash })}>
            <Text style={styles.item}>{item.type} – {item.amount}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No transactions yet.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#101827', padding: 16 },
  title: { fontSize: 24, color: '#F8FAFC', marginBottom: 12 },
  item: { color: '#F8FAFC', paddingVertical: 8 },
  empty: { color: '#94A3B8', textAlign: 'center', marginTop: 20 },
});