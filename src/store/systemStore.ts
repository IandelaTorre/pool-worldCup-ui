import { create } from 'zustand';

interface SystemState {
  isWakingUp: boolean;
  setIsWakingUp: (waking: boolean) => void;
}

export const useSystemStore = create<SystemState>((set) => ({
  isWakingUp: false,
  setIsWakingUp: (waking) => set({ isWakingUp: waking }),
}));
