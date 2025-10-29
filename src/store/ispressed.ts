// isPressed.ts
import { create } from 'zustand';

interface PressedStore {
  pressed: 0 | 1;
  setPressedToOne: () => void;
  setPressedToZero: () => void;
}

export const usePressedStore = create<PressedStore>((set) => ({
  pressed: 0,
  setPressedToOne: () => set({ pressed: 1 }),
  setPressedToZero: () => set({ pressed: 0 }),
}));