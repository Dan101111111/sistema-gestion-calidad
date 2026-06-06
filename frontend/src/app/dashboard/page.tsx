'use client';
import React from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, KpiCard, SkeletonCard, EmptyState } from '@/components/ui';
import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '@/lib/api';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, ScatterChart, Scatter, LineChart, Line,
} from 'recharts';
import {
  FileText, Shield, AlertTriangle, MessageSquare, BarChart2,
  ClipboardCheck, TrendingUp, TrendingDown, Minus,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const COLORS = ['#003366', '#C8102E', '#F7B731', '#27AE60', '#8B5CF6', '#06B6D4'];
const NIVEL_COLORS: Record<string, string> = {
  bajo: '#27AE60', medio: '#F7B731', alto: '#FF6B00', critico: '#C8102E',
};

export default function DashboardPage() {
  const { data: kpis, isLoading: kpiLoading } = useQuery({
    queryKey: ['dashboard-kpis'],
    queryFn: () => dashboardApi.kpis().then(r => r.data.data),
    refetchInterval: 60000,
  });

  const { data: graficos, isLoading: grafLoading } = useQuery({
    queryKey: ['dashboard-graficos'],
    queryFn: () => dashboardApi.graficos().then(r => r.data.data),
  });

  const kpiCards = [
    { key: 'documentos_activos', label: 'Documentos Activos', icon: <FileText className="w-5 h-5" />, color: 'blue' },
    { key: 'capas_abiertas', label: 'CAPAs Abiertas', icon: <Shield className="w-5 h-5" />, color: 'yellow' },
    { key: 'riesgos_criticos', label: 'Riesgos Críticos', icon: <AlertTriangle className="w-5 h-5" />, color: 'red' },
    { key: 'encuestas_vigentes', label: 'Encuestas Vigentes', icon: <MessageSquare className="w-5 h-5" />, color: 'purple' },
    { key: 'indicadores_bajo_meta', label: 'Indicadores Bajo Meta', icon: <BarChart2 className="w-5 h-5" />, color: 'orange' },
    { key: 'hallazgos_abiertos', label: 'Hallazgos Abiertos', icon: <ClipboardCheck className="w-5 h-5" />, color: 'green' },
  ];

  const capaData = (graficos?.capasPorEstado || []).map((c: any) => ({
    name: c.estado?.replace('_', ' ') || c.estado,
    value: parseInt(c.cantidad),
  }));

  const indicTendencia = (graficos?.indicadoresTendencia || []).map((m: any) => ({
    periodo: m.periodo,
    cumplimiento: parseFloat(parseFloat(m.promedio_cumplimiento).toFixed(1)),
  }));

  return (
    <AppLayout title="Dashboard">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Panel de Control</h2>
            <p className="text-sm text-gray-500 mt-0.5">Resumen ejecutivo del Sistema de Gestión de la Calidad</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400">{new Date().toLocaleDateString('es-PE', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}</p>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
          {kpiCards.map(k => (
            kpiLoading ? <SkeletonCard key={k.key} /> :
            <KpiCard
              key={k.key}
              title={k.label}
              value={kpis?.[k.key] ?? 0}
              icon={k.icon}
              color={k.color}
            />
          ))}
        </div>

        {/* Charts row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Tendencia indicadores */}
          <Card>
            <CardHeader>
              <CardTitle>Tendencia de Indicadores — Cumplimiento Promedio</CardTitle>
            </CardHeader>
            <CardContent>
              {grafLoading ? <div className="skeleton h-56 rounded" /> : indicTendencia.length === 0 ? (
                <EmptyState message="Sin mediciones registradas" />
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={indicTendencia} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="periodo" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} unit="%" />
                    <Tooltip
                      formatter={(v: number) => [`${v}%`, 'Cumplimiento']}
                      contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e0e0e0' }}
                    />
                    <Bar dataKey="cumplimiento" fill="#003366" radius={[4, 4, 0, 0]}>
                      {indicTendencia.map((d: any, i: number) => (
                        <Cell key={i} fill={d.cumplimiento >= 80 ? '#27AE60' : d.cumplimiento >= 60 ? '#F7B731' : '#C8102E'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* CAPAs por estado */}
          <Card>
            <CardHeader>
              <CardTitle>CAPAs por Estado</CardTitle>
            </CardHeader>
            <CardContent>
              {grafLoading ? <div className="skeleton h-56 rounded" /> : capaData.length === 0 ? (
                <EmptyState message="Sin CAPAs registradas" />
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={capaData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ name, value }) => `${name}: ${value}`}
                      labelLine={false}
                    >
                      {capaData.map((_: any, i: number) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Charts row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Mapa de calor riesgos */}
          <Card>
            <CardHeader>
              <CardTitle>Distribución de Riesgos — Probabilidad vs Impacto</CardTitle>
            </CardHeader>
            <CardContent>
              {grafLoading ? <div className="skeleton h-48 rounded" /> : (
                <div className="grid grid-cols-5 gap-1 mt-2">
                  {[5, 4, 3, 2, 1].map(p => (
                    [1, 2, 3, 4, 5].map(i => {
                      const nivel = p * i;
                      const cell = graficos?.riesgosPorNivel?.find((r: any) => parseInt(r.probabilidad) === p && parseInt(r.impacto) === i);
                      const qty = cell ? parseInt(cell.cantidad) : 0;
                      const color = nivel >= 17 ? '#C8102E' : nivel >= 10 ? '#FF6B00' : nivel >= 5 ? '#F7B731' : '#27AE60';
                      return (
                        <div key={`${p}-${i}`}
                          title={`P:${p} × I:${i} = ${nivel} | ${qty} riesgo(s)`}
                          className="aspect-square rounded flex items-center justify-center text-white text-xs font-bold cursor-default transition-transform hover:scale-110"
                          style={{ background: color, opacity: qty > 0 ? 1 : 0.3 }}
                        >
                          {qty > 0 && qty}
                        </div>
                      );
                    })
                  ))}
                </div>
              )}
              <div className="flex items-center justify-center gap-4 mt-4 text-xs text-gray-500">
                {[['#27AE60','Bajo (1-4)'], ['#F7B731','Medio (5-9)'], ['#FF6B00','Alto (10-16)'], ['#C8102E','Crítico (17-25)']].map(([c, l]) => (
                  <div key={l} className="flex items-center gap-1"><div className="w-3 h-3 rounded-sm" style={{ background: c }} />{l}</div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Alertas recientes */}
          <Card>
            <CardHeader>
              <CardTitle>Estado Rápido del Sistema</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {kpiLoading ? (
                Array(4).fill(0).map((_, i) => <div key={i} className="skeleton h-10 rounded" />)
              ) : [
                { label: 'Documentos Aprobados', value: kpis?.documentos_activos, total: 'activos', icon: FileText, ok: true },
                { label: 'CAPAs Requieren Atención', value: kpis?.capas_abiertas, total: 'abiertas', icon: Shield, ok: (kpis?.capas_abiertas || 0) < 5 },
                { label: 'Riesgos Críticos', value: kpis?.riesgos_criticos, total: 'pendientes', icon: AlertTriangle, ok: (kpis?.riesgos_criticos || 0) === 0 },
                { label: 'Indicadores Bajo Meta (80%)', value: kpis?.indicadores_bajo_meta, total: 'bajo umbral', icon: BarChart2, ok: (kpis?.indicadores_bajo_meta || 0) === 0 },
              ].map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div key={idx} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                    <div className={cn('p-2 rounded-lg', item.ok ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600')}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{item.label}</p>
                    </div>
                    <span className={cn('text-sm font-bold', item.ok ? 'text-green-600' : 'text-red-600')}>
                      {item.value ?? 0}
                    </span>
                    {item.ok ? <TrendingUp className="w-4 h-4 text-green-500" /> : <TrendingDown className="w-4 h-4 text-red-500" />}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
