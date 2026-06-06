'use client';
import React, { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import {
  Card, CardContent, CardHeader, CardTitle,
  Table, Thead, Tbody, Th, Td, Tr,
  Button, Badge, Modal, Input, Select, Textarea,
  EmptyState, SkeletonCard, ProgressBar,
} from '@/components/ui';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { acreditacionApi } from '@/lib/api';
import { formatDate, getErrorMessage, downloadBlob } from '@/lib/utils';
import { Plus, Download, Award, ChevronDown, ChevronRight } from 'lucide-react';
import { useToast } from '@/components/ui/ToastProvider';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts';

type AcredTab = 'estandares' | 'autoevaluaciones' | 'comparativa';

export default function AcreditacionPage() {
  const [tab, setTab] = useState<AcredTab>('estandares');

  return (
    <AppLayout title="Acreditación">
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Acreditación y Autoevaluación</h2>
            <p className="text-sm text-gray-500">Gestión de estándares ISO 21001 y SUNEDU</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl w-fit">
          {([
            { key: 'estandares', label: 'Estándares' },
            { key: 'autoevaluaciones', label: 'Autoevaluaciones' },
            { key: 'comparativa', label: 'Comparativa' },
          ] as { key: AcredTab; label: string }[]).map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={cn('px-4 py-1.5 rounded-lg text-sm font-medium transition-all',
                tab === t.key ? 'bg-white dark:bg-gray-900 text-unt-primary shadow-sm' : 'text-gray-500 hover:text-gray-700')}>
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'estandares' && <EstandaresTab />}
        {tab === 'autoevaluaciones' && <AutoevaluacionesTab />}
        {tab === 'comparativa' && <ComparativaTab />}
      </div>
    </AppLayout>
  );
}

// ── Tab Estándares ─────────────────────────────────────────────
function EstandaresTab() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { hasRole } = useAuth();
  const canEdit = hasRole('admin', 'gestor_calidad');
  const [expandidos, setExpandidos] = useState<Record<string, boolean>>({});
  const [showCreate, setShowCreate] = useState(false);
  const [showFactor, setShowFactor] = useState<string | null>(null);

  const { data: estandares, isLoading } = useQuery({
    queryKey: ['estandares'],
    queryFn: () => acreditacionApi.listarEstandares().then(r => r.data.data),
  });

  const crearEstandarMut = useMutation({
    mutationFn: (d: object) => acreditacionApi.crearEstandar(d),
    onSuccess: () => { toast('success', 'Estándar creado'); qc.invalidateQueries({ queryKey: ['estandares'] }); setShowCreate(false); },
    onError: (e) => toast('error', getErrorMessage(e)),
  });

  const crearFactorMut = useMutation({
    mutationFn: (d: object) => acreditacionApi.crearFactor(d),
    onSuccess: () => { toast('success', 'Factor creado'); qc.invalidateQueries({ queryKey: ['estandares'] }); setShowFactor(null); },
    onError: (e) => toast('error', getErrorMessage(e)),
  });

  const toggle = (id: string) => setExpandidos(e => ({ ...e, [id]: !e[id] }));

  return (
    <div className="space-y-4">
      {canEdit && (
        <div className="flex justify-end">
          <Button size="sm" icon={<Plus className="w-4 h-4" />} onClick={() => setShowCreate(true)}>
            Nuevo Estándar
          </Button>
        </div>
      )}

      {isLoading ? <SkeletonCard /> : (estandares || []).map((est: any) => (
        <Card key={est.id}>
          <div
            className="flex items-center gap-3 px-5 py-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
            onClick={() => toggle(est.id)}
          >
            {expandidos[est.id]
              ? <ChevronDown className="w-4 h-4 text-gray-400" />
              : <ChevronRight className="w-4 h-4 text-gray-400" />}
            <Award className="w-5 h-5 text-unt-primary" />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-gray-800 dark:text-gray-200">{est.codigo}</span>
                <Badge variant={est.tipo === 'ISO_21001' ? 'primary' : est.tipo === 'SUNEDU' ? 'danger' : 'default'}>
                  {est.tipo}
                </Badge>
              </div>
              <p className="text-sm text-gray-500 mt-0.5">{est.nombre}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400">{est.factores?.length || 0} factores</p>
              <p className="text-xs text-gray-400">
                Total: {(est.factores || []).reduce((a: number, f: any) => a + parseFloat(f.peso_porcentual || 0), 0).toFixed(0)}%
              </p>
            </div>
          </div>

          {expandidos[est.id] && (
            <div className="border-t dark:border-gray-800">
              {(est.factores || []).length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">Sin factores registrados</p>
              ) : (
                <Table>
                  <Thead>
                    <tr>
                      <Th>Código</Th><Th>Factor / Criterio</Th><Th className="text-center">Peso %</Th><Th>Sub-criterios</Th>
                    </tr>
                  </Thead>
                  <Tbody>
                    {(est.factores || []).map((f: any) => (
                      <Tr key={f.id}>
                        <Td><span className="font-mono text-xs font-bold">{f.codigo}</span></Td>
                        <Td>
                          <p className="font-medium text-sm text-gray-800 dark:text-gray-200">{f.nombre}</p>
                          {f.descripcion && <p className="text-xs text-gray-500 mt-0.5">{f.descripcion}</p>}
                        </Td>
                        <Td className="text-center">
                          <div className="flex items-center gap-2 justify-center">
                            <span className="font-bold text-unt-primary">{f.peso_porcentual}%</span>
                          </div>
                        </Td>
                        <Td>
                          <span className="text-xs text-gray-500">{f.hijos?.length || 0} sub-criterios</span>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              )}
              {canEdit && (
                <div className="px-5 py-3 border-t dark:border-gray-800">
                  <Button
                    variant="outline" size="sm"
                    icon={<Plus className="w-3.5 h-3.5" />}
                    onClick={() => setShowFactor(est.id)}
                  >
                    Agregar Factor
                  </Button>
                </div>
              )}
            </div>
          )}
        </Card>
      ))}

      {/* Modal crear estándar */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Nuevo Estándar" size="md">
        <EstandarForm onSubmit={crearEstandarMut.mutate} loading={crearEstandarMut.isPending} />
      </Modal>

      {/* Modal crear factor */}
      <Modal open={!!showFactor} onClose={() => setShowFactor(null)} title="Nuevo Factor / Criterio" size="md">
        <FactorForm estandarId={showFactor!} onSubmit={crearFactorMut.mutate} loading={crearFactorMut.isPending} />
      </Modal>
    </div>
  );
}

function EstandarForm({ onSubmit, loading }: { onSubmit: (d: any) => void; loading: boolean }) {
  const [form, setForm] = useState({ codigo: '', nombre: '', descripcion: '', tipo: 'ISO_21001' });
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Input label="Código*" placeholder="ISO-21001" value={form.codigo} onChange={e => setForm(f => ({ ...f, codigo: e.target.value }))} />
        <Select label="Tipo" value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}>
          <option value="ISO_21001">ISO 21001</option>
          <option value="SUNEDU">SUNEDU</option>
          <option value="SINEACE">SINEACE</option>
          <option value="ABET">ABET</option>
          <option value="OTRO">Otro</option>
        </Select>
      </div>
      <Input label="Nombre*" value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} />
      <Textarea label="Descripción" value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))} />
      <div className="flex justify-end pt-2">
        <Button onClick={() => onSubmit(form)} loading={loading}>Crear Estándar</Button>
      </div>
    </div>
  );
}

