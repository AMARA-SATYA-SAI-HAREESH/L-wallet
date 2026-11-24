// mobile/src/screens/HistoryScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  FlatList, ActivityIndicator, Linking,
} from 'react-native';
import axios from 'axios';
import { getAddress } from '../services/storageService';
import { COLORS } from '../constants/theme';

const BSCSCAN_API = 'https://api.bscscan.com/api';
const BSCSCAN_KEY = 'YourBscScanKeyHere'; // Replace in env

interface Tx {
  hash: string;
  from: string;
  to: string;
  value: string;
  timeStamp: string;
  isError: string;
  tokenSymbol?: string;
}

export default function HistoryScreen({ navigation }: any) {
  const [txs, setTxs] = useState<Tx[]>([]);
  const [loading, setLoading] = useState(true);
  const [myAddress, setMyAddress] = useState('');

  useEffect(() => {
    getAddress().then(async (addr) => {
      if (!addr) return;
      setMyAddress(addr);
      try {
        // BNB transactions
        const bnbRes = await axios.get(BSCSCAN_API, {
          params: {
            module: 'account', action: 'txlist', address: addr,
            startblock: 0, endblock: 99999999, page: 1, offset: 20,
            sort: 'desc', apikey: BSCSCAN_KEY,
          },
        });
        const bnbTxs: Tx[] = (bnbRes.data?.result || []).map((t: any) => ({ ...t, tokenSymbol: 'BNB' }));

        // BEP-20 token transactions
        const tokenRes = await axios.get(BSCSCAN_API, {
          params: {
            module: 'account', action: 'tokentx', address: addr,
            startblock: 0, endblock: 99999999, page: 1, offset: 20,
            sort: 'desc', apikey: BSCSCAN_KEY,
          },
        });
        const tokenTxs: Tx[] = tokenRes.data?.result || [];

        const all = [...bnbTxs, ...tokenTxs]
          .sort((a, b) => parseInt(b.timeStamp) - parseInt(a.timeStamp))
          .slice(0, 30);
        setTxs(all);
      } catch (e) {
        setTxs([]);
      } finally {
        setLoading(false);
      }
    });
  }, []);

  const isSend = (tx: Tx) => tx.from.toLowerCase() === myAddress.toLowerCase();

  const formatDate = (ts: string) => {
    const d = new Date(parseInt(ts) * 1000);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const formatAmount = (val: string, decimals = 18) => {
    const n = parseFloat(val) / 10 ** decimals;
    return n.toFixed(6);
  };

  const openBscScan = (hash: string) => {
    Linking.openURL(`https://bscscan.com/tx/${hash}`);
  };

  const renderTx = ({ item }: { item: Tx }) => {
    const send = isSend(item);
    return (
      <TouchableOpacity
        style={styles.txCard}
        onPress={() => navigation.navigate('TransactionDetail', { txHash: item.hash })}
      >
        <View style={[styles.txIcon, { backgroundColor: send ? '#1A1A2E' : '#001A0D' }]}>
          <Text style={{ fontSize: 18 }}>{send ? '↑' : '↓'}</Text>
        </View>
        <View style={styles.txInfo}>
          <Text style={styles.txType}>{send ? 'Sent' : 'Received'} {item.tokenSymbol}</Text>
          <Text style={styles.txDate}>{formatDate(item.timeStamp)}</Text>
          <Text style={styles.txAddress} numberOfLines={1}>
            {send ? `To: ${item.to.slice(0, 16)}…` : `From: ${item.from.slice(0, 16)}…`}
          </Text>
        </View>
        <View style={styles.txRight}>
          <Text style={[styles.txAmount, { color: send ? COLORS.error : COLORS.success }]}>
            {send ? '-' : '+'}{formatAmount(item.value)} {item.tokenSymbol}
          </Text>
          {item.isError === '1' && <Text style={styles.failedBadge}>Failed</Text>}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Transaction History</Text>
        <View style={{ width: 32 }} />
      </View>

      {loading ? (
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
      ) : txs.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No transactions found.</Text>
          <Text style={styles.emptySubtext}>Your transaction history will appear here.</Text>
        </View>
      ) : (
        <FlatList
          data={txs}
          keyExtractor={(item) => item.hash}
          renderItem={renderTx}
          contentContainerStyle={{ padding: 16 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 20, paddingTop: 48,
  },
  back: { fontSize: 24, color: COLORS.textPrimary },
  title: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary },
  txCard: {
    backgroundColor: COLORS.card, borderRadius: 12, padding: 14,
    flexDirection: 'row', alignItems: 'center', marginBottom: 10,
    borderWidth: 1, borderColor: COLORS.border,
  },
  txIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  txInfo: { flex: 1 },
  txType: { color: COLORS.textPrimary, fontWeight: '600', fontSize: 14 },
  txDate: { color: COLORS.textSecondary, fontSize: 12, marginTop: 2 },
  txAddress: { color: COLORS.textSecondary, fontSize: 11, marginTop: 2 },
  txRight: { alignItems: 'flex-end' },
  txAmount: { fontWeight: '600', fontSize: 13 },
  failedBadge: {
    backgroundColor: COLORS.error, color: '#fff', fontSize: 10,
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginTop: 4,
  },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: COLORS.textPrimary, fontSize: 18, fontWeight: '600' },
  emptySubtext: { color: COLORS.textSecondary, fontSize: 14, marginTop: 8 },
});
