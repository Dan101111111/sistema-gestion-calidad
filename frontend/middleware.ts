import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Rutas públicas (no requieren autenticación)
const PUBLIC_ROUTES = ['/login', '/recuperar', '/reset-password'];

// Rutas solo para admin
const ADMIN_ROUTES = ['/admin'];

// Rutas para admin y gestor_calidad
const GESTOR_ROUTES = ['/acreditacion', '/auditorias'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Permitir rutas públicas y assets
  if (
    PUBLIC_ROUTES.some(r => pathname.startsWith(r)) ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/assets')
  ) {
    return NextResponse.next();
  }

  // Verificar autenticación via cookie de refresh token
  const refreshToken = request.cookies.get('refreshToken');

  if (!refreshToken) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  // Para verificación de roles más fina, el frontend usa AuthContext
  // El middleware solo hace un primer nivel de protección por presencia de token
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|assets).*)',
  ],
};