function FactorForm({ estandarId, onSubmit, loading }: { estandarId: string; onSubmit: (d: any) => void; loading: boolean }) {
  const [form, setForm] = useState({ codigo: '', nombre: '', descripcion: '', peso_porcentual: '', nivel: '1' });
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Input label="Código*" placeholder="4.1" value={form.codigo} onChange={e => setForm(f => ({ ...f, codigo: e.target.value }))} />
        <Input label="Peso (%)*" type="number" min="0" max="100" placeholder="15" value={form.peso_porcentual} onChange={e => setForm(f => ({ ...f, peso_porcentual: e.target.value }))} />
      </div>
      <Input label="Nombre*" value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} />
      <Textarea label="Descripción" value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))} />
      <div className="flex justify-end pt-2">
        <Button onClick={() => onSubmit({ ...form, estandar_id: estandarId })} loading={loading}>Crear Factor</Button>
      </div>
    </div>
  );
}

// ── Tab Autoevaluaciones ──────────────────────────────────────
function AutoevaluacionesTab() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { hasRole } = useAuth();
  const canEdit = hasRole('admin', 'gestor_calidad');
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [evalForm, setEvalForm] = useState({ factor_id: '', puntaje: '', nivel_cumplimiento: 'no_cumple', evidencias: '', observaciones: '' });

  const { data, isLoading } = useQuery({
    queryKey: ['autoevaluaciones', page],
    queryFn: () => acreditacionApi.listarAutoevaluaciones({ page, limit: 10 }).then(r => r.data),
  });

  const { data: estandares } = useQuery({
    queryKey: ['estandares'],
    queryFn: () => acreditacionApi.listarEstandares().then(r => r.data.data),
  });

  const crearMut = useMutation({
    mutationFn: (d: object) => acreditacionApi.crearAutoevaluacion(d),
    onSuccess: () => { toast('success', 'Autoevaluación creada'); qc.invalidateQueries({ queryKey: ['autoevaluaciones'] }); setShowCreate(false); },
    onError: (e) => toast('error', getErrorMessage(e)),
  });

  const evalMut = useMutation({
    mutationFn: (d: object) => acreditacionApi.evaluarCriterio(d),
    onSuccess: () => { toast('success', 'Criterio evaluado'); qc.invalidateQueries({ queryKey: ['autoevaluaciones'] }); },
    onError: (e) => toast('error', getErrorMessage(e)),
  });

  const downloadPDF = async (id: string) => {
    try { const res = await acreditacionApi.reporte(id); downloadBlob(res.data, 'autoevaluacion.pdf'); toast('success', 'PDF generado'); }
    catch { toast('error', 'Error al generar PDF'); }
  };

  const aes = data?.data || [];
  const meta = data?.meta;
  const NIVEL_COLOR: Record<string, string> = {
    no_cumple: 'danger', cumple_parcialmente: 'warning', cumple: 'success', supera: 'primary',
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500">{meta?.total || 0} autoevaluaciones registradas</p>
        {canEdit && (
          <Button size="sm" icon={<Plus className="w-4 h-4" />} onClick={() => setShowCreate(true)}>
            Nueva Autoevaluación
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {isLoading ? <SkeletonCard /> : aes.map((ae: any) => {
          const pct = parseFloat(ae.puntaje_total || 0);
          const color = pct >= 80 ? 'green' : pct >= 60 ? 'yellow' : 'red';
          return (
            <Card key={ae.id} className={cn('cursor-pointer hover:shadow-md transition-all', selected?.id === ae.id && 'ring-2 ring-unt-primary')} onClick={() => setSelected(ae)}>
              <CardContent className="py-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <span className="font-mono text-xs font-bold text-unt-primary">{ae.codigo}</span>
                    <p className="font-semibold text-gray-800 dark:text-gray-200 mt-0.5">{ae.nombre}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{ae.estandar?.nombre} · {ae.periodo_academico}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold" style={{ color: pct >= 80 ? '#27AE60' : pct >= 60 ? '#F7B731' : '#C8102E' }}>
                      {pct.toFixed(1)}%
                    </p>
                    <Badge variant={ae.estado === 'aprobada' ? 'success' : ae.estado === 'completada' ? 'info' : 'default'}>
                      {ae.estado}
                    </Badge>
                  </div>
                </div>
                <ProgressBar value={pct} max={100} color={color} />
                <div className="flex justify-between items-center mt-3">
                  <p className="text-xs text-gray-400">{formatDate(ae.fecha_inicio)} — {formatDate(ae.fecha_fin)}</p>
                  <Button variant="ghost" size="sm" icon={<Download className="w-3.5 h-3.5" />} onClick={(e) => { e.stopPropagation(); downloadPDF(ae.id); }}>
                    PDF
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Evaluación de criterios */}
      {selected && canEdit && (
        <Card>
          <CardHeader>
            <CardTitle>Evaluar Criterios — {selected.codigo}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Select label="Factor/Criterio" value={evalForm.factor_id} onChange={e => setEvalForm(f => ({ ...f, factor_id: e.target.value }))}>
                <option value="">Seleccionar criterio...</option>
                {(estandares || []).flatMap((est: any) =>
                  (est.factores || []).map((fac: any) => (
                    <option key={fac.id} value={fac.id}>{fac.codigo} — {fac.nombre} ({fac.peso_porcentual}%)</option>
                  ))
                )}
              </Select>
              <Input label="Puntaje (0-100)" type="number" min="0" max="100" value={evalForm.puntaje} onChange={e => setEvalForm(f => ({ ...f, puntaje: e.target.value }))} />
              <Select label="Nivel de Cumplimiento" value={evalForm.nivel_cumplimiento} onChange={e => setEvalForm(f => ({ ...f, nivel_cumplimiento: e.target.value }))}>
                <option value="no_cumple">No Cumple</option>
                <option value="cumple_parcialmente">Cumple Parcialmente</option>
                <option value="cumple">Cumple</option>
                <option value="supera">Supera</option>
              </Select>
              <div className="md:col-span-2">
                <Textarea label="Evidencias" value={evalForm.evidencias} onChange={e => setEvalForm(f => ({ ...f, evidencias: e.target.value }))} className="min-h-[60px]" />
              </div>
              <div className="flex items-end">
                <Button
                  className="w-full"
                  onClick={() => evalMut.mutate({ ...evalForm, autoevaluacion_id: selected.id })}
                  loading={evalMut.isPending}
                  disabled={!evalForm.factor_id || !evalForm.puntaje}
                >
                  Guardar Evaluación
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Nueva Autoevaluación" size="md">
        <AeForm estandares={estandares || []} onSubmit={crearMut.mutate} loading={crearMut.isPending} />
      </Modal>
    </div>
  );
}

function AeForm({ estandares, onSubmit, loading }: { estandares: any[]; onSubmit: (d: any) => void; loading: boolean }) {
  const [form, setForm] = useState({ codigo: '', nombre: '', estandar_id: '', periodo_academico: '', fecha_inicio: '', fecha_fin: '' });
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Input label="Código*" placeholder="AE-2024-I" value={form.codigo} onChange={e => setForm(f => ({ ...f, codigo: e.target.value }))} />
        <Input label="Período Académico*" placeholder="2024-I" value={form.periodo_academico} onChange={e => setForm(f => ({ ...f, periodo_academico: e.target.value }))} />
      </div>
      <Input label="Nombre*" value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} />
      <Select label="Estándar" value={form.estandar_id} onChange={e => setForm(f => ({ ...f, estandar_id: e.target.value }))}>
        <option value="">Seleccionar...</option>
        {estandares.map((e: any) => <option key={e.id} value={e.id}>{e.codigo} — {e.nombre}</option>)}
      </Select>
      <div className="grid grid-cols-2 gap-4">
        <Input label="Fecha Inicio" type="date" value={form.fecha_inicio} onChange={e => setForm(f => ({ ...f, fecha_inicio: e.target.value }))} />
        <Input label="Fecha Fin" type="date" value={form.fecha_fin} onChange={e => setForm(f => ({ ...f, fecha_fin: e.target.value }))} />
      </div>
      <div className="flex justify-end pt-2">
        <Button onClick={() => onSubmit(form)} loading={loading}>Crear Autoevaluación</Button>
      </div>
    </div>
  );
}

// ── Tab Comparativa ───────────────────────────────────────────
function ComparativaTab() {
  const { data, isLoading } = useQuery({
    queryKey: ['comparativa-ae'],
    queryFn: () => acreditacionApi.comparativa().then(r => r.data.data),
  });

  const chartData = (data || []).map((ae: any) => ({
    periodo: ae.periodo_academico,
    puntaje: parseFloat(ae.puntaje_total || 0),
    nombre: ae.nombre,
  }));

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader><CardTitle>Evolución del Puntaje de Autoevaluación</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? <div className="skeleton h-64 rounded" /> : chartData.length === 0 ? (
            <EmptyState message="Sin autoevaluaciones para comparar" />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={chartData} margin={{ top: 8, right: 16, bottom: 0, left: -15 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="periodo" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} unit="%" />
                <Tooltip
                  formatter={(v: number, name: string) => [`${v.toFixed(1)}%`, 'Puntaje']}
                  contentStyle={{ fontSize: 12, borderRadius: 8 }}
                />
                <ReferenceLine y={80} stroke="#27AE60" strokeDasharray="4 4" label={{ value: 'Meta: 80%', fontSize: 10, fill: '#27AE60' }} />
                <ReferenceLine y={60} stroke="#F7B731" strokeDasharray="4 4" label={{ value: '60%', fontSize: 10, fill: '#F7B731' }} />
                <Line type="monotone" dataKey="puntaje" stroke="#003366" strokeWidth={2.5} dot={{ r: 5, fill: '#003366' }} activeDot={{ r: 7 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Tabla comparativa */}
      {(data || []).length > 0 && (
        <Card>
          <CardHeader><CardTitle>Detalle por Período</CardTitle></CardHeader>
          <Table>
            <Thead>
              <tr><Th>Período</Th><Th>Autoevaluación</Th><Th className="text-center">Puntaje</Th><Th>Estado</Th><Th>Tendencia</Th></tr>
            </Thead>
            <Tbody>
              {(data || []).map((ae: any, i: number) => {
                const prev = i > 0 ? parseFloat(data[i - 1].puntaje_total || 0) : null;
                const curr = parseFloat(ae.puntaje_total || 0);
                const diff = prev !== null ? curr - prev : null;
                return (
                  <Tr key={ae.id}>
                    <Td><Badge variant="default">{ae.periodo_academico}</Badge></Td>
                    <Td><span className="text-sm font-medium text-gray-800 dark:text-gray-200">{ae.nombre}</span></Td>
                    <Td className="text-center">
                      <span className="text-lg font-bold" style={{ color: curr >= 80 ? '#27AE60' : curr >= 60 ? '#F7B731' : '#C8102E' }}>
                        {curr.toFixed(1)}%
                      </span>
                    </Td>
                    <Td><Badge variant={ae.estado === 'aprobada' ? 'success' : 'default'}>{ae.estado}</Badge></Td>
                    <Td>
                      {diff !== null && (
                        <span className={cn('text-sm font-semibold', diff >= 0 ? 'text-green-600' : 'text-red-500')}>
                          {diff >= 0 ? '▲' : '▼'} {Math.abs(diff).toFixed(1)}pp
                        </span>
                      )}
                    </Td>
                  </Tr>
                );
              })}
            </Tbody>
          </Table>
        </Card>
      )}
    </div>
  );
}
