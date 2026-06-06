'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { authApi } from '@/lib/api';
import { getErrorMessage } from '@/lib/utils';

export default function RecuperarPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setError('');
    try {
      await authApi.recuperar(email);
      setEnviado(true);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-unt-primary via-blue-800 to-blue-900 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-gray-950 rounded-2xl shadow-2xl p-8">
          {/* Logo */}
          <div className="text-center mb-6">
            <div className="w-14 h-14 bg-unt-primary rounded-2xl flex items-center justify-center text-3xl mx-auto mb-3">🎓</div>
            <h1 className="text-xl font-bold text-unt-primary">SGC-UNT v2.0</h1>
          </div>

          {enviado ? (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Correo enviado</h2>
              <p className="text-gray-500 text-sm">
                Si el correo <strong>{email}</strong> está registrado en el sistema,
                recibirá instrucciones para restablecer su contraseña en los próximos minutos.
              </p>
              <p className="text-xs text-gray-400">
                Revise también su carpeta de spam.
              </p>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 text-sm text-unt-primary hover:underline mt-4"
              >
                <ArrowLeft className="w-4 h-4" />
                Volver al inicio de sesión
              </Link>
            </div>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Recuperar contraseña</h2>
              <p className="text-gray-500 text-sm mb-6">
                Ingrese su correo institucional y le enviaremos un enlace para restablecer su contraseña.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Correo electrónico
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="usuario@unitru.edu.pe"
                      required
                      className="w-full pl-10 pr-4 py-2.5 text-sm border rounded-xl outline-none transition-all bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 focus:border-unt-primary focus:bg-white dark:text-white"
                    />
                  </div>
                </div>

                {error && (
                  <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 border border-red-200 rounded-xl px-4 py-2">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading || !email}
                  className="w-full py-2.5 bg-unt-primary hover:bg-blue-800 text-white font-semibold rounded-xl transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Enviando...</>
                  ) : 'Enviar enlace de recuperación'}
                </button>

                <Link
                  href="/login"
                  className="flex items-center justify-center gap-2 text-sm text-gray-500 hover:text-unt-primary transition-colors mt-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Volver al inicio de sesión
                </Link>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
