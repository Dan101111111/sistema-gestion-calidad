'use client';
import React, { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Badge } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/ToastProvider';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authApi, adminApi } from '@/lib/api';
import { getErrorMessage, formatDatetime, fromNow } from '@/lib/utils';
import { User, Lock, Monitor, LogOut, Save, Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

type ProfileTab = 'datos' | 'seguridad' | 'sesiones';

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: 'Mínimo 8 caracteres', ok: password.length >= 8 },
    { label: 'Letra mayúscula',      ok: /[A-Z]/.test(password) },
    { label: 'Letra minúscula',      ok: /[a-z]/.test(password) },
    { label: 'Número',               ok: /\d/.test(password) },
  ];
  const score = checks.filter(c => c.ok).length;
  const color = score <= 1 ? 'bg-red-500' : score <= 2 ? 'bg-yellow-500' : score <= 3 ? 'bg-blue-500' : 'bg-green-500';

  return (
    <div className="space-y-1.5 mt-1">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i <= score ? color : 'bg-gray-200 dark:bg-gray-700'}`} />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-1">
        {checks.map(c => (
          <div key={c.label} className="flex items-center gap-1 text-xs">
            {c.ok
              ? <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" />
              : <XCircle className="w-3 h-3 text-gray-300 flex-shrink-0" />}
            <span className={c.ok ? 'text-green-700 dark:text-green-400' : 'text-gray-400'}>{c.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function PerfilPage() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [tab, setTab] = useState<ProfileTab>('datos');
  const [showActual, setShowActual] = useState(false);
  const [showNueva, setShowNueva] = useState(false);

  // Datos personales
  const [datosForm, setDatosForm] = useState({
    nombre:   user?.nombre   || '',
    apellido: user?.apellido || '',
    telefono: '',
    facultad: user?.facultad || '',
    escuela:  user?.escuela  || '',
  });

  // Contraseña
  const [pwdForm, setPwdForm] = useState({
    password_actual: '',
    password_nuevo:  '',
    password_confirm: '',
  });

  // Sesiones activas
  const { data: sesiones, isLoading: sesLoading } = useQuery({
    queryKey: ['mis-sesiones'],
    queryFn:  () => authApi.sesionesActivas().then(r => r.data.data),
    enabled:  tab === 'sesiones',
  });

  const updateMut = useMutation({
    mutationFn: (d: object) => authApi.actualizarPerfil(d),
    onSuccess:  () => { toast('success', 'Perfil actualizado correctamente'); qc.invalidateQueries({ queryKey: ['auth-me'] }); },
    onError:    (e) => toast('error', getErrorMessage(e)),
  });

  const pwdMut = useMutation({
    mutationFn: (d: { password_actual: string; password_nuevo: string }) => authApi.cambiarPassword(d.password_actual, d.password_nuevo),
    onSuccess:  () => { toast('success', 'Contraseña actualizada. Inicie sesión nuevamente.'); setPwdForm({ password_actual: '', password_nuevo: '', password_confirm: '' }); setTimeout(() => logout(), 2000); },
    onError:    (e) => toast('error', getErrorMessage(e)),
  });

  const revocarMut = useMutation({
    mutationFn: (id: string) => authApi.revocarSesion(id),
    onSuccess:  () => { toast('success', 'Sesión revocada'); qc.invalidateQueries({ queryKey: ['mis-sesiones'] }); },
    onError:    (e) => toast('error', getErrorMessage(e)),
  });

  const ROL_LABELS: Record<string, { label: string; variant: string }> = {
    admin:          { label: 'Administrador',     variant: 'danger' },
    gestor_calidad: { label: 'Gestor de Calidad', variant: 'primary' },
    auditor:        { label: 'Auditor',            variant: 'warning' },
    docente:        { label: 'Docente',            variant: 'info' },
    estudiante:     { label: 'Estudiante',         variant: 'success' },
    egresado:       { label: 'Egresado',           variant: 'purple' },
    invitado:       { label: 'Invitado',           variant: 'default' },
  };

  const rolInfo = ROL_LABELS[user?.rol || ''] || { label: user?.rol || '', variant: 'default' };

  const pwdValida = pwdForm.password_nuevo.length >= 8
    && /[A-Z]/.test(pwdForm.password_nuevo)
    && /[a-z]/.test(pwdForm.password_nuevo)
    && /\d/.test(pwdForm.password_nuevo)
    && pwdForm.password_nuevo === pwdForm.password_confirm
    && pwdForm.password_actual.length > 0;

  return (
    <AppLayout title="Mi Perfil">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header perfil */}
        <Card>
          <CardContent className="py-6">
            <div className="flex items-center gap-5">
              <div className="w-20 h-20 rounded-full bg-unt-primary text-white flex items-center justify-center text-3xl font-bold flex-shrink-0 shadow-lg">
                {user?.nombre?.[0]}{user?.apellido?.[0]}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {user?.nombre} {user?.apellido}
                </h2>
                <p className="text-gray-500 text-sm mt-0.5">{user?.email}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant={rolInfo.variant as any}>{rolInfo.label}</Badge>
                  {user?.facultad && <Badge variant="default">{user.facultad}</Badge>}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl w-fit">
          {([
            { key: 'datos',     label: 'Datos Personales', icon: User },
            { key: 'seguridad', label: 'Seguridad',         icon: Lock },
            { key: 'sesiones',  label: 'Sesiones',          icon: Monitor },
          ] as { key: ProfileTab; label: string; icon: React.ElementType }[]).map(t => {
            const Icon = t.icon;
            return (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={cn(
                  'flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-all',
                  tab === t.key ? 'bg-white dark:bg-gray-900 text-unt-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'
                )}>
                <Icon className="w-4 h-4" />{t.label}
              </button>
            );
          })}
        </div>

        {/* Tab: Datos personales */}
        {tab === 'datos' && (
          <Card>
            <CardHeader><CardTitle>Datos Personales</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Nombre"
                  value={datosForm.nombre}
                  onChange={e => setDatosForm(f => ({ ...f, nombre: e.target.value }))}
                />
                <Input
                  label="Apellido"
                  value={datosForm.apellido}
                  onChange={e => setDatosForm(f => ({ ...f, apellido: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Teléfono"
                  value={datosForm.telefono}
                  onChange={e => setDatosForm(f => ({ ...f, telefono: e.target.value }))}
                  placeholder="+51 999 999 999"
                />
                <Input
                  label="Facultad"
                  value={datosForm.facultad}
                  onChange={e => setDatosForm(f => ({ ...f, facultad: e.target.value }))}
                />
              </div>
              <Input
                label="Escuela / Departamento"
                value={datosForm.escuela}
                onChange={e => setDatosForm(f => ({ ...f, escuela: e.target.value }))}
              />
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl text-sm space-y-1">
                <p className="text-gray-500 text-xs uppercase font-semibold mb-2">Información de cuenta (no editable)</p>
                <div className="flex justify-between">
                  <span className="text-gray-500">Email institucional:</span>
                  <span className="font-medium text-gray-800 dark:text-gray-200">{user?.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Rol actual:</span>
                  <Badge variant={rolInfo.variant as any}>{rolInfo.label}</Badge>
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <Button
                  icon={<Save className="w-4 h-4" />}
                  onClick={() => updateMut.mutate(datosForm)}
                  loading={updateMut.isPending}
                >
                  Guardar cambios
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tab: Seguridad */}
        {tab === 'seguridad' && (
          <Card>
            <CardHeader><CardTitle>Cambiar Contraseña</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl text-sm text-yellow-800 dark:text-yellow-300">
                ⚠️ Al cambiar su contraseña, se cerrarán todas las sesiones activas y deberá iniciar sesión nuevamente.
              </div>

              {/* Contraseña actual */}
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Contraseña actual</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type={showActual ? 'text' : 'password'}
                    value={pwdForm.password_actual}
                    onChange={e => setPwdForm(f => ({ ...f, password_actual: e.target.value }))}
                    placeholder="Contraseña actual"
                    className="w-full pl-10 pr-10 py-2.5 text-sm border rounded-xl outline-none bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 focus:border-unt-primary dark:text-white"
                  />
                  <button type="button" onClick={() => setShowActual(!showActual)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showActual ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Nueva contraseña */}
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nueva contraseña</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type={showNueva ? 'text' : 'password'}
                    value={pwdForm.password_nuevo}
                    onChange={e => setPwdForm(f => ({ ...f, password_nuevo: e.target.value }))}
                    placeholder="Nueva contraseña"
                    className="w-full pl-10 pr-10 py-2.5 text-sm border rounded-xl outline-none bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 focus:border-unt-primary dark:text-white"
                  />
                  <button type="button" onClick={() => setShowNueva(!showNueva)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showNueva ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {pwdForm.password_nuevo && <PasswordStrength password={pwdForm.password_nuevo} />}
              </div>

              {/* Confirmar contraseña */}
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Confirmar nueva contraseña</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type={showNueva ? 'text' : 'password'}
                    value={pwdForm.password_confirm}
                    onChange={e => setPwdForm(f => ({ ...f, password_confirm: e.target.value }))}
                    placeholder="Repita la nueva contraseña"
                    className={cn(
                      'w-full pl-10 pr-4 py-2.5 text-sm border rounded-xl outline-none bg-gray-50 dark:bg-gray-900 dark:text-white focus:border-unt-primary transition-all',
                      pwdForm.password_confirm && pwdForm.password_nuevo !== pwdForm.password_confirm
                        ? 'border-red-400' : 'border-gray-200 dark:border-gray-700'
                    )}
                  />
                </div>
                {pwdForm.password_confirm && pwdForm.password_nuevo !== pwdForm.password_confirm && (
                  <p className="text-xs text-red-500">Las contraseñas no coinciden</p>
                )}
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  icon={<Lock className="w-4 h-4" />}
                  onClick={() => pwdMut.mutate({ password_actual: pwdForm.password_actual, password_nuevo: pwdForm.password_nuevo })}
                  loading={pwdMut.isPending}
                  disabled={!pwdValida}
                >
                  Cambiar contraseña
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tab: Sesiones */}
        {tab === 'sesiones' && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Sesiones Activas</CardTitle>
                <Button variant="danger" size="sm" icon={<LogOut className="w-4 h-4" />} onClick={() => logout()}>
                  Cerrar todas
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 py-3">
              {sesLoading ? (
                Array(2).fill(0).map((_, i) => <div key={i} className="skeleton h-16 rounded-xl" />)
              ) : (sesiones as any[] || []).length === 0 ? (
                <p className="text-center text-gray-400 text-sm py-6">Sin sesiones activas</p>
              ) : (
                (sesiones as any[]).map((s: any) => (
                  <div key={s.id} className="flex items-center gap-4 p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <div className="p-2.5 bg-unt-light dark:bg-blue-900/20 rounded-xl">
                      <Monitor className="w-5 h-5 text-unt-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                        {s.user_agent ? s.user_agent.split(' ').slice(0, 3).join(' ') : 'Dispositivo desconocido'}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        IP: {s.ip || '—'} · Iniciada {fromNow(s.creado_en)}
                      </p>
                      <p className="text-xs text-gray-400">
                        Expira: {formatDatetime(s.expira_en)}
                      </p>
                    </div>
                    <button
                      onClick={() => revocarMut.mutate(s.id)}
                      className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex-shrink-0"
                      title="Revocar sesión"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
