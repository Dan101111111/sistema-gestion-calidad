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
  ClipboardCheck, TrendingUp, TrendingDown, Minus, Search,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--destructive))', 'hsl(var(--warning))', 'hsl(var(--success))', 'hsl(var(--accent))', 'hsl(var(--secondary))'];
const NIVEL_COLORS: Record<string, string> = {
  bajo: 'hsl(var(--success))',
  medio: 'hsl(var(--warning))',
  alto: 'hsl(var(--destructive-light))',
  critico: 'hsl(var(--destructive))',
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

  const [searchQuery, setSearchQuery] = React.useState('');

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
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1">
            <h2 className="text-xl font-bold text-foreground tracking-tight">Panel de Control</h2>
            <p className="text-sm text-muted-foreground mt-0.5">Resumen ejecutivo del Sistema de Gestión de la Calidad</p>
          </div>
          <div className="flex items-center gap-4">
            {/* Search bar */}
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 text-sm border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all w-64"
              />
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">
                {new Date().toLocaleDateString('es-PE', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
              </p>
            </div>
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
          <Card className="hover:shadow-glow-sm transition-all duration-300">
            <CardHeader>
              <CardTitle className="tracking-tight">Tendencia de Indicadores — Cumplimiento Promedio</CardTitle>
            </CardHeader>
            <CardContent>
              {grafLoading ? (
                <div className="skeleton h-56 rounded animate-pulse" />
              ) : indicTendencia.length === 0 ? (
                <EmptyState message="Sin mediciones registradas" />
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={indicTendencia} margin={{ top: 20, right: 8, bottom: 20, left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="periodo" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} domain={[0, 100]} unit="%" axisLine={false} tickLine={false} />
                    <Tooltip
                      formatter={(v: number) => [`${v}%`, 'Cumplimiento']}
                      contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--card))' }}
                    />
                    <Bar dataKey="cumplimiento" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]}>
                      {indicTendencia.map((d: any, i: number) => (
                        <Cell key={i} fill={d.cumplimiento >= 80 ? 'hsl(var(--success))' : d.cumplimiento >= 60 ? 'hsl(var(--warning))' : 'hsl(var(--destructive))'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* CAPAs por estado */}
          <Card className="hover:shadow-glow-sm transition-all duration-300">
            <CardHeader>
              <CardTitle className="tracking-tight">CAPAs por Estado</CardTitle>
            </CardHeader>
            <CardContent>
              {grafLoading ? (
                <div className="skeleton h-56 rounded animate-pulse" />
              ) : capaData.length === 0 ? (
                <EmptyState message="Sin CAPAs registradas" />
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={capaData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="45%"
                      outerRadius={95}
                      stroke="none"
                      labelLine={false}
                      label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                        if (percent < 0.05) return null; // Ocultar si es muy pequeño
                        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                        const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
                        const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);
                        return (
                          <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight="bold">
                            {`${(percent * 100).toFixed(0)}%`}
                          </text>
                        );
                      }}
                    >
                      {capaData.map((_: any, i: number) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(val: number) => [val, 'CAPAs']}
                      contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--card))' }} 
                    />
                    <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: 12, paddingTop: '20px' }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Charts row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Mapa de calor riesgos */}
          <Card className="hover:shadow-glow-sm transition-all duration-300">
            <CardHeader>
              <CardTitle className="tracking-tight">Distribución de Riesgos — Probabilidad vs Impacto</CardTitle>
            </CardHeader>
            <CardContent>
              {grafLoading ? (
                <div className="skeleton h-48 rounded animate-pulse" />
              ) : (
                <div className="grid grid-cols-5 gap-1 mt-2">
                  {[5, 4, 3, 2, 1].map(p => (
                    [1, 2, 3, 4, 5].map(i => {
                      const nivel = p * i;
                      const cell = graficos?.riesgosPorNivel?.find((r: any) => parseInt(r.probabilidad) === p && parseInt(r.impacto) === i);
                      const qty = cell ? parseInt(cell.cantidad) : 0;
                      const color = nivel >= 17 ? NIVEL_COLORS.critico : nivel >= 10 ? NIVEL_COLORS.alto : nivel >= 5 ? NIVEL_COLORS.medio : NIVEL_COLORS.bajo;
                      return (
                        <div key={`${p}-${i}`}
                          title={`P:${p} × I:${i} = ${nivel} | ${qty} riesgo(s)`}
                          className="aspect-square rounded flex items-center justify-center text-white text-xs font-bold cursor-default transition-all duration-200 hover:scale-110 hover:-translate-y-1 hover:shadow-glow-sm"
                          style={{ background: color, opacity: qty > 0 ? 1 : 0.3 }}
                        >
                          {qty > 0 && qty}
                        </div>
                      );
                    })
                  ))}
                </div>
              )}
              <div className="flex items-center justify-center gap-4 mt-4 text-xs text-muted-foreground">
                {[
                  [NIVEL_COLORS.bajo, 'Bajo (1-4)'],
                  [NIVEL_COLORS.medio, 'Medio (5-9)'],
                  [NIVEL_COLORS.alto, 'Alto (10-16)'],
                  [NIVEL_COLORS.critico, 'Crítico (17-25)']
                ].map(([c, l]) => (
                  <div key={l} className="flex items-center gap-1"><div className="w-3 h-3 rounded-sm" style={{ background: c }} />{l}</div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Alertas recientes */}
          <Card className="hover:shadow-glow-sm transition-all duration-300">
            <CardHeader>
              <CardTitle className="tracking-tight">Estado Rápido del Sistema</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {kpiLoading ? (
                Array(4).fill(0).map((_, i) => <div key={i} className="skeleton h-10 rounded animate-pulse" />)
              ) : [
                { label: 'Documentos Aprobados', value: kpis?.documentos_activos, total: 'activos', icon: FileText, ok: true },
                { label: 'CAPAs Requieren Atención', value: kpis?.capas_abiertas, total: 'abiertas', icon: Shield, ok: (kpis?.capas_abiertas || 0) < 5 },
                { label: 'Riesgos Críticos', value: kpis?.riesgos_criticos, total: 'pendientes', icon: AlertTriangle, ok: (kpis?.riesgos_criticos || 0) === 0 },
                { label: 'Indicadores Bajo Meta (80%)', value: kpis?.indicadores_bajo_meta, total: 'bajo umbral', icon: BarChart2, ok: (kpis?.indicadores_bajo_meta || 0) === 0 },
              ].map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div key={idx} className="group flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-all duration-200 hover:-translate-y-0.5">
                    <div className={cn('p-2 rounded-lg transition-transform duration-200 group-hover:scale-110', item.ok ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive')}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{item.label}</p>
                    </div>
                    <span className={cn('text-sm font-bold tracking-tight', item.ok ? 'text-success' : 'text-destructive')}>
                      {item.value ?? 0}
                    </span>
                    {item.ok ? <TrendingUp className="w-4 h-4 text-success transition-transform duration-200 group-hover:scale-110" /> : <TrendingDown className="w-4 h-4 text-destructive transition-transform duration-200 group-hover:scale-110" />}
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
