// mobile/src/screens/HistoryScreen.tsx
import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  FlatList, RefreshControl,
} from 'react-native';
import axios from 'axios';
import { getAddress } from '../services/storageService';
import { NETWORK_CONFIG } from '../services/walletService';
import { useWalletStore } from '../store/walletStore';
import { CoinIcon } from '../components/CoinIcon';
import { Skeleton } from '../components/Skeleton';
import { COLORS } from '../constants/theme';
import { BACKEND_URL } from '../constants/config';

const BSCSCAN_KEY = '6XCRMRWWW656T6MBZUGRZEFPXFHKIRP154';

interface Tx {
  hash: string;
  from: string;
  to: string;
  value: string;
  timeStamp: string;
  isError: string;
  tokenSymbol: string;
  type?: 'send' | 'receive' | 'swap';
}

export default function HistoryScreen({ navigation }: any) {
  const network = useWalletStore((s) => s.network);
  const activeAccount = useWalletStore((s) => s.activeAccount);
  const netConfig = NETWORK_CONFIG[network];
  const bscscanApi = netConfig.bscscanApi;
  const nativeSymbol = netConfig.nativeSymbol;

  const [txs, setTxs] = useState<Tx[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [myAddress, setMyAddress] = useState('');

  const loadHistory = useCallback(async () => {
    const addr = activeAccount?.address || (await getAddress());
    if (!addr) {
      setLoading(false);
      setRefreshing(false);
      return;
    }
    setMyAddress(addr);

    try {
      // 1. Fetch immediate local transactions recorded in backend DB
      const backendPromise = axios
        .get(`${BACKEND_URL}/api/transactions`, {
          params: { address: addr },
          timeout: 6000,
        })
        .then((res) => (Array.isArray(res.data) ? res.data : []))
        .catch(() => []);

      // 2. Fetch on-chain transactions from BscScan
      const bscscanPromise = Promise.all([
        axios.get(bscscanApi, {
          params: {
            module: 'account', action: 'txlist', address: addr,
            startblock: 0, endblock: 99999999, page: 1, offset: 25,
            sort: 'desc', apikey: BSCSCAN_KEY,
          },
          timeout: 8000,
        }).catch(() => null),
        axios.get(bscscanApi, {
          params: {
            module: 'account', action: 'tokentx', address: addr,
            startblock: 0, endblock: 99999999, page: 1, offset: 25,
            sort: 'desc', apikey: BSCSCAN_KEY,
          },
          timeout: 8000,
        }).catch(() => null),
      ]);

      const [backendTxs, [bnbRes, tokenRes]] = await Promise.all([
        backendPromise,
        bscscanPromise,
      ]);

      const bnbRaw = Array.isArray(bnbRes?.data?.result) ? bnbRes.data.result : [];
      const tokenRaw = Array.isArray(tokenRes?.data?.result) ? tokenRes.data.result : [];

      const bnbTxs: Tx[] = bnbRaw.map((t: any) => ({
        hash: t.hash,
        from: t.from,
        to: t.to,
        value: t.value,
        timeStamp: t.timeStamp,
        isError: t.isError || '0',
        tokenSymbol: nativeSymbol,
      }));

      const tokenTxs: Tx[] = tokenRaw.map((t: any) => ({
        hash: t.hash,
        from: t.from,
        to: t.to,
        value: t.value,
        timeStamp: t.timeStamp,
        isError: t.isError || '0',
        tokenSymbol: t.tokenSymbol || 'TOKEN',
      }));

      // Convert backend transactions to standard Tx format
      const localTxs: Tx[] = backendTxs.map((t: any) => {
        const timeSec = t.createdAt
          ? Math.floor(new Date(t.createdAt).getTime() / 1000).toString()
          : Math.floor(Date.now() / 1000).toString();
        return {
          hash: t.txHash,
          from: t.fromAddress,
          to: t.toAddress || '',
          value: t.amount ? (parseFloat(t.amount) * 1e18).toString() : '0',
          timeStamp: timeSec,
          isError: t.status === 'failed' ? '1' : '0',
          tokenSymbol: t.tokenSymbol || nativeSymbol,
          type: t.type,
        };
      });

      // Merge backend + on-chain, deduplicating by tx hash (case-insensitive)
      const seen = new Set<string>();
      const combined: Tx[] = [];

      for (const tx of [...localTxs, ...bnbTxs, ...tokenTxs]) {
        const lowerHash = (tx.hash || '').toLowerCase();
        if (lowerHash && !seen.has(lowerHash)) {
          seen.add(lowerHash);
          combined.push(tx);
        }
      }

      combined.sort((a, b) => parseInt(b.timeStamp || '0') - parseInt(a.timeStamp || '0'));
      setTxs(combined.slice(0, 40));
    } catch {
      setTxs([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeAccount?.address, bscscanApi, nativeSymbol]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const onRefresh = () => {
    setRefreshing(true);
    loadHistory();
  };

  const isSend = (tx: Tx) => (tx.from || '').toLowerCase() === (myAddress || '').toLowerCase();

  const formatDate = (ts: string) => {
    if (!ts || isNaN(parseInt(ts))) return 'Recent';
    const d = new Date(parseInt(ts) * 1000);
    return d.toLocaleDateString('en-US', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  const formatAmount = (val: string, decimals = 18) => {
    try {
      const n = parseFloat(val) / 10 ** decimals;
      if (isNaN(n) || n === 0) return '0.00';
      return n < 0.0001 ? n.toExponential(2) : n.toFixed(4);
    } catch {
      return '0.00';
    }
  };

  const renderTx = ({ item }: { item: Tx }) => {
    const send = isSend(item);
    const label = item.type === 'swap' ? 'Swap' : send ? 'Sent' : 'Received';

    return (
      <TouchableOpacity
        style={styles.txCard}
        onPress={() => navigation.navigate('TransactionDetail', { txHash: item.hash })}
        activeOpacity={0.7}
      >
        {/* Real Coin Icon */}
        <View style={{ marginRight: 12 }}>
          <CoinIcon symbol={item.tokenSymbol} size={38} />
        </View>

        <View style={styles.txInfo}>
          <Text style={styles.txType}>{label} {item.tokenSymbol}</Text>
          <Text style={styles.txDate}>{formatDate(item.timeStamp)}</Text>
          <Text style={styles.txAddress} numberOfLines={1}>
            {send ? `To: ${(item.to || '').slice(0, 16)}…` : `From: ${(item.from || '').slice(0, 16)}…`}
          </Text>
        </View>

        <View style={styles.txRight}>
          <Text style={[styles.txAmount, { color: item.type === 'swap' ? COLORS.primary : send ? COLORS.error : COLORS.success }]}>
            {item.type === 'swap' ? '⇄ ' : send ? '-' : '+'}{formatAmount(item.value)} {item.tokenSymbol}
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
        <View style={{ padding: 16 }}>
          {[0, 1, 2, 3, 4].map((i) => (
            <View key={i} style={styles.txCard}>
              <Skeleton width={38} height={38} borderRadius={19} style={{ marginRight: 12 }} />
              <View style={{ flex: 1, gap: 6 }}>
                <Skeleton width={110} height={14} borderRadius={6} />
                <Skeleton width={140} height={11} borderRadius={6} />
              </View>
              <Skeleton width={75} height={14} borderRadius={6} />
            </View>
          ))}
        </View>
      ) : txs.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>📋</Text>
          <Text style={styles.emptyText}>No transactions yet</Text>
          <Text style={styles.emptySubtext}>Transactions you make will appear here immediately.</Text>
        </View>
      ) : (
        <FlatList
          data={txs}
          keyExtractor={(item, idx) => `${item.hash}-${idx}`}
          renderItem={renderTx}
          contentContainerStyle={{ padding: 16 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
          }
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
    backgroundColor: COLORS.card, borderRadius: 14, padding: 14,
    flexDirection: 'row', alignItems: 'center', marginBottom: 10,
    borderWidth: 1, borderColor: COLORS.border,
  },
  txInfo: { flex: 1 },
  txType: { color: COLORS.textPrimary, fontWeight: '600', fontSize: 14 },
  txDate: { color: COLORS.textSecondary, fontSize: 11, marginTop: 2 },
  txAddress: { color: COLORS.textSecondary, fontSize: 11, marginTop: 2 },
  txRight: { alignItems: 'flex-end' },
  txAmount: { fontWeight: '700', fontSize: 13 },
  failedBadge: {
    backgroundColor: COLORS.error, color: '#fff', fontSize: 10,
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginTop: 4,
  },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  emptyIcon: { fontSize: 44, marginBottom: 12 },
  emptyText: { color: COLORS.textPrimary, fontSize: 18, fontWeight: '700' },
  emptySubtext: { color: COLORS.textSecondary, fontSize: 13, marginTop: 6, textAlign: 'center' },
});
