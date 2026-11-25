// mobile/src/screens/TransactionDetailScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Linking,
} from 'react-native';
import axios from 'axios';
import { NETWORK_CONFIG } from '../services/walletService';
import { useWalletStore } from '../store/walletStore';
import { Skeleton } from '../components/Skeleton';
import { COLORS } from '../constants/theme';

const BSCSCAN_KEY = '6XCRMRWWW656T6MBZUGRZEFPXFHKIRP154';

export default function TransactionDetailScreen({ route, navigation }: any) {
  const { txHash } = route.params;
  const network = useWalletStore((s) => s.network);
  const netConfig = NETWORK_CONFIG[network];
  const [tx, setTx] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(netConfig.bscscanApi, {
      params: {
        module: 'transaction', action: 'gettxreceiptstatus',
        txhash: txHash, apikey: BSCSCAN_KEY,
      },
      timeout: 10000,
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
        <View style={styles.card}>
          <Skeleton width={120} height={12} borderRadius={6} style={{ marginBottom: 8 }} />
          <Skeleton width="100%" height={32} borderRadius={6} style={{ marginBottom: 20 }} />
          <Skeleton width={80} height={12} borderRadius={6} style={{ marginBottom: 8 }} />
          <Skeleton width={110} height={18} borderRadius={6} />
        </View>
      ) : (
        <>
          <View style={styles.card}>
            <DetailRow label="Transaction Hash" value={txHash} mono />
            <DetailRow
              label="Status"
              value={tx?.status === '1' ? '✅ Success' : tx?.status === '0' ? '❌ Failed' : '⏳ Pending'}
            />
          </View>

          <TouchableOpacity
            style={styles.explorerBtn}
            onPress={() => Linking.openURL(`${netConfig.explorerUrl}/tx/${txHash}`)}
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
  container: { backgroundColor: COLORS.background, padding: 20, paddingTop: 48, flexGrow: 1 },
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
