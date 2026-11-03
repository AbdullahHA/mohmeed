import { create } from 'zustand';

type Toast = { message: string; action?: { label: string; onPress: () => void } } | null;

export const useUI = create<{
  toast: Toast;
  showToast: (message: string, action?: { label: string; onPress: () => void }) => void;
  hideToast: () => void;
}>((set) => ({
  toast: null,
  showToast: (message, action) => set({ toast: { message, action } }),
  hideToast: () => set({ toast: null }),
}));

export const toast = (message: string, action?: { label: string; onPress: () => void }) => useUI.getState().showToast(message, action);
