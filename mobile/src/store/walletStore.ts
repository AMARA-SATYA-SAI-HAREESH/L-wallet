// mobile/src/store/walletStore.ts
import { create } from 'zustand';
import {
  WalletAccount,
  getAccounts,
  getActiveAccount,
  setActiveAccountId,
  deleteActiveAccount,
} from '../services/storageService';

export type NetworkType = 'mainnet' | 'testnet';

interface WalletState {
  address: string | null;
  isUnlocked: boolean;
  network: NetworkType;
  accounts: WalletAccount[];
  activeAccount: WalletAccount | null;
  setAddress: (address: string) => void;
  setUnlocked: (val: boolean) => void;
  setNetwork: (network: NetworkType) => void;
  toggleNetwork: () => void;
  loadAccounts: () => Promise<void>;
  switchAccount: (id: string) => Promise<void>;
  deleteCurrentAccount: () => Promise<number>;
  reset: () => void;
}

export const useWalletStore = create<WalletState>((set) => ({
  address: null,
  isUnlocked: false,
  network: 'mainnet',
  accounts: [],
  activeAccount: null,
  setAddress: (address) => set({ address }),
  setUnlocked: (val) => set({ isUnlocked: val }),
  setNetwork: (network) => set({ network }),
  toggleNetwork: () =>
    set((state) => ({ network: state.network === 'mainnet' ? 'testnet' : 'mainnet' })),
  loadAccounts: async () => {
    const [accounts, active] = await Promise.all([getAccounts(), getActiveAccount()]);
    set({
      accounts,
      activeAccount: active,
      address: active?.address ?? null,
    });
  },
  switchAccount: async (id: string) => {
    const active = await setActiveAccountId(id);
    if (active) {
      const accounts = await getAccounts();
      set({
        accounts,
        activeAccount: active,
        address: active.address,
      });
    }
  },
  deleteCurrentAccount: async () => {
    const result = await deleteActiveAccount();
    if (result.remaining === 0) {
      set({ accounts: [], activeAccount: null, address: null, isUnlocked: false });
      return 0;
    }
    const accounts = await getAccounts();
    set({
      accounts,
      activeAccount: result.nextActive,
      address: result.nextActive?.address ?? null,
    });
    return result.remaining;
  },
  reset: () => set({ address: null, isUnlocked: false, accounts: [], activeAccount: null }),
}));
