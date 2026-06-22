'use client';
import React, { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Table,
  Thead,
  Tbody,
  Th,
  Td,
  Tr,
  Button,
  Badge,
  Modal,
  Input,
  Textarea,
  Pagination,
  EmptyState,
  SkeletonCard
} from '@/components/ui';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { formatDatetime, getErrorMessage } from '@/lib/utils';
import { BookOpen, Plus, RefreshCw, Edit, Trash2 } from 'lucide-react';
import { useToast } from '@/components/ui/ToastProvider';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

export default function TiposDocumentoPage() {
  const { hasRole } = useAuth();
  const router = useRouter();
  const qc = useQueryClient();
  const { toast } = useToast();

  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  
  const [showCreate, setShowCreate] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [deleteItem, setDeleteItem] = useState<any>(null);

  const [form, setForm] = useState({
    nombre: '',
    codigo: '',
    descripcion: '',
    activo: true,
  });

  const [errors, setErrors] = useState({
    nombre: '',
    codigo: '',
  });

  React.useEffect(() => {
    if (!hasRole('admin')) router.replace('/dashboard');
  }, [hasRole, router]);

  // Query to list
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['admin-tipos-documento', page, q],
    queryFn: () => adminApi.tiposDocumento.listar({ page, limit: 15, q }).then((r) => r.data),
    enabled: hasRole('admin'),
  });

  // Mutation to create
  const crearMut = useMutation({
    mutationFn: (d: any) => adminApi.tiposDocumento.crear(d),
    onSuccess: () => {
      toast('success', 'Tipo de documento creado con éxito');
      qc.invalidateQueries({ queryKey: ['admin-tipos-documento'] });
      setShowCreate(false);
      resetForm();
    },
    onError: (e) => toast('error', getErrorMessage(e)),
  });

  // Mutation to update
  const actualizarMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      adminApi.tiposDocumento.actualizar(id, data),
    onSuccess: () => {
      toast('success', 'Tipo de documento actualizado con éxito');
      qc.invalidateQueries({ queryKey: ['admin-tipos-documento'] });
      setEditItem(null);
    },
    onError: (e) => toast('error', getErrorMessage(e)),
  });

  // Mutation to delete
  const eliminarMut = useMutation({
    mutationFn: (id: string) => adminApi.tiposDocumento.eliminar(id),
    onSuccess: () => {
      toast('success', 'Tipo de documento eliminado con éxito');
      qc.invalidateQueries({ queryKey: ['admin-tipos-documento'] });
      setDeleteItem(null);
    },
    onError: (e) => toast('error', getErrorMessage(e)),
  });

  if (!hasRole('admin')) return null;

  const items = data?.data || [];
  const meta = data?.meta;

  const resetForm = () => {
    setForm({
      nombre: '',
      codigo: '',
      descripcion: '',
      activo: true,
    });
    setErrors({ nombre: '', codigo: '' });
  };

  const validateField = (field: string, value: string) => {
    let error = '';
    if (field === 'codigo') {
      if (!value.trim()) error = 'El código es obligatorio.';
      else if (value.length < 2) error = 'El código debe tener al menos 2 caracteres.';
      else if (!/^[A-Z0-9_]+$/.test(value)) error = 'El código solo puede contener mayúsculas, números y guiones bajos.';
    }
    if (field === 'nombre') {
      if (!value.trim()) error = 'El nombre es obligatorio.';
      else if (value.length < 3) error = 'El nombre debe tener al menos 3 caracteres.';
    }
    setErrors(prev => ({ ...prev, [field]: error }));
    return !error;
  };

  const handleFieldChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    validateField(field, value);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const isCodigoValid = validateField('codigo', form.codigo);
    const isNombreValid = validateField('nombre', form.nombre);
    
    if (!isCodigoValid || !isNombreValid) {
      toast('error', 'Por favor, corrija los errores del formulario.');
      return;
    }
    crearMut.mutate(form);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editItem) return;
    const isNombreValid = validateField('nombre', form.nombre);
    
    if (!isNombreValid) {
      toast('error', 'Por favor, corrija los errores del formulario.');
      return;
    }
    actualizarMut.mutate({
      id: editItem.id,
      data: {
        nombre: form.nombre,
        descripcion: form.descripcion,
        activo: form.activo,
      },
    });
  };

  const openEditModal = (item: any) => {
    setEditItem(item);
    setForm({
      nombre: item.nombre,
      codigo: item.codigo,
      descripcion: item.descripcion || '',
      activo: item.activo,
    });
    setErrors({ nombre: '', codigo: '' });
  };

  return (
    <AppLayout title="Tipos de Documento">
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-unt-primary" />
              Tipos de Documento
            </h2>
            <p className="text-sm text-gray-500">
              Administración de las categorías y niveles jerárquicos de la documentación
            </p>
          </div>
          <Button
            size="sm"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => {
              resetForm();
              setShowCreate(true);
            }}
          >
            Nuevo Tipo
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="w-full sm:w-80">
            <Input
              placeholder="Buscar por código o nombre..."
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            icon={<RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />}
            onClick={() => refetch()}
            disabled={isLoading}
          >
            Actualizar
          </Button>
        </div>

        {/* Table / List */}
        <Card>
          {isLoading ? (
            <div className="p-5">
              <SkeletonCard />
            </div>
          ) : items.length === 0 ? (
            <EmptyState
              message="Sin tipos de documento"
              description={q ? 'Intenta otra búsqueda' : 'Comienza agregando un nuevo tipo de documento.'}
              action={
                !q && (
                  <Button
                    size="sm"
                    icon={<Plus className="w-4 h-4" />}
                    onClick={() => {
                      resetForm();
                      setShowCreate(true);
                    }}
                  >
                    Agregar Tipo
                  </Button>
                )
              }
            />
          ) : (
            <div className="space-y-4">
              <Table>
                <Thead>
                  <tr>
                    <Th className="w-24">Código</Th>
                    <Th className="w-48">Nombre</Th>
                    <Th>Descripción</Th>
                    <Th className="w-24">Estado</Th>
                    <Th className="w-36">Creado en</Th>
                    <Th className="w-24 text-right">Acciones</Th>
                  </tr>
                </Thead>
                <Tbody>
                  {items.map((item: any) => (
                    <Tr key={item.id}>
                      <Td className="font-mono text-xs font-semibold text-gray-900 dark:text-white uppercase">
                        {item.codigo}
                      </Td>
                      <Td className="font-medium text-gray-800 dark:text-gray-200">
                        {item.nombre}
                      </Td>
                      <Td className="max-w-xs">
                        <div className="text-gray-500 text-xs truncate" title={item.descripcion || ''}>
                          {item.descripcion || '—'}
                        </div>
                      </Td>
                      <Td>
                        <Badge variant={item.activo ? 'success' : 'danger'}>
                          {item.activo ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </Td>
                      <Td className="text-xs text-gray-400">
                        {formatDatetime(item.creado_en)}
                      </Td>
                      <Td className="text-right">
                        <div className="flex justify-end gap-1.5">
                          <button
                            title="Editar"
                            onClick={() => openEditModal(item)}
                            className="p-1.5 rounded-lg text-gray-500 hover:text-unt-primary hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            title="Eliminar"
                            onClick={() => setDeleteItem(item)}
                            className="p-1.5 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>

              {meta && meta.pages > 1 && (
                <div className="px-5 pb-4">
                  <Pagination
                    page={page}
                    pages={meta.pages}
                    total={meta.total}
                    onPage={(p) => setPage(p)}
                  />
                </div>
              )}
            </div>
          )}
        </Card>

        {/* Modal: Crear */}
        <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Crear Tipo de Documento">
          <form onSubmit={handleCreateSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Input
                  label="Código"
                  placeholder="Ej. POL"
                  value={form.codigo}
                  onChange={(e) => handleFieldChange('codigo', e.target.value.toUpperCase())}
                  required
                  maxLength={10}
                />
                {errors.codigo && <p className="text-xs text-red-500 mt-1 ml-1">{errors.codigo}</p>}
              </div>
              <div>
                <Input
                  label="Nombre"
                  placeholder="Ej. Políticas"
                  value={form.nombre}
                  onChange={(e) => handleFieldChange('nombre', e.target.value)}
                  required
                  maxLength={100}
                />
                {errors.nombre && <p className="text-xs text-red-500 mt-1 ml-1">{errors.nombre}</p>}
              </div>
            </div>
            <Textarea
              label="Descripción"
              placeholder="Describa el propósito de este tipo de documento..."
              value={form.descripcion}
              onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
              maxLength={1000}
            />
            <div className="flex gap-4 py-1">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="crear-activo"
                  checked={form.activo}
                  onChange={(e) => setForm({ ...form, activo: e.target.checked })}
                  className="w-4 h-4 text-unt-primary border-gray-300 rounded focus:ring-unt-primary"
                />
                <label htmlFor="crear-activo" className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                  Activo
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" onClick={() => setShowCreate(false)}>
                Cancelar
              </Button>
              <Button type="submit" loading={crearMut.isPending} disabled={!!errors.codigo || !!errors.nombre}>
                Guardar
              </Button>
            </div>
          </form>
        </Modal>

        {/* Modal: Editar */}
        <Modal open={!!editItem} onClose={() => setEditItem(null)} title="Editar Tipo de Documento">
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Código (No editable)
                </label>
                <div className="w-full px-3 py-2 text-sm border rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-500 border-gray-300 dark:border-gray-600 font-mono uppercase">
                  {form.codigo}
                </div>
              </div>
              <div>
                <Input
                  label="Nombre"
                  value={form.nombre}
                  onChange={(e) => handleFieldChange('nombre', e.target.value)}
                  required
                  maxLength={100}
                />
                {errors.nombre && <p className="text-xs text-red-500 mt-1 ml-1">{errors.nombre}</p>}
              </div>
            </div>
            <Textarea
              label="Descripción"
              value={form.descripcion}
              onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
              maxLength={1000}
            />
            <div className="flex gap-4 py-1">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="edit-activo"
                  checked={form.activo}
                  onChange={(e) => setForm({ ...form, activo: e.target.checked })}
                  className="w-4 h-4 text-unt-primary border-gray-300 rounded focus:ring-unt-primary"
                />
                <label htmlFor="edit-activo" className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                  Activo
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" onClick={() => setEditItem(null)}>
                Cancelar
              </Button>
              <Button type="submit" loading={actualizarMut.isPending} disabled={!!errors.nombre}>
                Guardar
              </Button>
            </div>
          </form>
        </Modal>

        {/* Modal: Eliminar (Confirmación) */}
        <Modal open={!!deleteItem} onClose={() => setDeleteItem(null)} title="Eliminar Tipo de Documento">
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              ¿Está seguro de que desea eliminar el tipo de documento{' '}
              <strong className="text-gray-900 dark:text-white font-semibold">
                "{deleteItem?.nombre}" ({deleteItem?.codigo})
              </strong>
              ? Esta acción no se puede deshacer.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" onClick={() => setDeleteItem(null)}>
                Cancelar
              </Button>
              <Button
                variant="danger"
                loading={eliminarMut.isPending}
                onClick={() => deleteItem && eliminarMut.mutate(deleteItem.id)}
              >
                Eliminar
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </AppLayout>
  );
}
