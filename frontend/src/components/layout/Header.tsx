'use client';
import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Bell, User, LogOut, Moon, Sun, ChevronDown, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { busquedaApi, notificacionesApi, apiHelpers } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface SearchResult {
  tipo: string; id: string; titulo: string; subtitulo?: string; estado?: string; url: string;
}

export function Header({ title }: { title?: string }) {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [darkMode, setDarkMode] = useState(false);
  const [searchQ, setSearchQ] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showNotif, setShowNotif] = useState(false);
  const [showUser, setShowUser] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchTimeout = useRef<NodeJS.Timeout>();

  // Badge de notificaciones
  const { data: notifData, refetch: refetchNotif } = useQuery({
    queryKey: ['notif-badge'],
    queryFn: () => notificacionesApi.noLeidas().then(r => r.data.data),
    refetchInterval: 30000,
  });
  const noLeidas = notifData?.count || 0;

  // Notificaciones recientes
  const { data: notifList } = useQuery({
    queryKey: ['notif-list', showNotif],
    queryFn: () => notificacionesApi.listar({ limit: 5 }).then(r => r.data.data),
    enabled: showNotif,
  });

  // Dark mode
  useEffect(() => {
    const stored = localStorage.getItem('theme');
    if (stored === 'dark') { document.documentElement.classList.add('dark'); setDarkMode(true); }
  }, []);
  const toggleDark = () => {
    const next = !darkMode;
    setDarkMode(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
  };

  // Búsqueda con debounce
  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (searchQ.length < 2) { setSearchResults([]); return; }

    setSearchLoading(true);
    searchTimeout.current = setTimeout(async () => {
      try {
        const res = await busquedaApi.buscar(searchQ);
        setSearchResults(res.data.data || []);
      } catch { setSearchResults([]); }
      finally { setSearchLoading(false); }
    }, 350);
  }, [searchQ]);

  // Cerrar dropdowns al click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearch(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const TIPO_COLORS: Record<string, string> = {
    documento: 'bg-blue-100 text-blue-700',
    proceso: 'bg-green-100 text-green-700',
    riesgo: 'bg-red-100 text-red-700',
    capa: 'bg-yellow-100 text-yellow-700',
    hallazgo: 'bg-purple-100 text-purple-700',
  };

  return (
    <header className="h-14 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center px-4 gap-4 sticky top-0 z-30">
      {/* Title */}
      {title && (
        <h1 className="hidden md:block text-base font-semibold text-gray-800 dark:text-gray-200 ml-10 lg:ml-0">
          {title}
        </h1>
      )}

      {/* Search */}
      <div ref={searchRef} className="flex-1 max-w-xl relative ml-10 lg:ml-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar documentos, procesos, riesgos..."
            value={searchQ}
            onChange={e => { setSearchQ(e.target.value); setShowSearch(true); }}
            onFocus={() => setShowSearch(true)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-gray-100 dark:bg-gray-800 border border-transparent focus:border-unt-primary focus:bg-white dark:focus:bg-gray-700 rounded-lg outline-none transition-all"
          />
          {searchQ && (
            <button onClick={() => { setSearchQ(''); setSearchResults([]); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Resultados */}
        {showSearch && searchQ.length >= 2 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-50 overflow-hidden animate-fade-in">
            {searchLoading ? (
              <div className="p-4 text-sm text-gray-500 text-center">Buscando...</div>
            ) : searchResults.length === 0 ? (
              <div className="p-4 text-sm text-gray-500 text-center">Sin resultados para "{searchQ}"</div>
            ) : (
              <ul className="max-h-80 overflow-y-auto">
                {searchResults.map((r, i) => (
                  <li key={i}>
                    <Link
                      href={r.url}
                      onClick={() => { setShowSearch(false); setSearchQ(''); }}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', TIPO_COLORS[r.tipo] || 'bg-gray-100 text-gray-600')}>
                        {r.tipo}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{r.titulo}</p>
                        {r.subtitulo && <p className="text-xs text-gray-500 truncate">{r.subtitulo}</p>}
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 ml-auto">
        {/* Dark mode */}
        <button onClick={toggleDark} className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
          {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Notificaciones */}
        <div className="relative">
          <button
            onClick={() => { setShowNotif(!showNotif); setShowUser(false); }}
            className="relative p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <Bell className="w-4 h-4" />
            {noLeidas > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                {noLeidas > 9 ? '9+' : noLeidas}
              </span>
            )}
          </button>
          {showNotif && (
            <div className="absolute right-0 top-full mt-1 w-80 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-50 animate-fade-in overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b dark:border-gray-700">
                <span className="font-semibold text-sm dark:text-white">Notificaciones</span>
                <Link href="/notificaciones" onClick={() => setShowNotif(false)} className="text-xs text-unt-primary hover:underline">Ver todas</Link>
              </div>
              {notifList?.length === 0 ? (
                <p className="p-4 text-sm text-gray-500 text-center">Sin notificaciones</p>
              ) : (
                <ul>
                  {(notifList as any[] || []).slice(0, 5).map((n: any) => (
                    <li key={n.id} className={cn('px-4 py-3 border-b dark:border-gray-800 last:border-0', !n.leida && 'bg-blue-50 dark:bg-blue-900/10')}>
                      <p className="text-sm font-medium dark:text-white">{n.titulo}</p>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.mensaje}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => { setShowUser(!showUser); setShowNotif(false); }}
            className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-unt-primary text-white flex items-center justify-center text-xs font-bold">
              {user?.nombre?.[0]}{user?.apellido?.[0]}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-medium text-gray-800 dark:text-gray-200">{user?.nombre}</p>
              <p className="text-xs text-gray-500 capitalize">{user?.rol?.replace('_', ' ')}</p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
          </button>
          {showUser && (
            <div className="absolute right-0 top-full mt-1 w-52 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-50 overflow-hidden animate-fade-in">
              <div className="px-4 py-3 border-b dark:border-gray-700">
                <p className="text-sm font-semibold dark:text-white">{user?.nombre} {user?.apellido}</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
              <Link href="/perfil" onClick={() => setShowUser(false)}
                className="flex items-center gap-2 w-full px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 border-b dark:border-gray-700 transition-colors">
                <User className="w-4 h-4" />
                Mi Perfil
              </Link>
              <button onClick={() => { setShowUser(false); logout(); }}
                className="flex items-center gap-2 w-full px-4 py-3 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                <LogOut className="w-4 h-4" />
                Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
