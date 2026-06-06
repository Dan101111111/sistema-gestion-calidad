import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ── Auth Store ────────────────────────────────────────────────
interface AuthStore {
  accessToken: string | null;
  setAccessToken: (token: string | null) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      accessToken: null,
      setAccessToken: (token) => set({ accessToken: token }),
      clearAuth: () => set({ accessToken: null }),
    }),
    {
      name: 'sgc-auth',
      partialize: (state) => ({ accessToken: state.accessToken }),
    }
  )
);

// ── Notificaciones Store ──────────────────────────────────────
interface NotifStore {
  noLeidas: number;
  setNoLeidas: (n: number) => void;
  decrementar: () => void;
  reset: () => void;
}

export const useNotifStore = create<NotifStore>((set) => ({
  noLeidas: 0,
  setNoLeidas: (n) => set({ noLeidas: n }),
  decrementar: () => set((s) => ({ noLeidas: Math.max(0, s.noLeidas - 1) })),
  reset: () => set({ noLeidas: 0 }),
}));

// ── UI Store (tema, sidebar) ──────────────────────────────────
interface UIStore {
  sidebarCollapsed: boolean;
  darkMode: boolean;
  toggleSidebar: () => void;
  toggleDarkMode: () => void;
  setSidebarCollapsed: (v: boolean) => void;
}

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      darkMode: false,
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      toggleDarkMode: () => set((s) => ({ darkMode: !s.darkMode })),
      setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),
    }),
    { name: 'sgc-ui' }
  )
);

// ── Filtros globales (periodo, facultad) ──────────────────────
interface FiltrosStore {
  periodoActivo: string;
  facultadActiva: string;
  setPeriodo: (p: string) => void;
  setFacultad: (f: string) => void;
  reset: () => void;
}

export const useFiltrosStore = create<FiltrosStore>((set) => ({
  periodoActivo: '',
  facultadActiva: '',
  setPeriodo: (p) => set({ periodoActivo: p }),
  setFacultad: (f) => set({ facultadActiva: f }),
  reset: () => set({ periodoActivo: '', facultadActiva: '' }),
}));
