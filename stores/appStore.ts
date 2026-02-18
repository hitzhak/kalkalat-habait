import { create } from 'zustand';

interface AppState {
  selectedMonth: number;
  selectedYear: number;
  setMonth: (month: number, year: number) => void;
}

const now = new Date();

export const useAppStore = create<AppState>((set) => ({
  selectedMonth: now.getMonth() + 1,
  selectedYear: now.getFullYear(),

  setMonth: (month: number, year: number) => {
    set({ selectedMonth: month, selectedYear: year });
  },
}));
