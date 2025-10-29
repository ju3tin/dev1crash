// store/walletStore.ts
import { create } from 'zustand';

interface WalletState {
  walletAddress: string | null;
  setWalletAddress: (address: string | null) => void;
}

export const useWalletStore = create<WalletState>((set) => ({
  walletAddress: null,
  setWalletAddress: (address: string | null) => set({ walletAddress: address }),
}));