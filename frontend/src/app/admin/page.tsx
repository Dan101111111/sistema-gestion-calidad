'use client';
import React, { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, Table, Thead, Tbody, Th, Td, Tr, Button, Badge, Modal, Input, Select, Pagination, EmptyState, SkeletonCard } from '@/components/ui';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api';
import { formatDatetime, getErrorMessage, fromNow } from '@/lib/utils';
import { Users, Settings, Activity, Plus, UserCheck, UserX, Key, RefreshCw, Save, Edit } from 'lucide-react';
import { useToast } from '@/components/ui/ToastProvider';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

type AdminTab = 'usuarios' | 'auditoria' | 'configuracion';

export default function AdminPage() {
  const { hasRole } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<AdminTab>('usuarios');

  React.useEffect(() => {
    if (!hasRole('admin')) router.replace('/dashboard');
  }, []);

  if (!hasRole('admin')) return null;

  return (
    <AppLayout title="Administración">
      <div className="space-y-5">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Panel de Administración</h2>
          <p className="text-sm text-gray-500">Gestión de usuarios, auditoría y configuración del sistema</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl w-fit">
          {([
            { key: 'usuarios', label: 'Usuarios', icon: Users },
            { key: 'auditoria', label: 'Auditoría', icon: Activity },
            { key: 'configuracion', label: 'Configuración', icon: Settings },
          ] as { key: AdminTab; label: string; icon: React.ElementType }[]).map(t => {
            const Icon = t.icon;
            return (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={cn('flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-all',
                  tab === t.key ? 'bg-white dark:bg-gray-900 text-unt-primary shadow-sm' : 'text-gray-500 hover:text-gray-700')}>
                <Icon className="w-4 h-4" />{t.label}
              </button>
            );
          })}
        </div>

        {tab === 'usuarios' && <UsuariosTab />}
        {tab === 'auditoria' && <AuditoriaTab />}
        {tab === 'configuracion' && <ConfiguracionTab />}
      </div>
    </AppLayout>
  );
}

