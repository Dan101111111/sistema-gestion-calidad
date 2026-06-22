'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  LayoutDashboard, FileText, GitBranch, Award, ClipboardCheck,
  AlertTriangle, BarChart2, MessageSquare, Bell, Settings, Users,
  ChevronLeft, ChevronRight, Menu, X, Shield, BookOpen,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  roles?: string[];
  badge?: number;
}

interface NavSection {
  header: string;
  items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    header: 'GESTIÓN',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/documentos', label: 'Documentos', icon: FileText },
      { href: '/procesos', label: 'Mapa de Procesos', icon: GitBranch },
      { href: '/capas', label: 'CAPA', icon: Shield },
      { href: '/riesgos', label: 'Riesgos', icon: AlertTriangle },
    ],
  },
  {
    header: 'MONITOREO',
    items: [
      { href: '/indicadores', label: 'Indicadores', icon: BarChart2 },
      { href: '/encuestas', label: 'Encuestas', icon: MessageSquare },
      { href: '/notificaciones', label: 'Notificaciones', icon: Bell },
    ],
  },
  {
    header: 'ADMIN',
    items: [
      { href: '/acreditacion', label: 'Acreditación', icon: Award, roles: ['admin', 'gestor_calidad', 'auditor'] },
      { href: '/auditorias', label: 'Auditorías', icon: ClipboardCheck, roles: ['admin', 'gestor_calidad', 'auditor'] },
      { href: '/admin', label: 'Administración', icon: Settings, roles: ['admin'] },
      { href: '/admin/tipos-documento', label: 'Tipos de Documento', icon: BookOpen, roles: ['admin'] },
    ],
  },
];

interface SidebarProps {
  noLeidas?: number;
}

export function Sidebar({ noLeidas = 0 }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const { user, hasRole } = useAuth();

  const visibleSections = NAV_SECTIONS.map(section => ({
    ...section,
    items: section.items.filter(item => !item.roles || hasRole(...(item.roles as any[]))),
  })).filter(section => section.items.length > 0);

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Collapse toggle - TOP */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center justify-center h-12 border-b border-white/10 text-blue-300 hover:text-white hover:bg-white/10 transition-all duration-200"
      >
        {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
      </button>

      {/* Logo */}
      <div className={cn(
        'flex items-center gap-3 px-4 py-4 border-b border-white/10',
        collapsed ? 'justify-center' : ''
      )}>
        <div className="flex-shrink-0 w-9 h-9 bg-white/10 rounded-lg flex items-center justify-center text-white font-bold text-lg">
          🎓
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <p className="text-white font-bold text-sm leading-tight">SGC-UNT</p>
            <p className="text-blue-200 text-xs leading-tight">v2.0</p>
          </div>
        )}
      </div>

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto py-4 px-2">
        {visibleSections.map((section, sectionIndex) => (
          <div key={section.header}>
            {/* Section header */}
            {!collapsed && (
              <div className="px-3 pt-6 pb-2">
                <p className="text-[10px] uppercase font-semibold tracking-wider text-blue-300">
                  {section.header}
                </p>
              </div>
            )}
            {collapsed && sectionIndex > 0 && (
              <div className="my-4 mx-3 h-px bg-white/10" />
            )}

            {/* Section items */}
            {section.items.map(item => {
              const Icon = item.icon;
              const active = item.href === '/admin' ? pathname === '/admin' : pathname.startsWith(item.href);
              const isNotif = item.href === '/notificaciones';

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group relative',
                    active
                      ? 'bg-white/20 text-white shadow-sm'
                      : 'text-blue-100 hover:bg-white/10 hover:text-white',
                    collapsed ? 'justify-center' : ''
                  )}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon className="w-5 h-5 flex-shrink-0 transition-transform duration-200 group-hover:scale-110" />
                  {!collapsed && <span className="flex-1">{item.label}</span>}
                  {isNotif && noLeidas > 0 && (
                    <span className={cn(
                      'bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse-slow',
                      collapsed ? 'absolute -top-1 -right-1 w-5 h-5 text-[10px]' : 'w-5 h-5 text-[10px]'
                    )}>
                      {noLeidas > 9 ? '9+' : noLeidas}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* User info */}
      {user && (
        <div className={cn(
          'border-t border-white/10 px-4 py-3 flex items-center gap-3',
          collapsed ? 'justify-center' : ''
        )}>
          <div className="w-8 h-8 rounded-full bg-white/20 flex-shrink-0 flex items-center justify-center text-white font-bold text-sm">
            {user.nombre[0]}{user.apellido[0]}
          </div>
          {!collapsed && (
            <div className="overflow-hidden flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">{user.nombre} {user.apellido}</p>
              <p className="text-blue-300 text-xs truncate capitalize">{user.rol.replace('_', ' ')}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className={cn(
        'hidden lg:flex flex-col bg-unt-primary border-r border-white/10 transition-all duration-300 flex-shrink-0',
        collapsed ? 'w-16' : 'w-64'
      )}>
        <SidebarContent />
      </aside>

      {/* Mobile toggle button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-unt-primary text-white rounded-lg shadow-lg"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-72 bg-unt-primary flex flex-col shadow-2xl">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-3 right-3 text-white/60 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}
    </>
  );
}
