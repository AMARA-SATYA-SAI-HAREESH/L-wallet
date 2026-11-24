// mobile/src/screens/HomeScreen.tsx
import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, RefreshControl, ActivityIndicator,
} from 'react-native';
import { getAddress } from '../services/storageService';
import { getBNBBalance, getTokenBalance } from '../services/walletService';
import { COLORS } from '../constants/theme';

interface Balance { symbol: string; amount: string; usd: string }

export default function HomeScreen({ navigation }: any) {
  const [address, setAddress] = useState('');
  const [balances, setBalances] = useState<Balance[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadBalances = useCallback(async () => {
    const addr = await getAddress();
    if (!addr) return;
    setAddress(addr);
    try {
      const [bnb, usdt, usdc] = await Promise.all([
        getBNBBalance(addr),
        getTokenBalance(addr, 'USDT'),
        getTokenBalance(addr, 'USDC'),
      ]);
      setBalances([
        { symbol: 'BNB',  amount: parseFloat(bnb).toFixed(6),  usd: '—' },
        { symbol: 'USDT', amount: parseFloat(usdt).toFixed(2), usd: '—' },
        { symbol: 'USDC', amount: parseFloat(usdc).toFixed(2), usd: '—' },
      ]);
    } catch (e) {
      setBalances([
        { symbol: 'BNB',  amount: '—', usd: '—' },
        { symbol: 'USDT', amount: '—', usd: '—' },
        { symbol: 'USDC', amount: '—', usd: '—' },
      ]);
    }
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { loadBalances(); }, [loadBalances]);

  const onRefresh = () => { setRefreshing(true); loadBalances(); };

  const short = (addr: string) =>
    addr ? `${addr.slice(0, 8)}...${addr.slice(-6)}` : '';

  const tokenColors: Record<string, string> = {
    BNB: '#F0B90B', USDT: '#26A17B', USDC: '#2775CA',
  };

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>L Wallet</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
          <Text style={styles.settingsIcon}>⚙</Text>
        </TouchableOpacity>
      </View>

      {/* Wallet Address Card */}
      <View style={styles.addressCard}>
        <Text style={styles.addressLabel}>Your Wallet Address</Text>
        <Text style={styles.addressText}>{short(address)}</Text>
        <Text style={styles.networkBadge}>BNB Smart Chain</Text>
      </View>

      {/* Action Buttons */}
      <View style={styles.actions}>
        {[
          { label: '↑ Send',    screen: 'Send' },
          { label: '↓ Receive', screen: 'Receive' },
          { label: '⇄ Swap',   screen: 'Swap' },
          { label: '☰ History', screen: 'History' },
        ].map((btn) => (
          <TouchableOpacity
            key={btn.screen}
            style={styles.actionBtn}
            onPress={() => navigation.navigate(btn.screen)}
          >
            <Text style={styles.actionBtnText}>{btn.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Asset List */}
      <Text style={styles.sectionTitle}>Your Assets</Text>

      {loading
        ? <ActivityIndicator color={COLORS.primary} style={{ marginTop: 20 }} />
        : balances.map((b) => (
          <View key={b.symbol} style={styles.assetCard}>
            <View style={[styles.tokenDot, { backgroundColor: tokenColors[b.symbol] ?? COLORS.primary }]} />
            <View style={styles.assetInfo}>
              <Text style={styles.assetSymbol}>{b.symbol}</Text>
              <Text style={styles.assetNetwork}>BNB Smart Chain</Text>
            </View>
            <Text style={styles.assetAmount}>{b.amount}</Text>
          </View>
        ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: COLORS.background },
  container: { padding: 20, paddingBottom: 40 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 20,
  },
  headerTitle: { fontSize: 22, fontWeight: '700', color: COLORS.textPrimary },
  settingsIcon: { fontSize: 22, color: COLORS.textSecondary },
  addressCard: {
    backgroundColor: COLORS.card, borderRadius: 16, padding: 20,
    marginBottom: 24, borderWidth: 1, borderColor: COLORS.border,
  },
  addressLabel: { fontSize: 12, color: COLORS.textSecondary, marginBottom: 6 },
  addressText: { fontSize: 16, color: COLORS.textPrimary, fontWeight: '600', marginBottom: 10 },
  networkBadge: {
    alignSelf: 'flex-start', backgroundColor: '#1A2D45',
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
    color: COLORS.primary, fontSize: 11, fontWeight: '600',
  },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 28 },
  actionBtn: {
    flex: 1, minWidth: '44%', backgroundColor: COLORS.card,
    paddingVertical: 16, borderRadius: 12, alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.border,
  },
  actionBtnText: { color: COLORS.textPrimary, fontSize: 14, fontWeight: '600' },
  sectionTitle: { fontSize: 16, color: COLORS.textSecondary, marginBottom: 14 },
  assetCard: {
    backgroundColor: COLORS.card, borderRadius: 12, padding: 16,
    flexDirection: 'row', alignItems: 'center',
    marginBottom: 10, borderWidth: 1, borderColor: COLORS.border,
  },
  tokenDot: { width: 36, height: 36, borderRadius: 18, marginRight: 14 },
  assetInfo: { flex: 1 },
  assetSymbol: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
  assetNetwork: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  assetAmount: { fontSize: 16, fontWeight: '600', color: COLORS.textPrimary },
});
