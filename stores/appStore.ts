import { create } from 'zustand';

interface AppState {
  selectedMonth: number;
  selectedYear: number;
  setMonth: (month: number, year: number) => void;
  goToNextMonth: () => void;
  goToPrevMonth: () => void;
  goToCurrentMonth: () => void;
}

export const useAppStore = create<AppState>((set, get) => {
  const now = new Date();
  
  return {
    selectedMonth: now.getMonth() + 1,
    selectedYear: now.getFullYear(),
    
    setMonth: (month: number, year: number) => {
      set({ selectedMonth: month, selectedYear: year });
    },
    
    goToNextMonth: () => {
      const { selectedMonth, selectedYear } = get();
      
      if (selectedMonth === 12) {
        set({ selectedMonth: 1, selectedYear: selectedYear + 1 });
      } else {
        set({ selectedMonth: selectedMonth + 1 });
      }
    },
    
    goToPrevMonth: () => {
      const { selectedMonth, selectedYear } = get();
      
      if (selectedMonth === 1) {
        set({ selectedMonth: 12, selectedYear: selectedYear - 1 });
      } else {
        set({ selectedMonth: selectedMonth - 1 });
      }
    },
    
    goToCurrentMonth: () => {
      const now = new Date();
      set({
        selectedMonth: now.getMonth() + 1,
        selectedYear: now.getFullYear(),
      });
    },
  };
});
