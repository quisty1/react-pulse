import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UiState {
  sidebarOpen: boolean;
  threadMessageId: string | null;
  locale: 'en' | 'ru';
  setSidebarOpen: (open: boolean) => void;
  setThreadMessageId: (id: string | null) => void;
  setLocale: (locale: 'en' | 'ru') => void;
}

/** UI-состояние: сайдбар, открытый тред, локаль (persist в localStorage) */
export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      sidebarOpen: false,
      threadMessageId: null,
      locale: 'en',
      setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
      setThreadMessageId: (threadMessageId) => set({ threadMessageId }),
      setLocale: (locale) => set({ locale }),
    }),
    { name: 'pulse-ui' },
  ),
);