// ── Tab Usuarios ──────────────────────────────────────────────
function UsuariosTab() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [editUser, setEditUser] = useState<any>(null);
  const [showEditDetails, setShowEditDetails] = useState<any>(null);
  const [form, setForm] = useState({ codigo: '', nombre: '', apellido: '', email: '', password: '', rol: 'docente', facultad: '', escuela: '', telefono: '' });

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-usuarios', page, q],
    queryFn: () => adminApi.usuarios.listar({ page, limit: 15, q }).then(r => r.data),
  });

  const crearMut = useMutation({
    mutationFn: (d: object) => adminApi.usuarios.crear(d),
    onSuccess: () => {
      toast('success', 'Usuario creado');
      qc.invalidateQueries({ queryKey: ['admin-usuarios'] });
      setForm({ codigo: '', nombre: '', apellido: '', email: '', password: '', rol: 'docente', facultad: '', escuela: '', telefono: '' });
      setShowCreate(false);
    },
    onError: (e) => toast('error', getErrorMessage(e)),
  });

  const rolMut = useMutation({
    mutationFn: ({ id, rol }: { id: string; rol: string }) => adminApi.usuarios.asignarRol(id, rol),
    onSuccess: () => { toast('success', 'Rol actualizado'); qc.invalidateQueries({ queryKey: ['admin-usuarios'] }); },
    onError: (e) => toast('error', getErrorMessage(e)),
  });

  const toggleMut = useMutation({
    mutationFn: (id: string) => adminApi.usuarios.toggleActivo(id),
    onSuccess: () => { toast('success', 'Estado actualizado'); qc.invalidateQueries({ queryKey: ['admin-usuarios'] }); },
    onError: (e) => toast('error', getErrorMessage(e)),
  });

  const resetPwdMut = useMutation({
    mutationFn: ({ id, password }: { id: string; password: string }) => adminApi.usuarios.resetPassword(id, password),
    onSuccess: () => { toast('success', 'Contraseña restablecida'); setEditUser(null); },
    onError: (e) => toast('error', getErrorMessage(e)),
  });

  const editDetailsMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: object }) => adminApi.usuarios.actualizar(id, data),
    onSuccess: () => {
      toast('success', 'Datos de usuario actualizados');
      qc.invalidateQueries({ queryKey: ['admin-usuarios'] });
      setShowEditDetails(null);
    },
    onError: (e) => toast('error', getErrorMessage(e)),
  });

  const ROLES = ['admin', 'gestor_calidad', 'auditor', 'docente', 'estudiante', 'egresado', 'invitado'];
  const ROLE_COLORS: Record<string, string> = {
    admin: 'danger', gestor_calidad: 'primary', auditor: 'warning', docente: 'info',
    estudiante: 'success', egresado: 'purple', invitado: 'default',
  };

  const usuarios = data?.data || [];
  const meta = data?.meta;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-center">
        <Input placeholder="Buscar usuarios..." value={q} onChange={e => { setQ(e.target.value); setPage(1); }} className="max-w-xs" />
        <Button variant="outline" size="sm" icon={<RefreshCw className="w-4 h-4" />} onClick={() => refetch()}>Actualizar</Button>
        <Button size="sm" icon={<Plus className="w-4 h-4" />} onClick={() => setShowCreate(true)} className="ml-auto">Nuevo Usuario</Button>
      </div>

      <Card>
        {isLoading ? <div className="p-5"><SkeletonCard /></div> : usuarios.length === 0 ? <EmptyState message="Sin usuarios" /> : (
          <>
            <Table>
              <Thead><tr><Th>Código</Th><Th>Nombre</Th><Th>Email</Th><Th>Rol</Th><Th>Facultad</Th><Th>Estado</Th><Th>Último Acceso</Th><Th className="text-right">Acciones</Th></tr></Thead>
              <Tbody>
                {usuarios.map((u: any) => (
                  <Tr key={u.id}>
                    <Td><span className="font-mono text-xs text-gray-500">{u.codigo || '—'}</span></Td>
                    <Td>
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-unt-primary text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                          {u.nombre[0]}{u.apellido[0]}
                        </div>
                        <span className="font-medium text-sm text-gray-800 dark:text-gray-200">{u.nombre} {u.apellido}</span>
                      </div>
                    </Td>
                    <Td><span className="text-xs text-gray-500">{u.email}</span></Td>
                    <Td>
                      <select
                        value={u.rol}
                        onChange={e => rolMut.mutate({ id: u.id, rol: e.target.value })}
                        className="text-xs border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1 bg-white dark:bg-gray-900 outline-none"
                      >
                        {ROLES.map(r => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
                      </select>
                    </Td>
                    <Td><span className="text-xs text-gray-500">{u.facultad || '—'}</span></Td>
                    <Td>
                      <span className={cn('inline-flex items-center gap-1 text-xs font-medium', u.activo ? 'text-green-600' : 'text-red-500')}>
                        <span className={cn('w-1.5 h-1.5 rounded-full', u.activo ? 'bg-green-500' : 'bg-red-500')} />
                        {u.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </Td>
                    <Td><span className="text-xs text-gray-400">{u.ultimo_acceso ? fromNow(u.ultimo_acceso) : 'Nunca'}</span></Td>
                    <Td>
                      <div className="flex justify-end gap-1">
                        <button onClick={() => setShowEditDetails(u)} title="Editar datos"
                          className="p-1.5 rounded text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => toggleMut.mutate(u.id)} title={u.activo ? 'Desactivar' : 'Activar'}
                          className="p-1.5 rounded text-gray-400 hover:text-unt-primary hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                          {u.activo ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                        </button>
                        <button onClick={() => setEditUser(u)} title="Restablecer contraseña"
                          className="p-1.5 rounded text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 transition-colors">
                          <Key className="w-3.5 h-3.5" />
                        </button>
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

      <Modal open={showCreate} onClose={() => { setShowCreate(false); setForm({ codigo: '', nombre: '', apellido: '', email: '', password: '', rol: 'docente', facultad: '', escuela: '', telefono: '' }); }} title="Nuevo Usuario" size="md">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Código" placeholder="Código institucional" value={form.codigo} onChange={e => setForm(f => ({ ...f, codigo: e.target.value }))} />
            <Input label="Email*" type="email" placeholder="correo@unitru.edu.pe" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Nombre*" value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} />
            <Input label="Apellido*" value={form.apellido} onChange={e => setForm(f => ({ ...f, apellido: e.target.value }))} />
          </div>
          <Input label="Contraseña*" type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
          <div className="grid grid-cols-3 gap-4">
            <Select label="Rol" value={form.rol} onChange={e => setForm(f => ({ ...f, rol: e.target.value }))}>
              {ROLES.map(r => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
            </Select>
            <Input label="Facultad" value={form.facultad} onChange={e => setForm(f => ({ ...f, facultad: e.target.value }))} />
            <Input label="Escuela" value={form.escuela} onChange={e => setForm(f => ({ ...f, escuela: e.target.value }))} />
          </div>
          <Input label="Teléfono" placeholder="+51 999 999 999" value={form.telefono} onChange={e => setForm(f => ({ ...f, telefono: e.target.value }))} />
          <div className="flex justify-end pt-2">
            <Button onClick={() => crearMut.mutate(form)} loading={crearMut.isPending}>Crear Usuario</Button>
          </div>
        </div>
      </Modal>

      <Modal open={!!showEditDetails} onClose={() => setShowEditDetails(null)} title={`Editar Usuario: ${showEditDetails?.email}`} size="md">
        {showEditDetails && (
          <EditUserForm
            initialValues={showEditDetails}
            onSubmit={(data) => editDetailsMut.mutate({ id: showEditDetails.id, data })}
            loading={editDetailsMut.isPending}
            roles={ROLES}
          />
        )}
      </Modal>

      <Modal open={!!editUser} onClose={() => setEditUser(null)} title={`Restablecer contraseña: ${editUser?.email}`} size="sm">
        <ResetPwdForm onSubmit={(pwd) => resetPwdMut.mutate({ id: editUser.id, password: pwd })} loading={resetPwdMut.isPending} />
      </Modal>
    </div>
  );
}

function EditUserForm({ initialValues, onSubmit, loading, roles }: { initialValues: any; onSubmit: (data: any) => void; loading: boolean; roles: string[] }) {
  const [form, setForm] = useState({
    codigo: initialValues.codigo || '',
    nombre: initialValues.nombre || '',
    apellido: initialValues.apellido || '',
    rol: initialValues.rol || 'docente',
    facultad: initialValues.facultad || '',
    escuela: initialValues.escuela || '',
    telefono: initialValues.telefono || ''
  });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Input label="Código" value={form.codigo} onChange={e => setForm(f => ({ ...f, codigo: e.target.value }))} />
        <Select label="Rol" value={form.rol} onChange={e => setForm(f => ({ ...f, rol: e.target.value }))}>
          {roles.map(r => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Input label="Nombre*" value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} />
        <Input label="Apellido*" value={form.apellido} onChange={e => setForm(f => ({ ...f, apellido: e.target.value }))} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Input label="Facultad" value={form.facultad} onChange={e => setForm(f => ({ ...f, facultad: e.target.value }))} />
        <Input label="Escuela" value={form.escuela} onChange={e => setForm(f => ({ ...f, escuela: e.target.value }))} />
      </div>
      <Input label="Teléfono" value={form.telefono} onChange={e => setForm(f => ({ ...f, telefono: e.target.value }))} />
      <div className="flex justify-end pt-2">
        <Button onClick={() => onSubmit(form)} loading={loading}>Guardar Cambios</Button>
      </div>
    </div>
  );
}

function ResetPwdForm({ onSubmit, loading }: { onSubmit: (pwd: string) => void; loading: boolean }) {
  const [pwd, setPwd] = useState('');
  return (
    <div className="space-y-4">
      <Input label="Nueva Contraseña*" type="password" placeholder="Mínimo 8 caracteres" value={pwd} onChange={e => setPwd(e.target.value)} />
      <div className="flex justify-end pt-2"><Button onClick={() => onSubmit(pwd)} loading={loading} disabled={pwd.length < 6}>Restablecer</Button></div>
    </div>
  );
}

// ── Tab Auditoría ─────────────────────────────────────────────
function AuditoriaTab() {
  const [page, setPage] = useState(1);
  const [accion, setAccion] = useState('');
  const [tabla, setTabla] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['auditoria-log', page, accion, tabla],
    queryFn: () => adminApi.auditoria.log({ page, limit: 20, ...(accion ? { accion } : {}), ...(tabla ? { tabla } : {}) }).then(r => r.data),
  });

  const ACCION_COLOR: Record<string, string> = { CREATE: 'success', UPDATE: 'warning', DELETE: 'danger', LOGIN: 'info', LOGOUT: 'default' };
  const logs = data?.data || [];

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <Select value={accion} onChange={e => { setAccion(e.target.value); setPage(1); }} className="w-44">
          <option value="">Todas las acciones</option>
          {['CREATE','UPDATE','DELETE','LOGIN','LOGOUT','EXPORT'].map(a => <option key={a} value={a}>{a}</option>)}
        </Select>
        <Input placeholder="Filtrar por tabla..." value={tabla} onChange={e => { setTabla(e.target.value); setPage(1); }} className="max-w-xs" />
      </div>

      <Card>
        {isLoading ? <div className="p-5"><SkeletonCard /></div> : logs.length === 0 ? <EmptyState message="Sin registros de auditoría" /> : (
          <>
            <Table>
              <Thead><tr><Th>Tabla</Th><Th>Acción</Th><Th>Usuario</Th><Th>IP</Th><Th>Fecha</Th></tr></Thead>
              <Tbody>
                {logs.map((l: any) => (
                  <Tr key={l.id}>
                    <Td><span className="font-mono text-xs bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">{l.tabla}</span></Td>
                    <Td><Badge variant={ACCION_COLOR[l.accion] || 'default'}>{l.accion}</Badge></Td>
                    <Td><span className="text-xs">{l.usuario?.nombre} {l.usuario?.apellido}</span></Td>
                    <Td><span className="text-xs text-gray-400 font-mono">{l.ip}</span></Td>
                    <Td><span className="text-xs text-gray-500">{formatDatetime(l.creado_en)}</span></Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
            {data?.meta && <div className="px-4"><Pagination page={data.meta.page} pages={data.meta.pages} total={data.meta.total} onPage={setPage} /></div>}
          </>
        )}
      </Card>
    </div>
  );
}

// ── Tab Configuración ─────────────────────────────────────────
function ConfiguracionTab() {
  const { toast } = useToast();
  const [config, setConfig] = useState<Record<string, string>>({});
  const [dirty, setDirty] = useState(false);

  const { isLoading } = useQuery({
    queryKey: ['sistema-config'],
    queryFn: () => adminApi.configuracion.obtener().then(r => { setConfig(r.data.data); return r.data.data; }),
  });

  const updateMut = useMutation({
    mutationFn: (d: object) => adminApi.configuracion.actualizar(d),
    onSuccess: () => { toast('success', 'Configuración guardada'); setDirty(false); },
    onError: (e) => toast('error', getErrorMessage(e)),
  });

  const CAMPOS_EDITABLES = [
    { key: 'nombre_institucion', label: 'Nombre de la Institución' },
    { key: 'siglas_institucion', label: 'Siglas' },
    { key: 'color_primario', label: 'Color Primario', type: 'color' },
    { key: 'color_secundario', label: 'Color Secundario', type: 'color' },
    { key: 'dias_alerta_vencimiento_documento', label: 'Días alerta vencimiento doc.' },
    { key: 'dias_alerta_vencimiento_capa', label: 'Días alerta vencimiento CAPA' },
    { key: 'umbral_cumplimiento_alerta', label: 'Umbral cumplimiento indicadores (%)' },
    { key: 'smtp_host', label: 'Servidor SMTP' },
    { key: 'smtp_port', label: 'Puerto SMTP' },
    { key: 'smtp_from', label: 'Correo remitente' },
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Parámetros del Sistema</CardTitle>
          {dirty && (
            <Button size="sm" icon={<Save className="w-4 h-4" />} onClick={() => updateMut.mutate(config)} loading={updateMut.isPending}>
              Guardar Cambios
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? <div className="space-y-3">{Array(6).fill(0).map((_, i) => <div key={i} className="skeleton h-10 rounded" />)}</div> : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {CAMPOS_EDITABLES.map(campo => (
              <div key={campo.key} className="space-y-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{campo.label}</label>
                <input
                  type={campo.type || 'text'}
                  value={config[campo.key] || ''}
                  onChange={e => { setConfig(c => ({ ...c, [campo.key]: e.target.value })); setDirty(true); }}
                  className="w-full px-3 py-2 text-sm border rounded-lg outline-none bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 focus:border-unt-primary"
                />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
