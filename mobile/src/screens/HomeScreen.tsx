// mobile/src/screens/HomeScreen.tsx
import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, RefreshControl,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { getBNBBalance, getTokenBalance, NETWORK_CONFIG } from '../services/walletService';
import { fetchLivePrices } from '../services/priceService';
import { useWalletStore } from '../store/walletStore';
import { AccountSwitcherModal } from '../components/AccountSwitcherModal';
import { CoinIcon } from '../components/CoinIcon';
import { Skeleton } from '../components/Skeleton';
import { COLORS } from '../constants/theme';

interface AssetItem {
  symbol: 'BNB' | 'USDT' | 'USDC';
  name: string;
  amount: string;
  priceUsd: number | null;
  change24h: number | null;
  valueUsd: number | null;
}

export default function HomeScreen({ navigation }: any) {
  const network = useWalletStore((s) => s.network);
  const toggleNetwork = useWalletStore((s) => s.toggleNetwork);
  const activeAccount = useWalletStore((s) => s.activeAccount);
  const loadAccounts = useWalletStore((s) => s.loadAccounts);
  const netConfig = NETWORK_CONFIG[network];

  const [switcherOpen, setSwitcherOpen] = useState(false);
  const [assets, setAssets] = useState<AssetItem[]>([]);
  const [totalUsd, setTotalUsd] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [copied, setCopied] = useState(false);

  const loadBalances = useCallback(async () => {
    setLoading(true);
    let currentAccount = activeAccount;
    if (!currentAccount) {
      await loadAccounts();
      currentAccount = useWalletStore.getState().activeAccount;
    }

    const addr = currentAccount?.address;
    if (!addr) {
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      const [bnb, usdt, usdc, prices] = await Promise.all([
        getBNBBalance(addr).catch(() => '0'),
        getTokenBalance(addr, 'USDT').catch(() => '0'),
        getTokenBalance(addr, 'USDC').catch(() => '0'),
        fetchLivePrices().catch(() => null),
      ]);

      const bnbNum = parseFloat(bnb) || 0;
      const usdtNum = parseFloat(usdt) || 0;
      const usdcNum = parseFloat(usdc) || 0;

      const items: AssetItem[] = [
        {
          symbol: 'BNB',
          name: 'BNB Smart Chain',
          amount: bnbNum.toFixed(6),
          priceUsd: prices ? prices.BNB.usd : null,
          change24h: prices ? prices.BNB.usd_24h_change : null,
          valueUsd: prices ? bnbNum * prices.BNB.usd : null,
        },
        {
          symbol: 'USDT',
          name: 'Tether USD',
          amount: usdtNum.toFixed(2),
          priceUsd: prices ? prices.USDT.usd : null,
          change24h: prices ? prices.USDT.usd_24h_change : null,
          valueUsd: prices ? usdtNum * prices.USDT.usd : null,
        },
        {
          symbol: 'USDC',
          name: 'USD Coin',
          amount: usdcNum.toFixed(2),
          priceUsd: prices ? prices.USDC.usd : null,
          change24h: prices ? prices.USDC.usd_24h_change : null,
          valueUsd: prices ? usdcNum * prices.USDC.usd : null,
        },
      ];

      setAssets(items);
      if (prices) {
        const total = items.reduce((acc, item) => acc + (item.valueUsd ?? 0), 0);
        setTotalUsd(total);
      } else {
        setTotalUsd(null);
      }
    } catch {
      setAssets([
        { symbol: 'BNB', name: 'BNB Smart Chain', amount: '0.000000', priceUsd: null, change24h: null, valueUsd: null },
        { symbol: 'USDT', name: 'Tether USD', amount: '0.00', priceUsd: null, change24h: null, valueUsd: null },
        { symbol: 'USDC', name: 'USD Coin', amount: '0.00', priceUsd: null, change24h: null, valueUsd: null },
      ]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeAccount, loadAccounts]);

  useEffect(() => {
    loadBalances();
  }, [loadBalances, network, activeAccount?.id]);

  const onRefresh = () => {
    setRefreshing(true);
    loadBalances();
  };

  const copyAddress = async () => {
    const addr = activeAccount?.address;
    if (!addr) return;
    await Clipboard.setStringAsync(addr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const short = (addr: string) =>
    addr ? `${addr.slice(0, 8)}...${addr.slice(-6)}` : '';

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
      }
    >
      {/* Account Switcher Modal */}
      <AccountSwitcherModal
        visible={switcherOpen}
        onClose={() => setSwitcherOpen(false)}
        onAddAccount={() => {
          setSwitcherOpen(false);
          navigation.navigate('Welcome');
        }}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.accountSelector}
          onPress={() => setSwitcherOpen(true)}
          activeOpacity={0.7}
        >
          <View style={styles.accountAvatar}>
            <Text style={styles.accountAvatarText}>
              {(activeAccount?.name ?? 'W')[0].toUpperCase()}
            </Text>
          </View>
          <View>
            <View style={styles.accountNameRow}>
              <Text style={styles.accountNameText} numberOfLines={1}>
                {activeAccount?.name || 'Main Wallet'}
              </Text>
              <Text style={styles.chevron}>▾</Text>
            </View>
            <Text style={styles.networkSubText}>
              {network === 'mainnet' ? 'BSC Mainnet' : 'BSC Testnet'}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.settingsBtn}
          onPress={() => navigation.navigate('Settings')}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.settingsIcon}>⚙</Text>
        </TouchableOpacity>
      </View>

      {/* Portfolio & Wallet Address Card */}
      <View style={styles.addressCard}>
        <Text style={styles.addressLabel}>Total Portfolio Balance</Text>
        {loading ? (
          <Skeleton width={150} height={34} borderRadius={8} style={{ marginVertical: 6 }} />
        ) : (
          <Text style={styles.portfolioValue}>
            {totalUsd !== null ? `$${totalUsd.toFixed(2)}` : '—'}
          </Text>
        )}

        <View style={styles.addressRow}>
          {/* Click to Copy Address */}
          <TouchableOpacity onPress={copyAddress} activeOpacity={0.7} style={styles.copyAddressBtn}>
            <Text style={styles.addressText}>
              {activeAccount?.address ? short(activeAccount.address) : 'No address'}
            </Text>
            <Text style={styles.copyIcon}>📋</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={toggleNetwork} activeOpacity={0.8}>
            <Text
              style={[
                styles.networkBadge,
                network === 'testnet' && { color: COLORS.warning, backgroundColor: '#2D1B00' },
              ]}
            >
              {network === 'mainnet' ? 'Mainnet' : 'Testnet'}
            </Text>
          </TouchableOpacity>
        </View>

        {copied && (
          <View style={styles.copiedBanner}>
            <Text style={styles.copiedBannerText}>✅ Address copied to clipboard!</Text>
          </View>
        )}
      </View>

      {/* Quick Action Buttons */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => navigation.navigate('Send')}
        >
          <Text style={styles.actionBtnText}>↑ Send</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => navigation.navigate('Receive')}
        >
          <Text style={styles.actionBtnText}>↓ Receive</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => navigation.navigate('Swap')}
        >
          <Text style={styles.actionBtnText}>⇄ Swap</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => navigation.navigate('History')}
        >
          <Text style={styles.actionBtnText}>📋 History</Text>
        </TouchableOpacity>
      </View>

      {/* Assets List */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Assets</Text>
        <Text style={styles.sectionHint}>Tap coin for chart & details</Text>
      </View>

      {loading ? (
        <>
          <Skeleton width="100%" height={72} borderRadius={14} style={{ marginBottom: 10 }} />
          <Skeleton width="100%" height={72} borderRadius={14} style={{ marginBottom: 10 }} />
          <Skeleton width="100%" height={72} borderRadius={14} style={{ marginBottom: 10 }} />
        </>
      ) : (
        assets.map((item) => {
          const isPositive = (item.change24h ?? 0) >= 0;
          return (
            <TouchableOpacity
              key={item.symbol}
              style={styles.assetCard}
              activeOpacity={0.75}
              onPress={() =>
                navigation.navigate('CoinDetail', {
                  symbol: item.symbol,
                  balance: item.amount,
                })
              }
            >
              {/* Real SVG Coin Icon */}
              <View style={{ marginRight: 14 }}>
                <CoinIcon symbol={item.symbol} size={40} />
              </View>

              <View style={styles.assetInfo}>
                <Text style={styles.assetSymbol}>
                  {item.symbol === 'BNB' ? netConfig.nativeSymbol : item.symbol}
                </Text>
                <View style={styles.priceRow}>
                  <Text style={styles.assetPrice}>
                    {item.priceUsd !== null
                      ? `$${item.priceUsd.toLocaleString('en-US', {
                          minimumFractionDigits: item.priceUsd < 10 ? 4 : 2,
                          maximumFractionDigits: item.priceUsd < 10 ? 4 : 2,
                        })}`
                      : item.name}
                  </Text>
                  {item.change24h !== null && (
                    <Text
                      style={[
                        styles.changeText,
                        { color: isPositive ? COLORS.success : COLORS.error },
                      ]}
                    >
                      {isPositive ? '+' : ''}
                      {item.change24h.toFixed(2)}%
                    </Text>
                  )}
                </View>
              </View>
              <View style={styles.assetRight}>
                <Text style={styles.assetAmount}>{item.amount}</Text>
                <Text style={styles.assetUsd}>
                  {item.valueUsd !== null ? `$${item.valueUsd.toFixed(2)}` : '—'}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: COLORS.background },
  container: { padding: 20, paddingTop: 48, paddingBottom: 40 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 20,
  },
  accountSelector: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.card, paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 24, borderWidth: 1, borderColor: COLORS.border,
    maxWidth: '80%',
  },
  accountAvatar: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center',
    marginRight: 8,
  },
  accountAvatarText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  accountNameRow: { flexDirection: 'row', alignItems: 'center' },
  accountNameText: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary, maxWidth: 140 },
  chevron: { fontSize: 12, color: COLORS.textSecondary, marginLeft: 4 },
  networkSubText: { fontSize: 10, color: COLORS.textSecondary },
  settingsBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: COLORS.card, justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.border,
  },
  settingsIcon: { fontSize: 18, color: COLORS.textSecondary },
  addressCard: {
    backgroundColor: COLORS.card, borderRadius: 16, padding: 20,
    marginBottom: 24, borderWidth: 1, borderColor: COLORS.border,
  },
  addressLabel: { fontSize: 12, color: COLORS.textSecondary, marginBottom: 4 },
  portfolioValue: { fontSize: 32, fontWeight: '700', color: COLORS.textPrimary, marginVertical: 4 },
  addressRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10,
  },
  copyAddressBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: COLORS.background, paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 8, borderWidth: 1, borderColor: COLORS.border,
  },
  addressText: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '500' },
  copyIcon: { fontSize: 13 },
  copiedBanner: {
    marginTop: 10, backgroundColor: '#0D2B1F', paddingVertical: 6,
    paddingHorizontal: 10, borderRadius: 8, borderWidth: 1, borderColor: COLORS.success,
    alignItems: 'center',
  },
  copiedBannerText: { color: COLORS.success, fontSize: 12, fontWeight: '600' },
  networkBadge: {
    backgroundColor: '#1A2D45',
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
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14,
  },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: COLORS.textSecondary },
  sectionHint: { fontSize: 12, color: COLORS.primary },
  assetCard: {
    backgroundColor: COLORS.card, borderRadius: 14, padding: 16,
    flexDirection: 'row', alignItems: 'center',
    marginBottom: 10, borderWidth: 1, borderColor: COLORS.border,
  },
  assetInfo: { flex: 1 },
  assetSymbol: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 3 },
  assetPrice: { fontSize: 12, color: COLORS.textSecondary },
  changeText: { fontSize: 11, fontWeight: '600' },
  assetRight: { alignItems: 'flex-end' },
  assetAmount: { fontSize: 16, fontWeight: '600', color: COLORS.textPrimary },
  assetUsd: { fontSize: 12, color: COLORS.textSecondary, marginTop: 3 },
});
