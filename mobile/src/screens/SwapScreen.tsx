// mobile/src/screens/SwapScreen.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, ScrollView, ActivityIndicator,
} from 'react-native';
import { ethers } from 'ethers';
import { getAddress, getPrivateKey } from '../services/storageService';
import {
  getBNBBalance, getTokenBalance, NETWORK_CONFIG,
} from '../services/walletService';
import {
  fetchSwapQuote,
  checkTokenAllowance,
  approveTokenSpending,
  executePancakeSwap,
  executeMainnetSwap,
  recordSwapToBackend,
  PANCAKESWAP_ROUTER_TESTNET,
  SwapQuoteData,
} from '../services/swapService';
import { useWalletStore } from '../store/walletStore';
import { CoinIcon } from '../components/CoinIcon';
import { LoadingOverlay } from '../components/LoadingOverlay';
import { Skeleton } from '../components/Skeleton';
import { COLORS } from '../constants/theme';

type TokenSymbol = 'BNB' | 'USDT' | 'USDC';
const TOKENS: TokenSymbol[] = ['BNB', 'USDT', 'USDC'];

export default function SwapScreen({ navigation }: any) {
  const network = useWalletStore((s) => s.network);
  const activeAccount = useWalletStore((s) => s.activeAccount);
  const netConfig = NETWORK_CONFIG[network];

  const [sellToken, setSellToken] = useState<TokenSymbol>('BNB');
  const [buyToken, setBuyToken] = useState<TokenSymbol>('USDT');
  const [sellAmount, setSellAmount] = useState('');
  const [quote, setQuote] = useState<SwapQuoteData | null>(null);

  const [balances, setBalances] = useState<Record<TokenSymbol, string>>({
    BNB: '0', USDT: '0', USDC: '0',
  });
  const [loadingBalances, setLoadingBalances] = useState(false);
  const [loadingQuote, setLoadingQuote] = useState(false);
  const [swapping, setSwapping] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Processing swap…');

  const [errorMessage, setErrorMessage] = useState('');
  const [successTxHash, setSuccessTxHash] = useState('');

  // Load balances for current account
  const loadBalances = useCallback(async () => {
    const addr = activeAccount?.address || (await getAddress());
    if (!addr) return;
    setLoadingBalances(true);
    try {
      const [bnb, usdt, usdc] = await Promise.all([
        getBNBBalance(addr).catch(() => '0'),
        getTokenBalance(addr, 'USDT').catch(() => '0'),
        getTokenBalance(addr, 'USDC').catch(() => '0'),
      ]);
      setBalances({
        BNB: parseFloat(bnb).toFixed(4),
        USDT: parseFloat(usdt).toFixed(2),
        USDC: parseFloat(usdc).toFixed(2),
      });
    } catch {
      // Keep defaults
    } finally {
      setLoadingBalances(false);
    }
  }, [activeAccount?.address, network]);

  useEffect(() => {
    loadBalances();
  }, [loadBalances]);

  // Set sell amount to max available balance
  const setMaxAmount = () => {
    setErrorMessage('');
    const bal = balances[sellToken];
    if (!bal || parseFloat(bal) <= 0) return;
    if (sellToken === 'BNB') {
      const num = Math.max(0, parseFloat(bal) - 0.005);
      setSellAmount(num > 0 ? num.toFixed(4) : '0');
    } else {
      setSellAmount(bal);
    }
    setQuote(null);
  };

  // Fetch Quote
  const onGetQuote = async () => {
    setErrorMessage('');
    setSuccessTxHash('');
    if (sellToken === buyToken) {
      setErrorMessage('Please select two different tokens to swap.');
      return;
    }
    const amountNum = parseFloat(sellAmount);
    if (!sellAmount || isNaN(amountNum) || amountNum <= 0) {
      setErrorMessage('Please enter a valid amount greater than 0.');
      return;
    }

    const availableBal = parseFloat(balances[sellToken] || '0');
    if (amountNum > availableBal) {
      setErrorMessage(
        `Insufficient balance. You have ${availableBal} ${sellToken === 'BNB' ? netConfig.nativeSymbol : sellToken}, but entered ${amountNum}.`
      );
      return;
    }

    setLoadingQuote(true);
    setQuote(null);
    try {
      const address = activeAccount?.address || (await getAddress());
      if (!address) throw new Error('No active wallet address found.');

      const q = await fetchSwapQuote(sellToken, buyToken, sellAmount, address, network);
      setQuote(q);
    } catch (e: any) {
      setErrorMessage(
        e.response?.data?.error || e.message || 'Could not fetch swap quote from provider.'
      );
    } finally {
      setLoadingQuote(false);
    }
  };

  // Execute Swap locally
  const onSwap = async () => {
    if (!quote) return;
    setErrorMessage('');
    setSwapping(true);

    try {
      const address = activeAccount?.address || (await getAddress());
      const privateKey = await getPrivateKey();
      if (!address || !privateKey) {
        throw new Error('Wallet credentials not found.');
      }

      let txHash = '';

      if (network === 'testnet') {
        const routerAddress = PANCAKESWAP_ROUTER_TESTNET;

        // Step 1: If selling ERC-20 (USDT / USDC), check & perform approval
        if (sellToken !== 'BNB') {
          setStatusMessage(`Checking ${sellToken} allowance on PancakeSwap…`);
          const allowance = await checkTokenAllowance(
            sellToken,
            address,
            routerAddress,
            network,
          );
          const amountWei = ethers.parseUnits(sellAmount, 18);

          if (allowance < amountWei) {
            setStatusMessage(`Step 1/2: Approving ${sellToken} for PancakeSwap…`);
            await approveTokenSpending(sellToken, privateKey, routerAddress, network);
          }
        }

        // Step 2: Execute trade on PancakeSwap
        setStatusMessage(`Step 2/2: Swapping ${sellToken} → ${buyToken}…`);
        txHash = await executePancakeSwap(
          sellToken,
          buyToken,
          sellAmount,
          quote,
          privateKey,
          address,
          1.0,
        );
      } else {
        // BSC Mainnet: 0x
        setStatusMessage('Executing swap via 0x…');
        txHash = await executeMainnetSwap(quote, privateKey);
      }

      // Record to backend DB
      await recordSwapToBackend({
        txHash,
        takerAddress: address,
        sellToken,
        buyToken,
        sellAmount,
        buyAmount: quote.buyAmountFormatted,
        lwFeeBps: quote.lwFeeBps,
        lwFeeUSD: quote.lwFeeUSD,
        chainId: netConfig.chainId,
      });

      // Refresh balances
      await loadBalances();

      setSuccessTxHash(txHash);
      setQuote(null);
      setSellAmount('');
    } catch (e: any) {
      const msg = e.response?.data?.error || e.message || 'Swap execution failed.';
      setErrorMessage(msg);
    } finally {
      setSwapping(false);
    }
  };

  const swapPair = () => {
    setSellToken(buyToken);
    setBuyToken(sellToken);
    setQuote(null);
    setErrorMessage('');
  };

  const displaySellSymbol = sellToken === 'BNB' ? netConfig.nativeSymbol : sellToken;
  const displayBuySymbol = buyToken === 'BNB' ? netConfig.nativeSymbol : buyToken;

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <LoadingOverlay visible={swapping} message={statusMessage} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Swap</Text>
        <View style={styles.networkBadgeBox}>
          <Text
            style={[
              styles.networkBadgeText,
              network === 'testnet' && styles.testnetBadge,
            ]}
          >
            {network === 'testnet' ? '🥞 PancakeSwap' : '⚡ 0x'}
          </Text>
        </View>
      </View>

      {/* Inline Red Error Message */}
      {errorMessage ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>⚠️ {errorMessage}</Text>
        </View>
      ) : null}

      {/* Inline Success Card */}
      {successTxHash ? (
        <View style={styles.successCard}>
          <Text style={styles.successIcon}>✅</Text>
          <Text style={styles.successTitle}>Swap Submitted!</Text>
          <Text style={styles.successDesc}>
            Your swap transaction was successfully broadcast to the network.
          </Text>
          <Text style={styles.hashLabel}>Transaction Hash:</Text>
          <Text style={styles.hashText} numberOfLines={2}>{successTxHash}</Text>

          <View style={{ width: '100%', gap: 10 }}>
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => navigation.navigate('History')}
            >
              <Text style={styles.primaryBtnText}>View in History →</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.ghostBtn}
              onPress={() => setSuccessTxHash('')}
            >
              <Text style={styles.ghostBtnText}>Swap More Tokens</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <>
          <View style={styles.card}>
            {/* Sell Side */}
            <View style={styles.sideHeader}>
              <Text style={styles.label}>You Pay</Text>
              <TouchableOpacity onPress={setMaxAmount} style={styles.balRow}>
                <Text style={styles.balText}>
                  Bal: {loadingBalances ? '…' : balances[sellToken]} {displaySellSymbol}
                </Text>
                <View style={styles.maxBtn}>
                  <Text style={styles.maxBtnText}>MAX</Text>
                </View>
              </TouchableOpacity>
            </View>

            <View style={styles.swapRow}>
              <TextInput
                style={styles.amountInput}
                placeholder="0.00"
                placeholderTextColor={COLORS.textSecondary}
                value={sellAmount}
                onChangeText={(v) => { setSellAmount(v); setQuote(null); setErrorMessage(''); }}
                keyboardType="decimal-pad"
              />
              <View style={styles.tokenPicker}>
                {TOKENS.map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[styles.tokenChip, sellToken === t && styles.tokenChipActive]}
                    onPress={() => { setSellToken(t); setQuote(null); setErrorMessage(''); }}
                  >
                    <CoinIcon symbol={t} size={18} />
                    <Text style={[styles.tokenChipText, sellToken === t && styles.tokenChipTextActive]}>
                      {t === 'BNB' ? netConfig.nativeSymbol : t}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Swap Arrow */}
            <TouchableOpacity style={styles.swapArrow} onPress={swapPair} activeOpacity={0.7}>
              <Text style={styles.swapArrowText}>⇅</Text>
            </TouchableOpacity>

            {/* Buy Side */}
            <View style={styles.sideHeader}>
              <Text style={styles.label}>You Receive</Text>
              <Text style={styles.balText}>
                Bal: {loadingBalances ? '…' : balances[buyToken]} {displayBuySymbol}
              </Text>
            </View>

            <View style={styles.swapRow}>
              <View style={[styles.amountInput, styles.receiveBox]}>
                <Text style={styles.receiveText}>
                  {quote ? quote.buyAmountFormatted : '—'}
                </Text>
              </View>
              <View style={styles.tokenPicker}>
                {TOKENS.map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[styles.tokenChip, buyToken === t && styles.tokenChipActive]}
                    onPress={() => { setBuyToken(t); setQuote(null); setErrorMessage(''); }}
                  >
                    <CoinIcon symbol={t} size={18} />
                    <Text style={[styles.tokenChipText, buyToken === t && styles.tokenChipTextActive]}>
                      {t === 'BNB' ? netConfig.nativeSymbol : t}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* Quote Details */}
          {loadingQuote ? (
            <View style={styles.quoteBox}>
              <Skeleton width="70%" height={14} borderRadius={6} style={{ marginBottom: 10 }} />
              <Skeleton width="55%" height={14} borderRadius={6} style={{ marginBottom: 10 }} />
              <Skeleton width="60%" height={14} borderRadius={6} />
            </View>
          ) : quote ? (
            <View style={styles.quoteBox}>
              <Row label="DEX Provider"  value={quote.provider === 'PancakeSwap' ? '🥞 PancakeSwap V2' : '⚡ 0x Protocol'} />
              <Row label="Exchange Rate" value={quote.exchangeRate} />
              <Row label="L Wallet Fee"  value={quote.lwFeeUSD} />
              <Row label="Est. Gas"      value={quote.estimatedGas} />
              <Row label="Price Impact"  value={quote.priceImpact} />
              <Row label="Slippage"      value="1.0%" />
            </View>
          ) : null}

          {/* Action Button: Get Quote or Confirm */}
          {!quote ? (
            <TouchableOpacity
              style={[styles.primaryBtn, loadingQuote && styles.disabledBtn]}
              onPress={onGetQuote}
              disabled={loadingQuote}
            >
              {loadingQuote ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryBtnText}>Get Quote</Text>
              )}
            </TouchableOpacity>
          ) : (
            <View style={{ gap: 10 }}>
              <TouchableOpacity
                style={[styles.primaryBtn, swapping && styles.disabledBtn]}
                onPress={onSwap}
                disabled={swapping}
              >
                {swapping ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.primaryBtnText}>
                    {network === 'testnet' ? '🥞 Swap on PancakeSwap' : '⚡ Confirm Swap'}
                  </Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.refreshBtn}
                onPress={onGetQuote}
                disabled={swapping}
              >
                <Text style={styles.refreshBtnText}>🔄 Refresh Quote</Text>
              </TouchableOpacity>
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginVertical: 4 }}>
      <Text style={{ color: COLORS.textSecondary, fontSize: 13 }}>{label}</Text>
      <Text style={{ color: COLORS.textPrimary, fontSize: 13, fontWeight: '600' }}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: COLORS.background, padding: 20, flexGrow: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 20, paddingTop: 20,
  },
  back: { fontSize: 24, color: COLORS.textPrimary },
  title: { fontSize: 20, fontWeight: '700', color: COLORS.textPrimary },
  networkBadgeBox: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12,
    backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border,
  },
  networkBadgeText: { fontSize: 11, fontWeight: '600', color: COLORS.primary },
  testnetBadge: { color: COLORS.warning },

  errorBox: {
    backgroundColor: '#2D0A0A', borderWidth: 1, borderColor: COLORS.error,
    borderRadius: 12, padding: 14, marginBottom: 16,
  },
  errorText: { color: '#FF6B6B', fontSize: 13, lineHeight: 18 },

  card: {
    backgroundColor: COLORS.card, borderRadius: 16, padding: 18,
    marginBottom: 16, borderWidth: 1, borderColor: COLORS.border,
  },
  sideHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 8,
  },
  label: { color: COLORS.textSecondary, fontSize: 13, fontWeight: '500' },
  balRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  balText: { color: COLORS.textSecondary, fontSize: 12 },
  maxBtn: {
    backgroundColor: '#1A2D45', borderRadius: 4,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  maxBtnText: { color: COLORS.primary, fontSize: 10, fontWeight: '700' },

  swapRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start', marginBottom: 12 },
  amountInput: {
    flex: 1, backgroundColor: COLORS.inputBg, borderRadius: 12, padding: 14,
    color: COLORS.textPrimary, fontSize: 20, borderWidth: 1, borderColor: COLORS.border,
  },
  receiveBox: { justifyContent: 'center', minHeight: 56 },
  receiveText: { color: COLORS.textPrimary, fontSize: 20, fontWeight: '600' },
  tokenPicker: { gap: 6 },
  tokenChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8,
    backgroundColor: COLORS.background, borderWidth: 1, borderColor: COLORS.border,
  },
  tokenChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  tokenChipText: { color: COLORS.textSecondary, fontSize: 12, fontWeight: '600' },
  tokenChipTextActive: { color: '#fff' },

  swapArrow: {
    alignSelf: 'center', marginVertical: 8,
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: COLORS.background, borderWidth: 1, borderColor: COLORS.border,
    justifyContent: 'center', alignItems: 'center',
  },
  swapArrowText: { fontSize: 18, color: COLORS.primary, fontWeight: '700' },

  quoteBox: {
    backgroundColor: COLORS.card, borderRadius: 14, padding: 16,
    marginBottom: 16, borderWidth: 1, borderColor: COLORS.border,
  },
  primaryBtn: {
    backgroundColor: COLORS.primary, paddingVertical: 16,
    borderRadius: 14, alignItems: 'center',
  },
  disabledBtn: { opacity: 0.6 },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  refreshBtn: {
    paddingVertical: 12, borderRadius: 12, alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.border,
  },
  refreshBtnText: { color: COLORS.textSecondary, fontSize: 14 },

  successCard: {
    backgroundColor: COLORS.card, borderRadius: 16, padding: 24,
    alignItems: 'center', borderWidth: 1, borderColor: COLORS.success,
  },
  successIcon: { fontSize: 44, marginBottom: 12 },
  successTitle: { fontSize: 20, fontWeight: '700', color: COLORS.success, marginBottom: 8 },
  successDesc: { color: COLORS.textSecondary, fontSize: 14, textAlign: 'center', marginBottom: 16 },
  hashLabel: { color: COLORS.textSecondary, fontSize: 12, alignSelf: 'flex-start', marginBottom: 4 },
  hashText: { color: COLORS.textPrimary, fontSize: 12, backgroundColor: COLORS.background, padding: 10, borderRadius: 8, width: '100%', marginBottom: 20 },
  ghostBtn: { alignItems: 'center', paddingVertical: 10 },
  ghostBtnText: { color: COLORS.textSecondary, fontSize: 14 },
});
