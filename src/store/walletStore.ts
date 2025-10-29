// store/walletStore.ts

let walletAddress: string | null = null;

export const setWalletAddress = (address: string) => {
    walletAddress = address;
};

export const getWalletAddress = (): string | null => {
    return walletAddress;
};

import { create } from 'zustand';

interface WalletStore {
    walletAddress: string | null;
    setWalletAddress: (address: string) => void;
}

export const useWalletStore = create<WalletStore>((set) => ({
    walletAddress: null,
    setWalletAddress: (address: string) => set({ walletAddress: address }),
}));