// mobile/src/store/walletStore.ts
import { create } from 'zustand';

interface WalletState {
  address: string | null;
  isUnlocked: boolean;
  setAddress: (address: string) => void;
  setUnlocked: (val: boolean) => void;
  reset: () => void;
}

export const useWalletStore = create<WalletState>((set) => ({
  address: null,
  isUnlocked: false,
  setAddress: (address) => set({ address }),
  setUnlocked: (val) => set({ isUnlocked: val }),
  reset: () => set({ address: null, isUnlocked: false }),
}));
