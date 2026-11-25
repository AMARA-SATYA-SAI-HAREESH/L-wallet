// mobile/src/components/AccountSwitcherModal.tsx
import React from 'react';
import {
  Modal, View, Text, StyleSheet, TouchableOpacity,
  FlatList, SafeAreaView, ActivityIndicator,
} from 'react-native';
import { useWalletStore } from '../store/walletStore';
import { WalletAccount } from '../services/storageService';
import { COLORS } from '../constants/theme';

interface Props {
  visible: boolean;
  onClose: () => void;
  onAddAccount: () => void;
}

function short(addr: string) {
  return addr ? `${addr.slice(0, 8)}…${addr.slice(-6)}` : '';
}

function AccountItem({
  account,
  isActive,
  onSelect,
  switching,
}: {
  account: WalletAccount;
  isActive: boolean;
  onSelect: () => void;
  switching: boolean;
}) {
  return (
    <TouchableOpacity
      style={[styles.accountRow, isActive && styles.accountRowActive]}
      onPress={onSelect}
      disabled={isActive || switching}
      activeOpacity={0.7}
    >
      {/* Avatar circle */}
      <View style={[styles.avatar, isActive && styles.avatarActive]}>
        <Text style={styles.avatarText}>
          {(account.name ?? 'W')[0].toUpperCase()}
        </Text>
      </View>

      {/* Info */}
      <View style={styles.accountInfo}>
        <Text style={[styles.accountName, isActive && styles.accountNameActive]} numberOfLines={1}>
          {account.name}
        </Text>
        <Text style={styles.accountAddr}>{short(account.address)}</Text>
      </View>

      {/* Active indicator / spinner */}
      {switching && !isActive ? (
        <ActivityIndicator size="small" color={COLORS.primary} />
      ) : isActive ? (
        <View style={styles.checkDot}>
          <Text style={styles.checkDotText}>✓</Text>
        </View>
      ) : (
        <Text style={styles.switchHint}>Switch</Text>
      )}
    </TouchableOpacity>
  );
}

export function AccountSwitcherModal({ visible, onClose, onAddAccount }: Props) {
  const accounts = useWalletStore((s) => s.accounts);
  const activeAccount = useWalletStore((s) => s.activeAccount);
  const switchAccount = useWalletStore((s) => s.switchAccount);
  const [switching, setSwitching] = React.useState<string | null>(null);

  const handleSwitch = async (id: string) => {
    if (id === activeAccount?.id) return;
    setSwitching(id);
    await switchAccount(id);
    setSwitching(null);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <SafeAreaView style={styles.sheet}>
          {/* Handle bar */}
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>My Accounts</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <Text style={styles.closeBtn}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Account list */}
          <FlatList
            data={accounts}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => (
              <AccountItem
                account={item}
                isActive={item.id === activeAccount?.id}
                onSelect={() => handleSwitch(item.id)}
                switching={switching === item.id}
              />
            )}
            ListEmptyComponent={
              <Text style={styles.emptyText}>No accounts found.</Text>
            }
          />

          {/* Add account */}
          <TouchableOpacity style={styles.addBtn} onPress={onAddAccount} activeOpacity={0.8}>
            <Text style={styles.addBtnIcon}>＋</Text>
            <Text style={styles.addBtnText}>Add New Account</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 24,
    maxHeight: '80%',
  },
  handle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: COLORS.border,
    alignSelf: 'center', marginTop: 12, marginBottom: 8,
  },
  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary },
  closeBtn: { fontSize: 18, color: COLORS.textSecondary, padding: 4 },
  list: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 8 },
  accountRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 14, paddingHorizontal: 14,
    borderRadius: 14, marginBottom: 8,
    backgroundColor: COLORS.background,
    borderWidth: 1, borderColor: COLORS.border,
  },
  accountRowActive: {
    borderColor: COLORS.primary,
    backgroundColor: '#0D1F3A',
  },
  avatar: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: COLORS.border,
    justifyContent: 'center', alignItems: 'center',
    marginRight: 14,
  },
  avatarActive: { backgroundColor: COLORS.primary },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: 17 },
  accountInfo: { flex: 1 },
  accountName: { fontSize: 15, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 2 },
  accountNameActive: { color: COLORS.primary },
  accountAddr: { fontSize: 12, color: COLORS.textSecondary },
  checkDot: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: COLORS.primary,
    justifyContent: 'center', alignItems: 'center',
  },
  checkDotText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  switchHint: { color: COLORS.textSecondary, fontSize: 12 },
  emptyText: { color: COLORS.textSecondary, textAlign: 'center', marginTop: 20 },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    marginHorizontal: 16, marginTop: 8,
    backgroundColor: COLORS.primary,
    borderRadius: 14, paddingVertical: 15,
  },
  addBtnIcon: { color: '#fff', fontSize: 18, marginRight: 8, fontWeight: '700' },
  addBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
