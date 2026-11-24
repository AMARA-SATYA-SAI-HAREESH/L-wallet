// mobile/src/screens/SwapScreen.tsx
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, Alert, ScrollView, ActivityIndicator,
} from 'react-native';
import axios from 'axios';
import { getAddress, getPrivateKey } from '../services/storageService';
import { COLORS } from '../constants/theme';

type TokenSymbol = 'BNB' | 'USDT' | 'USDC';
const TOKENS: TokenSymbol[] = ['BNB', 'USDT', 'USDC'];

// Update to your deployed backend URL
const BACKEND_URL = 'https://l-wallet-backend.onrender.com';

export default function SwapScreen({ navigation }: any) {
  const [sellToken, setSellToken] = useState<TokenSymbol>('BNB');
  const [buyToken, setBuyToken] = useState<TokenSymbol>('USDT');
  const [sellAmount, setSellAmount] = useState('');
  const [quote, setQuote] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [swapping, setSwapping] = useState(false);

  const onGetQuote = async () => {
    if (sellToken === buyToken) {
      Alert.alert('Invalid', 'Select different tokens to swap.');
      return;
    }
    if (!sellAmount || parseFloat(sellAmount) <= 0) {
      Alert.alert('Invalid', 'Enter a valid amount.');
      return;
    }
    setLoading(true);
    setQuote(null);
    try {
      const address = await getAddress();
      const res = await axios.post(`${BACKEND_URL}/api/swap/quote`, {
        sellToken, buyToken, sellAmount, takerAddress: address,
      });
      setQuote(res.data);
    } catch (e: any) {
      Alert.alert(
        'Quote Failed',
        e.response?.data?.error || e.message || 'Could not fetch swap quote',
      );
    } finally {
      setLoading(false);
    }
  };

  const onSwap = async () => {
    if (!quote) return;
    Alert.alert(
      'Confirm Swap',
      `Swap ${sellAmount} ${sellToken} → ~${quote.buyAmountFormatted} ${buyToken}\nService fee: ~$0.01\nGas included in quote`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm Swap',
          onPress: async () => {
            setSwapping(true);
            try {
              const address = await getAddress();
              const pk = await getPrivateKey();
              const res = await axios.post(`${BACKEND_URL}/api/swap/execute`, {
                sellToken, buyToken, sellAmount, takerAddress: address, privateKey: pk,
              });
              Alert.alert(
                '✅ Swap Submitted',
                `Tx Hash:\n${res.data.txHash}`,
                [{ text: 'OK', onPress: () => navigation.navigate('History') }],
              );
              setQuote(null);
              setSellAmount('');
            } catch (e: any) {
              Alert.alert('Swap Failed', e.response?.data?.error || e.message || 'Swap failed');
            } finally {
              setSwapping(false);
            }
          },
        },
      ],
    );
  };

  const swapPair = () => {
    setSellToken(buyToken);
    setBuyToken(sellToken);
    setQuote(null);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Swap</Text>
        <View style={{ width: 32 }} />
      </View>

      <View style={styles.card}>
        {/* Sell Side */}
        <Text style={styles.label}>You Pay</Text>
        <View style={styles.swapRow}>
          <TextInput
            style={styles.amountInput}
            placeholder="0.00"
            placeholderTextColor={COLORS.textSecondary}
            value={sellAmount}
            onChangeText={(v) => { setSellAmount(v); setQuote(null); }}
            keyboardType="decimal-pad"
          />
          <View style={styles.tokenPicker}>
            {TOKENS.map((t) => (
              <TouchableOpacity
                key={t}
                style={[styles.tokenChip, sellToken === t && styles.tokenChipActive]}
                onPress={() => { setSellToken(t); setQuote(null); }}
              >
                <Text style={[styles.tokenChipText, sellToken === t && styles.tokenChipTextActive]}>
                  {t}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Swap Arrow */}
        <TouchableOpacity style={styles.swapArrow} onPress={swapPair}>
          <Text style={styles.swapArrowText}>⇅</Text>
        </TouchableOpacity>

        {/* Buy Side */}
        <Text style={styles.label}>You Receive</Text>
        <View style={styles.swapRow}>
          <View style={[styles.amountInput, styles.receiveBox]}>
            <Text style={styles.receiveText}>
              {quote ? quote.buyAmountFormatted ?? '—' : '—'}
            </Text>
          </View>
          <View style={styles.tokenPicker}>
            {TOKENS.map((t) => (
              <TouchableOpacity
                key={t}
                style={[styles.tokenChip, buyToken === t && styles.tokenChipActive]}
                onPress={() => { setBuyToken(t); setQuote(null); }}
              >
                <Text style={[styles.tokenChipText, buyToken === t && styles.tokenChipTextActive]}>
                  {t}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {/* Quote Details */}
      {quote && (
        <View style={styles.quoteBox}>
          <Row label="Rate"         value={quote.exchangeRate ?? '—'} />
          <Row label="L Wallet Fee" value={quote.lwFee ?? '~$0.01'} />
          <Row label="Gas (BNB)"    value={quote.estimatedGas ?? '—'} />
          <Row label="Price Impact" value={quote.priceImpact ?? '—'} />
        </View>
      )}

      {/* Get Quote */}
      <TouchableOpacity
        style={[styles.secondaryBtn, loading && styles.disabledBtn]}
        onPress={onGetQuote}
        disabled={loading}
      >
        {loading
          ? <ActivityIndicator color={COLORS.primary} />
          : <Text style={styles.secondaryBtnText}>Get Quote</Text>}
      </TouchableOpacity>

      {/* Confirm Swap */}
      {quote && (
        <TouchableOpacity
          style={[styles.primaryBtn, swapping && styles.disabledBtn]}
          onPress={onSwap}
          disabled={swapping}
        >
          {swapping
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.primaryBtnText}>Confirm Swap</Text>}
        </TouchableOpacity>
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
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  back: { fontSize: 24, color: COLORS.textPrimary },
  title: { fontSize: 20, fontWeight: '700', color: COLORS.textPrimary },
  card: { backgroundColor: COLORS.card, borderRadius: 16, padding: 18, marginBottom: 16, borderWidth: 1, borderColor: COLORS.border },
  label: { color: COLORS.textSecondary, fontSize: 13, marginBottom: 10 },
  swapRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start', marginBottom: 16 },
  amountInput: {
    flex: 1, backgroundColor: COLORS.inputBg, borderRadius: 10, padding: 14,
    color: COLORS.textPrimary, fontSize: 20, borderWidth: 1, borderColor: COLORS.border,
  },
  receiveBox: { justifyContent: 'center' },
  receiveText: { color: COLORS.textPrimary, fontSize: 20 },
  tokenPicker: { gap: 6 },
  tokenChip: {
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8,
    backgroundColor: COLORS.background, borderWidth: 1, borderColor: COLORS.border,
  },
  tokenChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  tokenChipText: { color: COLORS.textSecondary, fontSize: 12, fontWeight: '600' },
  tokenChipTextActive: { color: '#fff' },
  swapArrow: { alignSelf: 'center', marginBottom: 12 },
  swapArrowText: { fontSize: 24, color: COLORS.primary },
  quoteBox: {
    backgroundColor: COLORS.card, borderRadius: 12, padding: 16,
    marginBottom: 16, borderWidth: 1, borderColor: COLORS.border,
  },
  secondaryBtn: {
    paddingVertical: 14, borderRadius: 12, alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.primary, marginBottom: 12,
  },
  secondaryBtnText: { color: COLORS.primary, fontSize: 15, fontWeight: '600' },
  primaryBtn: {
    backgroundColor: COLORS.primary, paddingVertical: 16,
    borderRadius: 12, alignItems: 'center',
  },
  disabledBtn: { opacity: 0.6 },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
