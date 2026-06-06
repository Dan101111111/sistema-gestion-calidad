'use client';
import React, { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, Button, Badge, EmptyState } from '@/components/ui';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificacionesApi } from '@/lib/api';
import { fromNow } from '@/lib/utils';
import { Bell, Check, CheckCheck, AlertTriangle, Info, Clock, Star } from 'lucide-react';
import { useToast } from '@/components/ui/ToastProvider';
import { cn } from '@/lib/utils';

const TIPO_ICONS: Record<string, { icon: React.ElementType; color: string }> = {
  alerta: { icon: AlertTriangle, color: 'text-red-500' },
  recordatorio: { icon: Clock, color: 'text-yellow-500' },
  info: { icon: Info, color: 'text-blue-500' },
  aprobacion_pendiente: { icon: Star, color: 'text-purple-500' },
  error: { icon: AlertTriangle, color: 'text-red-600' },
};

export default function NotificacionesPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [filtro, setFiltro] = useState<'todos' | 'no_leidas' | string>('todos');
  const [tipo, setTipo] = useState('');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['notificaciones', filtro, tipo],
    queryFn: () => notificacionesApi.listar({
      limit: 50,
      ...(filtro === 'no_leidas' ? { leida: 'false' } : {}),
      ...(tipo ? { tipo } : {}),
    }).then(r => r.data),
  });

  const marcarLeidaMut = useMutation({
    mutationFn: (id: string) => notificacionesApi.marcarLeida(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['notificaciones'] }); qc.invalidateQueries({ queryKey: ['notif-badge'] }); },
  });

  const marcarTodasMut = useMutation({
    mutationFn: () => notificacionesApi.marcarTodas(),
    onSuccess: () => { toast('success', 'Todas marcadas como leídas'); qc.invalidateQueries({ queryKey: ['notificaciones'] }); qc.invalidateQueries({ queryKey: ['notif-badge'] }); },
  });

  const notifs = data?.data || [];
  const noLeidas = data?.meta?.no_leidas || 0;

  return (
    <AppLayout title="Notificaciones">
      <div className="max-w-3xl mx-auto space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Centro de Notificaciones</h2>
            {noLeidas > 0 && <p className="text-sm text-gray-500">{noLeidas} sin leer</p>}
          </div>
          {noLeidas > 0 && (
            <Button variant="outline" size="sm" icon={<CheckCheck className="w-4 h-4" />} onClick={() => marcarTodasMut.mutate()} loading={marcarTodasMut.isPending}>
              Marcar todas como leídas
            </Button>
          )}
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap gap-2">
          {[
            { key: 'todos', label: 'Todas' },
            { key: 'no_leidas', label: 'Sin leer' },
          ].map(f => (
            <button key={f.key} onClick={() => setFiltro(f.key)}
              className={cn('px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
                filtro === f.key ? 'bg-unt-primary text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200')}>
              {f.label}
            </button>
          ))}
          <select
            value={tipo}
            onChange={e => setTipo(e.target.value)}
            className="px-3 py-1.5 rounded-lg text-sm bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 outline-none"
          >
            <option value="">Todos los tipos</option>
            <option value="alerta">Alertas</option>
            <option value="recordatorio">Recordatorios</option>
            <option value="info">Información</option>
            <option value="aprobacion_pendiente">Aprobaciones</option>
          </select>
        </div>

        {/* Lista */}
        {isLoading ? (
          <div className="space-y-2">
            {Array(5).fill(0).map((_, i) => <div key={i} className="skeleton h-16 rounded-xl" />)}
          </div>
        ) : notifs.length === 0 ? (
          <EmptyState
            message="Sin notificaciones"
            description={filtro === 'no_leidas' ? 'No tiene notificaciones sin leer' : 'Su bandeja está vacía'}
          />
        ) : (
          <div className="space-y-2">
            {notifs.map((n: any) => {
              const tipoConfig = TIPO_ICONS[n.tipo] || TIPO_ICONS.info;
              const Icon = tipoConfig.icon;
              return (
                <Card key={n.id} className={cn('transition-all hover:shadow-md', !n.leida && 'border-l-4 border-l-unt-primary')}>
                  <CardContent className="py-3">
                    <div className="flex items-start gap-3">
                      <div className={cn('p-2 rounded-lg flex-shrink-0', !n.leida ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-gray-50 dark:bg-gray-800')}>
                        <Icon className={cn('w-4 h-4', tipoConfig.color)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className={cn('text-sm font-medium', !n.leida ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300')}>
                              {n.titulo}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.mensaje}</p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {n.modulo && (
                              <Badge variant="default" className="text-xs capitalize">{n.modulo}</Badge>
                            )}
                            {!n.leida && (
                              <button
                                onClick={() => marcarLeidaMut.mutate(n.id)}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-unt-primary hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                                title="Marcar como leída"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                        <p className="text-xs text-gray-400 mt-1.5">{fromNow(n.creado_en)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
