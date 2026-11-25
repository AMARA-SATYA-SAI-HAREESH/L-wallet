// mobile/src/screens/SettingsScreen.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useWalletStore } from '../store/walletStore';
import { NETWORK_CONFIG } from '../services/walletService';
import { AccountSwitcherModal } from '../components/AccountSwitcherModal';
import { COLORS } from '../constants/theme';

export default function SettingsScreen({ navigation }: any) {
  const network = useWalletStore((s) => s.network);
  const toggleNetwork = useWalletStore((s) => s.toggleNetwork);
  const activeAccount = useWalletStore((s) => s.activeAccount);
  const accounts = useWalletStore((s) => s.accounts);
  const deleteCurrentAccount = useWalletStore((s) => s.deleteCurrentAccount);
  const netConfig = NETWORK_CONFIG[network];

  const [switcherOpen, setSwitcherOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Lock / Logout: locks the app and returns to PIN login
  const onLogout = () => {
    navigation.replace('PinLogin');
  };

  // Delete current account with inline confirmation
  const onDeleteAccount = async () => {
    setErrorMsg('');
    try {
      const remainingCount = await deleteCurrentAccount();
      setConfirmDelete(false);
      if (remainingCount === 0) {
        navigation.replace('Welcome');
      }
    } catch (e: any) {
      setErrorMsg(e.message || 'Failed to delete account');
    }
  };

  const short = (addr: string) =>
    addr ? `${addr.slice(0, 8)}…${addr.slice(-6)}` : '';

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      {/* Account switcher modal */}
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
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Settings</Text>
        <View style={{ width: 32 }} />
      </View>

      {/* Active account banner */}
      {activeAccount && (
        <TouchableOpacity
          style={styles.accountBanner}
          onPress={() => setSwitcherOpen(true)}
          activeOpacity={0.8}
        >
          <View style={styles.bannerAvatar}>
            <Text style={styles.bannerAvatarText}>
              {(activeAccount.name ?? 'W')[0].toUpperCase()}
            </Text>
          </View>
          <View style={styles.bannerInfo}>
            <Text style={styles.bannerName}>{activeAccount.name}</Text>
            <Text style={styles.bannerAddr}>{short(activeAccount.address)}</Text>
          </View>
          <Text style={styles.bannerChevron}>›</Text>
        </TouchableOpacity>
      )}

      {/* Accounts section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Accounts</Text>

        <TouchableOpacity style={styles.row} onPress={() => setSwitcherOpen(true)}>
          <Text style={styles.rowText}>👤  Manage Accounts</Text>
          <Text style={styles.rowSub}>{accounts.length} account{accounts.length !== 1 ? 's' : ''}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.row}
          onPress={() => {
            setSwitcherOpen(false);
            navigation.navigate('Welcome');
          }}
        >
          <Text style={styles.rowText}>＋  Add New Account</Text>
          <Text style={styles.rowArrow}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Security & Backup */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Security</Text>

        <TouchableOpacity style={styles.row} onPress={onLogout}>
          <Text style={styles.rowText}>🔒  Lock / Logout</Text>
          <Text style={styles.rowArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.row} onPress={() => navigation.navigate('VerifyRecovery')}>
          <Text style={styles.rowText}>🔑  Backup Recovery Phrase</Text>
          <Text style={styles.rowArrow}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Network */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Network (Tap to switch)</Text>
        <TouchableOpacity style={styles.row} onPress={toggleNetwork}>
          <Text style={styles.rowText}>⬡  {netConfig.name}</Text>
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

      {/* About */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <View style={styles.row}>
          <Text style={styles.rowText}>L Wallet</Text>
          <Text style={styles.rowArrow}>v0.1.0</Text>
        </View>
      </View>

      {/* Inline Red Error Message if any */}
      {errorMsg ? (
        <View style={styles.inlineErrorBox}>
          <Text style={styles.inlineErrorText}>{errorMsg}</Text>
        </View>
      ) : null}

      {/* Delete Account of Current Wallet */}
      <View style={styles.dangerSection}>
        {!confirmDelete ? (
          <TouchableOpacity
            style={styles.dangerBtn}
            onPress={() => setConfirmDelete(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.dangerBtnText}>
              🗑️  Delete Current Account ({activeAccount?.name || 'Wallet'})
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.confirmBox}>
            <Text style={styles.confirmTitle}>
              ⚠️ Delete "{activeAccount?.name || 'Current Account'}"?
            </Text>
            <Text style={styles.confirmDesc}>
              Make sure you have backed up its 12-word recovery phrase. This cannot be undone.
            </Text>
            <View style={styles.confirmButtons}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setConfirmDelete(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteConfirmBtn}
                onPress={onDeleteAccount}
              >
                <Text style={styles.deleteConfirmBtnText}>Yes, Delete Account</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: COLORS.background },
  container: { padding: 20, paddingBottom: 48 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 24, paddingTop: 20,
  },
  back: { fontSize: 24, color: COLORS.textPrimary },
  title: { fontSize: 20, fontWeight: '700', color: COLORS.textPrimary },

  /* Account banner */
  accountBanner: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.card, borderRadius: 14, padding: 16,
    marginBottom: 24, borderWidth: 1, borderColor: COLORS.primary,
  },
  bannerAvatar: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center',
    marginRight: 14,
  },
  bannerAvatarText: { color: '#fff', fontWeight: '700', fontSize: 18 },
  bannerInfo: { flex: 1 },
  bannerName: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  bannerAddr: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  bannerChevron: { fontSize: 22, color: COLORS.textSecondary },

  /* Section */
  section: { marginBottom: 24 },
  sectionTitle: {
    fontSize: 12, fontWeight: '600', color: COLORS.textSecondary,
    textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8,
  },
  row: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: COLORS.card, padding: 16, borderRadius: 12,
    borderWidth: 1, borderColor: COLORS.border, marginBottom: 8,
  },
  rowText: { fontSize: 15, color: COLORS.textPrimary },
  rowSub: { fontSize: 13, color: COLORS.textSecondary },
  rowArrow: { fontSize: 18, color: COLORS.textSecondary },
  networkBadge: {
    backgroundColor: '#1A2D45', paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 20, color: COLORS.primary, fontSize: 11, fontWeight: '600',
  },

  dangerSection: { marginTop: 8 },
  dangerBtn: {
    backgroundColor: '#2D0A0A', borderRadius: 12, paddingVertical: 16,
    alignItems: 'center', borderWidth: 1, borderColor: COLORS.error,
  },
  dangerBtnText: { color: COLORS.error, fontSize: 14, fontWeight: '600' },

  inlineErrorBox: {
    backgroundColor: '#2D0A0A', borderWidth: 1, borderColor: COLORS.error,
    borderRadius: 10, padding: 12, marginBottom: 14,
  },
  inlineErrorText: { color: '#FF6B6B', fontSize: 13, textAlign: 'center' },

  confirmBox: {
    backgroundColor: '#2D0A0A', borderRadius: 14, padding: 18,
    borderWidth: 1.5, borderColor: COLORS.error,
  },
  confirmTitle: { color: '#FF6B6B', fontSize: 16, fontWeight: '700', marginBottom: 6 },
  confirmDesc: { color: COLORS.textSecondary, fontSize: 13, lineHeight: 18, marginBottom: 16 },
  confirmButtons: { flexDirection: 'row', gap: 10 },
  cancelBtn: {
    flex: 1, backgroundColor: COLORS.card, borderRadius: 10,
    paddingVertical: 12, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border,
  },
  cancelBtnText: { color: COLORS.textPrimary, fontSize: 14, fontWeight: '600' },
  deleteConfirmBtn: {
    flex: 1.2, backgroundColor: COLORS.error, borderRadius: 10,
    paddingVertical: 12, alignItems: 'center',
  },
  deleteConfirmBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
});
