// ============================================================
// PÁGINA: Documentos (/documentos)
// ============================================================
'use client';
import React, { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import {
  Card, CardContent, CardHeader, CardTitle,
  Table, Thead, Tbody, Th, Td, Tr,
  Button, Badge, EstadoBadge, Modal, Input, Select, Textarea,
  Pagination, EmptyState, SkeletonCard, ConfirmDialog,
} from '@/components/ui';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { documentosApi, adminApi, archivosApi, apiHelpers } from '@/lib/api';
import { formatDate, formatDatetime, downloadBlob, getErrorMessage, truncate } from '@/lib/utils';
import { Plus, FileText, Download, Eye, Edit, Trash2, Search, RefreshCw } from 'lucide-react';
import { useToast } from '@/components/ui/ToastProvider';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

export default function DocumentosPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { user, hasRole } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (!hasRole('admin', 'gestor_calidad', 'auditor', 'docente')) {
      router.replace('/dashboard');
    }
  }, [hasRole, router]);

  const canCreate = hasRole('admin', 'gestor_calidad', 'docente');

  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ estado: '', q: '' });
  
  const [showCreate, setShowCreate] = useState(false);
  const [editingDoc, setEditingDoc] = useState<any>(null);
  const [confirmDelete, setConfirmDelete] = useState<any>(null);
  
  const [selected, setSelected] = useState<any>(null);
  const [showApproval, setShowApproval] = useState(false);
  const [approvalComment, setApprovalComment] = useState('');

  // Main list query
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['documentos', page, filters],
    queryFn: () => documentosApi.listar({ page, limit: 15, ...filters }).then(r => r.data),
  });

  // Query for selected document full details (proceso, versiones, aprobaciones)
  const { data: activeDocDetail, isLoading: isLoadingDetail } = useQuery<any>({
    queryKey: ['documento-detalle', selected?.id],
    queryFn: () => documentosApi.obtener(selected.id).then(apiHelpers.getData),
    enabled: !!selected?.id,
  });

  const crearMut = useMutation({
    mutationFn: (d: object) => documentosApi.crear(d),
    onSuccess: () => {
      toast('success', 'Documento creado con éxito');
      qc.invalidateQueries({ queryKey: ['documentos'] });
      setShowCreate(false);
    },
    onError: (e) => toast('error', getErrorMessage(e)),
  });

  const actualizarMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => documentosApi.actualizar(id, data),
    onSuccess: () => {
      toast('success', 'Documento actualizado con éxito');
      qc.invalidateQueries({ queryKey: ['documentos'] });
      setEditingDoc(null);
    },
    onError: (e) => toast('error', getErrorMessage(e)),
  });

  const eliminarMut = useMutation({
    mutationFn: (id: string) => documentosApi.eliminar(id),
    onSuccess: () => {
      toast('success', 'Documento eliminado con éxito');
      qc.invalidateQueries({ queryKey: ['documentos'] });
      setConfirmDelete(null);
    },
    onError: (e) => toast('error', getErrorMessage(e)),
  });

  const estadoMut = useMutation({
    mutationFn: ({ id, accion, comentario }: { id: string; accion: string; comentario: string }) =>
      documentosApi.cambiarEstado(id, accion, comentario),
    onSuccess: () => {
      toast('success', 'Transición de estado completada con éxito');
      qc.invalidateQueries({ queryKey: ['documentos'] });
      setShowApproval(false);
      setSelected(null);
    },
    onError: (e) => toast('error', getErrorMessage(e)),
  });

  const downloadPDF = async () => {
    try {
      const res = await documentosApi.reporte(filters);
      downloadBlob(res.data, 'documentos.pdf');
      toast('success', 'Reporte PDF generado');
    } catch {
      toast('error', 'Error al generar el reporte PDF');
    }
  };

  const docs = data?.data || [];
  const meta = data?.meta;

  return (
    <AppLayout title="Gestión Documental">
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Documentos</h2>
            <p className="text-sm text-gray-500">Visualice, apruebe y gestione los documentos de calidad</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" icon={<Download className="w-4 h-4" />} onClick={downloadPDF}>PDF</Button>
            <Button variant="outline" size="sm" icon={<RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />} onClick={() => refetch()}>Actualizar</Button>
            {canCreate && (
              <Button size="sm" icon={<Plus className="w-4 h-4" />} onClick={() => setShowCreate(true)}>
                Nuevo Documento
              </Button>
            )}
          </div>
        </div>

        {/* Filtros */}
        <Card>
          <CardContent className="py-3">
            <div className="flex flex-wrap gap-3">
              <div className="flex-1 min-w-[200px]">
                <Input
                  placeholder="Buscar por código o título..."
                  value={filters.q}
                  onChange={e => { setFilters(f => ({ ...f, q: e.target.value })); setPage(1); }}
                  icon={<Search className="w-4 h-4" />}
                />
              </div>
              <Select
                value={filters.estado}
                onChange={e => { setFilters(f => ({ ...f, estado: e.target.value })); setPage(1); }}
                className="w-44"
              >
                <option value="">Todos los estados</option>
                {['borrador', 'en_revision', 'aprobado', 'archivado', 'obsoleto'].map(s => (
                  <option key={s} value={s}>{s.replace('_', ' ')}</option>
                ))}
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Tabla */}
        <Card>
          {isLoading ? (
            <div className="p-6">
              <SkeletonCard />
            </div>
          ) : docs.length === 0 ? (
            <EmptyState
              message="Sin documentos"
              description="No se encontraron documentos registrados."
              action={canCreate && (
                <Button size="sm" icon={<Plus className="w-4 h-4" />} onClick={() => setShowCreate(true)}>
                  Crear Documento
                </Button>
              )}
            />
          ) : (
            <>
              <Table>
                <Thead>
                  <tr>
                    <Th className="w-28">Código</Th>
                    <Th>Título</Th>
                    <Th className="w-48">Tipo</Th>
                    <Th className="w-24">Versión</Th>
                    <Th className="w-32">Estado</Th>
                    <Th className="w-36">Vigencia Fin</Th>
                    <Th className="w-64 text-right">Acciones</Th>
                  </tr>
                </Thead>
                <Tbody>
                  {docs.map((doc: any) => {
                    const esCreador = user && doc.creado_por === user.id;
                    const esBorrador = doc.estado === 'borrador';
                    const showEditDelete = esCreador && esBorrador;

                    return (
                      <Tr key={doc.id}>
                        <Td>
                          <span className="font-mono text-xs bg-gray-100/80 dark:bg-gray-800/80 px-2 py-0.5 rounded uppercase font-semibold text-gray-800 dark:text-gray-200">
                            {doc.codigo}
                          </span>
                        </Td>
                        <Td>
                          <p className="font-medium text-gray-900 dark:text-white" title={doc.titulo}>
                            {truncate(doc.titulo, 50)}
                          </p>
                        </Td>
                        <Td>
                          <span className="text-xs text-gray-500">
                            {doc.tipo?.nombre || '—'}
                          </span>
                        </Td>
                        <Td>
                          <span className="text-xs font-mono font-semibold">
                            v{doc.version_actual}
                          </span>
                        </Td>
                        <Td>
                          <EstadoBadge estado={doc.estado} />
                        </Td>
                        <Td>
                          <span className="text-xs text-gray-500">
                            {formatDate(doc.fecha_vigencia_fin)}
                          </span>
                        </Td>
                        <Td className="text-right">
                          <div className="flex justify-end gap-1.5">
                            <Button
                              variant="ghost"
                              size="sm"
                              icon={<Eye className="w-3.5 h-3.5" />}
                              onClick={() => {
                                setSelected(doc);
                                setShowApproval(true);
                                setApprovalComment('');
                              }}
                            >
                              Gestionar
                            </Button>
                            {showEditDelete && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  icon={<Edit className="w-3.5 h-3.5" />}
                                  onClick={() => setEditingDoc(doc)}
                                >
                                  Editar
                                </Button>
                                <Button
                                  variant="danger"
                                  size="sm"
                                  icon={<Trash2 className="w-3.5 h-3.5" />}
                                  onClick={() => setConfirmDelete(doc)}
                                >
                                  Eliminar
                                </Button>
                              </>
                            )}
                          </div>
                        </Td>
                      </Tr>
                    );
                  })}
                </Tbody>
              </Table>
              {meta && meta.pages > 1 && (
                <div className="px-4 py-3">
                  <Pagination page={meta.page} pages={meta.pages} total={meta.total} onPage={setPage} />
                </div>
              )}
            </>
          )}
        </Card>
      </div>

      {/* Modal crear */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Nuevo Documento" size="lg">
        <DocForm onSubmit={crearMut.mutate} loading={crearMut.isPending} />
      </Modal>

      {/* Modal editar */}
      <Modal open={!!editingDoc} onClose={() => setEditingDoc(null)} title={`Editar Documento: ${editingDoc?.codigo}`} size="lg">
        {editingDoc && (
          <DocForm
            initialData={editingDoc}
            onSubmit={(data) => actualizarMut.mutate({ id: editingDoc.id, data })}
            loading={actualizarMut.isPending}
          />
        )}
      </Modal>

      {/* Modal confirmación eliminar */}
      <ConfirmDialog
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => confirmDelete && eliminarMut.mutate(confirmDelete.id)}
        title="Eliminar Documento"
        message={`¿Está seguro de que desea eliminar el documento "${confirmDelete?.codigo} - ${confirmDelete?.titulo}"? Esta acción eliminará el registro de forma permanente.`}
        danger
      />

      {/* Modal gestión/detalle */}
      <Modal open={showApproval} onClose={() => { setShowApproval(false); setSelected(null); }} title={`Gestión de Documento: ${selected?.codigo || ''}`} size="lg">
        {selected && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 select-none animate-fade-in">
            {/* Columna Izquierda: Detalle e Información */}
            <div className="lg:col-span-7 space-y-4 border-r dark:border-gray-800 pr-0 lg:pr-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white leading-tight">
                    {selected.titulo}
                  </h3>
                  <p className="text-[10px] text-gray-400 font-mono mt-1">ID: {selected.id}</p>
                </div>
                <div className="flex-shrink-0">
                  <EstadoBadge estado={selected.estado} />
                </div>
              </div>

              {/* Grid de Metadatos estilo Consola Cyber */}
              <div className="grid grid-cols-2 gap-3 p-3.5 bg-gray-50/50 dark:bg-gray-900/60 border border-gray-150 dark:border-gray-800/80 rounded-xl text-xs backdrop-blur-sm">
                <div>
                  <p className="text-gray-400 font-medium">Tipo</p>
                  <p className="text-gray-800 dark:text-gray-200 font-semibold">{selected.tipo?.nombre || '—'}</p>
                </div>
                <div>
                  <p className="text-gray-400 font-medium">Proceso</p>
                  <p className="text-gray-800 dark:text-gray-200 font-semibold">
                    {activeDocDetail?.proceso?.nombre ? `${activeDocDetail.proceso.codigo} - ${activeDocDetail.proceso.nombre}` : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 font-medium">Versión Actual</p>
                  <p className="text-gray-800 dark:text-gray-200 font-semibold font-mono">v{selected.version_actual}</p>
                </div>
                <div>
                  <p className="text-gray-400 font-medium">Creado por</p>
                  <p className="text-gray-800 dark:text-gray-200 font-semibold">
                    {selected.creador ? `${selected.creador.nombre} ${selected.creador.apellido}` : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 font-medium">Fecha Creación</p>
                  <p className="text-gray-800 dark:text-gray-200 font-semibold">{formatDate(selected.creado_en)}</p>
                </div>
                <div>
                  <p className="text-gray-400 font-medium">Fecha Revisión</p>
                  <p className="text-gray-800 dark:text-gray-200 font-semibold font-mono">
                    {activeDocDetail?.fecha_revision ? formatDatetime(activeDocDetail.fecha_revision) : '—'}
                  </p>
                </div>
              </div>

              {/* Visor de Contenido con scroll */}
              <div className="space-y-1">
                <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">Contenido</p>
                <div className="w-full max-h-48 overflow-y-auto p-4 bg-gray-50/30 dark:bg-gray-950/40 border border-gray-150 dark:border-gray-800 rounded-xl text-xs text-gray-600 dark:text-gray-400 font-sans whitespace-pre-wrap leading-relaxed">
                  {selected.contenido || 'Sin contenido registrado.'}
                </div>
              </div>

              {/* Descargar Adjunto si existe */}
              {selected.archivo_id && (
                <div className="pt-1">
                  <Button
                    variant="outline"
                    size="sm"
                    icon={<Download className="w-4 h-4" />}
                    onClick={async () => {
                      try {
                        const res = await archivosApi.getUrl(selected.archivo_id);
                        window.open(res.data.data.url, '_blank');
                      } catch {
                        toast('error', 'Error al obtener URL del archivo');
                      }
                    }}
                  >
                    Descargar Archivo Adjunto
                  </Button>
                </div>
              )}
            </div>

            {/* Columna Derecha: Acciones y Timeline de Cambios */}
            <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
              {/* Timeline de Historial */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                  Historial de Revisiones
                </h4>
                {isLoadingDetail ? (
                  <div className="space-y-3">
                    <div className="h-6 bg-gray-100 dark:bg-gray-900 rounded animate-pulse" />
                    <div className="h-6 bg-gray-100 dark:bg-gray-900 rounded animate-pulse" />
                  </div>
                ) : !activeDocDetail?.aprobaciones || activeDocDetail.aprobaciones.length === 0 ? (
                  <p className="text-xs text-gray-400 italic">No hay registros de aprobaciones para este documento.</p>
                ) : (
                  <div className="max-h-48 overflow-y-auto pr-1 space-y-4 relative before:absolute before:top-2 before:bottom-2 before:left-[11px] before:w-[2px] before:bg-blue-500/25 dark:before:bg-blue-500/10">
                    {activeDocDetail.aprobaciones.map((aprob: any) => (
                      <div key={aprob.id} className="relative pl-7 text-xs">
                        {/* Círculo brillante cibernético */}
                        <div className="absolute left-[5px] top-1.5 w-3.5 h-3.5 rounded-full bg-blue-500 dark:bg-blue-400 shadow-[0_0_8px_rgba(59,130,246,0.6)] border-2 border-white dark:border-gray-950" />
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-gray-800 dark:text-gray-200 capitalize">
                              {aprob.accion.replace('_', ' ')}
                            </span>
                            <span className="text-[10px] text-gray-400">
                              {formatDatetime(aprob.creado_en)}
                            </span>
                          </div>
                          <p className="text-gray-500 text-[11px] mt-0.5">
                            Por: {aprob.aprobador ? `${aprob.aprobador.nombre} ${aprob.aprobador.apellido}` : '—'}
                          </p>
                          {aprob.comentario && (
                            <p className="text-gray-400 dark:text-gray-500 italic mt-1 bg-gray-100/40 dark:bg-gray-900/30 p-2 rounded-lg border border-gray-150/40 dark:border-gray-800/40 text-[11px]">
                              "{aprob.comentario}"
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Consola de Acciones */}
              <div className="space-y-4 pt-4 border-t dark:border-gray-800">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                  Consola de Operaciones
                </h4>
                
                {(() => {
                  const esAdminOGestor = user && ['admin', 'gestor_calidad'].includes(user.rol);
                  const esCreador = user && selected.creado_por === user.id;

                  const mostrarEnviarRevision = selected.estado === 'borrador' && (esCreador || esAdminOGestor);
                  const mostrarAprobacion = selected.estado === 'en_revision' && esAdminOGestor;
                  const mostrarArchivo = selected.estado === 'aprobado' && esAdminOGestor;

                  if (!mostrarEnviarRevision && !mostrarAprobacion && !mostrarArchivo) {
                    return (
                      <div className="p-3.5 bg-blue-50/50 dark:bg-blue-950/10 border border-blue-500/10 rounded-xl text-center">
                        <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                          Acceso de solo lectura para este documento.
                        </p>
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-4">
                      <Textarea
                        label="Comentario de Operación"
                        placeholder={selected.estado === 'en_revision' ? 'Ingrese un comentario (obligatorio para rechazar)...' : 'Ingrese un comentario opcional...'}
                        value={approvalComment}
                        onChange={e => setApprovalComment(e.target.value)}
                        className="text-xs min-h-[70px]"
                      />

                      <div className="flex flex-wrap gap-2 justify-end">
                        {mostrarEnviarRevision && (
                          <Button
                            size="sm"
                            loading={estadoMut.isPending}
                            onClick={() => estadoMut.mutate({ id: selected.id, accion: 'enviar_revision', comentario: approvalComment })}
                            className="bg-blue-600 hover:bg-blue-700 text-white shadow-[0_0_12px_rgba(59,130,246,0.3)] transition-all"
                          >
                            Enviar a Revisión
                          </Button>
                        )}
                        {mostrarAprobacion && (
                          <>
                            <Button
                              size="sm"
                              variant="danger"
                              loading={estadoMut.isPending}
                              onClick={() => {
                                if (!approvalComment.trim()) {
                                  toast('error', 'El comentario es obligatorio al rechazar');
                                  return;
                                }
                                estadoMut.mutate({ id: selected.id, accion: 'rechazar', comentario: approvalComment });
                              }}
                              className="shadow-[0_0_12px_rgba(239,68,68,0.3)] transition-all"
                            >
                              Rechazar
                            </Button>
                            <Button
                              size="sm"
                              loading={estadoMut.isPending}
                              onClick={() => estadoMut.mutate({ id: selected.id, accion: 'aprobar', comentario: approvalComment })}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-[0_0_12px_rgba(16,185,129,0.3)] transition-all"
                            >
                              Aprobar
                            </Button>
                          </>
                        )}
                        {mostrarArchivo && (
                          <>
                            <Button
                              size="sm"
                              variant="danger"
                              loading={estadoMut.isPending}
                              onClick={() => estadoMut.mutate({ id: selected.id, accion: 'obsoletar', comentario: approvalComment })}
                              className="shadow-[0_0_12px_rgba(239,68,68,0.3)] transition-all"
                            >
                              Marcar Obsoleto
                            </Button>
                            <Button
                              size="sm"
                              loading={estadoMut.isPending}
                              onClick={() => estadoMut.mutate({ id: selected.id, accion: 'archivar', comentario: approvalComment })}
                              className="bg-blue-600 hover:bg-blue-700 text-white shadow-[0_0_12px_rgba(59,130,246,0.3)] transition-all"
                            >
                              Archivar
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </AppLayout>
  );
}

function DocForm({ onSubmit, loading, initialData }: { onSubmit: (d: any) => void; loading: boolean; initialData?: any }) {
  const [form, setForm] = useState({
    codigo: initialData?.codigo || '',
    titulo: initialData?.titulo || '',
    contenido: initialData?.contenido || '',
    tipo_id: initialData?.tipo_id || '',
    fecha_vigencia_fin: initialData?.fecha_vigencia_fin || '',
  });

  // Query types dropdown
  const { data: tiposData } = useQuery({
    queryKey: ['tipos-documento-dropdown'],
    queryFn: () => adminApi.tiposDocumento.listar({ limit: 100 }).then(r => r.data),
  });
  const tipos = tiposData?.data || [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: any = { ...form };
    if (!payload.tipo_id) delete payload.tipo_id;
    if (!payload.fecha_vigencia_fin) delete payload.fecha_vigencia_fin;
    onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-750 dark:text-gray-300 mb-1">Código*</label>
          <Input
            placeholder="Ej. POL-001"
            value={form.codigo}
            onChange={e => setForm(f => ({ ...f, codigo: e.target.value.toUpperCase() }))}
            disabled={!!initialData}
            required
          />
        </div>
        <Select
          label="Tipo de Documento*"
          value={form.tipo_id}
          onChange={e => setForm(f => ({ ...f, tipo_id: e.target.value }))}
          required
        >
          <option value="">Seleccione un tipo...</option>
          {tipos.map((t: any) => (
            <option key={t.id} value={t.id}>{t.nombre}</option>
          ))}
        </Select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Fecha Vigencia Fin"
          type="date"
          value={form.fecha_vigencia_fin}
          onChange={e => setForm(f => ({ ...f, fecha_vigencia_fin: e.target.value }))}
        />
        <Input
          label="Título*"
          placeholder="Título del documento"
          value={form.titulo}
          onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))}
          required
        />
      </div>

      <Textarea
        label="Contenido"
        placeholder="Contenido del documento..."
        value={form.contenido}
        onChange={e => setForm(f => ({ ...f, contenido: e.target.value }))}
        className="min-h-[150px]"
      />

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="primary" loading={loading} type="submit">
          {initialData ? 'Guardar Cambios' : 'Crear Documento'}
        </Button>
      </div>
    </form>
  );
}
