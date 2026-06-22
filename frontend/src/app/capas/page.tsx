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
import { capasApi, adminApi } from '@/lib/api';
import { formatDate, getErrorMessage, downloadBlob, truncate } from '@/lib/utils';
import { Plus, Download, RefreshCw, CheckCircle, AlertCircle, Trash2 } from 'lucide-react';
import { useToast } from '@/components/ui/ToastProvider';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';

const ESTADOS_CICLO = ['registrada', 'en_implementacion', 'implementada', 'verificada', 'cerrada'];
const ESTADO_LABELS: Record<string, string> = {
  registrada: 'Registrada', en_implementacion: 'En Implementación',
  implementada: 'Implementada', verificada: 'Verificada', cerrada: 'Cerrada',
};

function AvanceStepper({ estado, avance }: { estado: string, avance: number }) {
  const isRechazada = estado === 'rechazada';
  let idx = -1;
  if (!isRechazada) {
    if (avance > 0) idx = 0;
    if (avance >= 25) idx = 1;
    if (avance >= 50) idx = 2;
    if (avance >= 75) idx = 3;
    if (avance >= 100) idx = 5;
  }

  const NODOS = [1, 2, 3, 4, 5];

  return (
    <div className="flex items-center gap-0">
      {NODOS.map((n, i) => (
        <React.Fragment key={n}>
          <div
            className={cn(
              'flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-bold transition-all',
              isRechazada ? 'bg-red-200 dark:bg-red-900/40 text-red-400' :
              i < idx ? 'bg-green-500 text-white' :
              i === idx ? 'bg-unt-primary text-white ring-2 ring-unt-primary/30' :
              'bg-gray-200 dark:bg-gray-700 text-gray-500'
            )}
          >
            {!isRechazada && i < idx ? <CheckCircle className="w-3.5 h-3.5" /> : n}
          </div>
          {i < NODOS.length - 1 && (
            <div className={cn('h-0.5 w-5', !isRechazada && i < idx ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700')} />
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
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [estadoForm, setEstadoForm] = useState({ nuevo_estado: '', comentario: '', efectividad: '' });
  const [seguimientoForm, setSeguimientoForm] = useState({ avance_porcentaje: 0, observaciones: '' });

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['capas', page, filters],
    queryFn: () => capasApi.listar({ page, limit: 15, ...filters }).then(r => r.data),
  });

  const { data: capaDetalle } = useQuery({
    queryKey: ['capa-detalle', selected?.id],
    queryFn: () => capasApi.obtener(selected.id).then(r => r.data.data),
    enabled: !!selected?.id,
  });

  const { data: usuariosData } = useQuery({
    queryKey: ['usuarios'],
    queryFn: () => adminApi.usuarios.listar({ limit: 100 }).then(r => r.data),
  });
  const usuarios = usuariosData?.data || [];

  const crearMut = useMutation({
    mutationFn: (d: object) => capasApi.crear(d),
    onSuccess: () => { toast('success', 'CAPA creada'); qc.invalidateQueries({ queryKey: ['capas'] }); setShowCreate(false); },
    onError: (e) => toast('error', getErrorMessage(e)),
  });

  const estadoMut = useMutation({
    mutationFn: (d: object) => capasApi.cambiarEstado(selected.id, d),
    onSuccess: () => {
      toast('success', 'Estado actualizado');
      qc.invalidateQueries({ queryKey: ['capas'] });
      qc.invalidateQueries({ queryKey: ['capa-detalle'] });
      setShowEstado(false);
      // Actualizar el estado del seleccionado localmente
      setSelected((prev: any) => prev ? { ...prev, estado: (estadoMut.variables as any)?.nuevo_estado || prev.estado } : null);
    },
    onError: (e) => toast('error', getErrorMessage(e)),
  });

  const eliminarMut = useMutation({
    mutationFn: (id: string) => capasApi.eliminar(id),
    onSuccess: () => { toast('success', 'CAPA eliminada'); qc.invalidateQueries({ queryKey: ['capas'] }); setSelected(null); setShowConfirmDelete(false); },
    onError: (e) => { toast('error', getErrorMessage(e)); setShowConfirmDelete(false); },
  });

  const seguimientoMut = useMutation({
    mutationFn: (d: object) => capasApi.agregarSeguimiento(selected.id, d),
    onSuccess: () => { 
      toast('success', 'Seguimiento registrado'); 
      qc.invalidateQueries({ queryKey: ['capas'] });
      qc.invalidateQueries({ queryKey: ['capa-detalle'] }); 
      setShowSeguimiento(false); 
    },
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

  const isConfirmDisabled = estadoForm.nuevo_estado === 'rechazada' && !estadoForm.comentario.trim();

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
                            <Td className="min-w-[140px]">
                              <AvanceStepper estado={c.estado} avance={c.seguimientos?.[0]?.avance_porcentaje || 0} />
                            </Td>
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
                    {/* Barra de progreso del último seguimiento */}
                    {capaDetalle?.seguimientos?.length > 0 && (() => {
                      const lastSeg = capaDetalle.seguimientos[0];
                      const avance = lastSeg?.avance_porcentaje ?? 0;
                      return (
                        <div className="mt-3 space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-500 font-medium">Avance actual</span>
                            <span className={cn(
                              'text-sm font-bold',
                              avance >= 80 ? 'text-green-600 dark:text-green-400' :
                              avance >= 50 ? 'text-yellow-600 dark:text-yellow-400' :
                              'text-red-500'
                            )}>{avance}%</span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                            <div
                              className={cn(
                                'h-2 rounded-full transition-all duration-500',
                                avance >= 80 ? 'bg-green-500' : avance >= 50 ? 'bg-yellow-400' : 'bg-red-500'
                              )}
                              style={{ width: `${avance}%` }}
                            />
                          </div>
                        </div>
                      );
                    })()}
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div>
                      <p className="text-xs text-gray-500 font-semibold uppercase">Descripción</p>
                      <p className="text-gray-700 dark:text-gray-300 mt-0.5">{capaDetalle?.descripcion || selected.descripcion}</p>
                    </div>
                    {(capaDetalle?.causa_raiz || selected.causa_raiz) && (
                      <div>
                        <p className="text-xs text-gray-500 font-semibold uppercase">Causa Raíz</p>
                        <p className="text-gray-700 dark:text-gray-300 mt-0.5">{capaDetalle?.causa_raiz || selected.causa_raiz}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-xs text-gray-500 font-semibold uppercase">Acción Propuesta</p>
                      <p className="text-gray-700 dark:text-gray-300 mt-0.5">{capaDetalle?.accion_propuesta || selected.accion_propuesta}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <div><p className="text-xs text-gray-500">Responsable</p><p className="font-medium">{capaDetalle?.responsable ? `${capaDetalle.responsable.nombre} ${capaDetalle.responsable.apellido}` : '—'}</p></div>
                      <div><p className="text-xs text-gray-500">Fecha Impl.</p><p className="font-medium">{formatDate(capaDetalle?.fecha_implementacion || selected.fecha_implementacion)}</p></div>
                    </div>
                    {(capaDetalle?.efectividad || selected.efectividad) && (
                      <div>
                        <p className="text-xs text-gray-500">Efectividad</p>
                        <Badge variant={(capaDetalle?.efectividad || selected.efectividad) === 'efectiva' ? 'success' : (capaDetalle?.efectividad || selected.efectividad) === 'parcialmente_efectiva' || (capaDetalle?.efectividad || selected.efectividad) === 'par' ? 'warning' : 'danger'}>
                          {(capaDetalle?.efectividad || selected.efectividad).replace(/_/g,' ')}
                        </Badge>
                      </div>
                    )}

                    {canEdit && TRANSICIONES[capaDetalle?.estado || selected.estado] && (
                      <div className="flex flex-col gap-2 pt-2">
                        <Button size="sm" onClick={() => { setEstadoForm({ nuevo_estado: TRANSICIONES[capaDetalle?.estado || selected.estado]?.[0] || '', comentario: '', efectividad: '' }); setShowEstado(true); }}>
                          Cambiar Estado
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => {
                          // Pre-fill with last known avance
                          const lastSeg = capaDetalle?.seguimientos?.[0];
                          setSeguimientoForm({ avance_porcentaje: lastSeg?.avance_porcentaje ?? 0, observaciones: '' });
                          setShowSeguimiento(true);
                        }}>
                          + Seguimiento
                        </Button>
                      </div>
                    )}

                    {canEdit && (
                      <Button size="sm" variant="danger" className="w-full mt-2" icon={<Trash2 className="w-3.5 h-3.5" />}
                        onClick={() => setShowConfirmDelete(true)}>
                        Eliminar CAPA
                      </Button>
                    )}
                  </CardContent>
                </Card>

                {/* Seguimientos */}
                {capaDetalle?.seguimientos?.length > 0 && (
                  <Card>
                    <CardHeader><CardTitle>Seguimientos ({capaDetalle.seguimientos.length})</CardTitle></CardHeader>
                    <CardContent className="space-y-3 py-3 font-sans">
                      {capaDetalle.seguimientos.map((s: any) => (
                        <div key={s.id} className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800 text-sm border border-gray-100 dark:border-gray-700">
                          <div className="flex items-center justify-between mb-1">
                            <ProgressBar value={s.avance_porcentaje} color={s.avance_porcentaje >= 80 ? 'green' : s.avance_porcentaje >= 50 ? 'yellow' : 'red'} />
                          </div>
                          {s.observaciones && <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{s.observaciones}</p>}
                          <div className="flex justify-between items-center mt-2 text-[10px] text-gray-400">
                            <span>Registrado por: {s.registrador ? `${s.registrador.nombre} ${s.registrador.apellido}` : '—'}</span>
                            <span>{formatDate(s.creado_en, 'dd/MM/yyyy HH:mm')}</span>
                          </div>
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
        <CapaForm onSubmit={crearMut.mutate} loading={crearMut.isPending} usuarios={usuarios} />
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
              <option value="parcial">Parcial</option>
              <option value="no_efectiva">No Efectiva</option>
            </Select>
          )}
          <Textarea 
            label={estadoForm.nuevo_estado === 'rechazada' ? 'Comentario (Obligatorio)*' : 'Comentario'} 
            value={estadoForm.comentario} 
            onChange={e => setEstadoForm(f => ({ ...f, comentario: e.target.value }))}
            placeholder={estadoForm.nuevo_estado === 'rechazada' ? 'Debe detallar la justificación del rechazo...' : 'Ingrese comentarios u observaciones...'}
          />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={() => setShowEstado(false)}>Cancelar</Button>
            <Button size="sm" onClick={() => {
              // Strip empty efectividad so Joi doesn't get an empty string
              const payload: any = { ...estadoForm };
              if (!payload.efectividad) delete payload.efectividad;
              estadoMut.mutate(payload);
            }} loading={estadoMut.isPending} disabled={isConfirmDisabled}>
              Confirmar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal seguimiento */}
      <Modal open={showSeguimiento} onClose={() => setShowSeguimiento(false)} title="Registrar Seguimiento" size="sm">
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Avance actual</label>
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  placeholder="0"
                  value={seguimientoForm.avance_porcentaje === 0 ? '' : seguimientoForm.avance_porcentaje}
                  onChange={e => {
                    if (e.target.value === '') {
                      setSeguimientoForm(f => ({ ...f, avance_porcentaje: 0 }));
                      return;
                    }
                    const num = parseInt(e.target.value.replace(/\D/g, ''), 10);
                    if (!isNaN(num)) {
                      setSeguimientoForm(f => ({ ...f, avance_porcentaje: Math.min(100, num) }));
                    }
                  }}
                  className={cn(
                    "w-16 text-center text-lg font-black rounded-md px-1 py-0.5 focus:outline-none focus:ring-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 transition-colors",
                    seguimientoForm.avance_porcentaje >= 80 ? 'text-green-600 focus:ring-green-500' :
                    seguimientoForm.avance_porcentaje >= 50 ? 'text-yellow-500 focus:ring-yellow-500' : 'text-red-500 focus:ring-red-500'
                  )}
                />
                <span className="text-lg font-bold text-gray-500">%</span>
              </div>
            </div>
            <input
              type="range" min={0} max={100} step={1}
              value={seguimientoForm.avance_porcentaje}
              onChange={e => setSeguimientoForm(f => ({ ...f, avance_porcentaje: parseInt(e.target.value) }))}
              className="w-full accent-unt-primary h-2 cursor-pointer" />
            <div className="flex justify-between text-[10px] text-gray-400">
              <span>0%</span><span>25%</span><span>50%</span><span>75%</span><span>100%</span>
            </div>
            {/* Barra de vista previa */}
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
              <div
                className={cn(
                  'h-2.5 rounded-full transition-all duration-300',
                  seguimientoForm.avance_porcentaje >= 80 ? 'bg-green-500' :
                  seguimientoForm.avance_porcentaje >= 50 ? 'bg-yellow-400' : 'bg-red-500'
                )}
                style={{ width: `${seguimientoForm.avance_porcentaje}%` }}
              />
            </div>
          </div>
          <Textarea label="Observaciones" placeholder="Describa el avance o novedades del periodo..." value={seguimientoForm.observaciones} onChange={e => setSeguimientoForm(f => ({ ...f, observaciones: e.target.value }))} />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={() => setShowSeguimiento(false)}>Cancelar</Button>
            <Button size="sm" onClick={() => seguimientoMut.mutate(seguimientoForm)} loading={seguimientoMut.isPending}>Guardar</Button>
          </div>
        </div>
      </Modal>

      {/* Modal confirmar eliminación */}
      <Modal open={showConfirmDelete} onClose={() => setShowConfirmDelete(false)} title="Confirmar Eliminación" size="sm">
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-700 dark:text-red-400">Esta acción no se puede deshacer</p>
              <p className="text-xs text-red-600 dark:text-red-300 mt-1">
                Va a eliminar la CAPA <span className="font-mono font-bold">{selected?.codigo}</span> y todos sus seguimientos.
                {!['rechazada','cerrada'].includes(selected?.estado) && (
                  <span className="block mt-1 font-semibold">⚠ Solo se puede eliminar una CAPA activa si no tiene seguimientos manuales registrados.</span>
                )}
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={() => setShowConfirmDelete(false)}>Cancelar</Button>
            <Button variant="danger" size="sm" loading={eliminarMut.isPending} onClick={() => eliminarMut.mutate(selected.id)}>
              Sí, eliminar
            </Button>
          </div>
        </div>
      </Modal>
    </AppLayout>
  );
}

function CapaForm({ onSubmit, loading, usuarios }: { onSubmit: (d: any) => void; loading: boolean; usuarios: any[] }) {
  const [form, setForm] = useState({ codigo: '', tipo: 'correctiva', descripcion: '', causa_raiz: '', accion_propuesta: '', responsable_id: '', fecha_implementacion: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateField = (name: string, value: string) => {
    if (['codigo', 'descripcion', 'accion_propuesta', 'fecha_implementacion'].includes(name)) {
      if (!value || value.trim() === '') return 'Este campo es requerido';
    }
    if (name === 'codigo' && value && !/^[A-Z0-9-]+$/.test(value)) {
      return 'Solo letras mayúsculas, números y guiones';
    }
    if (['descripcion', 'accion_propuesta'].includes(name) && value && value.trim().length < 5) {
      return 'Mínimo 5 caracteres';
    }
    return null;
  };

  const handleFieldChange = (name: string, value: string) => {
    setForm(p => ({ ...p, [name]: value }));
    const err = validateField(name, value);
    setErrors(e => {
      const newE = { ...e };
      if (err) newE[name] = err;
      else delete newE[name];
      return newE;
    });
  };

  const handleValidateAll = () => {
    const errs: Record<string, string> = {};
    Object.keys(form).forEach(key => {
      const err = validateField(key, (form as any)[key]);
      if (err) errs[key] = err;
    });
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = () => {
    if (handleValidateAll()) {
      onSubmit(form);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Input label="Código*" placeholder="Ej: CAP-2024-001" value={form.codigo} onChange={e => handleFieldChange('codigo', e.target.value)} error={errors.codigo} />
        <Select label="Tipo" value={form.tipo} onChange={e => handleFieldChange('tipo', e.target.value)}>
          <option value="correctiva">Correctiva</option>
          <option value="preventiva">Preventiva</option>
          <option value="mejora">Mejora</option>
        </Select>
      </div>
      <Textarea label="Descripción*" value={form.descripcion} onChange={e => handleFieldChange('descripcion', e.target.value)} error={errors.descripcion} />
      <Textarea label="Causa Raíz" value={form.causa_raiz} onChange={e => handleFieldChange('causa_raiz', e.target.value)} />
      <Textarea label="Acción Propuesta*" value={form.accion_propuesta} onChange={e => handleFieldChange('accion_propuesta', e.target.value)} error={errors.accion_propuesta} />
      
      <div className="grid grid-cols-2 gap-4">
        <Select label="Responsable" value={form.responsable_id} onChange={e => handleFieldChange('responsable_id', e.target.value)}>
          <option value="">Seleccionar responsable...</option>
          {usuarios.map(u => <option key={u.id} value={u.id}>{u.nombre} {u.apellido} ({u.rol})</option>)}
        </Select>
        <Input label="Fecha de Implementación*" type="date" value={form.fecha_implementacion} onChange={e => handleFieldChange('fecha_implementacion', e.target.value)} error={errors.fecha_implementacion} />
      </div>

      <div className="flex justify-end pt-2">
        <Button onClick={handleSubmit} loading={loading}>Crear CAPA</Button>
      </div>
    </div>
  );
}
