// ── React Imports ───────────────────────────────────────────────
import { useState, useCallback, useEffect } from 'react';

// ── useAuth hook ──────────────────────────────────────────────
export { useAuth } from '@/context/AuthContext';

// ── useNotificaciones ─────────────────────────────────────────
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificacionesApi } from '@/lib/api';
import { useToast } from '@/components/ui/ToastProvider';

export function useNotificaciones() {
  const qc = useQueryClient();

  const { data: badge } = useQuery({
    queryKey: ['notif-badge'],
    queryFn:  () => notificacionesApi.noLeidas().then(r => r.data.data),
    refetchInterval: 30000,
  });

  const marcarLeidaMut = useMutation({
    mutationFn: (id: string) => notificacionesApi.marcarLeida(id),
    onSuccess:  () => {
      qc.invalidateQueries({ queryKey: ['notif-badge'] });
      qc.invalidateQueries({ queryKey: ['notificaciones'] });
    },
  });

  const marcarTodasMut = useMutation({
    mutationFn: () => notificacionesApi.marcarTodas(),
    onSuccess:  () => {
      qc.invalidateQueries({ queryKey: ['notif-badge'] });
      qc.invalidateQueries({ queryKey: ['notificaciones'] });
    },
  });

  return {
    noLeidas:    badge?.count || 0,
    marcarLeida: marcarLeidaMut.mutate,
    marcarTodas: marcarTodasMut.mutate,
  };
}

// ── usePagination ─────────────────────────────────────────────

export function usePagination(initialLimit = 20) {
  const [page, setPage]   = useState(1);
  const [limit, setLimit] = useState(initialLimit);

  const goToPage    = useCallback((p: number) => setPage(p), []);
  const nextPage    = useCallback(() => setPage(p => p + 1), []);
  const prevPage    = useCallback(() => setPage(p => Math.max(1, p - 1)), []);
  const resetPage   = useCallback(() => setPage(1), []);

  return { page, limit, goToPage, nextPage, prevPage, resetPage, setLimit };
}

// ── useLocalStorage ───────────────────────────────────────────

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') return initialValue;
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.error(error);
    }
  };

  return [storedValue, setValue] as const;
}

// ── useDebounce ───────────────────────────────────────────────
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

// ── useDownloadPDF ────────────────────────────────────────────
import { downloadBlob } from '@/lib/utils';

export function useDownloadPDF() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const download = async (apiFn: () => Promise<any>, filename: string) => {
    setLoading(true);
    try {
      const res = await apiFn();
      downloadBlob(res.data, filename);
      toast('success', `PDF "${filename}" descargado`);
    } catch {
      toast('error', 'Error al generar el PDF. Intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  return { download, loading };
}
