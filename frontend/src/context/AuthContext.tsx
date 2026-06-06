'use client';
import React, { createContext, useContext, useEffect, useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, setAuthToken, clearAuthToken } from '@/lib/api';

// ─── Types ───────────────────────────────────────────────────
export interface User {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  rol: 'admin' | 'gestor_calidad' | 'auditor' | 'docente' | 'estudiante' | 'egresado' | 'invitado';
  facultad?: string;
  escuela?: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<string | null>;
  hasRole: (...roles: User['rol'][]) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Provider ────────────────────────────────────────────────
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [state, setState] = useState<AuthState>({
    user: null, accessToken: null, isLoading: true, isAuthenticated: false,
  });

  // Refresh silencioso al cargar
  useEffect(() => {
    refreshToken().finally(() => setState(s => ({ ...s, isLoading: false })));
  }, []);

  const refreshToken = useCallback(async (): Promise<string | null> => {
    try {
      const { data } = await api.post('/auth/refresh', {}, { withCredentials: true });
      const token: string = data.data.accessToken;
      setAuthToken(token);
      setState(s => ({ ...s, accessToken: token, isAuthenticated: true }));

      // Obtener datos del usuario
      const me = await api.get('/auth/me');
      setState(s => ({ ...s, user: me.data.data, isAuthenticated: true }));

      return token;
    } catch {
      clearAuthToken();
      setState({ user: null, accessToken: null, isLoading: false, isAuthenticated: false });
      return null;
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { data } = await api.post('/auth/login', { email, password }, { withCredentials: true });
    const { accessToken, user } = data.data;
    setAuthToken(accessToken);
    setState({ user, accessToken, isLoading: false, isAuthenticated: true });
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout', {}, { withCredentials: true });
    } catch { /* ignorar errores en logout */ }
    clearAuthToken();
    setState({ user: null, accessToken: null, isLoading: false, isAuthenticated: false });
    router.push('/login');
  }, [router]);

  const hasRole = useCallback((...roles: User['rol'][]) => {
    return state.user ? roles.includes(state.user.rol) : false;
  }, [state.user]);

  return (
    <AuthContext.Provider value={{ ...state, login, logout, refreshToken, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
