// mobile/src/services/storageService.ts
import * as SecureStore from 'expo-secure-store';

const ACCOUNTS_KEY = 'lwallet_accounts_v1';
const ACTIVE_ACCOUNT_KEY = 'lwallet_active_account_id_v1';

export interface WalletAccount {
  id: string;
  name: string;
  address: string;
  mnemonic: string;
  privateKey: string;
  createdAt: number;
}

// ─── Legacy Single-Wallet Helpers ─────────────────────────────────────────────
export async function getMnemonic(): Promise<string | null> {
  const active = await getActiveAccount();
  if (active?.mnemonic) return active.mnemonic;
  return SecureStore.getItemAsync('mnemonic');
}

export async function storeMnemonic(mnemonic: string): Promise<void> {
  return SecureStore.setItemAsync('mnemonic', mnemonic);
}

export async function getAddress(): Promise<string | null> {
  const active = await getActiveAccount();
  if (active?.address) return active.address;
  return SecureStore.getItemAsync('address');
}

export async function storeAddress(address: string): Promise<void> {
  return SecureStore.setItemAsync('address', address);
}

export async function getPrivateKey(): Promise<string | null> {
  const active = await getActiveAccount();
  if (active?.privateKey) return active.privateKey;
  return SecureStore.getItemAsync('privateKey');
}

export async function storePrivateKey(pk: string): Promise<void> {
  return SecureStore.setItemAsync('privateKey', pk);
}

export async function getPin(): Promise<string | null> {
  return SecureStore.getItemAsync('pin');
}

export async function storePin(pin: string): Promise<void> {
  return SecureStore.setItemAsync('pin', pin);
}

// Keep legacy single-account keys synced with active account
async function syncLegacyKeys(account: WalletAccount | null): Promise<void> {
  if (!account) return;
  await Promise.all([
    SecureStore.setItemAsync('address', account.address),
    SecureStore.setItemAsync('mnemonic', account.mnemonic),
    SecureStore.setItemAsync('privateKey', account.privateKey),
  ]);
}

// ─── Multi-Account API ────────────────────────────────────────────────────────
export async function getAccounts(): Promise<WalletAccount[]> {
  const raw = await SecureStore.getItemAsync(ACCOUNTS_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as WalletAccount[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    } catch {
      // fall through to migration check
    }
  }

  // Migrate legacy single-account data if present
  const [address, mnemonic, privateKey] = await Promise.all([
    SecureStore.getItemAsync('address'),
    SecureStore.getItemAsync('mnemonic'),
    SecureStore.getItemAsync('privateKey'),
  ]);

  if (address && mnemonic && privateKey) {
    const migrated: WalletAccount = {
      id: 'account-1',
      name: 'Main Wallet',
      address,
      mnemonic,
      privateKey,
      createdAt: Date.now(),
    };
    await SecureStore.setItemAsync(ACCOUNTS_KEY, JSON.stringify([migrated]));
    await SecureStore.setItemAsync(ACTIVE_ACCOUNT_KEY, migrated.id);
    return [migrated];
  }

  return [];
}

export async function getActiveAccount(): Promise<WalletAccount | null> {
  const accounts = await getAccounts();
  if (accounts.length === 0) return null;

  const activeId = await SecureStore.getItemAsync(ACTIVE_ACCOUNT_KEY);
  const found = accounts.find((a) => a.id === activeId) ?? accounts[0];
  if (found.id !== activeId) {
    await SecureStore.setItemAsync(ACTIVE_ACCOUNT_KEY, found.id);
    await syncLegacyKeys(found);
  }
  return found;
}

export async function setActiveAccountId(id: string): Promise<WalletAccount | null> {
  const accounts = await getAccounts();
  const target = accounts.find((a) => a.id === id);
  if (!target) return null;

  await SecureStore.setItemAsync(ACTIVE_ACCOUNT_KEY, target.id);
  await syncLegacyKeys(target);
  return target;
}

export async function addAccount(input: {
  name: string;
  address: string;
  mnemonic: string;
  privateKey: string;
}): Promise<WalletAccount> {
  const accounts = await getAccounts();
  const newAccount: WalletAccount = {
    id: `account-${Date.now()}`,
    name: input.name.trim() || `Wallet ${accounts.length + 1}`,
    address: input.address,
    mnemonic: input.mnemonic,
    privateKey: input.privateKey,
    createdAt: Date.now(),
  };

  const updated = [...accounts, newAccount];
  await SecureStore.setItemAsync(ACCOUNTS_KEY, JSON.stringify(updated));
  await SecureStore.setItemAsync(ACTIVE_ACCOUNT_KEY, newAccount.id);
  await syncLegacyKeys(newAccount);
  return newAccount;
}

/**
 * Delete only the current active account.
 * If accounts remain, switches to the first remaining one.
 * If no accounts remain, clears wallet data completely.
 */
export async function deleteActiveAccount(): Promise<{ remaining: number; nextActive: WalletAccount | null }> {
  const accounts = await getAccounts();
  const current = await getActiveAccount();
  if (!current) return { remaining: 0, nextActive: null };

  const updated = accounts.filter((a) => a.id !== current.id);

  if (updated.length === 0) {
    await clearWallet();
    return { remaining: 0, nextActive: null };
  }

  const nextActive = updated[0];
  await SecureStore.setItemAsync(ACCOUNTS_KEY, JSON.stringify(updated));
  await SecureStore.setItemAsync(ACTIVE_ACCOUNT_KEY, nextActive.id);
  await syncLegacyKeys(nextActive);
  return { remaining: updated.length, nextActive };
}

// ─── Clear All ────────────────────────────────────────────────────────────────
export async function clearWallet(): Promise<void> {
  await Promise.all([
    SecureStore.deleteItemAsync(ACCOUNTS_KEY),
    SecureStore.deleteItemAsync(ACTIVE_ACCOUNT_KEY),
    SecureStore.deleteItemAsync('mnemonic'),
    SecureStore.deleteItemAsync('address'),
    SecureStore.deleteItemAsync('privateKey'),
    SecureStore.deleteItemAsync('pin'),
  ]);
}
