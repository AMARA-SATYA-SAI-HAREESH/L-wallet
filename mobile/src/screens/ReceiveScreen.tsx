// mobile/src/screens/ReceiveScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Share, ScrollView,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import * as Clipboard from 'expo-clipboard';
import { getAddress } from '../services/storageService';
import { useWalletStore } from '../store/walletStore';
import { COLORS } from '../constants/theme';

export default function ReceiveScreen({ navigation }: any) {
  const activeAccount = useWalletStore((s) => s.activeAccount);
  const [address, setAddress] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const addr = activeAccount?.address;
    if (addr) {
      setAddress(addr);
    } else {
      getAddress().then((a) => setAddress(a ?? ''));
    }
  }, [activeAccount?.address]);

  const copyAddress = async () => {
    if (!address) return;
    await Clipboard.setStringAsync(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const shareAddress = async () => {
    await Share.share({ message: `My L Wallet address (BNB Smart Chain):\n${address}` });
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Receive</Text>
        <View style={{ width: 32 }} />
      </View>

      <Text style={styles.subtitle}>
        Share your address or QR code to receive BNB, USDT, or USDC on BNB Smart Chain.
      </Text>

      {/* Inline Feedback Banner when copied */}
      {copied && (
        <View style={styles.copiedBanner}>
          <Text style={styles.copiedBannerText}>✅ Address copied to clipboard!</Text>
        </View>
      )}

      <View style={styles.qrContainer}>
        {address ? (
          <QRCode
            value={address}
            size={200}
            backgroundColor={COLORS.card}
            color={COLORS.textPrimary}
          />
        ) : (
          <View style={styles.qrPlaceholder}><Text style={styles.qrPlaceholderText}>Loading…</Text></View>
        )}
      </View>

      <View style={styles.networkBadgeRow}>
        <Text style={styles.networkBadge}>BNB Smart Chain (BEP-20)</Text>
      </View>

      <View style={styles.addressBox}>
        <Text style={styles.addressLabel}>
          {activeAccount?.name ? `${activeAccount.name} Address` : 'Your Wallet Address'}
        </Text>
        <Text style={styles.addressText}>{address}</Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.copyBtn} onPress={copyAddress}>
          <Text style={styles.copyBtnText}>{copied ? '✅ Copied!' : '📋 Copy Address'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.shareBtn} onPress={shareAddress}>
          <Text style={styles.shareBtnText}>↑ Share</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.warningBox}>
        <Text style={styles.warningText}>
          ⚠️  Only send BNB Smart Chain (BSC / BEP-20) assets to this address.
          Sending other networks' assets may result in permanent loss.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: COLORS.background, padding: 20, flexGrow: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, paddingTop: 20 },
  back: { fontSize: 24, color: COLORS.textPrimary },
  title: { fontSize: 20, fontWeight: '700', color: COLORS.textPrimary },
  subtitle: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 22, textAlign: 'center', marginBottom: 20 },
  copiedBanner: {
    backgroundColor: '#0D2B1F', paddingVertical: 8, paddingHorizontal: 14,
    borderRadius: 8, borderWidth: 1, borderColor: COLORS.success,
    alignItems: 'center', marginBottom: 16,
  },
  copiedBannerText: { color: COLORS.success, fontSize: 13, fontWeight: '600' },
  qrContainer: {
    alignSelf: 'center', backgroundColor: COLORS.card, borderRadius: 16,
    padding: 20, marginBottom: 20, borderWidth: 1, borderColor: COLORS.border,
  },
  qrPlaceholder: { width: 200, height: 200, justifyContent: 'center', alignItems: 'center' },
  qrPlaceholderText: { color: COLORS.textSecondary },
  networkBadgeRow: { alignItems: 'center', marginBottom: 20 },
  networkBadge: {
    backgroundColor: '#1A2D45', paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: 20, color: COLORS.primary, fontSize: 12, fontWeight: '600',
  },
  addressBox: {
    backgroundColor: COLORS.card, borderRadius: 12, padding: 16,
    marginBottom: 16, borderWidth: 1, borderColor: COLORS.border,
  },
  addressLabel: { color: COLORS.textSecondary, fontSize: 12, marginBottom: 8 },
  addressText: {
    color: COLORS.textPrimary, fontSize: 13, letterSpacing: 0.5, lineHeight: 20,
  },
  actions: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  copyBtn: {
    flex: 1, backgroundColor: COLORS.primary, paddingVertical: 14,
    borderRadius: 10, alignItems: 'center',
  },
  copyBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  shareBtn: {
    flex: 1, backgroundColor: COLORS.card, paddingVertical: 14,
    borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border,
  },
  shareBtnText: { color: COLORS.textPrimary, fontSize: 14, fontWeight: '600' },
  warningBox: {
    backgroundColor: '#1A1500', borderRadius: 10, padding: 14,
    borderWidth: 1, borderColor: COLORS.warning,
  },
  warningText: { color: COLORS.warning, fontSize: 12, lineHeight: 20 },
});
