'use client';
import React, { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import {
  Card, CardContent, CardHeader, CardTitle,
  Button, Modal, Input, Select, Textarea,
  EmptyState, SkeletonCard, Badge,
} from '@/components/ui';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { procesosApi, apiHelpers } from '@/lib/api';
import { Plus, GitBranch, ChevronRight, ChevronDown, Download, Layers } from 'lucide-react';
import { useToast } from '@/components/ui/ToastProvider';
import { useAuth } from '@/context/AuthContext';
import { cn, getErrorMessage, downloadBlob } from '@/lib/utils';

const TIPO_COLORS: Record<string, string> = {
  estrategico: 'bg-blue-100 text-blue-700',
  misional: 'bg-green-100 text-green-700',
  apoyo: 'bg-yellow-100 text-yellow-700',
};

export default function ProcesosPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { hasRole } = useAuth();
  const canEdit = hasRole('admin', 'gestor_calidad');

  const [expandidos, setExpandidos] = useState<Record<string, boolean>>({});
  const [procesoSel, setProcesoSel] = useState<any>(null);
  const [showCreateMacro, setShowCreateMacro] = useState(false);
  const [showCreateProceso, setShowCreateProceso] = useState<string | null>(null);
  const [showCreateActividad, setShowCreateActividad] = useState<string | null>(null);

  const { data: macrosData, isLoading } = useQuery({
    queryKey: ['macroprocesos'],
    queryFn: () => procesosApi.listarMacroprocesos().then(r => r.data.data),
  });

  const { data: procesoDetalle } = useQuery({
    queryKey: ['proceso-detalle', procesoSel?.id],
    queryFn: () => procesosApi.obtener(procesoSel.id).then(r => r.data.data),
    enabled: !!procesoSel?.id,
  });

  const crearMacroMut = useMutation({
    mutationFn: (d: object) => procesosApi.crearMacroproceso(d),
    onSuccess: () => { toast('success', 'Macroproceso creado'); qc.invalidateQueries({ queryKey: ['macroprocesos'] }); setShowCreateMacro(false); },
    onError: (e) => toast('error', getErrorMessage(e)),
  });

  const crearProcesoMut = useMutation({
    mutationFn: (d: object) => procesosApi.crear(d),
    onSuccess: () => { toast('success', 'Proceso creado'); qc.invalidateQueries({ queryKey: ['macroprocesos'] }); setShowCreateProceso(null); },
    onError: (e) => toast('error', getErrorMessage(e)),
  });

  const crearActMut = useMutation({
    mutationFn: ({ procesoId, data }: { procesoId: string; data: object }) => procesosApi.crearActividad(procesoId, data),
    onSuccess: () => { toast('success', 'Actividad creada'); qc.invalidateQueries({ queryKey: ['proceso-detalle', showCreateActividad] }); setShowCreateActividad(null); },
    onError: (e) => toast('error', getErrorMessage(e)),
  });

  const downloadPDF = async () => {
    try {
      const res = await procesosApi.reporte();
      downloadBlob(res.data, 'mapa-procesos.pdf');
      toast('success', 'PDF generado');
    } catch { toast('error', 'Error al generar PDF'); }
  };

  const toggleExpand = (id: string) => setExpandidos(e => ({ ...e, [id]: !e[id] }));
  const macros = macrosData || [];

  return (
    <AppLayout title="Mapa de Procesos">
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Mapa de Procesos</h2>
            <p className="text-sm text-gray-500">Estructura jerárquica de procesos institucionales</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" icon={<Download className="w-4 h-4" />} onClick={downloadPDF}>Reporte PDF</Button>
            {canEdit && <Button size="sm" icon={<Plus className="w-4 h-4" />} onClick={() => setShowCreateMacro(true)}>Nuevo Macroproceso</Button>}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Panel izquierdo — árbol */}
          <div className="lg:col-span-1 space-y-3">
            {isLoading ? <SkeletonCard /> : macros.length === 0 ? (
              <EmptyState message="Sin macroprocesos" action={canEdit && <Button size="sm" onClick={() => setShowCreateMacro(true)}>Crear</Button>} />
            ) : macros.map((macro: any) => (
              <Card key={macro.id} className="overflow-hidden">
                <div
                  className="flex items-center gap-2 px-4 py-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  onClick={() => toggleExpand(macro.id)}
                >
                  {expandidos[macro.id] ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                  <Layers className="w-4 h-4 text-unt-primary" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-gray-800 dark:text-gray-200 truncate">{macro.codigo}</p>
                    <p className="text-xs text-gray-500 truncate">{macro.nombre}</p>
                  </div>
                  <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', TIPO_COLORS[macro.tipo] || 'bg-gray-100 text-gray-600')}>
                    {macro.tipo}
                  </span>
                </div>

                {expandidos[macro.id] && (
                  <div className="border-t dark:border-gray-800">
                    {(macro.procesos || []).map((proc: any) => (
                      <div
                        key={proc.id}
                        className={cn(
                          'flex items-center gap-2 px-6 py-2.5 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-colors border-b dark:border-gray-800 last:border-0',
                          procesoSel?.id === proc.id && 'bg-blue-50 dark:bg-blue-900/20 text-unt-primary'
                        )}
                        onClick={() => setProcesoSel(proc)}
                      >
                        <GitBranch className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                        <span className="text-sm truncate">{proc.codigo} — {proc.nombre}</span>
                      </div>
                    ))}
                    {canEdit && (
                      <button
                        className="w-full flex items-center gap-2 px-6 py-2 text-xs text-unt-primary hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-colors"
                        onClick={() => setShowCreateProceso(macro.id)}
                      >
                        <Plus className="w-3.5 h-3.5" /> Agregar proceso
                      </button>
                    )}
                  </div>
                )}
              </Card>
            ))}
          </div>

          {/* Panel derecho — detalle */}
          <div className="lg:col-span-2">
            {!procesoSel ? (
              <Card className="h-full flex items-center justify-center min-h-[400px]">
                <EmptyState message="Seleccione un proceso" description="Haga clic en un proceso del árbol para ver su detalle" />
              </Card>
            ) : (
              <div className="space-y-4">
                {/* Info proceso */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-mono text-xs bg-unt-light text-unt-primary px-2 py-0.5 rounded font-bold">{procesoDetalle?.codigo || procesoSel.codigo}</span>
                        <CardTitle className="mt-1">{procesoDetalle?.nombre || procesoSel.nombre}</CardTitle>
                      </div>
                      {canEdit && (
                        <Button size="sm" icon={<Plus className="w-4 h-4" />} onClick={() => setShowCreateActividad(procesoSel.id)}>
                          Actividad
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      {procesoDetalle?.objetivo && (
                        <div>
                          <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Objetivo</p>
                          <p className="text-gray-700 dark:text-gray-300">{procesoDetalle.objetivo}</p>
                        </div>
                      )}
                      {procesoDetalle?.alcance && (
                        <div>
                          <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Alcance</p>
                          <p className="text-gray-700 dark:text-gray-300">{procesoDetalle.alcance}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Actividades */}
                <Card>
                  <CardHeader><CardTitle>Actividades ({procesoDetalle?.actividades?.length || 0})</CardTitle></CardHeader>
                  <CardContent className="space-y-2 py-3">
                    {(procesoDetalle?.actividades || []).length === 0 ? (
                      <p className="text-sm text-gray-400 text-center py-4">Sin actividades registradas</p>
                    ) : (procesoDetalle.actividades).map((act: any, idx: number) => (
                      <div key={act.id} className="flex gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                        <div className="w-7 h-7 rounded-full bg-unt-primary text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                          {act.secuencia || idx + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-gray-800 dark:text-gray-200">{act.nombre}</p>
                          {act.descripcion && <p className="text-xs text-gray-500 mt-0.5">{act.descripcion}</p>}
                          {(act.entradas || act.salidas) && (
                            <div className="flex gap-4 mt-1.5 text-xs">
                              {act.entradas && <span className="text-blue-600">↓ {act.entradas}</span>}
                              {act.salidas && <span className="text-green-600">↑ {act.salidas}</span>}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Documentos asociados */}
                {procesoDetalle?.documentos?.length > 0 && (
                  <Card>
                    <CardHeader><CardTitle>Documentos Asociados</CardTitle></CardHeader>
                    <CardContent className="space-y-2 py-3">
                      {procesoDetalle.documentos.map((d: any) => (
                        <div key={d.id} className="flex items-center gap-3 text-sm">
                          <span className="font-mono text-xs bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">{d.codigo}</span>
                          <span className="text-gray-700 dark:text-gray-300 flex-1">{d.titulo}</span>
                          <Badge variant={d.estado === 'aprobado' ? 'success' : 'default'}>{d.estado}</Badge>
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

      {/* Modals */}
      <Modal open={showCreateMacro} onClose={() => setShowCreateMacro(false)} title="Nuevo Macroproceso" size="md">
        <SimpleForm
          fields={[
            { name: 'codigo', label: 'Código*', placeholder: 'MP-EST-01' },
            { name: 'nombre', label: 'Nombre*', placeholder: 'Nombre del macroproceso' },
            { name: 'tipo', label: 'Tipo', type: 'select', options: [{ value: 'estrategico', label: 'Estratégico' }, { value: 'misional', label: 'Misional' }, { value: 'apoyo', label: 'Apoyo' }] },
            { name: 'descripcion', label: 'Descripción', type: 'textarea' },
          ]}
          onSubmit={crearMacroMut.mutate}
          loading={crearMacroMut.isPending}
          submitLabel="Crear Macroproceso"
        />
      </Modal>

      <Modal open={!!showCreateProceso} onClose={() => setShowCreateProceso(null)} title="Nuevo Proceso" size="md">
        <SimpleForm
          fields={[
            { name: 'codigo', label: 'Código*', placeholder: 'PRO-001' },
            { name: 'nombre', label: 'Nombre*', placeholder: 'Nombre del proceso' },
            { name: 'objetivo', label: 'Objetivo', type: 'textarea' },
            { name: 'alcance', label: 'Alcance', type: 'textarea' },
          ]}
          onSubmit={(d) => crearProcesoMut.mutate({ ...d, macroproceso_id: showCreateProceso })}
          loading={crearProcesoMut.isPending}
          submitLabel="Crear Proceso"
        />
      </Modal>

      <Modal open={!!showCreateActividad} onClose={() => setShowCreateActividad(null)} title="Nueva Actividad" size="md">
        <SimpleForm
          fields={[
            { name: 'nombre', label: 'Nombre*', placeholder: 'Nombre de la actividad' },
            { name: 'descripcion', label: 'Descripción', type: 'textarea' },
            { name: 'entradas', label: 'Entradas', placeholder: 'Entradas del proceso' },
            { name: 'salidas', label: 'Salidas', placeholder: 'Salidas del proceso' },
            { name: 'secuencia', label: 'Secuencia', type: 'number', placeholder: '1' },
          ]}
          onSubmit={(d) => crearActMut.mutate({ procesoId: showCreateActividad!, data: d })}
          loading={crearActMut.isPending}
          submitLabel="Crear Actividad"
        />
      </Modal>
    </AppLayout>
  );
}

// ── Helper: SimpleForm ────────────────────────────────────────
function SimpleForm({ fields, onSubmit, loading, submitLabel = 'Guardar' }: {
  fields: { name: string; label: string; type?: string; placeholder?: string; options?: { value: string; label: string }[] }[];
  onSubmit: (data: any) => void; loading: boolean; submitLabel?: string;
}) {
  const [form, setForm] = useState<Record<string, string>>({});
  return (
    <div className="space-y-4">
      {fields.map(f => (
        f.type === 'select' ? (
          <Select key={f.name} label={f.label} value={form[f.name] || ''} onChange={e => setForm(p => ({ ...p, [f.name]: e.target.value }))}>
            {f.options?.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </Select>
        ) : f.type === 'textarea' ? (
          <Textarea key={f.name} label={f.label} placeholder={f.placeholder} value={form[f.name] || ''} onChange={e => setForm(p => ({ ...p, [f.name]: e.target.value }))} />
        ) : (
          <Input key={f.name} label={f.label} placeholder={f.placeholder} type={f.type || 'text'} value={form[f.name] || ''} onChange={e => setForm(p => ({ ...p, [f.name]: e.target.value }))} />
        )
      ))}
      <div className="flex justify-end pt-2">
        <Button onClick={() => onSubmit(form)} loading={loading}>{submitLabel}</Button>
      </div>
    </div>
  );
}
