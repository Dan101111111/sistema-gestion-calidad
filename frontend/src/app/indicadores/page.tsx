// ============================================================
// PÁGINA: Indicadores (/indicadores)
// ============================================================
'use client';
import React, { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, Table, Thead, Tbody, Th, Td, Tr, Button, Modal, Input, Select, Textarea, Pagination, EmptyState, SkeletonCard, ProgressBar, Badge } from '@/components/ui';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { indicadoresApi } from '@/lib/api';
import { getErrorMessage, downloadBlob, truncate, cumplimientoColor } from '@/lib/utils';
import { Plus, Download, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useToast } from '@/components/ui/ToastProvider';
import { useAuth } from '@/context/AuthContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from 'recharts';
import { cn } from '@/lib/utils';

export default function IndicadoresPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { hasRole } = useAuth();
  const canEdit = hasRole('admin', 'gestor_calidad');

  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<any>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showMedicion, setShowMedicion] = useState(false);
  const [medForm, setMedForm] = useState({ periodo: '', valor_real: '', valor_esperado: '', observaciones: '' });
  const [indForm, setIndForm] = useState({ codigo: '', nombre: '', tipo: 'eficacia', meta: '', unidad: '', frecuencia: 'mensual', formula: '' });

  const { data, isLoading } = useQuery({
    queryKey: ['indicadores', page],
    queryFn: () => indicadoresApi.listar({ page, limit: 15 }).then(r => r.data),
  });

  const { data: tendenciaData } = useQuery({
    queryKey: ['indicador-tendencia', selected?.id],
    queryFn: () => indicadoresApi.tendencias(selected.id).then(r => r.data.data),
    enabled: !!selected?.id,
  });

  const crearMut = useMutation({
    mutationFn: (d: object) => indicadoresApi.crear(d),
    onSuccess: () => { toast('success', 'Indicador creado'); qc.invalidateQueries({ queryKey: ['indicadores'] }); setShowCreate(false); },
    onError: (e) => toast('error', getErrorMessage(e)),
  });

  const medicionMut = useMutation({
    mutationFn: (d: object) => indicadoresApi.registrarMedicion(selected.id, d),
    onSuccess: () => { toast('success', 'Medición registrada'); qc.invalidateQueries({ queryKey: ['indicador-tendencia', selected.id] }); setShowMedicion(false); },
    onError: (e) => toast('error', getErrorMessage(e)),
  });

  const downloadPDF = async () => {
    try { const r = await indicadoresApi.reporte(); downloadBlob(r.data, 'indicadores.pdf'); toast('success', 'PDF generado'); }
    catch { toast('error', 'Error al generar PDF'); }
  };

  const indicadores = data?.data || [];
  const meta = data?.meta;
  const mediciones = tendenciaData?.mediciones || [];
  const analisis = tendenciaData?.analisis;

  return (
    <AppLayout title="Indicadores de Gestión">
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Indicadores de Gestión</h2>
            <p className="text-sm text-gray-500">Seguimiento y análisis de indicadores institucionales</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" icon={<Download className="w-4 h-4" />} onClick={downloadPDF}>PDF</Button>
            {canEdit && <Button size="sm" icon={<Plus className="w-4 h-4" />} onClick={() => setShowCreate(true)}>Nuevo Indicador</Button>}
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          <div className="xl:col-span-1 space-y-3">
            {isLoading ? <SkeletonCard /> : indicadores.map((ind: any) => {
              const ult = ind.mediciones?.[0];
              const cumpl = ult ? parseFloat(ult.cumplimiento) : null;
              const color = cumpl !== null ? (cumpl >= 100 ? 'green' : cumpl >= 80 ? 'yellow' : 'red') : 'blue';
              return (
                <Card key={ind.id} className={cn('cursor-pointer hover:shadow-md transition-all', selected?.id === ind.id && 'ring-2 ring-unt-primary')} onClick={() => setSelected(ind)}>
                  <CardContent className="py-3">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <span className="font-mono text-xs text-unt-primary font-bold">{ind.codigo}</span>
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200 mt-0.5">{ind.nombre}</p>
                      </div>
                      <Badge variant={cumpl === null ? 'default' : cumpl >= 80 ? 'success' : 'danger'}>
                        {cumpl !== null ? `${cumpl.toFixed(1)}%` : 'Sin datos'}
                      </Badge>
                    </div>
                    {cumpl !== null && <ProgressBar value={Math.min(100, cumpl)} color={color} />}
                    <p className="text-xs text-gray-400 mt-1.5">Meta: {ind.meta} {ind.unidad} | {ind.frecuencia}</p>
                  </CardContent>
                </Card>
              );
            })}
            {meta && <Pagination page={meta.page} pages={meta.pages} total={meta.total} onPage={setPage} />}
          </div>

          <div className="xl:col-span-2">
            {!selected ? (
              <Card className="min-h-[400px] flex items-center justify-center">
                <EmptyState message="Seleccione un indicador" description="Haga clic en un indicador para ver la evolución" />
              </Card>
            ) : (
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>{tendenciaData?.indicador?.nombre || selected.nombre}</CardTitle>
                      <div className="flex items-center gap-2">
                        {analisis?.tendencia === 'creciente' && <TrendingUp className="w-5 h-5 text-green-500" />}
                        {analisis?.tendencia === 'decreciente' && <TrendingDown className="w-5 h-5 text-red-500" />}
                        {analisis?.tendencia === 'estable' && <Minus className="w-5 h-5 text-yellow-500" />}
                        {canEdit && <Button size="sm" icon={<Plus className="w-4 h-4" />} onClick={() => setShowMedicion(true)}>Medición</Button>}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {mediciones.length === 0 ? (
                      <EmptyState message="Sin mediciones" description="Registre la primera medición" />
                    ) : (
                      <ResponsiveContainer width="100%" height={260}>
                        <BarChart data={mediciones} margin={{ top: 4, right: 8, bottom: 0, left: -15 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis dataKey="periodo" tick={{ fontSize: 11 }} />
                          <YAxis tick={{ fontSize: 11 }} unit="%" domain={[0, Math.max(120, ...mediciones.map((m: any) => parseFloat(m.cumplimiento || 0) + 10))]} />
                          <Tooltip formatter={(v: number) => [`${v}%`, 'Cumplimiento']} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                          <ReferenceLine y={80} stroke="#F7B731" strokeDasharray="4 4" label={{ value: 'Meta mín. 80%', fontSize: 10, fill: '#F7B731' }} />
                          <Bar dataKey="cumplimiento" radius={[4, 4, 0, 0]}>
                            {mediciones.map((m: any, i: number) => (
                              <Cell key={i} fill={parseFloat(m.cumplimiento) >= 80 ? '#27AE60' : parseFloat(m.cumplimiento) >= 60 ? '#F7B731' : '#C8102E'} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                    {analisis && (
                      <div className="grid grid-cols-3 gap-3 mt-4 text-center">
                        <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <p className="text-xs text-gray-500">Tendencia</p>
                          <p className="font-bold capitalize text-gray-800 dark:text-gray-200">{analisis.tendencia}</p>
                        </div>
                        <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <p className="text-xs text-gray-500">Promedio</p>
                          <p className="font-bold text-gray-800 dark:text-gray-200">{analisis.promedio}%</p>
                        </div>
                        <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <p className="text-xs text-gray-500">Mediciones</p>
                          <p className="font-bold text-gray-800 dark:text-gray-200">{analisis.totalMediciones}</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Nuevo Indicador" size="md">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Código*" placeholder="IND-001" value={indForm.codigo} onChange={e => setIndForm(f => ({ ...f, codigo: e.target.value }))} />
            <Select label="Tipo" value={indForm.tipo} onChange={e => setIndForm(f => ({ ...f, tipo: e.target.value }))}>
              {['eficacia','eficiencia','impacto','satisfaccion','cobertura'].map(t => <option key={t} value={t}>{t}</option>)}
            </Select>
          </div>
          <Input label="Nombre*" value={indForm.nombre} onChange={e => setIndForm(f => ({ ...f, nombre: e.target.value }))} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Meta*" type="number" value={indForm.meta} onChange={e => setIndForm(f => ({ ...f, meta: e.target.value }))} />
            <Input label="Unidad" placeholder="%, puntos, etc." value={indForm.unidad} onChange={e => setIndForm(f => ({ ...f, unidad: e.target.value }))} />
          </div>
          <Select label="Frecuencia" value={indForm.frecuencia} onChange={e => setIndForm(f => ({ ...f, frecuencia: e.target.value }))}>
            {['diario','semanal','mensual','trimestral','semestral','anual'].map(f => <option key={f} value={f}>{f}</option>)}
          </Select>
          <Textarea label="Fórmula de cálculo" placeholder="Describe cómo se calcula..." value={indForm.formula} onChange={e => setIndForm(f => ({ ...f, formula: e.target.value }))} />
          <div className="flex justify-end pt-2"><Button onClick={() => crearMut.mutate(indForm)} loading={crearMut.isPending}>Crear Indicador</Button></div>
        </div>
      </Modal>

      <Modal open={showMedicion} onClose={() => setShowMedicion(false)} title="Registrar Medición" size="sm">
        <div className="space-y-4">
          <Input label="Período*" placeholder="2024-I, 2024-T1, Ene-2024..." value={medForm.periodo} onChange={e => setMedForm(f => ({ ...f, periodo: e.target.value }))} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Valor Real*" type="number" value={medForm.valor_real} onChange={e => setMedForm(f => ({ ...f, valor_real: e.target.value }))} />
            <Input label="Valor Esperado" type="number" placeholder={selected?.meta} value={medForm.valor_esperado} onChange={e => setMedForm(f => ({ ...f, valor_esperado: e.target.value }))} />
          </div>
          <Textarea label="Observaciones" value={medForm.observaciones} onChange={e => setMedForm(f => ({ ...f, observaciones: e.target.value }))} />
          <div className="flex justify-end pt-2"><Button onClick={() => medicionMut.mutate(medForm)} loading={medicionMut.isPending}>Registrar</Button></div>
        </div>
      </Modal>
    </AppLayout>
  );
}
