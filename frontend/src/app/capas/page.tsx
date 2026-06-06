'use client';
import React, { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import {
  Card, CardContent, CardHeader, CardTitle,
  Table, Thead, Tbody, Th, Td, Tr,
  Button, EstadoBadge, Modal, Input, Select, Textarea,
  Pagination, EmptyState, SkeletonCard, ProgressBar, Badge,
} from '@/components/ui';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { capasApi } from '@/lib/api';
import { formatDate, getErrorMessage, downloadBlob, truncate } from '@/lib/utils';
import { Plus, Download, RefreshCw, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { useToast } from '@/components/ui/ToastProvider';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';

const ESTADOS_CICLO = ['registrada', 'en_implementacion', 'implementada', 'verificada', 'cerrada'];

function EstadoStepper({ estado }: { estado: string }) {
  const idx = ESTADOS_CICLO.indexOf(estado);
  return (
    <div className="flex items-center gap-0">
      {ESTADOS_CICLO.map((e, i) => (
        <React.Fragment key={e}>
          <div className={cn(
            'flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold transition-all',
            i < idx ? 'bg-green-500 text-white' : i === idx ? 'bg-unt-primary text-white ring-2 ring-unt-primary/30' : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
          )}>
            {i < idx ? <CheckCircle className="w-3.5 h-3.5" /> : i + 1}
          </div>
          {i < ESTADOS_CICLO.length - 1 && (
            <div className={cn('h-0.5 w-6', i < idx ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700')} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

export default function CapasPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { hasRole } = useAuth();
  const canEdit = hasRole('admin', 'gestor_calidad');

  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ estado: '', tipo: '', vencidas: '' });
  const [showCreate, setShowCreate] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [showEstado, setShowEstado] = useState(false);
  const [showSeguimiento, setShowSeguimiento] = useState(false);
  const [estadoForm, setEstadoForm] = useState({ nuevo_estado: '', comentario: '', efectividad: '' });
  const [seguimientoForm, setSeguimientoForm] = useState({ avance_porcentaje: 0, observaciones: '' });

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['capas', page, filters],
    queryFn: () => capasApi.listar({ page, limit: 15, ...filters }).then(r => r.data),
  });

  const { data: capaDetalle, isLoading: detLoading } = useQuery({
    queryKey: ['capa-detalle', selected?.id],
    queryFn: () => capasApi.obtener(selected.id).then(r => r.data.data),
    enabled: !!selected?.id,
  });

  const crearMut = useMutation({
    mutationFn: (d: object) => capasApi.crear(d),
    onSuccess: () => { toast('success', 'CAPA creada'); qc.invalidateQueries({ queryKey: ['capas'] }); setShowCreate(false); },
    onError: (e) => toast('error', getErrorMessage(e)),
  });

  const estadoMut = useMutation({
    mutationFn: (d: object) => capasApi.cambiarEstado(selected.id, d),
    onSuccess: () => { toast('success', 'Estado actualizado'); qc.invalidateQueries({ queryKey: ['capas'] }); qc.invalidateQueries({ queryKey: ['capa-detalle'] }); setShowEstado(false); },
    onError: (e) => toast('error', getErrorMessage(e)),
  });

  const seguimientoMut = useMutation({
    mutationFn: (d: object) => capasApi.agregarSeguimiento(selected.id, d),
    onSuccess: () => { toast('success', 'Seguimiento registrado'); qc.invalidateQueries({ queryKey: ['capa-detalle'] }); setShowSeguimiento(false); },
    onError: (e) => toast('error', getErrorMessage(e)),
  });

  const downloadPDF = async () => {
    try { const res = await capasApi.reporte(filters); downloadBlob(res.data, 'capas.pdf'); toast('success', 'PDF generado'); }
    catch { toast('error', 'Error al generar PDF'); }
  };

  const TRANSICIONES: Record<string, string[]> = {
    registrada: ['en_implementacion', 'rechazada'],
    en_implementacion: ['implementada', 'rechazada'],
    implementada: ['verificada'],
    verificada: ['cerrada', 'en_implementacion'],
  };

  const capas = data?.data || [];
  const meta = data?.meta;

  return (
    <AppLayout title="Gestión CAPA">
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Acciones Correctivas y Preventivas</h2>
            <p className="text-sm text-gray-500">Gestión del ciclo de vida de CAPAs</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" icon={<Download className="w-4 h-4" />} onClick={downloadPDF}>PDF</Button>
            <Button variant="outline" size="sm" icon={<RefreshCw className="w-4 h-4" />} onClick={() => refetch()}>Actualizar</Button>
            {canEdit && <Button size="sm" icon={<Plus className="w-4 h-4" />} onClick={() => setShowCreate(true)}>Nueva CAPA</Button>}
          </div>
        </div>

        {/* Filtros */}
        <Card>
          <CardContent className="py-3">
            <div className="flex flex-wrap gap-3">
              <Select value={filters.estado} onChange={e => { setFilters(f => ({ ...f, estado: e.target.value })); setPage(1); }} className="w-44">
                <option value="">Todos los estados</option>
                {['registrada','en_implementacion','implementada','verificada','cerrada','rechazada'].map(s => <option key={s} value={s}>{s.replace(/_/g,' ')}</option>)}
              </Select>
              <Select value={filters.tipo} onChange={e => { setFilters(f => ({ ...f, tipo: e.target.value })); setPage(1); }} className="w-40">
                <option value="">Todos los tipos</option>
                <option value="correctiva">Correctiva</option>
                <option value="preventiva">Preventiva</option>
                <option value="mejora">Mejora</option>
              </Select>
              <Select value={filters.vencidas} onChange={e => { setFilters(f => ({ ...f, vencidas: e.target.value })); setPage(1); }} className="w-44">
                <option value="">Todas</option>
                <option value="true">Solo vencidas</option>
              </Select>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          {/* Tabla */}
          <div className="xl:col-span-2">
            <Card>
              {isLoading ? <div className="p-5"><SkeletonCard /></div> : capas.length === 0 ? (
                <EmptyState message="Sin CAPAs registradas" action={canEdit && <Button size="sm" icon={<Plus className="w-4 h-4" />} onClick={() => setShowCreate(true)}>Crear CAPA</Button>} />
              ) : (
                <>
                  <Table>
                    <Thead>
                      <tr><Th>Código</Th><Th>Tipo</Th><Th>Descripción</Th><Th>Responsable</Th><Th>Fecha Impl.</Th><Th>Progreso</Th><Th>Estado</Th></tr>
                    </Thead>
                    <Tbody>
                      {capas.map((c: any) => {
                        const vencida = new Date(c.fecha_implementacion) < new Date() && !['cerrada','rechazada'].includes(c.estado);
                        return (
                          <Tr key={c.id} onClick={() => setSelected(c)} className={cn(selected?.id === c.id && 'bg-blue-50 dark:bg-blue-900/10')}>
                            <Td>
                              <div className="flex items-center gap-1">
                                {vencida && <AlertCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />}
                                <span className="font-mono text-xs">{c.codigo}</span>
                              </div>
                            </Td>
                            <Td><Badge variant={c.tipo === 'correctiva' ? 'danger' : c.tipo === 'preventiva' ? 'warning' : 'info'}>{c.tipo}</Badge></Td>
                            <Td><span className="text-xs text-gray-600 dark:text-gray-400">{truncate(c.descripcion, 55)}</span></Td>
                            <Td><span className="text-xs">{c.responsable ? `${c.responsable.nombre} ${c.responsable.apellido}` : '—'}</span></Td>
                            <Td><span className={cn('text-xs', vencida && 'text-red-500 font-medium')}>{formatDate(c.fecha_implementacion)}</span></Td>
                            <Td className="min-w-[100px]"><EstadoStepper estado={c.estado} /></Td>
                            <Td><EstadoBadge estado={c.estado} /></Td>
                          </Tr>
                        );
                      })}
                    </Tbody>
                  </Table>
                  {meta && <div className="px-4"><Pagination page={meta.page} pages={meta.pages} total={meta.total} onPage={setPage} /></div>}
                </>
              )}
            </Card>
          </div>

          {/* Panel detalle */}
          <div>
            {!selected ? (
              <Card className="min-h-[300px] flex items-center justify-center">
                <EmptyState message="Seleccione una CAPA" description="Haga clic en una fila para ver el detalle" />
              </Card>
            ) : (
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-sm font-bold text-unt-primary">{capaDetalle?.codigo || selected.codigo}</span>
                      <EstadoBadge estado={capaDetalle?.estado || selected.estado} />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div>
                      <p className="text-xs text-gray-500 font-semibold uppercase">Descripción</p>
                      <p className="text-gray-700 dark:text-gray-300 mt-0.5">{capaDetalle?.descripcion}</p>
                    </div>
                    {capaDetalle?.causa_raiz && (
                      <div>
                        <p className="text-xs text-gray-500 font-semibold uppercase">Causa Raíz</p>
                        <p className="text-gray-700 dark:text-gray-300 mt-0.5">{capaDetalle.causa_raiz}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-xs text-gray-500 font-semibold uppercase">Acción Propuesta</p>
                      <p className="text-gray-700 dark:text-gray-300 mt-0.5">{capaDetalle?.accion_propuesta}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <div><p className="text-xs text-gray-500">Responsable</p><p className="font-medium">{capaDetalle?.responsable?.nombre} {capaDetalle?.responsable?.apellido}</p></div>
                      <div><p className="text-xs text-gray-500">Fecha Impl.</p><p className="font-medium">{formatDate(capaDetalle?.fecha_implementacion)}</p></div>
                    </div>
                    {capaDetalle?.efectividad && (
                      <div><p className="text-xs text-gray-500">Efectividad</p><Badge variant={capaDetalle.efectividad === 'efectiva' ? 'success' : capaDetalle.efectividad === 'parcialmente_efectiva' ? 'warning' : 'danger'}>{capaDetalle.efectividad.replace(/_/g,' ')}</Badge></div>
                    )}

                    {canEdit && TRANSICIONES[capaDetalle?.estado || selected.estado] && (
                      <div className="flex flex-col gap-2 pt-2">
                        <Button size="sm" onClick={() => { setEstadoForm({ nuevo_estado: TRANSICIONES[capaDetalle?.estado || selected.estado]?.[0] || '', comentario: '', efectividad: '' }); setShowEstado(true); }}>
                          Cambiar Estado
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => { setSeguimientoForm({ avance_porcentaje: 0, observaciones: '' }); setShowSeguimiento(true); }}>
                          + Seguimiento
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Seguimientos */}
                {capaDetalle?.seguimientos?.length > 0 && (
                  <Card>
                    <CardHeader><CardTitle>Seguimientos ({capaDetalle.seguimientos.length})</CardTitle></CardHeader>
                    <CardContent className="space-y-3 py-3">
                      {capaDetalle.seguimientos.map((s: any) => (
                        <div key={s.id} className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800 text-sm">
                          <div className="flex items-center justify-between mb-1">
                            <ProgressBar value={s.avance_porcentaje} color={s.avance_porcentaje >= 80 ? 'green' : s.avance_porcentaje >= 50 ? 'yellow' : 'red'} />
                          </div>
                          {s.observaciones && <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{s.observaciones}</p>}
                          <p className="text-xs text-gray-400 mt-1">{formatDate(s.creado_en, 'dd/MM/yyyy HH:mm')}</p>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal crear CAPA */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Nueva CAPA" size="lg">
        <CapaForm onSubmit={crearMut.mutate} loading={crearMut.isPending} />
      </Modal>

      {/* Modal cambiar estado */}
      <Modal open={showEstado} onClose={() => setShowEstado(false)} title="Cambiar Estado CAPA" size="sm">
        <div className="space-y-4">
          <Select label="Nuevo Estado" value={estadoForm.nuevo_estado} onChange={e => setEstadoForm(f => ({ ...f, nuevo_estado: e.target.value }))}>
            {(TRANSICIONES[selected?.estado] || []).map(s => <option key={s} value={s}>{s.replace(/_/g,' ')}</option>)}
          </Select>
          {estadoForm.nuevo_estado === 'cerrada' && (
            <Select label="Efectividad" value={estadoForm.efectividad} onChange={e => setEstadoForm(f => ({ ...f, efectividad: e.target.value }))}>
              <option value="">Seleccionar...</option>
              <option value="efectiva">Efectiva</option>
              <option value="parcialmente_efectiva">Parcialmente Efectiva</option>
              <option value="no_efectiva">No Efectiva</option>
            </Select>
          )}
          <Textarea label="Comentario" value={estadoForm.comentario} onChange={e => setEstadoForm(f => ({ ...f, comentario: e.target.value }))} />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={() => setShowEstado(false)}>Cancelar</Button>
            <Button size="sm" onClick={() => estadoMut.mutate(estadoForm)} loading={estadoMut.isPending}>Confirmar</Button>
          </div>
        </div>
      </Modal>

      {/* Modal seguimiento */}
      <Modal open={showSeguimiento} onClose={() => setShowSeguimiento(false)} title="Registrar Seguimiento" size="sm">
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Avance: {seguimientoForm.avance_porcentaje}%</label>
            <input type="range" min={0} max={100} value={seguimientoForm.avance_porcentaje}
              onChange={e => setSeguimientoForm(f => ({ ...f, avance_porcentaje: parseInt(e.target.value) }))}
              className="w-full" />
          </div>
          <Textarea label="Observaciones" value={seguimientoForm.observaciones} onChange={e => setSeguimientoForm(f => ({ ...f, observaciones: e.target.value }))} />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={() => setShowSeguimiento(false)}>Cancelar</Button>
            <Button size="sm" onClick={() => seguimientoMut.mutate(seguimientoForm)} loading={seguimientoMut.isPending}>Guardar</Button>
          </div>
        </div>
      </Modal>
    </AppLayout>
  );
}

function CapaForm({ onSubmit, loading }: { onSubmit: (d: any) => void; loading: boolean }) {
  const [form, setForm] = useState({ codigo: '', tipo: 'correctiva', descripcion: '', causa_raiz: '', accion_propuesta: '', fecha_implementacion: '' });
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Input label="Código*" placeholder="CAP-2024-001" value={form.codigo} onChange={e => setForm(f => ({ ...f, codigo: e.target.value }))} />
        <Select label="Tipo" value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}>
          <option value="correctiva">Correctiva</option>
          <option value="preventiva">Preventiva</option>
          <option value="mejora">Mejora</option>
        </Select>
      </div>
      <Textarea label="Descripción*" value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))} />
      <Textarea label="Causa Raíz" value={form.causa_raiz} onChange={e => setForm(f => ({ ...f, causa_raiz: e.target.value }))} />
      <Textarea label="Acción Propuesta*" value={form.accion_propuesta} onChange={e => setForm(f => ({ ...f, accion_propuesta: e.target.value }))} />
      <Input label="Fecha de Implementación*" type="date" value={form.fecha_implementacion} onChange={e => setForm(f => ({ ...f, fecha_implementacion: e.target.value }))} />
      <div className="flex justify-end pt-2">
        <Button onClick={() => onSubmit(form)} loading={loading}>Crear CAPA</Button>
      </div>
    </div>
  );
}
