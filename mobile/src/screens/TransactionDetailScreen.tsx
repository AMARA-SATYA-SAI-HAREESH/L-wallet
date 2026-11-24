// mobile/src/screens/TransactionDetailScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Linking, ActivityIndicator,
} from 'react-native';
import axios from 'axios';
import { COLORS } from '../constants/theme';

const BSCSCAN_API = 'https://api.bscscan.com/api';
const BSCSCAN_KEY = 'YourBscScanKeyHere';

export default function TransactionDetailScreen({ route, navigation }: any) {
  const { txHash } = route.params;
  const [tx, setTx] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(BSCSCAN_API, {
      params: {
        module: 'transaction', action: 'gettxreceiptstatus',
        txhash: txHash, apikey: BSCSCAN_KEY,
      },
    }).then((r) => {
      setTx(r.data?.result);
    }).catch(() => setTx(null))
      .finally(() => setLoading(false));
  }, [txHash]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Transaction Details</Text>
        <View style={{ width: 32 }} />
      </View>

      {loading ? (
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
      ) : (
        <>
          <View style={styles.card}>
            <DetailRow label="Transaction Hash" value={txHash} mono />
            <DetailRow label="Status" value={tx?.status === '1' ? '✅ Success' : tx?.status === '0' ? '❌ Failed' : '⏳ Pending'} />
          </View>

          <TouchableOpacity
            style={styles.explorerBtn}
            onPress={() => Linking.openURL(`https://bscscan.com/tx/${txHash}`)}
          >
            <Text style={styles.explorerBtnText}>View on BscScan ↗</Text>
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  );
}

function DetailRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={{ color: COLORS.textSecondary, fontSize: 12, marginBottom: 4 }}>{label}</Text>
      <Text style={{ color: COLORS.textPrimary, fontSize: mono ? 12 : 15, fontFamily: mono ? 'monospace' : undefined }}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: COLORS.background, padding: 20, flexGrow: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  back: { fontSize: 24, color: COLORS.textPrimary },
  title: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary },
  card: {
    backgroundColor: COLORS.card, borderRadius: 14, padding: 18,
    marginBottom: 20, borderWidth: 1, borderColor: COLORS.border,
  },
  explorerBtn: {
    backgroundColor: COLORS.primary, paddingVertical: 14,
    borderRadius: 12, alignItems: 'center',
  },
  explorerBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});
