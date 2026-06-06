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
import { documentosApi, apiHelpers } from '@/lib/api';
import { formatDate, downloadBlob, getErrorMessage, truncate } from '@/lib/utils';
import { Plus, FileText, Download, Eye, ChevronRight, Search, Filter, RefreshCw } from 'lucide-react';
import { useToast } from '@/components/ui/ToastProvider';
import { useAuth } from '@/context/AuthContext';

export default function DocumentosPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { hasRole } = useAuth();
  const canEdit = hasRole('admin', 'gestor_calidad');

  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ estado: '', q: '' });
  const [showCreate, setShowCreate] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [showApproval, setShowApproval] = useState(false);
  const [approvalAction, setApprovalAction] = useState('');
  const [approvalComment, setApprovalComment] = useState('');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['documentos', page, filters],
    queryFn: () => documentosApi.listar({ page, limit: 15, ...filters }).then(r => r.data),
  });

  const crearMut = useMutation({
    mutationFn: (d: object) => documentosApi.crear(d),
    onSuccess: () => { toast('success', 'Documento creado'); qc.invalidateQueries({ queryKey: ['documentos'] }); setShowCreate(false); },
    onError: (e) => toast('error', getErrorMessage(e)),
  });

  const estadoMut = useMutation({
    mutationFn: ({ id, accion, comentario }: { id: string; accion: string; comentario: string }) =>
      documentosApi.cambiarEstado(id, accion, comentario),
    onSuccess: () => { toast('success', 'Estado actualizado'); qc.invalidateQueries({ queryKey: ['documentos'] }); setShowApproval(false); setSelected(null); },
    onError: (e) => toast('error', getErrorMessage(e)),
  });

  const downloadPDF = async () => {
    try {
      const res = await documentosApi.reporte(filters);
      downloadBlob(res.data, 'documentos.pdf');
      toast('success', 'PDF generado');
    } catch { toast('error', 'Error al generar PDF'); }
  };

  const ACCION_LABEL: Record<string, string> = {
    enviar_revision: 'Enviar a Revisión', aprobar: 'Aprobar', rechazar: 'Rechazar', archivar: 'Archivar',
  };
  const ACCION_DISPONIBLE: Record<string, string[]> = {
    borrador: ['enviar_revision'], en_revision: ['aprobar', 'rechazar'], aprobado: ['archivar'], rechazado: ['enviar_revision'],
  };

  const docs = data?.data || [];
  const meta = data?.meta;

  return (
    <AppLayout title="Gestión Documental">
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Documentos</h2>
            <p className="text-sm text-gray-500">Gestión de documentos institucionales</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" icon={<Download className="w-4 h-4" />} onClick={downloadPDF}>PDF</Button>
            <Button variant="outline" size="sm" icon={<RefreshCw className="w-4 h-4" />} onClick={() => refetch()}>Actualizar</Button>
            {canEdit && <Button size="sm" icon={<Plus className="w-4 h-4" />} onClick={() => setShowCreate(true)}>Nuevo Documento</Button>}
          </div>
        </div>

        {/* Filtros */}
        <Card>
          <CardContent className="py-3">
            <div className="flex flex-wrap gap-3">
              <div className="flex-1 min-w-48">
                <Input placeholder="Buscar por código o título..." value={filters.q} onChange={e => { setFilters(f => ({ ...f, q: e.target.value })); setPage(1); }} icon={<Search className="w-4 h-4" />} />
              </div>
              <Select value={filters.estado} onChange={e => { setFilters(f => ({ ...f, estado: e.target.value })); setPage(1); }} className="w-44">
                <option value="">Todos los estados</option>
                {['borrador','en_revision','aprobado','rechazado','archivado'].map(s => <option key={s} value={s}>{s.replace('_',' ')}</option>)}
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Tabla */}
        <Card>
          {isLoading ? <div className="p-6"><SkeletonCard /></div> : docs.length === 0 ? (
            <EmptyState message="Sin documentos" description="Cree el primer documento institucional" action={canEdit && <Button size="sm" icon={<Plus className="w-4 h-4" />} onClick={() => setShowCreate(true)}>Crear</Button>} />
          ) : (
            <>
              <Table>
                <Thead>
                  <tr>
                    <Th>Código</Th><Th>Título</Th><Th>Tipo</Th><Th>Versión</Th>
                    <Th>Estado</Th><Th>Vigencia Fin</Th><Th className="text-right">Acciones</Th>
                  </tr>
                </Thead>
                <Tbody>
                  {docs.map((doc: any) => (
                    <Tr key={doc.id}>
                      <Td><span className="font-mono text-xs bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">{doc.codigo}</span></Td>
                      <Td><p className="font-medium text-gray-800 dark:text-gray-200">{truncate(doc.titulo, 50)}</p></Td>
                      <Td><span className="text-xs text-gray-500">{doc.tipo?.nombre || '—'}</span></Td>
                      <Td><span className="text-xs">v{doc.version_actual}</span></Td>
                      <Td><EstadoBadge estado={doc.estado} /></Td>
                      <Td><span className="text-xs text-gray-500">{formatDate(doc.fecha_vigencia_fin)}</span></Td>
                      <Td>
                        <div className="flex justify-end gap-1">
                          {canEdit && ACCION_DISPONIBLE[doc.estado]?.length > 0 && (
                            <Button variant="ghost" size="sm" onClick={() => { setSelected(doc); setShowApproval(true); setApprovalComment(''); setApprovalAction(ACCION_DISPONIBLE[doc.estado][0]); }}>
                              Gestionar
                            </Button>
                          )}
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

      {/* Modal crear */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Nuevo Documento" size="lg">
        <CreateDocForm onSubmit={crearMut.mutate} loading={crearMut.isPending} />
      </Modal>

      {/* Modal aprobación */}
      <Modal open={showApproval} onClose={() => setShowApproval(false)} title={`Gestionar: ${selected?.codigo}`} size="md">
        {selected && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">Estado actual: <EstadoBadge estado={selected.estado} /></p>
            <Select label="Acción" value={approvalAction} onChange={e => setApprovalAction(e.target.value)}>
              {(ACCION_DISPONIBLE[selected.estado] || []).map(a => <option key={a} value={a}>{ACCION_LABEL[a]}</option>)}
            </Select>
            <Textarea label="Comentario (obligatorio al rechazar)" value={approvalComment} onChange={e => setApprovalComment(e.target.value)} placeholder="Ingrese un comentario..." />
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setShowApproval(false)}>Cancelar</Button>
              <Button onClick={() => estadoMut.mutate({ id: selected.id, accion: approvalAction, comentario: approvalComment })} loading={estadoMut.isPending}>
                {ACCION_LABEL[approvalAction] || 'Confirmar'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </AppLayout>
  );
}

function CreateDocForm({ onSubmit, loading }: { onSubmit: (d: any) => void; loading: boolean }) {
  const [form, setForm] = useState({ codigo: '', titulo: '', contenido: '', tipo_id: '', fecha_vigencia_fin: '' });
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Input label="Código*" placeholder="POL-001" value={form.codigo} onChange={e => setForm(f => ({ ...f, codigo: e.target.value }))} />
        <Input label="Fecha Vigencia Fin" type="date" value={form.fecha_vigencia_fin} onChange={e => setForm(f => ({ ...f, fecha_vigencia_fin: e.target.value }))} />
      </div>
      <Input label="Título*" placeholder="Título del documento" value={form.titulo} onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))} />
      <Textarea label="Contenido" placeholder="Contenido del documento..." value={form.contenido} onChange={e => setForm(f => ({ ...f, contenido: e.target.value }))} className="min-h-[120px]" />
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="primary" loading={loading} onClick={() => onSubmit(form)}>Crear Documento</Button>
      </div>
    </div>
  );
}
