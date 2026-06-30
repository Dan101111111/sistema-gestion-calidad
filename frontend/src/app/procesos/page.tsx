'use client';
import React, { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import {
  Card, CardContent, CardHeader, CardTitle,
  Button, Modal, Input, Select, Textarea,
  EmptyState, SkeletonCard, Badge,
} from '@/components/ui';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { procesosApi, adminApi } from '@/lib/api';
import {
  Plus, GitBranch, ChevronRight, ChevronDown, Download, Layers,
  Edit, Trash, ArrowUp, ArrowDown, Users, Eye, Code, Play, RefreshCw, AlertCircle
} from 'lucide-react';
import { useToast } from '@/components/ui/ToastProvider';
import { useAuth } from '@/context/AuthContext';
import { cn, getErrorMessage, downloadBlob } from '@/lib/utils';

// Colores Glowing para los tipos de macroproceso
const TIPO_COLORS: Record<string, string> = {
  estrategico: 'border-blue-500/30 text-blue-600 dark:text-blue-400 bg-blue-500/5 dark:bg-blue-500/10 shadow-[0_0_8px_rgba(59,130,246,0.15)]',
  misional: 'border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5 dark:bg-emerald-500/10 shadow-[0_0_8px_rgba(16,185,129,0.15)]',
  apoyo: 'border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-500/5 dark:bg-amber-500/10 shadow-[0_0_8px_rgba(245,158,11,0.15)]',
  evaluacion: 'border-purple-500/30 text-purple-600 dark:text-purple-400 bg-purple-500/5 dark:bg-purple-500/10 shadow-[0_0_8px_rgba(168,85,247,0.15)]',
};

// Badges Glowing para estados del proceso
const ESTADO_VARIANTS: Record<string, string> = {
  activo: 'success',
  inactivo: 'danger',
  en_mejora: 'primary',
};

export default function ProcesosPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { hasRole } = useAuth();
  const canEdit = hasRole('admin', 'gestor_calidad');

  const [expandidos, setExpandidos] = useState<Record<string, boolean>>({});
  const [procesoSel, setProcesoSel] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Estados de Modales
  const [showCreateMacro, setShowCreateMacro] = useState(false);
  const [showEditMacro, setShowEditMacro] = useState<any>(null);
  const [showCreateProceso, setShowCreateProceso] = useState<string | null>(null);
  const [showEditProceso, setShowEditProceso] = useState<any>(null);
  const [showCreateActividad, setShowCreateActividad] = useState<string | null>(null);
  const [showEditActividad, setShowEditActividad] = useState<any>(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState<any>(null);
  const [showFlowModal, setShowFlowModal] = useState<any>(null);

  // Queries
  const { data: macrosData, isLoading } = useQuery({
    queryKey: ['macroprocesos'],
    queryFn: () => procesosApi.listarMacroprocesos().then(r => r.data.data),
  });

  const { data: procesoDetalle, refetch: refetchDetalle } = useQuery({
    queryKey: ['proceso-detalle', procesoSel?.id],
    queryFn: () => procesosApi.obtener(procesoSel.id).then(r => r.data.data),
    enabled: !!procesoSel?.id,
  });

  const { data: usuariosData } = useQuery({
    queryKey: ['usuarios'],
    queryFn: () => adminApi.usuarios.listar({ limit: 100, activo: 'true' }).then(r => r.data.data),
  });

  // Mutaciones Macroprocesos
  const crearMacroMut = useMutation({
    mutationFn: (d: object) => procesosApi.crearMacroproceso(d),
    onSuccess: () => {
      toast('success', 'Macroproceso creado exitosamente');
      qc.invalidateQueries({ queryKey: ['macroprocesos'] });
      setShowCreateMacro(false);
    },
    onError: (e) => toast('error', getErrorMessage(e)),
  });

  const editarMacroMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: object }) => procesosApi.actualizarMacroproceso(id, data),
    onSuccess: () => {
      toast('success', 'Macroproceso actualizado exitosamente');
      qc.invalidateQueries({ queryKey: ['macroprocesos'] });
      setShowEditMacro(null);
    },
    onError: (e) => toast('error', getErrorMessage(e)),
  });

  const eliminarMacroMut = useMutation({
    mutationFn: (id: string) => procesosApi.eliminarMacroproceso(id),
    onSuccess: () => {
      toast('success', 'Macroproceso eliminado');
      qc.invalidateQueries({ queryKey: ['macroprocesos'] });
      setShowConfirmDelete(null);
    },
    onError: (e) => toast('error', getErrorMessage(e)),
  });

  // Mutaciones Procesos
  const crearProcesoMut = useMutation({
    mutationFn: (d: object) => procesosApi.crear(d),
    onSuccess: () => {
      toast('success', 'Proceso creado exitosamente');
      qc.invalidateQueries({ queryKey: ['macroprocesos'] });
      setShowCreateProceso(null);
    },
    onError: (e) => toast('error', getErrorMessage(e)),
  });

  const editarProcesoMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: object }) => procesosApi.actualizar(id, data),
    onSuccess: () => {
      toast('success', 'Proceso actualizado exitosamente');
      qc.invalidateQueries({ queryKey: ['macroprocesos'] });
      if (procesoSel?.id) {
        qc.invalidateQueries({ queryKey: ['proceso-detalle', procesoSel.id] });
      }
      setShowEditProceso(null);
    },
    onError: (e) => toast('error', getErrorMessage(e)),
  });

  const eliminarProcesoMut = useMutation({
    mutationFn: (id: string) => procesosApi.eliminarProceso(id),
    onSuccess: () => {
      toast('success', 'Proceso eliminado exitosamente');
      qc.invalidateQueries({ queryKey: ['macroprocesos'] });
      setProcesoSel(null);
      setShowConfirmDelete(null);
    },
    onError: (e) => toast('error', getErrorMessage(e)),
  });

  // Mutaciones Actividades
  const crearActMut = useMutation({
    mutationFn: ({ procesoId, data }: { procesoId: string; data: object }) => procesosApi.crearActividad(procesoId, data),
    onSuccess: () => {
      toast('success', 'Actividad creada');
      qc.invalidateQueries({ queryKey: ['proceso-detalle', procesoSel?.id] });
      setShowCreateActividad(null);
    },
    onError: (e) => toast('error', getErrorMessage(e)),
  });

  const editarActMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: object }) => procesosApi.actualizarActividad(id, data),
    onSuccess: () => {
      toast('success', 'Actividad actualizada');
      qc.invalidateQueries({ queryKey: ['proceso-detalle', procesoSel?.id] });
      setShowEditActividad(null);
    },
    onError: (e) => toast('error', getErrorMessage(e)),
  });

  const eliminarActMut = useMutation({
    mutationFn: (id: string) => procesosApi.eliminarActividad(id),
    onSuccess: () => {
      toast('success', 'Actividad eliminada');
      qc.invalidateQueries({ queryKey: ['proceso-detalle', procesoSel?.id] });
      setShowConfirmDelete(null);
    },
    onError: (e) => toast('error', getErrorMessage(e)),
  });

  const reordenarActMut = useMutation({
    mutationFn: ({ procesoId, ids }: { procesoId: string; ids: string[] }) => procesosApi.reordenarActividades(procesoId, ids),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['proceso-detalle', procesoSel?.id] });
      toast('success', 'Secuencia de actividades actualizada');
    },
    onError: (e) => toast('error', getErrorMessage(e)),
  });

  const guardarFlujoMut = useMutation({
    mutationFn: ({ procesoId, data }: { procesoId: string; data: object }) => procesosApi.guardarFlujo(procesoId, data),
    onSuccess: () => {
      toast('success', 'Flujo de trabajo guardado');
      qc.invalidateQueries({ queryKey: ['proceso-detalle', procesoSel?.id] });
      setShowFlowModal(null);
    },
    onError: (e) => toast('error', getErrorMessage(e)),
  });

  const downloadPDF = async () => {
    try {
      const res = await procesosApi.reporte();
      downloadBlob(res.data, 'mapa-procesos.pdf');
      toast('success', 'Reporte PDF descargado');
    } catch {
      toast('error', 'Error al descargar PDF');
    }
  };

  const toggleExpand = (id: string) => setExpandidos(e => ({ ...e, [id]: !e[id] }));

  // Reordenar actividades con botones subir / bajar
  const handleMoveActivity = (idx: number, direction: 'up' | 'down') => {
    if (!procesoDetalle?.actividades || !Array.isArray(procesoDetalle.actividades)) return;
    const list = [...procesoDetalle.actividades];
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= list.length) return;

    // Intercambiar
    const temp = list[idx];
    list[idx] = list[targetIdx];
    list[targetIdx] = temp;

    // Mapear a arreglo de IDs ordenados
    const ids = list.map((a: any) => a.id);
    reordenarActMut.mutate({ procesoId: procesoSel.id, ids });
  };

  // Filtrado de macroprocesos por barra de búsqueda
  const filterMacros = (macrosList: any[]) => {
    if (!Array.isArray(macrosList)) return [];
    if (!searchTerm) return macrosList;
    return macrosList.map((macro: any) => {
      const procesosFiltrados = (Array.isArray(macro?.procesos) ? macro.procesos : []).filter((p: any) =>
        p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.codigo.toLowerCase().includes(searchTerm.toLowerCase())
      );
      if (procesosFiltrados.length > 0 || macro?.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) || macro?.codigo?.toLowerCase().includes(searchTerm.toLowerCase())) {
        return { ...macro, procesos: procesosFiltrados };
      }
      return null;
    }).filter(Boolean);
  };

  const macros = filterMacros(Array.isArray(macrosData) ? macrosData : []);
  const usuarios = Array.isArray(usuariosData) ? usuariosData : [];

  return (
    <AppLayout title="Mapa de Procesos">
      <div className="space-y-6">
        {/* Encabezado */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-white/50 dark:bg-gray-950/30 backdrop-blur-md border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
              <Layers className="w-6 h-6 text-blue-500 animate-pulse" />
              Mapa de Procesos
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Estructura jerárquica de procesos institucionales y secuencia operativa.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" icon={<Download className="w-4 h-4" />} onClick={downloadPDF}>Reporte PDF</Button>
            {canEdit && <Button size="sm" icon={<Plus className="w-4 h-4" />} onClick={() => setShowCreateMacro(true)}>Nuevo Macroproceso</Button>}
          </div>
        </div>

        {/* Contenido Principal */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Panel izquierdo — buscador y árbol jerárquico */}
          <div className="lg:col-span-1 space-y-4">
            <div className="relative">
              <Input
                placeholder="Buscar macroprocesos o procesos..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10"
                icon={<Eye className="w-4 h-4 text-gray-400" />}
              />
            </div>

            <div className="space-y-3">
              {isLoading ? (
                <div className="space-y-3">
                  <SkeletonCard />
                  <SkeletonCard />
                </div>
              ) : !Array.isArray(macros) || macros.length === 0 ? (
                <EmptyState message="No se encontraron macroprocesos" description="Prueba con otros términos de búsqueda." />
              ) : (
                macros.map((macro: any) => {
                  const colorClass = TIPO_COLORS[macro.tipo] || 'bg-gray-100 dark:bg-gray-800 text-gray-600';
                  const isExpanded = expandidos[macro.id] || searchTerm.length > 0;
                  return (
                    <Card key={macro.id} className="overflow-hidden border border-gray-200/80 dark:border-gray-800/80 transition-all hover:shadow-md dark:shadow-black/20">
                      <div className="flex items-center gap-2 px-4 py-3 bg-gray-50/50 dark:bg-gray-900/30">
                        <div
                          className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer"
                          onClick={() => toggleExpand(macro.id)}
                        >
                          {isExpanded ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-bold text-gray-400">{macro.codigo}</span>
                              <span className={cn('text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border', colorClass)}>
                                {macro.tipo}
                              </span>
                            </div>
                            <p className="font-semibold text-sm text-gray-800 dark:text-gray-200 truncate mt-0.5">{macro.nombre}</p>
                            {macro.responsable && (
                              <p className="text-[11px] text-gray-500 truncate flex items-center gap-1 mt-0.5">
                                <Users className="w-3 h-3" /> Responsable: {macro.responsable.nombre} {macro.responsable.apellido}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Acciones Macroproceso */}
                        {canEdit && (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => setShowEditMacro(macro)}
                              className="p-1 text-gray-400 hover:text-blue-500 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                              title="Editar Macroproceso"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setShowConfirmDelete({ id: macro.id, type: 'macroproceso', name: macro.nombre })}
                              className="p-1 text-gray-400 hover:text-red-500 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                              title="Eliminar Macroproceso"
                            >
                              <Trash className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Procesos asociados */}
                      {isExpanded && (
                        <div className="border-t border-gray-100 dark:border-gray-800 bg-white/20 dark:bg-gray-950/20 divide-y divide-gray-100 dark:divide-gray-800">
                          {!Array.isArray(macro.procesos) || macro.procesos.length === 0 ? (
                            <p className="text-xs text-gray-400 dark:text-gray-500 text-center py-2">Sin procesos en este bloque</p>
                          ) : (
                            macro.procesos.map((proc: any) => (
                              <div
                                key={proc.id}
                                className={cn(
                                  'group flex items-center justify-between px-5 py-2.5 cursor-pointer hover:bg-blue-500/5 transition-all duration-150',
                                  procesoSel?.id === proc.id && 'bg-blue-500/10 dark:bg-blue-500/15 border-l-2 border-blue-500'
                                )}
                                onClick={() => setProcesoSel(proc)}
                              >
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  <GitBranch className={cn('w-3.5 h-3.5 text-gray-400', procesoSel?.id === proc.id && 'text-blue-500')} />
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5">
                                      <span className="font-mono text-[10px] font-bold text-gray-400">{proc.codigo}</span>
                                      <Badge variant={ESTADO_VARIANTS[proc.estado] || 'default'} className="text-[9px] py-0 px-1.5 scale-90">
                                        {proc.estado}
                                      </Badge>
                                    </div>
                                    <p className="text-xs text-gray-700 dark:text-gray-300 font-medium truncate mt-0.5">{proc.nombre}</p>
                                  </div>
                                </div>

                                {/* Acciones Proceso en lista */}
                                {canEdit && (
                                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                      onClick={(e) => { e.stopPropagation(); setShowEditProceso(proc); }}
                                      className="p-0.5 text-gray-400 hover:text-blue-500 rounded"
                                      title="Editar Proceso"
                                    >
                                      <Edit className="w-3 h-3" />
                                    </button>
                                    <button
                                      onClick={(e) => { e.stopPropagation(); setShowConfirmDelete({ id: proc.id, type: 'proceso', name: proc.nombre }); }}
                                      className="p-0.5 text-gray-400 hover:text-red-500 rounded"
                                      title="Eliminar Proceso"
                                    >
                                      <Trash className="w-3 h-3" />
                                    </button>
                                  </div>
                                )}
                              </div>
                            ))
                          )}
                          {canEdit && (
                            <button
                              className="w-full flex items-center justify-center gap-1.5 py-2 text-xs text-blue-500 hover:bg-blue-500/5 dark:hover:bg-blue-500/10 font-semibold transition-colors"
                              onClick={() => setShowCreateProceso(macro.id)}
                            >
                              <Plus className="w-3.5 h-3.5" /> Agregar proceso
                            </button>
                          )}
                        </div>
                      )}
                    </Card>
                  );
                })
              )}
            </div>
          </div>

          {/* Panel derecho — Detalle del proceso seleccionado */}
          <div className="lg:col-span-2">
            {!procesoSel ? (
              <Card className="h-full flex items-center justify-center min-h-[450px] border-dashed border-2 border-gray-200 dark:border-gray-800">
                <EmptyState
                  message="Seleccione un proceso"
                  description="Explore la estructura en el panel izquierdo y seleccione un proceso para visualizar sus actividades, flujos e indicadores asociados."
                />
              </Card>
            ) : (
              <div className="space-y-6">
                {/* Info Proceso */}
                <Card className="border border-gray-200/80 dark:border-gray-800/80 shadow-md">
                  <CardHeader className="pb-4 bg-gray-50/50 dark:bg-gray-900/30">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 px-2.5 py-0.5 rounded font-bold">
                            {procesoDetalle?.codigo || procesoSel.codigo}
                          </span>
                          <Badge variant={ESTADO_VARIANTS[procesoDetalle?.estado || procesoSel.estado] || 'default'}>
                            {procesoDetalle?.estado || procesoSel.estado}
                          </Badge>
                          {procesoDetalle?.macroproceso && (
                            <span className="text-xs text-gray-400">
                              (Pertenece a {procesoDetalle.macroproceso.nombre})
                            </span>
                          )}
                        </div>
                        <CardTitle className="text-xl mt-1.5">{procesoDetalle?.nombre || procesoSel.nombre}</CardTitle>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          icon={<Code className="w-3.5 h-3.5 text-purple-500" />}
                          onClick={() => setShowFlowModal(procesoSel.id)}
                        >
                          Ver flujo
                        </Button>
                        {canEdit && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              icon={<Edit className="w-3.5 h-3.5 text-blue-500" />}
                              onClick={() => setShowEditProceso(procesoDetalle || procesoSel)}
                            >
                              Editar
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              icon={<Trash className="w-3.5 h-3.5 text-red-500" />}
                              onClick={() => setShowConfirmDelete({ id: procesoSel.id, type: 'proceso', name: procesoSel.nombre })}
                            >
                              Eliminar
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                      <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Objetivo</p>
                        <p className="text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg border dark:border-gray-800">
                          {procesoDetalle?.objetivo || 'Sin objetivo estratégico definido.'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Alcance</p>
                        <p className="text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg border dark:border-gray-800">
                          {procesoDetalle?.alcance || 'Sin alcance operativo delimitado.'}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t dark:border-gray-800 flex flex-wrap items-center justify-between gap-4 text-xs text-gray-500">
                      {procesoDetalle?.responsable && (
                        <span className="flex items-center gap-1.5 font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800/60 px-3 py-1 rounded-full">
                          <Users className="w-3.5 h-3.5 text-gray-400" />
                          Líder Responsable: {procesoDetalle.responsable.nombre} {procesoDetalle.responsable.apellido}
                        </span>
                      )}
                      <span>
                        Creado en: {procesoDetalle?.creado_en ? new Date(procesoDetalle.creado_en).toLocaleDateString() : '—'}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {/* Cronología de Actividades */}
                <Card className="border border-gray-200/80 dark:border-gray-800/80 shadow-md">
                  <CardHeader className="pb-3 border-b dark:border-gray-800 flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Play className="w-4 h-4 text-emerald-500" />
                      Secuencia Operativa de Actividades ({procesoDetalle?.actividades?.length || 0})
                    </CardTitle>
                    {canEdit && (
                      <Button
                        size="sm"
                        variant="primary"
                        icon={<Plus className="w-4 h-4" />}
                        onClick={() => setShowCreateActividad(procesoSel.id)}
                      >
                        Nueva Actividad
                      </Button>
                    )}
                  </CardHeader>
                  <CardContent className="py-4 space-y-4">
                    {!Array.isArray(procesoDetalle?.actividades) || procesoDetalle.actividades.length === 0 ? (
                      <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-6">
                        No hay actividades asignadas a este proceso. Comience agregando una.
                      </p>
                    ) : (
                      <div className="relative border-l-2 border-gray-200 dark:border-gray-800 ml-4 pl-6 space-y-5">
                        {procesoDetalle.actividades.map((act: any, idx: number) => (
                          <div key={act.id} className="relative group/item">
                            {/* Círculo brillante con número de secuencia */}
                            <span className="absolute -left-[35px] top-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-[10px] font-bold text-white shadow-[0_0_10px_rgba(59,130,246,0.3)]">
                              {act.secuencia}
                            </span>

                            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                              <div className="flex items-start justify-between gap-4">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono text-xs bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded text-gray-500 font-bold">
                                      {act.codigo}
                                    </span>
                                    <h4 className="font-semibold text-sm text-gray-900 dark:text-white">{act.nombre}</h4>
                                  </div>
                                  {act.descripcion && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{act.descripcion}</p>}
                                </div>

                                {/* Controles de Orden y Acciones (Subir / Bajar / Editar / Eliminar) */}
                                {canEdit && (
                                  <div className="flex items-center gap-1">
                                    <button
                                      disabled={idx === 0}
                                      onClick={() => handleMoveActivity(idx, 'up')}
                                      className="p-1 text-gray-400 hover:text-blue-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                      title="Subir Secuencia"
                                    >
                                      <ArrowUp className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      disabled={idx === (procesoDetalle.actividades.length - 1)}
                                      onClick={() => handleMoveActivity(idx, 'down')}
                                      className="p-1 text-gray-400 hover:text-blue-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                      title="Bajar Secuencia"
                                    >
                                      <ArrowDown className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => setShowEditActividad(act)}
                                      className="p-1 text-gray-400 hover:text-yellow-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
                                      title="Editar"
                                    >
                                      <Edit className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => setShowConfirmDelete({ id: act.id, type: 'actividad', name: act.nombre })}
                                      className="p-1 text-gray-400 hover:text-red-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
                                      title="Eliminar"
                                    >
                                      <Trash className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                )}
                              </div>

                              {/* Entradas, Salidas e Indicadores */}
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3 pt-3 border-t dark:border-gray-800/50 text-[11px] text-gray-500">
                                {act.entradas && (
                                  <div>
                                    <span className="font-bold block text-gray-400 uppercase tracking-wider mb-0.5">↓ Entradas</span>
                                    <span className="text-gray-700 dark:text-gray-300">{act.entradas}</span>
                                  </div>
                                )}
                                {act.salidas && (
                                  <div>
                                    <span className="font-bold block text-gray-400 uppercase tracking-wider mb-0.5">↑ Salidas</span>
                                    <span className="text-gray-700 dark:text-gray-300">{act.salidas}</span>
                                  </div>
                                )}
                                {act.indicadores && (
                                  <div>
                                    <span className="font-bold block text-gray-400 uppercase tracking-wider mb-0.5">⚙ Indicadores</span>
                                    <span className="text-gray-700 dark:text-gray-300">{act.indicadores}</span>
                                  </div>
                                )}
                              </div>

                              {/* Responsable de Actividad */}
                              {act.responsable && (
                                <div className="mt-2 text-[10px] text-gray-400 flex items-center gap-1">
                                  <Users className="w-3 h-3 text-gray-400" />
                                  Responsable: <span className="font-medium text-gray-600 dark:text-gray-400">{act.responsable.nombre} {act.responsable.apellido}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Grid Inferior de Referencias y Vinculaciones */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Documentos */}
                  <Card className="border border-gray-200/80 dark:border-gray-800/80 shadow-sm md:col-span-1">
                    <CardHeader className="py-3 bg-gray-50/50 dark:bg-gray-900/30">
                      <CardTitle className="text-xs uppercase tracking-wider text-gray-400 font-bold">Documentos Asociados</CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 space-y-2 max-h-[220px] overflow-y-auto">
                      {!Array.isArray(procesoDetalle?.documentos) || procesoDetalle.documentos.length === 0 ? (
                        <p className="text-[11px] text-gray-400 text-center py-4">Sin documentos vinculados</p>
                      ) : (
                        procesoDetalle.documentos.map((d: any) => (
                          <div key={d.id} className="flex flex-col p-2 bg-gray-50 dark:bg-gray-900/50 rounded-lg border dark:border-gray-800 text-xs">
                            <span className="font-mono text-[9px] font-bold text-gray-400">{d.codigo}</span>
                            <span className="font-semibold text-gray-800 dark:text-gray-200 truncate mt-0.5">{d.titulo}</span>
                            <Badge className="text-[8px] py-0 px-1 mt-1.5 self-start scale-95">{d.estado}</Badge>
                          </div>
                        ))
                      )}
                    </CardContent>
                  </Card>

                  {/* Riesgos */}
                  <Card className="border border-gray-200/80 dark:border-gray-800/80 shadow-sm md:col-span-1">
                    <CardHeader className="py-3 bg-gray-50/50 dark:bg-gray-900/30">
                      <CardTitle className="text-xs uppercase tracking-wider text-gray-400 font-bold">Riesgos Identificados</CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 space-y-2 max-h-[220px] overflow-y-auto">
                      {!Array.isArray(procesoDetalle?.riesgos) || procesoDetalle.riesgos.length === 0 ? (
                        <p className="text-[11px] text-gray-400 text-center py-4">Sin riesgos vinculados</p>
                      ) : (
                        procesoDetalle.riesgos.map((r: any) => (
                          <div key={r.id} className="flex flex-col p-2 bg-gray-50 dark:bg-gray-900/50 rounded-lg border dark:border-gray-800 text-xs">
                            <span className="font-mono text-[9px] font-bold text-gray-400">{r.codigo}</span>
                            <span className="font-semibold text-gray-800 dark:text-gray-200 truncate mt-0.5">{r.nombre}</span>
                            <Badge variant={r.estado === 'activo' ? 'danger' : 'success'} className="text-[8px] py-0 px-1 mt-1.5 self-start scale-95">{r.estado}</Badge>
                          </div>
                        ))
                      )}
                    </CardContent>
                  </Card>

                  {/* Indicadores */}
                  <Card className="border border-gray-200/80 dark:border-gray-800/80 shadow-sm md:col-span-1">
                    <CardHeader className="py-3 bg-gray-50/50 dark:bg-gray-900/30">
                      <CardTitle className="text-xs uppercase tracking-wider text-gray-400 font-bold">Indicadores de Gestión</CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 space-y-2 max-h-[220px] overflow-y-auto">
                      {!Array.isArray(procesoDetalle?.indicadores) || procesoDetalle.indicadores.length === 0 ? (
                        <p className="text-[11px] text-gray-400 text-center py-4">Sin indicadores vinculados</p>
                      ) : (
                        procesoDetalle.indicadores.map((i: any) => (
                          <div key={i.id} className="flex flex-col p-2 bg-gray-50 dark:bg-gray-900/50 rounded-lg border dark:border-gray-800 text-xs">
                            <span className="font-mono text-[9px] font-bold text-gray-400">{i.codigo}</span>
                            <span className="font-semibold text-gray-800 dark:text-gray-200 truncate mt-0.5">{i.nombre}</span>
                            <Badge variant={i.activo ? 'success' : 'default'} className="text-[8px] py-0 px-1 mt-1.5 self-start scale-95">
                              {i.activo ? 'activo' : 'inactivo'}
                            </Badge>
                          </div>
                        ))
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ========================================== MODALES ========================================== */}

      {/* Crear Macroproceso */}
      <Modal open={showCreateMacro} onClose={() => setShowCreateMacro(false)} title="Nuevo Macroproceso" size="md">
        <FormHelper
          fields={[
            { name: 'codigo', label: 'Código*', placeholder: 'Ej: MP-EST-01', required: true, pattern: /^[A-Z0-9-]+$/, patternMessage: 'Solo letras mayúsculas, números y guiones (-)' },
            { name: 'nombre', label: 'Nombre*', placeholder: 'Direccionamiento Estratégico', required: true, minLength: 5 },
            { name: 'tipo', label: 'Tipo', type: 'select', options: [{ value: 'estrategico', label: 'Estratégico' }, { value: 'misional', label: 'Misional' }, { value: 'apoyo', label: 'Apoyo' }, { value: 'evaluacion', label: 'Evaluación' }] },
            { name: 'responsable_id', label: 'Responsable', type: 'select', options: [{ value: '', label: 'Seleccionar...' }, ...usuarios.map((u: any) => ({ value: u.id, label: `${u.nombre} ${u.apellido} (${u.rol})` }))] },
            { name: 'descripcion', label: 'Descripción', type: 'textarea' },
          ]}
          onSubmit={crearMacroMut.mutate}
          loading={crearMacroMut.isPending}
          submitLabel="Crear Macroproceso"
        />
      </Modal>

      {/* Editar Macroproceso */}
      <Modal open={!!showEditMacro} onClose={() => setShowEditMacro(null)} title="Editar Macroproceso" size="md">
        {showEditMacro && (
          <FormHelper
            initialValues={showEditMacro}
            fields={[
              { name: 'codigo', label: 'Código (Fijo)', disabled: true },
              { name: 'nombre', label: 'Nombre*', required: true, minLength: 5 },
              { name: 'tipo', label: 'Tipo', type: 'select', options: [{ value: 'estrategico', label: 'Estratégico' }, { value: 'misional', label: 'Misional' }, { value: 'apoyo', label: 'Apoyo' }, { value: 'evaluacion', label: 'Evaluación' }] },
              { name: 'responsable_id', label: 'Responsable', type: 'select', options: [{ value: '', label: 'Seleccionar...' }, ...usuarios.map((u: any) => ({ value: u.id, label: `${u.nombre} ${u.apellido} (${u.rol})` }))] },
              { name: 'descripcion', label: 'Descripción', type: 'textarea' },
            ]}
            onSubmit={(d) => editarMacroMut.mutate({ id: showEditMacro.id, data: d })}
            loading={editarMacroMut.isPending}
            submitLabel="Guardar Cambios"
          />
        )}
      </Modal>

      {/* Crear Proceso */}
      <Modal open={!!showCreateProceso} onClose={() => setShowCreateProceso(null)} title="Nuevo Proceso" size="md">
        <FormHelper
          fields={[
            { name: 'codigo', label: 'Código*', placeholder: 'Ej: PR-FOR-01', required: true, pattern: /^[A-Z0-9-]+$/, patternMessage: 'Solo letras mayúsculas, números y guiones (-)' },
            { name: 'nombre', label: 'Nombre*', placeholder: 'Gestión de Matrícula', required: true, minLength: 5 },
            { name: 'responsable_id', label: 'Líder Responsable*', type: 'select', required: true, options: [{ value: '', label: 'Seleccionar...' }, ...usuarios.map((u: any) => ({ value: u.id, label: `${u.nombre} ${u.apellido} (${u.rol})` }))] },
            { name: 'estado', label: 'Estado', type: 'select', options: [{ value: 'activo', label: 'Activo' }, { value: 'inactivo', label: 'Inactivo' }, { value: 'en_mejora', label: 'En Mejora' }] },
            { name: 'objetivo', label: 'Objetivo', type: 'textarea' },
            { name: 'alcance', label: 'Alcance', type: 'textarea' },
          ]}
          onSubmit={(d) => crearProcesoMut.mutate({ ...d, macroproceso_id: showCreateProceso })}
          loading={crearProcesoMut.isPending}
          submitLabel="Crear Proceso"
        />
      </Modal>

      {/* Editar Proceso */}
      <Modal open={!!showEditProceso} onClose={() => setShowEditProceso(null)} title="Editar Proceso" size="md">
        {showEditProceso && (
          <FormHelper
            initialValues={showEditProceso}
            fields={[
              { name: 'codigo', label: 'Código (Fijo)', disabled: true },
              { name: 'nombre', label: 'Nombre*', required: true, minLength: 5 },
              { name: 'responsable_id', label: 'Líder Responsable*', type: 'select', required: true, options: [{ value: '', label: 'Seleccionar...' }, ...usuarios.map((u: any) => ({ value: u.id, label: `${u.nombre} ${u.apellido} (${u.rol})` }))] },
              { name: 'estado', label: 'Estado', type: 'select', options: [{ value: 'activo', label: 'Activo' }, { value: 'inactivo', label: 'Inactivo' }, { value: 'en_mejora', label: 'En Mejora' }] },
              { name: 'objetivo', label: 'Objetivo', type: 'textarea' },
              { name: 'alcance', label: 'Alcance', type: 'textarea' },
            ]}
            onSubmit={(d) => editarProcesoMut.mutate({ id: showEditProceso.id, data: d })}
            loading={editarProcesoMut.isPending}
            submitLabel="Guardar Cambios"
          />
        )}
      </Modal>

      {/* Crear Actividad */}
      <Modal open={!!showCreateActividad} onClose={() => setShowCreateActividad(null)} title="Nueva Actividad" size="md">
        <FormHelper
          fields={[
            { name: 'codigo', label: 'Código*', placeholder: 'Ej: ACT-001', required: true, pattern: /^[A-Z0-9-]+$/, patternMessage: 'Solo letras mayúsculas, números y guiones (-)' },
            { name: 'nombre', label: 'Nombre*', placeholder: 'Validar requisitos de matrícula', required: true, minLength: 5 },
            { name: 'secuencia', label: 'Secuencia (Nro. Orden)*', type: 'number', placeholder: '1', required: true, pattern: /^[1-9][0-9]*$/, patternMessage: 'Debe ser un entero positivo mayor a 0' },
            { name: 'responsable_id', label: 'Responsable Operativo*', type: 'select', required: true, options: [{ value: '', label: 'Seleccionar...' }, ...usuarios.map((u: any) => ({ value: u.id, label: `${u.nombre} ${u.apellido} (${u.rol})` }))] },
            { name: 'entradas', label: 'Entradas (Recursos)', placeholder: 'Ficha de inscripción, constancia de pago' },
            { name: 'salidas', label: 'Salidas (Resultados)', placeholder: 'Acta de matrícula generada' },
            { name: 'indicadores', label: 'Indicadores de Medición', placeholder: 'Porcentaje de expedientes válidos' },
            { name: 'descripcion', label: 'Descripción / Instrucciones', type: 'textarea' },
          ]}
          onSubmit={(d) => crearActMut.mutate({ procesoId: showCreateActividad!, data: { ...d, secuencia: parseInt(d.secuencia) } })}
          loading={crearActMut.isPending}
          submitLabel="Crear Actividad"
        />
      </Modal>

      {/* Editar Actividad */}
      <Modal open={!!showEditActividad} onClose={() => setShowEditActividad(null)} title="Editar Actividad" size="md">
        {showEditActividad && (
          <FormHelper
            initialValues={showEditActividad}
            fields={[
              { name: 'codigo', label: 'Código*', required: true, pattern: /^[A-Z0-9-]+$/, patternMessage: 'Solo letras mayúsculas, números y guiones (-)' },
              { name: 'nombre', label: 'Nombre*', required: true, minLength: 5 },
              { name: 'secuencia', label: 'Secuencia (Nro. Orden)*', type: 'number', required: true, pattern: /^[1-9][0-9]*$/, patternMessage: 'Debe ser un entero positivo mayor a 0' },
              { name: 'responsable_id', label: 'Responsable Operativo*', type: 'select', required: true, options: [{ value: '', label: 'Seleccionar...' }, ...usuarios.map((u: any) => ({ value: u.id, label: `${u.nombre} ${u.apellido} (${u.rol})` }))] },
              { name: 'entradas', label: 'Entradas (Recursos)' },
              { name: 'salidas', label: 'Salidas (Resultados)' },
              { name: 'indicadores', label: 'Indicadores de Medición' },
              { name: 'descripcion', label: 'Descripción / Instrucciones', type: 'textarea' },
            ]}
            onSubmit={(d) => editarActMut.mutate({ id: showEditActividad.id, data: { ...d, secuencia: parseInt(d.secuencia) } })}
            loading={editarActMut.isPending}
            submitLabel="Guardar Cambios"
          />
        )}
      </Modal>

      {/* Confirmar Eliminación (Con Validaciones de Integridad) */}
      <Modal open={!!showConfirmDelete} onClose={() => setShowConfirmDelete(null)} title="Confirmar Eliminación" size="sm">
        {showConfirmDelete && (
          <div className="space-y-4">
            <div className="flex gap-3 items-start p-3 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 rounded-lg border border-red-200 dark:border-red-800">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold">¿Está seguro de eliminar?</p>
                <p className="text-xs mt-1">
                  Se eliminará el elemento: <strong className="font-bold">{showConfirmDelete.name}</strong>.
                </p>
                {showConfirmDelete.type === 'macroproceso' && (
                  <p className="text-[11px] text-red-500 font-medium mt-2">
                    * La eliminación fallará si este macroproceso contiene procesos asociados.
                  </p>
                )}
                {showConfirmDelete.type === 'proceso' && (
                  <p className="text-[11px] text-red-500 font-medium mt-2">
                    * La eliminación fallará si el proceso contiene actividades, documentos vinculados, riesgos, indicadores o hallazgos.
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" size="sm" onClick={() => setShowConfirmDelete(null)}>Cancelar</Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => {
                  if (showConfirmDelete.type === 'macroproceso') eliminarMacroMut.mutate(showConfirmDelete.id);
                  if (showConfirmDelete.type === 'proceso') eliminarProcesoMut.mutate(showConfirmDelete.id);
                  if (showConfirmDelete.type === 'actividad') eliminarActMut.mutate(showConfirmDelete.id);
                }}
                loading={eliminarMacroMut.isPending || eliminarProcesoMut.isPending || eliminarActMut.isPending}
              >
                Eliminar Definitivamente
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Editor de Flujo de Trabajo (BPMN / JSON) */}
      <Modal open={!!showFlowModal} onClose={() => setShowFlowModal(null)} title="Flujo de Trabajo (JSON)" size="lg">
        {showFlowModal && (
          <FlowEditorHelper
            procesoId={showFlowModal}
            flujoActual={procesoDetalle?.flujos?.[0]}
            onSave={(json) => guardarFlujoMut.mutate({ procesoId: showFlowModal, data: { definicion_bpmn: json } })}
            loading={guardarFlujoMut.isPending}
            canEdit={canEdit}
          />
        )}
      </Modal>
    </AppLayout>
  );
}

// ─── Helper: Formulario Genérico con Validaciones ───
function FormHelper({
  fields, onSubmit, loading, submitLabel = 'Guardar', initialValues = {}
}: {
  fields: any[]; onSubmit: (data: any) => void; loading: boolean; submitLabel?: string; initialValues?: any;
}) {
  const [form, setForm] = useState<Record<string, any>>(() => {
    const defaultVals: Record<string, any> = {};
    fields.forEach(f => {
      defaultVals[f.name] = initialValues[f.name] ?? (f.type === 'select' ? (f.options?.[0]?.value || '') : '');
    });
    return defaultVals;
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateField = (name: string, value: any, f: any) => {
    if (f.required && (!value || String(value).trim() === '')) return 'Este campo es requerido';
    if (value && f.pattern && !f.pattern.test(String(value))) return f.patternMessage || 'Formato inválido';
    if (value && f.minLength && String(value).trim().length < f.minLength) return `Mínimo ${f.minLength} caracteres`;
    return null;
  };

  const handleFieldChange = (name: string, value: any) => {
    setForm(p => ({ ...p, [name]: value }));
    const f = fields.find(f => f.name === name);
    if (f) {
      const err = validateField(name, value, f);
      setErrors(e => {
        const newE = { ...e };
        if (err) newE[name] = err;
        else delete newE[name];
        return newE;
      });
    }
  };

  const handleValidate = () => {
    const errs: Record<string, string> = {};
    fields.forEach(f => {
      const err = validateField(f.name, form[f.name], f);
      if (err) errs[f.name] = err;
    });
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleFormSubmit = () => {
    if (handleValidate()) {
      onSubmit(form);
    }
  };

  return (
    <div className="space-y-4">
      {fields.map((f: any) => (
        <div key={f.name}>
          {f.type === 'select' ? (
            <Select
              label={f.label}
              value={form[f.name] || ''}
              onChange={e => handleFieldChange(f.name, e.target.value)}
              disabled={f.disabled}
              error={errors[f.name]}
            >
              {f.options?.map((o: any) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </Select>
          ) : f.type === 'textarea' ? (
            <Textarea
              label={f.label}
              placeholder={f.placeholder}
              value={form[f.name] || ''}
              onChange={e => handleFieldChange(f.name, e.target.value)}
              disabled={f.disabled}
              error={errors[f.name]}
            />
          ) : (
            <Input
              label={f.label}
              placeholder={f.placeholder}
              type={f.type || 'text'}
              value={form[f.name] || ''}
              onChange={e => handleFieldChange(f.name, e.target.value)}
              disabled={f.disabled}
              error={errors[f.name]}
            />
          )}
        </div>
      ))}
      <div className="flex justify-end pt-2">
        <Button onClick={handleFormSubmit} loading={loading}>{submitLabel}</Button>
      </div>
    </div>
  );
}

// ─── Helper: Visor y Editor de Flujo (JSON) ───
function FlowEditorHelper({
  procesoId, flujoActual, onSave, loading, canEdit
}: {
  procesoId: string; flujoActual: any; onSave: (json: object) => void; loading: boolean; canEdit: boolean;
}) {
  const defaultFlow = {
    proceso: "PR-Matricula",
    pasos: [
      { id: "1", nombre: "Validación de Requisitos", rol: "docente", siguiente: ["2"] },
      { id: "2", nombre: "Generar Pago", rol: "estudiante", siguiente: ["3"] },
      { id: "3", nombre: "Confirmación de Matrícula", rol: "gestor_calidad", siguiente: [] }
    ]
  };

  const [jsonText, setJsonText] = useState(() => {
    const raw = flujoActual?.definicion_bpmn || defaultFlow;
    return JSON.stringify(raw, null, 2);
  });
  const [errorText, setErrorText] = useState('');

  const handleFlowSave = () => {
    try {
      const parsed = JSON.parse(jsonText);
      setErrorText('');
      onSave(parsed);
    } catch {
      setErrorText('Error de formato JSON: Asegúrese de que sea un JSON válido.');
    }
  };

  // Convertir JSON a visualización simplificada de pasos
  let visualSteps: any[] = [];
  try {
    const parsed = JSON.parse(jsonText);
    if (Array.isArray(parsed.pasos)) {
      visualSteps = parsed.pasos;
    }
  } catch {}

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Editor de Código */}
      <div className="space-y-3">
        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">Definición JSON del Flujo</label>
        <textarea
          value={jsonText}
          onChange={e => setJsonText(e.target.value)}
          disabled={!canEdit}
          className="w-full h-[280px] font-mono text-[11px] p-3 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 outline-none focus:border-blue-500"
        />
        {errorText && <p className="text-xs text-red-500 font-semibold">{errorText}</p>}
        {canEdit && (
          <div className="flex justify-end pt-1">
            <Button size="sm" onClick={handleFlowSave} loading={loading}>Guardar Flujo</Button>
          </div>
        )}
      </div>

      {/* Visualización Visual */}
      <div className="space-y-3 flex flex-col justify-between">
        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Vista Visual del Flujo</label>
          <div className="bg-gray-50 dark:bg-gray-950 p-4 rounded-xl border border-gray-200 dark:border-gray-800 h-[280px] overflow-y-auto space-y-3">
            {visualSteps.length === 0 ? (
              <p className="text-xs text-gray-400 dark:text-gray-500 text-center pt-[100px]">Define pasos en el JSON ("pasos": [ ... ]) para visualizar el flujo.</p>
            ) : (
              visualSteps.map((s: any, i: number) => (
                <div key={s.id || i} className="flex items-center gap-2">
                  <div className="bg-blue-500 text-white font-bold text-xs p-2 rounded-lg shadow-[0_0_8px_rgba(59,130,246,0.2)] flex-1">
                    <p className="font-semibold">{s.nombre || 'Paso sin nombre'}</p>
                    <p className="text-[9px] opacity-85 mt-0.5">Rol: {s.rol || 'no asignado'}</p>
                  </div>
                  {i < (visualSteps.length - 1) && (
                    <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
        <p className="text-[10px] text-gray-400 leading-relaxed">
          * Este JSON representa la secuencia lógica de aprobación y ejecución del proceso. Puede ser integrado con modeladores BPMN estándar.
        </p>
      </div>
    </div>
  );
}
