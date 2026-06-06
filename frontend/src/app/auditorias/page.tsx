'use client';
import React, { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import {
  Card, CardContent, CardHeader, CardTitle,
  Table, Thead, Tbody, Th, Td, Tr,
  Button, EstadoBadge, Badge, Modal, Input, Select, Textarea,
  Pagination, EmptyState, SkeletonCard,
} from '@/components/ui';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { auditoriasApi, capasApi } from '@/lib/api';
import { formatDate, getErrorMessage, downloadBlob, truncate } from '@/lib/utils';
import { Plus, Download, ClipboardCheck, AlertTriangle } from 'lucide-react';
import { useToast } from '@/components/ui/ToastProvider';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';

type AudTab = 'planes' | 'hallazgos';

const GRAVEDAD_COLOR: Record<string, string> = {
  critica: 'danger', mayor: 'warning', menor: 'info', observacion: 'default',
};

export default function AuditoriasPage() {
  const [tab, setTab] = useState<AudTab>('planes');

  return (
    <AppLayout title="Auditorías">
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Auditorías e Inspecciones</h2>
            <p className="text-sm text-gray-500">Planificación, ejecución y hallazgos de auditorías</p>
          </div>
        </div>

        <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl w-fit">
          {(['planes', 'hallazgos'] as AudTab[]).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={cn('px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-all',
                tab === t ? 'bg-white dark:bg-gray-900 text-unt-primary shadow-sm' : 'text-gray-500 hover:text-gray-700')}>
              {t === 'planes' ? 'Planes de Auditoría' : 'Hallazgos'}
            </button>
          ))}
        </div>

        {tab === 'planes' && <PlanesTab />}
        {tab === 'hallazgos' && <HallazgosTab />}
      </div>
    </AppLayout>
  );
}

