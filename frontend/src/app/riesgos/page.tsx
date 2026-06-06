'use client';
import React, { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import {
  Card, CardContent, CardHeader, CardTitle,
  Table, Thead, Tbody, Th, Td, Tr,
  Button, NivelRiesgoBadge, EstadoBadge, Modal, Input, Select, Textarea,
  Pagination, EmptyState, SkeletonCard, Badge,
} from '@/components/ui';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { riesgosApi } from '@/lib/api';
import { formatDate, getErrorMessage, downloadBlob, truncate, nivelRiesgoLabel } from '@/lib/utils';
import { Plus, Download, RefreshCw, AlertTriangle } from 'lucide-react';
import { useToast } from '@/components/ui/ToastProvider';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';

export default function RiesgosPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { hasRole } = useAuth();
  const canEdit = hasRole('admin', 'gestor_calidad');

  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ estado: 'activo', tipo: '' });
  const [selected, setSelected] = useState<any>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showMitigacion, setShowMitigacion] = useState(false);
  const [activeTab, setActiveTab] = useState<'lista' | 'matriz' | 'ranking'>('lista');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['riesgos', page, filters],
    queryFn: () => riesgosApi.listar({ page, limit: 15, ...filters }).then(r => r.data),
  });

  const { data: matrizData } = useQuery({
    queryKey: ['riesgos-matriz'],
    queryFn: () => riesgosApi.matrizCalor().then(r => r.data.data),
    enabled: activeTab === 'matriz',
  });

  const { data: rankingData } = useQuery({
    queryKey: ['riesgos-ranking'],
    queryFn: () => riesgosApi.ranking().then(r => r.data.data),
    enabled: activeTab === 'ranking',
  });

  const { data: detalleData } = useQuery({
    queryKey: ['riesgo-detalle', selected?.id],
    queryFn: () => riesgosApi.obtener(selected.id).then(r => r.data.data),
    enabled: !!selected?.id,
  });

  const crearMut = useMutation({
    mutationFn: (d: object) => riesgosApi.crear(d),
    onSuccess: () => { toast('success', 'Riesgo registrado'); qc.invalidateQueries({ queryKey: ['riesgos'] }); qc.invalidateQueries({ queryKey: ['riesgos-matriz'] }); setShowCreate(false); },
    onError: (e) => toast('error', getErrorMessage(e)),
  });

  const mitigacionMut = useMutation({
    mutationFn: (d: object) => riesgosApi.agregarMitigacion(selected.id, d),
    onSuccess: () => { toast('success', 'Plan de mitigación agregado'); qc.invalidateQueries({ queryKey: ['riesgo-detalle'] }); setShowMitigacion(false); },
    onError: (e) => toast('error', getErrorMessage(e)),
  });

  const downloadPDF = async () => {
    try { const res = await riesgosApi.reporte(); downloadBlob(res.data, 'riesgos.pdf'); toast('success', 'PDF generado'); }
    catch { toast('error', 'Error al generar PDF'); }
  };

  const riesgos = data?.data || [];
  const meta = data?.meta;

  return (
    <AppLayout title="Gestión de Riesgos">
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Gestión de Riesgos</h2>
            <p className="text-sm text-gray-500">Identificación, evaluación y control de riesgos institucionales</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" icon={<Download className="w-4 h-4" />} onClick={downloadPDF}>PDF</Button>
            {canEdit && <Button size="sm" icon={<Plus className="w-4 h-4" />} onClick={() => setShowCreate(true)}>Nuevo Riesgo</Button>}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl w-fit">
          {(['lista', 'matriz', 'ranking'] as const).map(t => (
            <button key={t} onClick={() => setActiveTab(t)}
              className={cn('px-4 py-1.5 rounded-lg text-sm font-medium transition-all capitalize', activeTab === t ? 'bg-white dark:bg-gray-900 text-unt-primary shadow-sm' : 'text-gray-500 hover:text-gray-700')}>
              {t === 'lista' ? 'Lista' : t === 'matriz' ? 'Mapa de Calor' : 'Ranking Críticos'}
            </button>
          ))}
        </div>

        {/* Lista */}
        {activeTab === 'lista' && (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
            <div className="xl:col-span-2">
              <div className="flex gap-3 mb-3">
                <Select value={filters.estado} onChange={e => { setFilters(f => ({ ...f, estado: e.target.value })); setPage(1); }} className="w-40">
                  <option value="">Todos</option>
                  <option value="activo">Activos</option>
                  <option value="mitigado">Mitigados</option>
                  <option value="aceptado">Aceptados</option>
                  <option value="eliminado">Eliminados</option>
                </Select>
                <Select value={filters.tipo} onChange={e => { setFilters(f => ({ ...f, tipo: e.target.value })); setPage(1); }} className="w-44">
                  <option value="">Todos los tipos</option>
                  {['estrategico','operativo','academico','financiero','legal','tecnologico','reputacional'].map(t => <option key={t} value={t}>{t}</option>)}
                </Select>
              </div>
              <Card>
                {isLoading ? <div className="p-5"><SkeletonCard /></div> : riesgos.length === 0 ? (
                  <EmptyState message="Sin riesgos registrados" />
                ) : (
                  <>
                    <Table>
                      <Thead>
                        <tr><Th>Código</Th><Th>Nombre</Th><Th>Tipo</Th><Th className="text-center">P</Th><Th className="text-center">I</Th><Th>Nivel</Th><Th>Estado</Th></tr>
                      </Thead>
                      <Tbody>
                        {riesgos.map((r: any) => (
                          <Tr key={r.id} onClick={() => setSelected(r)} className={cn(selected?.id === r.id && 'bg-blue-50 dark:bg-blue-900/10')}>
                            <Td><span className="font-mono text-xs">{r.codigo}</span></Td>
                            <Td><span className="text-sm font-medium text-gray-800 dark:text-gray-200">{truncate(r.nombre, 40)}</span></Td>
                            <Td><span className="text-xs text-gray-500 capitalize">{r.tipo}</span></Td>
                            <Td className="text-center"><span className="text-sm font-bold text-unt-primary">{r.probabilidad}</span></Td>
                            <Td className="text-center"><span className="text-sm font-bold text-unt-primary">{r.impacto}</span></Td>
                            <Td><NivelRiesgoBadge nivel={r.nivel_riesgo} /></Td>
                            <Td><EstadoBadge estado={r.estado} /></Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                    {meta && <div className="px-4"><Pagination page={meta.page} pages={meta.pages} total={meta.total} onPage={setPage} /></div>}
                  </>
                )}
              </Card>
            </div>

            {/* Detalle */}
            <div>
              {!selected ? (
                <Card className="min-h-[300px] flex items-center justify-center">
                  <EmptyState message="Seleccione un riesgo" description="Haga clic en una fila para ver el detalle" />
                </Card>
              ) : (
                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-sm font-bold text-unt-primary">{detalleData?.codigo}</span>
                        <NivelRiesgoBadge nivel={detalleData?.nivel_riesgo || 0} />
                      </div>
                      <CardTitle className="mt-1">{detalleData?.nombre}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                      {detalleData?.descripcion && <p className="text-gray-600 dark:text-gray-400">{detalleData.descripcion}</p>}
                      <div className="grid grid-cols-3 gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-center">
                        <div><p className="text-xs text-gray-500">Probabilidad</p><p className="text-2xl font-bold text-unt-primary">{detalleData?.probabilidad}</p></div>
                        <div><p className="text-xs text-gray-500">Impacto</p><p className="text-2xl font-bold text-unt-primary">{detalleData?.impacto}</p></div>
                        <div>
                          <p className="text-xs text-gray-500">Nivel</p>
                          <p className="text-2xl font-bold" style={{ color: nivelRiesgoLabel(detalleData?.nivel_riesgo || 0).color }}>
                            {detalleData?.nivel_riesgo}
                          </p>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Responsable</p>
                        <p className="font-medium">{detalleData?.responsable?.nombre} {detalleData?.responsable?.apellido}</p>
                      </div>
                      {canEdit && (
                        <Button size="sm" variant="outline" className="w-full" icon={<Plus className="w-4 h-4" />} onClick={() => setShowMitigacion(true)}>
                          Plan de Mitigación
                        </Button>
                      )}
                    </CardContent>
                  </Card>

                  {(detalleData?.planes_mitigacion || []).length > 0 && (
                    <Card>
                      <CardHeader><CardTitle>Planes de Mitigación</CardTitle></CardHeader>
                      <CardContent className="space-y-2 py-3">
                        {detalleData.planes_mitigacion.map((p: any) => (
                          <div key={p.id} className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800 text-sm">
                            <div className="flex items-center justify-between">
                              <p className="font-medium text-gray-800 dark:text-gray-200">{p.nombre}</p>
                              <EstadoBadge estado={p.estado} />
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5">{truncate(p.descripcion || '', 80)}</p>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Mapa de calor */}
        {activeTab === 'matriz' && (
          <Card>
            <CardHeader><CardTitle>Mapa de Calor — Probabilidad × Impacto</CardTitle></CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <div className="flex flex-col justify-center text-xs text-gray-500 gap-0" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', height: 300 }}>
                  Probabilidad ↑
                </div>
                <div className="flex-1">
                  <div className="grid gap-1.5" style={{ gridTemplateColumns: 'repeat(5,1fr)', gridTemplateRows: 'repeat(5,1fr)' }}>
                    {[5,4,3,2,1].map(p =>
                      [1,2,3,4,5].map(i => {
                        const nivel = p * i;
                        const cell = matrizData?.find((c: any) => c.probabilidad === p && c.impacto === i);
                        const qty = cell?.riesgos?.length || 0;
                        const color = nivel >= 17 ? '#C8102E' : nivel >= 10 ? '#FF6B00' : nivel >= 5 ? '#F7B731' : '#27AE60';
                        return (
                          <div key={`${p}-${i}`}
                            className="aspect-square rounded-lg flex flex-col items-center justify-center text-white cursor-default transition-all hover:scale-105 hover:shadow-md"
                            style={{ background: color, opacity: qty > 0 ? 1 : 0.25 }}
                            title={`P:${p} × I:${i} = ${nivel} | ${qty} riesgo(s): ${cell?.riesgos?.map((r: any) => r.codigo).join(', ')}`}
                          >
                            <span className="text-lg font-bold">{nivel}</span>
                            {qty > 0 && <span className="text-xs mt-0.5 bg-white/20 rounded-full px-1.5">{qty}</span>}
                          </div>
                        );
                      })
                    )}
                  </div>
                  <div className="flex justify-between mt-3 text-xs text-gray-400">
                    {[1,2,3,4,5].map(i => <span key={i} className="text-center flex-1">I={i}</span>)}
                  </div>
                  <p className="text-xs text-gray-400 text-center mt-1">Impacto →</p>
                </div>
              </div>
              <div className="flex items-center justify-center gap-6 mt-4 text-xs text-gray-500">
                {[['#27AE60','Bajo (1-4)'], ['#F7B731','Medio (5-9)'], ['#FF6B00','Alto (10-16)'], ['#C8102E','Crítico (17-25)']].map(([c, l]) => (
                  <div key={l} className="flex items-center gap-1.5"><div className="w-4 h-4 rounded" style={{ background: c }} />{l}</div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Ranking */}
        {activeTab === 'ranking' && (
          <Card>
            <CardHeader><CardTitle>Top 10 Riesgos Críticos</CardTitle></CardHeader>
            {(rankingData || []).length === 0 ? (
              <EmptyState message="Sin riesgos críticos activos" />
            ) : (
              <Table>
                <Thead><tr><Th>#</Th><Th>Código</Th><Th>Nombre</Th><Th>Tipo</Th><Th className="text-center">Nivel</Th><Th>Responsable</Th></tr></Thead>
                <Tbody>
                  {(rankingData || []).map((r: any, i: number) => (
                    <Tr key={r.id}>
                      <Td><span className="font-bold text-gray-400">#{i+1}</span></Td>
                      <Td><span className="font-mono text-xs">{r.codigo}</span></Td>
                      <Td><span className="font-medium text-gray-800 dark:text-gray-200">{r.nombre}</span></Td>
                      <Td><span className="text-xs capitalize text-gray-500">{r.tipo}</span></Td>
                      <Td className="text-center"><NivelRiesgoBadge nivel={r.nivel_riesgo} /></Td>
                      <Td><span className="text-xs">{r.responsable?.nombre} {r.responsable?.apellido}</span></Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            )}
          </Card>
        )}
      </div>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Nuevo Riesgo" size="lg">
        <RiesgoForm onSubmit={crearMut.mutate} loading={crearMut.isPending} />
      </Modal>

      <Modal open={showMitigacion} onClose={() => setShowMitigacion(false)} title="Plan de Mitigación" size="md">
        <MitigacionForm onSubmit={mitigacionMut.mutate} loading={mitigacionMut.isPending} />
      </Modal>
    </AppLayout>
  );
}

function RiesgoForm({ onSubmit, loading }: { onSubmit: (d: any) => void; loading: boolean }) {
  const [form, setForm] = useState({ codigo: '', nombre: '', descripcion: '', tipo: 'operativo', probabilidad: 1, impacto: 1 });
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Input label="Código*" placeholder="RIE-2024-001" value={form.codigo} onChange={e => setForm(f => ({ ...f, codigo: e.target.value }))} />
        <Select label="Tipo*" value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}>
          {['estrategico','operativo','academico','financiero','legal','tecnologico','reputacional'].map(t => <option key={t} value={t}>{t}</option>)}
        </Select>
      </div>
      <Input label="Nombre*" placeholder="Descripción breve del riesgo" value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} />
      <Textarea label="Descripción" value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))} />
      <div className="grid grid-cols-2 gap-4">
        <Select label={`Probabilidad (${form.probabilidad}/5)`} value={String(form.probabilidad)} onChange={e => setForm(f => ({ ...f, probabilidad: parseInt(e.target.value) }))}>
          {[1,2,3,4,5].map(n => <option key={n} value={n}>{n} - {['Muy baja','Baja','Media','Alta','Muy alta'][n-1]}</option>)}
        </Select>
        <Select label={`Impacto (${form.impacto}/5)`} value={String(form.impacto)} onChange={e => setForm(f => ({ ...f, impacto: parseInt(e.target.value) }))}>
          {[1,2,3,4,5].map(n => <option key={n} value={n}>{n} - {['Insignificante','Menor','Moderado','Mayor','Catastrófico'][n-1]}</option>)}
        </Select>
      </div>
      <div className="p-3 rounded-lg text-center" style={{ background: nivelRiesgoLabel(form.probabilidad * form.impacto).color + '20' }}>
        <p className="text-sm font-semibold" style={{ color: nivelRiesgoLabel(form.probabilidad * form.impacto).color }}>
          Nivel de Riesgo: {form.probabilidad * form.impacto} — {nivelRiesgoLabel(form.probabilidad * form.impacto).label}
        </p>
      </div>
      <div className="flex justify-end pt-2"><Button onClick={() => onSubmit(form)} loading={loading}>Registrar Riesgo</Button></div>
    </div>
  );
}

function MitigacionForm({ onSubmit, loading }: { onSubmit: (d: any) => void; loading: boolean }) {
  const [form, setForm] = useState({ nombre: '', descripcion: '', tipo_respuesta: 'mitigar', fecha_limite: '' });
  return (
    <div className="space-y-4">
      <Input label="Nombre del Plan*" value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} />
      <Textarea label="Descripción" value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))} />
      <Select label="Tipo de Respuesta" value={form.tipo_respuesta} onChange={e => setForm(f => ({ ...f, tipo_respuesta: e.target.value }))}>
        <option value="mitigar">Mitigar</option><option value="transferir">Transferir</option>
        <option value="aceptar">Aceptar</option><option value="eliminar">Eliminar</option>
      </Select>
      <Input label="Fecha Límite" type="date" value={form.fecha_limite} onChange={e => setForm(f => ({ ...f, fecha_limite: e.target.value }))} />
      <div className="flex justify-end pt-2"><Button onClick={() => onSubmit(form)} loading={loading}>Guardar Plan</Button></div>
    </div>
  );
}
