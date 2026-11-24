// mobile/src/screens/SendScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, Alert, ScrollView, ActivityIndicator,
} from 'react-native';
import { getAddress, getPrivateKey } from '../services/storageService';
import { sendBNB, sendToken, estimateGasFee } from '../services/walletService';
import { COLORS } from '../constants/theme';

type TokenSymbol = 'BNB' | 'USDT' | 'USDC';
const TOKENS: TokenSymbol[] = ['BNB', 'USDT', 'USDC'];

export default function SendScreen({ navigation }: any) {
  const [token, setToken] = useState<TokenSymbol>('BNB');
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [gasFee, setGasFee] = useState('');
  const [estimating, setEstimating] = useState(false);
  const [sending, setSending] = useState(false);
  const [txHash, setTxHash] = useState('');
  const [myAddress, setMyAddress] = useState('');

  useEffect(() => { getAddress().then((a) => setMyAddress(a ?? '')); }, []);

  const onEstimate = async () => {
    if (!recipient || !amount) {
      Alert.alert('Missing fields', 'Please fill in recipient address and amount.');
      return;
    }
    setEstimating(true);
    setGasFee('');
    try {
      const { gasCostBNB } = await estimateGasFee(myAddress, recipient, token === 'BNB' ? amount : '0');
      setGasFee(gasCostBNB);
    } catch (e: any) {
      Alert.alert('Estimation Failed', e.message || 'Could not estimate gas fee');
    } finally {
      setEstimating(false);
    }
  };

  const onSend = async () => {
    if (!recipient || !amount) {
      Alert.alert('Missing fields', 'Please fill in all fields.');
      return;
    }
    Alert.alert(
      'Confirm Transaction',
      `Send ${amount} ${token} to\n${recipient.slice(0, 16)}...${recipient.slice(-8)}\nGas: ~${gasFee || '?'} BNB`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send',
          onPress: async () => {
            setSending(true);
            try {
              const pk = await getPrivateKey();
              if (!pk) throw new Error('No private key found');
              let hash: string;
              if (token === 'BNB') {
                hash = await sendBNB(pk, recipient, amount);
              } else {
                hash = await sendToken(pk, recipient, amount, token);
              }
              setTxHash(hash);
              Alert.alert(
                '✅ Transaction Sent',
                `Tx Hash:\n${hash}`,
                [{ text: 'OK', onPress: () => navigation.navigate('History') }],
              );
            } catch (e: any) {
              Alert.alert('Send Failed', e.message || 'Transaction failed');
            } finally {
              setSending(false);
            }
          },
        },
      ],
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Send</Text>
        <View style={{ width: 32 }} />
      </View>

      {/* Token Selector */}
      <Text style={styles.label}>Select Token</Text>
      <View style={styles.tokenRow}>
        {TOKENS.map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.tokenBtn, token === t && styles.tokenBtnActive]}
            onPress={() => setToken(t)}
          >
            <Text style={[styles.tokenBtnText, token === t && styles.tokenBtnTextActive]}>{t}</Text>
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
        onChangeText={setRecipient}
        autoCapitalize="none"
        autoCorrect={false}
      />

      {/* Amount */}
      <Text style={styles.label}>Amount ({token})</Text>
      <TextInput
        style={styles.input}
        placeholder="0.00"
        placeholderTextColor={COLORS.textSecondary}
        value={amount}
        onChangeText={setAmount}
        keyboardType="decimal-pad"
      />

      {/* Gas Estimate */}
      <TouchableOpacity style={styles.estimateBtn} onPress={onEstimate} disabled={estimating}>
        {estimating
          ? <ActivityIndicator color={COLORS.primary} />
          : <Text style={styles.estimateBtnText}>Estimate Gas Fee</Text>}
      </TouchableOpacity>

      {gasFee ? (
        <View style={styles.feeBox}>
          <Text style={styles.feeLabel}>Estimated Network Fee</Text>
          <Text style={styles.feeValue}>{gasFee} BNB</Text>
          <Text style={styles.feeNote}>L Wallet charges no additional fee for sending.</Text>
        </View>
      ) : null}

      {/* Send Button */}
      <TouchableOpacity
        style={[styles.primaryBtn, sending && styles.disabledBtn]}
        onPress={onSend}
        disabled={sending}
      >
        {sending
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.primaryBtnText}>Send {token}</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: COLORS.background, padding: 20, flexGrow: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  back: { fontSize: 24, color: COLORS.textPrimary },
  title: { fontSize: 20, fontWeight: '700', color: COLORS.textPrimary },
  label: { color: COLORS.textSecondary, fontSize: 13, marginBottom: 8, marginTop: 16 },
  tokenRow: { flexDirection: 'row', gap: 10 },
  tokenBtn: {
    flex: 1, paddingVertical: 10, borderRadius: 8,
    alignItems: 'center', backgroundColor: COLORS.card,
    borderWidth: 1, borderColor: COLORS.border,
  },
  tokenBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  tokenBtnText: { color: COLORS.textSecondary, fontWeight: '600', fontSize: 14 },
  tokenBtnTextActive: { color: '#fff' },
  input: {
    backgroundColor: COLORS.inputBg, borderRadius: 10, padding: 14,
    color: COLORS.textPrimary, fontSize: 15, borderWidth: 1, borderColor: COLORS.border,
  },
  estimateBtn: {
    marginTop: 18, borderRadius: 10, paddingVertical: 12,
    alignItems: 'center', borderWidth: 1, borderColor: COLORS.primary,
  },
  estimateBtnText: { color: COLORS.primary, fontSize: 14, fontWeight: '600' },
  feeBox: {
    backgroundColor: COLORS.card, borderRadius: 10, padding: 14,
    marginTop: 14, borderWidth: 1, borderColor: COLORS.border,
  },
  feeLabel: { color: COLORS.textSecondary, fontSize: 12 },
  feeValue: { color: COLORS.textPrimary, fontSize: 16, fontWeight: '600', marginTop: 4 },
  feeNote: { color: COLORS.textSecondary, fontSize: 11, marginTop: 6 },
  primaryBtn: {
    backgroundColor: COLORS.primary, paddingVertical: 16,
    borderRadius: 12, alignItems: 'center', marginTop: 24,
  },
  disabledBtn: { opacity: 0.6 },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