// ── Tab Planes ────────────────────────────────────────────────
function PlanesTab() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { hasRole } = useAuth();
  const canEdit = hasRole('admin', 'gestor_calidad', 'auditor');
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ estado: '', tipo: '' });
  const [showCreate, setShowCreate] = useState(false);
  const [selected, setSelected] = useState<any>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['planes-auditoria', page, filters],
    queryFn: () => auditoriasApi.listarPlanes({ page, limit: 10, ...filters }).then(r => r.data),
  });

  const crearMut = useMutation({
    mutationFn: (d: object) => auditoriasApi.crearPlan(d),
    onSuccess: () => { toast('success', 'Plan creado'); qc.invalidateQueries({ queryKey: ['planes-auditoria'] }); setShowCreate(false); },
    onError: (e) => toast('error', getErrorMessage(e)),
  });

  const actualizarMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: object }) => auditoriasApi.actualizarPlan(id, data),
    onSuccess: () => { toast('success', 'Plan actualizado'); qc.invalidateQueries({ queryKey: ['planes-auditoria'] }); },
    onError: (e) => toast('error', getErrorMessage(e)),
  });

  const downloadPDF = async (id: string) => {
    try { const res = await auditoriasApi.reporte(id); downloadBlob(res.data, `auditoria-${id}.pdf`); toast('success', 'PDF generado'); }
    catch { toast('error', 'Error al generar PDF'); }
  };

  const planes = data?.data || [];
  const meta = data?.meta;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex gap-3">
          <Select value={filters.estado} onChange={e => { setFilters(f => ({ ...f, estado: e.target.value })); setPage(1); }} className="w-44">
            <option value="">Todos los estados</option>
            <option value="planificado">Planificado</option>
            <option value="en_ejecucion">En Ejecución</option>
            <option value="completado">Completado</option>
            <option value="cancelado">Cancelado</option>
          </Select>
          <Select value={filters.tipo} onChange={e => { setFilters(f => ({ ...f, tipo: e.target.value })); setPage(1); }} className="w-44">
            <option value="">Todos los tipos</option>
            <option value="interna">Interna</option>
            <option value="externa">Externa</option>
            <option value="seguimiento">Seguimiento</option>
            <option value="certificacion">Certificación</option>
          </Select>
        </div>
        {canEdit && <Button size="sm" icon={<Plus className="w-4 h-4" />} onClick={() => setShowCreate(true)}>Nuevo Plan</Button>}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="xl:col-span-2">
          <Card>
            {isLoading ? <div className="p-5"><SkeletonCard /></div> : planes.length === 0 ? (
              <EmptyState message="Sin planes de auditoría" action={canEdit && <Button size="sm" onClick={() => setShowCreate(true)}>Crear Plan</Button>} />
            ) : (
              <>
                <Table>
                  <Thead>
                    <tr><Th>Código</Th><Th>Nombre</Th><Th>Tipo</Th><Th>Período</Th><Th>Líder</Th><Th>Estado</Th><Th className="text-right">Acc.</Th></tr>
                  </Thead>
                  <Tbody>
                    {planes.map((p: any) => (
                      <Tr key={p.id} onClick={() => setSelected(p)} className={cn(selected?.id === p.id && 'bg-blue-50 dark:bg-blue-900/10')}>
                        <Td><span className="font-mono text-xs">{p.codigo}</span></Td>
                        <Td><span className="text-sm font-medium text-gray-800 dark:text-gray-200">{truncate(p.nombre, 40)}</span></Td>
                        <Td><Badge variant={p.tipo === 'externa' ? 'warning' : 'info'}>{p.tipo}</Badge></Td>
                        <Td><span className="text-xs text-gray-500">{formatDate(p.fecha_inicio)} — {formatDate(p.fecha_fin)}</span></Td>
                        <Td><span className="text-xs">{p.lider ? `${p.lider.nombre} ${p.lider.apellido}` : '—'}</span></Td>
                        <Td><EstadoBadge estado={p.estado} /></Td>
                        <Td>
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="sm" icon={<Download className="w-3.5 h-3.5" />} onClick={(e) => { e.stopPropagation(); downloadPDF(p.id); }} />
                          </div>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
                {meta && <div className="px-4"><Pagination page={meta.page} pages={meta.pages} total={meta.total} onPage={setPage} /></div>}
              </>
            )}
          </Card>
        </div>

        {/* Detalle plan */}
        <div>
          {!selected ? (
            <Card className="min-h-[300px] flex items-center justify-center">
              <EmptyState message="Seleccione un plan" description="Haga clic en un plan para ver su detalle" />
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm font-bold text-unt-primary">{selected.codigo}</span>
                  <EstadoBadge estado={selected.estado} />
                </div>
                <CardTitle className="mt-1 text-sm">{selected.nombre}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm py-3">
                {selected.objetivo && (
                  <div><p className="text-xs text-gray-500 font-semibold uppercase">Objetivo</p><p className="text-gray-700 dark:text-gray-300 mt-0.5">{selected.objetivo}</p></div>
                )}
                {selected.alcance && (
                  <div><p className="text-xs text-gray-500 font-semibold uppercase">Alcance</p><p className="text-gray-700 dark:text-gray-300 mt-0.5">{selected.alcance}</p></div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <div><p className="text-xs text-gray-500">Inicio</p><p className="font-medium">{formatDate(selected.fecha_inicio)}</p></div>
                  <div><p className="text-xs text-gray-500">Fin</p><p className="font-medium">{formatDate(selected.fecha_fin)}</p></div>
                </div>

                {/* Equipo */}
                {selected.equipo?.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-500 font-semibold uppercase mb-2">Equipo Auditor</p>
                    <div className="space-y-1.5">
                      {selected.equipo.map((m: any) => (
                        <div key={m.id} className="flex items-center gap-2 text-xs">
                          <div className="w-5 h-5 rounded-full bg-unt-primary text-white flex items-center justify-center text-[10px] font-bold">
                            {m.auditor?.nombre?.[0]}
                          </div>
                          <span>{m.auditor?.nombre} {m.auditor?.apellido}</span>
                          <Badge variant={m.rol_en_equipo === 'lider' ? 'primary' : 'default'} className="ml-auto">{m.rol_en_equipo}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {canEdit && selected.estado === 'planificado' && (
                  <Button size="sm" className="w-full" onClick={() => actualizarMut.mutate({ id: selected.id, data: { estado: 'en_ejecucion' } })}>
                    Iniciar Auditoría
                  </Button>
                )}
                {canEdit && selected.estado === 'en_ejecucion' && (
                  <Button size="sm" variant="outline" className="w-full" onClick={() => actualizarMut.mutate({ id: selected.id, data: { estado: 'completado' } })}>
                    Completar Auditoría
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Nuevo Plan de Auditoría" size="lg">
        <PlanForm onSubmit={crearMut.mutate} loading={crearMut.isPending} />
      </Modal>
    </div>
  );
}

function PlanForm({ onSubmit, loading }: { onSubmit: (d: any) => void; loading: boolean }) {
  const [form, setForm] = useState({ codigo: '', nombre: '', tipo: 'interna', alcance: '', objetivo: '', fecha_inicio: '', fecha_fin: '' });
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Input label="Código*" placeholder="AUD-2024-001" value={form.codigo} onChange={e => setForm(f => ({ ...f, codigo: e.target.value }))} />
        <Select label="Tipo" value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}>
          <option value="interna">Interna</option>
          <option value="externa">Externa</option>
          <option value="seguimiento">Seguimiento</option>
          <option value="certificacion">Certificación</option>
        </Select>
      </div>
      <Input label="Nombre*" value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} />
      <Textarea label="Objetivo" value={form.objetivo} onChange={e => setForm(f => ({ ...f, objetivo: e.target.value }))} />
      <Textarea label="Alcance" value={form.alcance} onChange={e => setForm(f => ({ ...f, alcance: e.target.value }))} />
      <div className="grid grid-cols-2 gap-4">
        <Input label="Fecha Inicio*" type="date" value={form.fecha_inicio} onChange={e => setForm(f => ({ ...f, fecha_inicio: e.target.value }))} />
        <Input label="Fecha Fin*" type="date" value={form.fecha_fin} onChange={e => setForm(f => ({ ...f, fecha_fin: e.target.value }))} />
      </div>
      <div className="flex justify-end pt-2"><Button onClick={() => onSubmit(form)} loading={loading}>Crear Plan</Button></div>
    </div>
  );
}

// ── Tab Hallazgos ─────────────────────────────────────────────
function HallazgosTab() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { hasRole } = useAuth();
  const canEdit = hasRole('admin', 'gestor_calidad', 'auditor');
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ estado: '', gravedad: '', tipo: '' });
  const [showCreate, setShowCreate] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [showCapa, setShowCapa] = useState(false);
  const [capaForm, setCapaForm] = useState({ codigo: '', descripcion: '', causa_raiz: '', accion_propuesta: '', fecha_implementacion: '' });

  const { data, isLoading } = useQuery({
    queryKey: ['hallazgos', page, filters],
    queryFn: () => auditoriasApi.listarHallazgos({ page, limit: 15, ...filters }).then(r => r.data),
  });

  const { data: planes } = useQuery({
    queryKey: ['planes-select'],
    queryFn: () => auditoriasApi.listarPlanes({ limit: 100 }).then(r => r.data.data),
  });

  const crearMut = useMutation({
    mutationFn: (d: object) => auditoriasApi.crearHallazgo(d),
    onSuccess: () => { toast('success', 'Hallazgo registrado'); qc.invalidateQueries({ queryKey: ['hallazgos'] }); setShowCreate(false); },
    onError: (e) => toast('error', getErrorMessage(e)),
  });

  const crearCapaMut = useMutation({
    mutationFn: (d: object) => capasApi.crear(d),
    onSuccess: () => { toast('success', 'CAPA creada desde hallazgo'); qc.invalidateQueries({ queryKey: ['hallazgos'] }); setShowCapa(false); },
    onError: (e) => toast('error', getErrorMessage(e)),
  });

  const hallazgos = data?.data || [];
  const meta = data?.meta;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex flex-wrap gap-3">
          <Select value={filters.estado} onChange={e => { setFilters(f => ({ ...f, estado: e.target.value })); setPage(1); }} className="w-36">
            <option value="">Todos</option>
            <option value="abierto">Abierto</option>
            <option value="en_proceso">En Proceso</option>
            <option value="cerrado">Cerrado</option>
          </Select>
          <Select value={filters.gravedad} onChange={e => { setFilters(f => ({ ...f, gravedad: e.target.value })); setPage(1); }} className="w-36">
            <option value="">Gravedad</option>
            <option value="critica">Crítica</option>
            <option value="mayor">Mayor</option>
            <option value="menor">Menor</option>
            <option value="observacion">Observación</option>
          </Select>
          <Select value={filters.tipo} onChange={e => { setFilters(f => ({ ...f, tipo: e.target.value })); setPage(1); }} className="w-44">
            <option value="">Todos los tipos</option>
            <option value="no_conformidad">No Conformidad</option>
            <option value="observacion">Observación</option>
            <option value="oportunidad_mejora">Oportunidad Mejora</option>
          </Select>
        </div>
        {canEdit && <Button size="sm" icon={<Plus className="w-4 h-4" />} onClick={() => setShowCreate(true)}>Nuevo Hallazgo</Button>}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="xl:col-span-2">
          <Card>
            {isLoading ? <div className="p-5"><SkeletonCard /></div> : hallazgos.length === 0 ? (
              <EmptyState message="Sin hallazgos registrados" />
            ) : (
              <>
                <Table>
                  <Thead><tr><Th>Código</Th><Th>Tipo</Th><Th>Gravedad</Th><Th>Descripción</Th><Th>Estado</Th><Th>CAPA</Th></tr></Thead>
                  <Tbody>
                    {hallazgos.map((h: any) => (
                      <Tr key={h.id} onClick={() => setSelected(h)} className={cn(selected?.id === h.id && 'bg-blue-50 dark:bg-blue-900/10')}>
                        <Td><span className="font-mono text-xs">{h.codigo}</span></Td>
                        <Td><span className="text-xs capitalize">{h.tipo?.replace(/_/g, ' ')}</span></Td>
                        <Td>
                          <Badge variant={GRAVEDAD_COLOR[h.gravedad] || 'default'}>
                            {h.gravedad}
                          </Badge>
                        </Td>
                        <Td><span className="text-xs text-gray-600 dark:text-gray-400">{truncate(h.descripcion, 55)}</span></Td>
                        <Td><EstadoBadge estado={h.estado} /></Td>
                        <Td>
                          {h.capa ? (
                            <Badge variant="success">{h.capa.codigo}</Badge>
                          ) : (
                            <span className="text-xs text-gray-400">Sin CAPA</span>
                          )}
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
                {meta && <div className="px-4"><Pagination page={meta.page} pages={meta.pages} total={meta.total} onPage={setPage} /></div>}
              </>
            )}
          </Card>
        </div>

        {/* Detalle hallazgo */}
        <div>
          {!selected ? (
            <Card className="min-h-[250px] flex items-center justify-center">
              <EmptyState message="Seleccione un hallazgo" />
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm font-bold text-unt-primary">{selected.codigo}</span>
                  <Badge variant={GRAVEDAD_COLOR[selected.gravedad] || 'default'}>{selected.gravedad}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-sm py-3">
                <div><p className="text-xs text-gray-500 uppercase font-semibold">Tipo</p><p>{selected.tipo?.replace(/_/g, ' ')}</p></div>
                <div><p className="text-xs text-gray-500 uppercase font-semibold">Descripción</p><p className="text-gray-700 dark:text-gray-300">{selected.descripcion}</p></div>
                {selected.evidencia && <div><p className="text-xs text-gray-500 uppercase font-semibold">Evidencia</p><p className="text-gray-600 dark:text-gray-400">{selected.evidencia}</p></div>}
                <div><p className="text-xs text-gray-500">Estado</p><EstadoBadge estado={selected.estado} /></div>
                {selected.capa ? (
                  <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <p className="text-xs text-green-700 dark:text-green-400">✓ CAPA vinculada: <strong>{selected.capa.codigo}</strong></p>
                    <EstadoBadge estado={selected.capa.estado} />
                  </div>
                ) : canEdit && selected.estado !== 'cerrado' && (
                  <Button size="sm" variant="outline" className="w-full" icon={<Plus className="w-3.5 h-3.5" />} onClick={() => setShowCapa(true)}>
                    Crear CAPA desde Hallazgo
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Nuevo Hallazgo" size="lg">
        <HallazgoForm planes={planes || []} onSubmit={crearMut.mutate} loading={crearMut.isPending} />
      </Modal>

      <Modal open={showCapa} onClose={() => setShowCapa(false)} title={`CAPA para: ${selected?.codigo}`} size="md">
        <div className="space-y-4">
          <Input label="Código CAPA*" placeholder="CAP-2024-001" value={capaForm.codigo} onChange={e => setCapaForm(f => ({ ...f, codigo: e.target.value }))} />
          <Textarea label="Descripción*" value={capaForm.descripcion} onChange={e => setCapaForm(f => ({ ...f, descripcion: e.target.value }))} />
          <Textarea label="Causa Raíz" value={capaForm.causa_raiz} onChange={e => setCapaForm(f => ({ ...f, causa_raiz: e.target.value }))} />
          <Textarea label="Acción Propuesta*" value={capaForm.accion_propuesta} onChange={e => setCapaForm(f => ({ ...f, accion_propuesta: e.target.value }))} />
          <Input label="Fecha Implementación*" type="date" value={capaForm.fecha_implementacion} onChange={e => setCapaForm(f => ({ ...f, fecha_implementacion: e.target.value }))} />
          <div className="flex justify-end pt-2">
            <Button onClick={() => crearCapaMut.mutate({ ...capaForm, tipo: 'correctiva', hallazgo_id: selected?.id })} loading={crearCapaMut.isPending}>
              Crear CAPA
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function HallazgoForm({ planes, onSubmit, loading }: { planes: any[]; onSubmit: (d: any) => void; loading: boolean }) {
  const [form, setForm] = useState({ codigo: '', plan_id: '', tipo: 'no_conformidad', gravedad: 'mayor', descripcion: '', evidencia: '' });
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Input label="Código*" placeholder="HAL-2024-001" value={form.codigo} onChange={e => setForm(f => ({ ...f, codigo: e.target.value }))} />
        <Select label="Plan de Auditoría" value={form.plan_id} onChange={e => setForm(f => ({ ...f, plan_id: e.target.value }))}>
          <option value="">Sin plan asociado</option>
          {planes.map((p: any) => <option key={p.id} value={p.id}>{p.codigo} — {p.nombre}</option>)}
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Select label="Tipo" value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}>
          <option value="no_conformidad">No Conformidad</option>
          <option value="observacion">Observación</option>
          <option value="oportunidad_mejora">Oportunidad de Mejora</option>
          <option value="buena_practica">Buena Práctica</option>
        </Select>
        <Select label="Gravedad" value={form.gravedad} onChange={e => setForm(f => ({ ...f, gravedad: e.target.value }))}>
          <option value="critica">Crítica</option>
          <option value="mayor">Mayor</option>
          <option value="menor">Menor</option>
          <option value="observacion">Observación</option>
        </Select>
      </div>
      <Textarea label="Descripción*" value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))} />
      <Textarea label="Evidencia" value={form.evidencia} onChange={e => setForm(f => ({ ...f, evidencia: e.target.value }))} />
      <div className="flex justify-end pt-2"><Button onClick={() => onSubmit(form)} loading={loading}>Registrar Hallazgo</Button></div>
    </div>
  );
}
