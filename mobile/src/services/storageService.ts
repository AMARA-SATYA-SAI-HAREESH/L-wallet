// mobile/src/services/storageService.ts
import * as SecureStore from 'expo-secure-store';

// ─── Mnemonic ───────────────────────────────────────────────────────────────
export async function storeMnemonic(mnemonic: string): Promise<void> {
  await SecureStore.setItemAsync('mnemonic', mnemonic);
}
export async function getMnemonic(): Promise<string | null> {
  return SecureStore.getItemAsync('mnemonic');
}

// ─── Address ────────────────────────────────────────────────────────────────
export async function storeAddress(address: string): Promise<void> {
  await SecureStore.setItemAsync('address', address);
}
export async function getAddress(): Promise<string | null> {
  return SecureStore.getItemAsync('address');
}

// ─── Private Key ────────────────────────────────────────────────────────────
export async function storePrivateKey(privateKey: string): Promise<void> {
  await SecureStore.setItemAsync('privateKey', privateKey);
}
export async function getPrivateKey(): Promise<string | null> {
  return SecureStore.getItemAsync('privateKey');
}

// ─── PIN ─────────────────────────────────────────────────────────────────────
export async function storePin(pin: string): Promise<void> {
  await SecureStore.setItemAsync('pin', pin);
}
export async function getPin(): Promise<string | null> {
  return SecureStore.getItemAsync('pin');
}

// ─── Clear All ──────────────────────────────────────────────────────────────
export async function clearWallet(): Promise<void> {
  await Promise.all([
    SecureStore.deleteItemAsync('mnemonic'),
    SecureStore.deleteItemAsync('address'),
    SecureStore.deleteItemAsync('privateKey'),
    SecureStore.deleteItemAsync('pin'),
  ]);
}
