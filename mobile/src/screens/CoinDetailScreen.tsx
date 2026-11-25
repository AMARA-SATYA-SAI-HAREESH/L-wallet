// mobile/src/screens/CoinDetailScreen.tsx
import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl,
} from 'react-native';
import {
  fetchCoinChart,
  fetchLivePrices,
  ChartPoint,
  ChartTimeframe,
} from '../services/priceService';
import { PriceChart } from '../components/PriceChart';
import { CoinIcon } from '../components/CoinIcon';
import { Skeleton } from '../components/Skeleton';
import { COLORS } from '../constants/theme';

const TIMEFRAMES: { label: string; value: ChartTimeframe }[] = [
  { label: '24H', value: '1' },
  { label: '7D',  value: '7' },
  { label: '30D', value: '30' },
  { label: '1Y',  value: '365' },
];

const COIN_NAMES: Record<'BNB' | 'USDT' | 'USDC', string> = {
  BNB: 'BNB Smart Chain',
  USDT: 'Tether USD',
  USDC: 'USD Coin',
};

export default function CoinDetailScreen({ route, navigation }: any) {
  const { symbol, balance } = route.params as {
    symbol: 'BNB' | 'USDT' | 'USDC';
    balance: string;
  };

  const [timeframe, setTimeframe] = useState<ChartTimeframe>('1');
  const [chartData, setChartData] = useState<ChartPoint[]>([]);
  const [chartLoading, setChartLoading] = useState(true);
  const [price, setPrice] = useState<number | null>(null);
  const [change24h, setChange24h] = useState<number>(0);
  const [selectedPoint, setSelectedPoint] = useState<ChartPoint | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async (tf: ChartTimeframe) => {
    setChartLoading(true);
    try {
      const [prices, points] = await Promise.all([
        fetchLivePrices(),
        fetchCoinChart(symbol, tf),
      ]);
      setPrice(prices[symbol].usd);
      setChange24h(prices[symbol].usd_24h_change);
      setChartData(points);
    } catch {
      // keep existing state if transient error
    } finally {
      setChartLoading(false);
      setRefreshing(false);
    }
  }, [symbol]);

  useEffect(() => {
    loadData(timeframe);
  }, [timeframe, loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData(timeframe);
  };

  const displayPrice = selectedPoint ? selectedPoint.price : price;
  const isPositive = change24h >= 0;
  const numBalance = parseFloat(balance) || 0;
  const usdBalance = price !== null ? (numBalance * price).toFixed(2) : '—';

  const formatTimestamp = (ts: number) => {
    const d = new Date(ts);
    if (timeframe === '1') {
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return d.toLocaleDateString([], { day: '2-digit', month: 'short', year: '2-digit' });
  };

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <View style={styles.titleRow}>
          {/* Real SVG Coin Icon */}
          <CoinIcon symbol={symbol} size={34} />
          <View>
            <Text style={styles.title}>{symbol}</Text>
            <Text style={styles.subtitle}>{COIN_NAMES[symbol]}</Text>
          </View>
        </View>
        <View style={{ width: 32 }} />
      </View>

      {/* Price Display */}
      <View style={styles.priceSection}>
        {displayPrice === null ? (
          <>
            <Skeleton width={160} height={36} borderRadius={8} />
            <Skeleton width={90} height={18} borderRadius={6} style={{ marginTop: 8 }} />
          </>
        ) : (
          <>
            <Text style={styles.priceText}>
              ${displayPrice.toLocaleString('en-US', {
                minimumFractionDigits: displayPrice < 10 ? 4 : 2,
                maximumFractionDigits: displayPrice < 10 ? 4 : 2,
              })}
            </Text>
            {selectedPoint ? (
              <Text style={styles.scrubTime}>{formatTimestamp(selectedPoint.timestamp)}</Text>
            ) : (
              <View style={[styles.changeBadge, { backgroundColor: isPositive ? '#0F2E1B' : '#2E1114' }]}>
                <Text style={[styles.changeText, { color: isPositive ? COLORS.success : COLORS.error }]}>
                  {isPositive ? '▲' : '▼'} {Math.abs(change24h).toFixed(2)}% (24h)
                </Text>
              </View>
            )}
          </>
        )}
      </View>

      {/* Interactive Chart */}
      <PriceChart
        data={chartData}
        loading={chartLoading}
        isPositive={isPositive}
        onSelectPoint={setSelectedPoint}
      />

      {/* Timeframe Selector */}
      <View style={styles.tfRow}>
        {TIMEFRAMES.map((tf) => {
          const active = timeframe === tf.value;
          return (
            <TouchableOpacity
              key={tf.value}
              style={[styles.tfBtn, active && styles.tfBtnActive]}
              onPress={() => setTimeframe(tf.value)}
            >
              <Text style={[styles.tfText, active && styles.tfTextActive]}>{tf.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* User Holdings Card */}
      <View style={styles.holdingCard}>
        <Text style={styles.holdingLabel}>Your {symbol} Balance</Text>
        <View style={styles.holdingRow}>
          <Text style={styles.holdingAmount}>{balance} {symbol}</Text>
          <Text style={styles.holdingUsd}>≈ ${usdBalance}</Text>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('Send')}>
          <Text style={styles.actionBtnText}>↑ Send</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('Receive')}>
          <Text style={styles.actionBtnText}>↓ Receive</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, styles.primaryAction]}
          onPress={() => navigation.navigate('Swap')}
        >
          <Text style={[styles.actionBtnText, { color: '#fff' }]}>⇄ Swap</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: COLORS.background },
  container: { padding: 20, paddingTop: 48, paddingBottom: 40 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  backBtn: { padding: 4 },
  backText: { fontSize: 24, color: COLORS.textPrimary },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  title: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary },
  subtitle: { fontSize: 12, color: COLORS.textSecondary },
  priceSection: { marginBottom: 12 },
  priceText: { fontSize: 34, fontWeight: '700', color: COLORS.textPrimary },
  scrubTime: { fontSize: 13, color: COLORS.primary, marginTop: 6, fontWeight: '600' },
  changeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
  },
  changeText: { fontSize: 13, fontWeight: '600' },
  tfRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 4,
    marginTop: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tfBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  tfBtnActive: { backgroundColor: COLORS.primary },
  tfText: { color: COLORS.textSecondary, fontSize: 13, fontWeight: '600' },
  tfTextActive: { color: '#fff' },
  holdingCard: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  holdingLabel: { fontSize: 12, color: COLORS.textSecondary, marginBottom: 8 },
  holdingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  holdingAmount: { fontSize: 20, fontWeight: '700', color: COLORS.textPrimary },
  holdingUsd: { fontSize: 15, fontWeight: '600', color: COLORS.textSecondary },
  actionRow: { flexDirection: 'row', gap: 10 },
  actionBtn: {
    flex: 1,
    backgroundColor: COLORS.card,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  primaryAction: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  actionBtnText: { color: COLORS.textPrimary, fontSize: 14, fontWeight: '600' },
});
