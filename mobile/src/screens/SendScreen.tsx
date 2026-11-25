// mobile/src/screens/SendScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, ScrollView, ActivityIndicator,
} from 'react-native';
import axios from 'axios';
import { getAddress, getPrivateKey } from '../services/storageService';
import { sendBNB, sendToken, estimateGasFee, NETWORK_CONFIG } from '../services/walletService';
import { useWalletStore } from '../store/walletStore';
import { CoinIcon } from '../components/CoinIcon';
import { LoadingOverlay } from '../components/LoadingOverlay';
import { Skeleton } from '../components/Skeleton';
import { COLORS } from '../constants/theme';
import { BACKEND_URL } from '../constants/config';

type TokenSymbol = 'BNB' | 'USDT' | 'USDC';
const TOKENS: TokenSymbol[] = ['BNB', 'USDT', 'USDC'];

export default function SendScreen({ navigation }: any) {
  const network = useWalletStore((s) => s.network);
  const activeAccount = useWalletStore((s) => s.activeAccount);
  const netConfig = NETWORK_CONFIG[network];
  const nativeSymbol = netConfig.nativeSymbol;

  const [token, setToken] = useState<TokenSymbol>('BNB');
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [gasFee, setGasFee] = useState('');
  const [estimating, setEstimating] = useState(false);
  const [sending, setSending] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [txHash, setTxHash] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const [myAddress, setMyAddress] = useState('');

  useEffect(() => {
    const addr = activeAccount?.address;
    if (addr) setMyAddress(addr);
    else getAddress().then((a) => setMyAddress(a ?? ''));
  }, [activeAccount?.address]);

  const onEstimate = async () => {
    setErrorMessage('');
    if (!recipient.trim() || !amount.trim()) {
      setErrorMessage('Please enter both recipient address and amount.');
      return;
    }
    if (!recipient.startsWith('0x') || recipient.length !== 42) {
      setErrorMessage('Please enter a valid 42-character BNB Smart Chain address (0x...).');
      return;
    }
    const num = parseFloat(amount);
    if (isNaN(num) || num <= 0) {
      setErrorMessage('Please enter a valid amount greater than 0.');
      return;
    }

    setEstimating(true);
    setGasFee('');
    try {
      const { gasCostBNB } = await estimateGasFee(myAddress, recipient.trim(), amount.trim(), token);
      setGasFee(gasCostBNB);
    } catch (e: any) {
      setErrorMessage(e.message || 'Could not estimate gas fee.');
    } finally {
      setEstimating(false);
    }
  };

  const onStartSend = () => {
    setErrorMessage('');
    if (!recipient.trim() || !amount.trim()) {
      setErrorMessage('Please fill in both recipient address and amount.');
      return;
    }
    if (!recipient.startsWith('0x') || recipient.length !== 42) {
      setErrorMessage('Please enter a valid 42-character BNB Smart Chain address (0x...).');
      return;
    }
    const num = parseFloat(amount);
    if (isNaN(num) || num <= 0) {
      setErrorMessage('Please enter a valid amount greater than 0.');
      return;
    }
    setConfirming(true);
  };

  const onConfirmSend = async () => {
    setErrorMessage('');
    setSending(true);
    try {
      const pk = await getPrivateKey();
      if (!pk) throw new Error('No private key found on device.');

      let hash: string;
      if (token === 'BNB') {
        hash = await sendBNB(pk, recipient.trim(), amount.trim());
      } else {
        hash = await sendToken(pk, recipient.trim(), amount.trim(), token);
      }

      setTxHash(hash);
      setConfirming(false);

      // Record to backend DB immediately for instant history
      await axios.post(`${BACKEND_URL}/api/transactions`, {
        txHash: hash,
        type: 'send',
        fromAddress: myAddress,
        toAddress: recipient.trim(),
        tokenSymbol: token === 'BNB' ? nativeSymbol : token,
        amount: amount.trim(),
        chainId: netConfig.chainId,
      }).catch((e) => console.warn('Failed to record send:', e.message));

    } catch (e: any) {
      setErrorMessage(e.message || 'Transaction failed. Please check your balance and gas.');
    } finally {
      setSending(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <LoadingOverlay visible={sending} message={`Sending ${amount} ${token}…`} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Send</Text>
        <View style={{ width: 32 }} />
      </View>

      {/* Inline Red Error Message */}
      {errorMessage ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>⚠️ {errorMessage}</Text>
        </View>
      ) : null}

      {/* Success View */}
      {txHash ? (
        <View style={styles.successCard}>
          <Text style={styles.successIcon}>✅</Text>
          <Text style={styles.successTitle}>Transaction Broadcast!</Text>
          <Text style={styles.successDesc}>
            Sent {amount} {token} to {recipient.slice(0, 10)}…{recipient.slice(-6)}
          </Text>
          <Text style={styles.hashLabel}>Transaction Hash:</Text>
          <Text style={styles.hashText} numberOfLines={2}>{txHash}</Text>

          <View style={styles.successBtns}>
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => navigation.navigate('History')}
            >
              <Text style={styles.primaryBtnText}>View in History →</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.ghostBtn}
              onPress={() => {
                setTxHash('');
                setAmount('');
                setRecipient('');
                setGasFee('');
                setConfirming(false);
              }}
            >
              <Text style={styles.ghostBtnText}>Send Another</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : confirming ? (
        /* Inline Confirmation Card */
        <View style={styles.confirmCard}>
          <Text style={styles.confirmHeader}>Confirm Transaction</Text>
          <View style={styles.confirmRow}>
            <Text style={styles.confirmLabel}>Sending</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <CoinIcon symbol={token} size={22} />
              <Text style={styles.confirmValue}>{amount} {token === 'BNB' ? nativeSymbol : token}</Text>
            </View>
          </View>
          <View style={styles.confirmRow}>
            <Text style={styles.confirmLabel}>To Address</Text>
            <Text style={[styles.confirmValue, { fontSize: 13 }]}>
              {recipient.slice(0, 12)}…{recipient.slice(-8)}
            </Text>
          </View>
          <View style={styles.confirmRow}>
            <Text style={styles.confirmLabel}>Network</Text>
            <Text style={styles.confirmValue}>{netConfig.name}</Text>
          </View>
          <View style={styles.confirmRow}>
            <Text style={styles.confirmLabel}>Network Fee</Text>
            <Text style={styles.confirmValue}>~{gasFee || '0.0004'} {nativeSymbol}</Text>
          </View>

          <View style={styles.confirmActions}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => setConfirming(false)}
              disabled={sending}
            >
              <Text style={styles.cancelBtnText}>Back</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.primaryBtn, { flex: 1.5, marginTop: 0 }]}
              onPress={onConfirmSend}
              disabled={sending}
            >
              {sending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryBtnText}>Confirm & Send</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        /* Form Inputs */
        <>
          {/* Token Selector with Real Coin Icons */}
          <Text style={styles.label}>Select Token</Text>
          <View style={styles.tokenRow}>
            {TOKENS.map((t) => (
              <TouchableOpacity
                key={t}
                style={[styles.tokenBtn, token === t && styles.tokenBtnActive]}
                onPress={() => { setToken(t); setGasFee(''); }}
              >
                <CoinIcon symbol={t} size={24} />
                <Text style={[styles.tokenBtnText, token === t && styles.tokenBtnTextActive]}>
                  {t === 'BNB' ? nativeSymbol : t}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Recipient */}
          <Text style={styles.label}>Recipient Address</Text>
          <TextInput
            style={styles.input}
            placeholder="0x..."
            placeholderTextColor={COLORS.textSecondary}
            value={recipient}
            onChangeText={(v) => { setRecipient(v); setErrorMessage(''); }}
            autoCapitalize="none"
            autoCorrect={false}
          />

          {/* Amount */}
          <Text style={styles.label}>Amount ({token === 'BNB' ? nativeSymbol : token})</Text>
          <TextInput
            style={styles.input}
            placeholder="0.00"
            placeholderTextColor={COLORS.textSecondary}
            value={amount}
            onChangeText={(v) => { setAmount(v); setErrorMessage(''); }}
            keyboardType="decimal-pad"
          />

          {/* Gas Estimate */}
          <TouchableOpacity style={styles.estimateBtn} onPress={onEstimate} disabled={estimating}>
            {estimating ? (
              <ActivityIndicator color={COLORS.primary} />
            ) : (
              <Text style={styles.estimateBtnText}>Estimate Gas Fee</Text>
            )}
          </TouchableOpacity>

          {estimating ? (
            <View style={styles.feeBox}>
              <Skeleton width={130} height={12} borderRadius={6} style={{ marginBottom: 8 }} />
              <Skeleton width={160} height={18} borderRadius={6} />
            </View>
          ) : gasFee ? (
            <View style={styles.feeBox}>
              <Text style={styles.feeLabel}>Estimated Network Fee</Text>
              <Text style={styles.feeValue}>{gasFee} {nativeSymbol}</Text>
              <Text style={styles.feeNote}>L Wallet charges no additional fee for sending.</Text>
            </View>
          ) : null}

          {/* Send Button */}
          <TouchableOpacity
            style={[styles.primaryBtn, sending && styles.disabledBtn]}
            onPress={onStartSend}
            disabled={sending}
          >
            <Text style={styles.primaryBtnText}>Review & Send →</Text>
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: COLORS.background, padding: 20, flexGrow: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, paddingTop: 20 },
  back: { fontSize: 24, color: COLORS.textPrimary },
  title: { fontSize: 20, fontWeight: '700', color: COLORS.textPrimary },

  errorBox: {
    backgroundColor: '#2D0A0A', borderWidth: 1, borderColor: COLORS.error,
    borderRadius: 12, padding: 14, marginBottom: 16,
  },
  errorText: { color: '#FF6B6B', fontSize: 13, lineHeight: 18 },

  label: { color: COLORS.textSecondary, fontSize: 13, marginBottom: 8, marginTop: 16 },
  tokenRow: { flexDirection: 'row', gap: 10 },
  tokenBtn: {
    flex: 1, flexDirection: 'row', gap: 8, paddingVertical: 12, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.card,
    borderWidth: 1, borderColor: COLORS.border,
  },
  tokenBtnActive: { backgroundColor: '#1A2D45', borderColor: COLORS.primary },
  tokenBtnText: { color: COLORS.textSecondary, fontWeight: '600', fontSize: 14 },
  tokenBtnTextActive: { color: COLORS.primary },

  input: {
    backgroundColor: COLORS.inputBg, borderRadius: 12, padding: 14,
    color: COLORS.textPrimary, fontSize: 16, borderWidth: 1, borderColor: COLORS.border,
  },
  estimateBtn: {
    marginTop: 18, borderRadius: 12, paddingVertical: 12,
    alignItems: 'center', borderWidth: 1, borderColor: COLORS.primary,
  },
  estimateBtnText: { color: COLORS.primary, fontSize: 14, fontWeight: '600' },
  feeBox: {
    backgroundColor: COLORS.card, borderRadius: 12, padding: 14,
    marginTop: 14, borderWidth: 1, borderColor: COLORS.border,
  },
  feeLabel: { color: COLORS.textSecondary, fontSize: 12 },
  feeValue: { color: COLORS.textPrimary, fontSize: 16, fontWeight: '600', marginTop: 4 },
  feeNote: { color: COLORS.textSecondary, fontSize: 11, marginTop: 6 },
  primaryBtn: {
    backgroundColor: COLORS.primary, paddingVertical: 16,
    borderRadius: 14, alignItems: 'center', marginTop: 24,
  },
  disabledBtn: { opacity: 0.6 },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  confirmCard: {
    backgroundColor: COLORS.card, borderRadius: 16, padding: 20,
    borderWidth: 1, borderColor: COLORS.border, marginTop: 10,
  },
  confirmHeader: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 18 },
  confirmRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 8 },
  confirmLabel: { color: COLORS.textSecondary, fontSize: 14 },
  confirmValue: { color: COLORS.textPrimary, fontSize: 15, fontWeight: '600' },
  confirmActions: { flexDirection: 'row', gap: 12, marginTop: 24 },
  cancelBtn: {
    flex: 1, backgroundColor: COLORS.background, borderRadius: 12,
    paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border,
  },
  cancelBtnText: { color: COLORS.textPrimary, fontSize: 14, fontWeight: '600' },

  successCard: {
    backgroundColor: COLORS.card, borderRadius: 16, padding: 24,
    alignItems: 'center', borderWidth: 1, borderColor: COLORS.success, marginTop: 10,
  },
  successIcon: { fontSize: 44, marginBottom: 12 },
  successTitle: { fontSize: 20, fontWeight: '700', color: COLORS.success, marginBottom: 8 },
  successDesc: { color: COLORS.textSecondary, fontSize: 14, textAlign: 'center', marginBottom: 16 },
  hashLabel: { color: COLORS.textSecondary, fontSize: 12, alignSelf: 'flex-start', marginBottom: 4 },
  hashText: { color: COLORS.textPrimary, fontSize: 12, backgroundColor: COLORS.background, padding: 10, borderRadius: 8, width: '100%', marginBottom: 20 },
  successBtns: { width: '100%', gap: 10 },
  ghostBtn: { alignItems: 'center', paddingVertical: 10 },
  ghostBtnText: { color: COLORS.textSecondary, fontSize: 14 },
});
