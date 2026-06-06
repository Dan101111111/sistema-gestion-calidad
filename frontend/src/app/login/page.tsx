'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Lock, Mail, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/ToastProvider';
import { getErrorMessage } from '@/lib/utils';

const schema = z.object({
  email: z.string().email('Ingrese un email válido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
});
type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) });

  React.useEffect(() => {
    if (isAuthenticated) router.replace('/dashboard');
  }, [isAuthenticated, router]);

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    setLoginError('');
    try {
      await login(data.email, data.password);
      toast('success', '¡Bienvenido al SGC-UNT!');
      router.replace('/dashboard');
    } catch (err) {
      const msg = getErrorMessage(err);
      setLoginError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-unt-primary via-blue-800 to-blue-900">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-center items-center flex-1 p-12 text-white">
        <div className="max-w-md">
          <div className="w-24 h-24 bg-white/10 rounded-2xl flex items-center justify-center text-6xl mb-6 backdrop-blur">
            🎓
          </div>
          <h1 className="text-4xl font-bold mb-3">SGC-UNT v2.0</h1>
          <p className="text-blue-200 text-lg mb-8">Sistema de Gestión de la Calidad</p>
          <p className="text-blue-100 leading-relaxed">
            Universidad Nacional de Trujillo — Plataforma integral para la gestión de calidad
            institucional, acreditación, auditorías y mejora continua.
          </p>
          <div className="mt-10 grid grid-cols-2 gap-4">
            {[
              { icon: '📄', label: 'Gestión Documental' },
              { icon: '🔍', label: 'Auditorías ISO 21001' },
              { icon: '📊', label: 'Indicadores SUNEDU' },
              { icon: '⚠️', label: 'Gestión de Riesgos' },
            ].map(f => (
              <div key={f.label} className="bg-white/10 backdrop-blur rounded-xl p-4">
                <span className="text-2xl">{f.icon}</span>
                <p className="text-sm mt-2 font-medium">{f.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — Form */}
      <div className="flex-1 lg:max-w-md flex items-center justify-center p-6 bg-white dark:bg-gray-950">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="w-16 h-16 bg-unt-primary rounded-2xl flex items-center justify-center text-4xl mx-auto mb-3">🎓</div>
            <h2 className="text-xl font-bold text-unt-primary">SGC-UNT v2.0</h2>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Iniciar sesión</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-8">Ingrese sus credenciales institucionales</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Email */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Correo electrónico</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  {...register('email')}
                  type="email"
                  placeholder="usuario@unitru.edu.pe"
                  className="w-full pl-10 pr-4 py-2.5 text-sm border rounded-xl outline-none transition-all bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 focus:border-unt-primary focus:bg-white dark:focus:bg-gray-800 dark:text-white"
                />
              </div>
              {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
            </div>

            {/* Password */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Contraseña</label>
                <Link href="/recuperar" className="text-xs text-unt-primary hover:underline">¿Olvidó su contraseña?</Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  {...register('password')}
                  type={showPwd ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 text-sm border rounded-xl outline-none transition-all bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 focus:border-unt-primary focus:bg-white dark:focus:bg-gray-800 dark:text-white"
                />
                <button type="button" onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
            </div>

            {/* Error */}
            {loginError && (
              <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-600 dark:text-red-400">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{loginError}</span>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-unt-primary hover:bg-blue-800 text-white font-semibold rounded-xl transition-all disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? (
                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Verificando...</>
              ) : 'Ingresar al sistema'}
            </button>
          </form>

          <p className="text-center text-xs text-gray-400 mt-8">
            © {new Date().getFullYear()} Universidad Nacional de Trujillo<br />
            Dirección de Gestión de la Calidad
          </p>
        </div>
      </div>
    </div>
  );
}
