'use client';
import React from 'react';
import { cn } from '@/lib/utils';
import { X, AlertTriangle, CheckCircle, Info, XCircle, Loader2 } from 'lucide-react';

// ─── Card ────────────────────────────────────────────────────
export function Card({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm', className)} {...props}>
      {children}
    </div>
  );
}
export function CardHeader({ children, className }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('px-5 py-4 border-b border-gray-100 dark:border-gray-800', className)}>{children}</div>;
}
export function CardTitle({ children, className }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn('text-base font-semibold text-gray-800 dark:text-gray-200', className)}>{children}</h3>;
}
export function CardContent({ children, className }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('px-5 py-4', className)}>{children}</div>;
}

// ─── Badge ───────────────────────────────────────────────────
const BADGE_VARIANTS: Record<string, string> = {
  default: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  primary: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  success: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  warning: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  danger: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  info: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
  purple: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
};

export function Badge({ children, variant = 'default', className }: { children: React.ReactNode; variant?: string; className?: string }) {
  return (
    <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', BADGE_VARIANTS[variant] || BADGE_VARIANTS.default, className)}>
      {children}
    </span>
  );
}

// ─── Button ──────────────────────────────────────────────────
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
}
const BTN_VARIANTS: Record<string, string> = {
  primary: 'bg-unt-primary hover:bg-blue-800 text-white shadow-sm',
  secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-200',
  danger: 'bg-red-600 hover:bg-red-700 text-white shadow-sm',
  ghost: 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400',
  outline: 'border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300',
};
const BTN_SIZES: Record<string, string> = {
  sm: 'px-3 py-1.5 text-xs gap-1.5',
  md: 'px-4 py-2 text-sm gap-2',
  lg: 'px-6 py-2.5 text-base gap-2',
};
export function Button({ children, variant = 'primary', size = 'md', loading, icon, className, disabled, ...props }: ButtonProps) {
  return (
    <button
      className={cn('inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed', BTN_VARIANTS[variant], BTN_SIZES[size], className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : icon}
      {children}
    </button>
  );
}

// ─── Input ───────────────────────────────────────────────────
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string; error?: string; icon?: React.ReactNode;
}
export function Input({ label, error, icon, className, ...props }: InputProps) {
  return (
    <div className="space-y-1">
      {label && <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>}
      <div className="relative">
        {icon && <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{icon}</div>}
        <input
          className={cn(
            'w-full px-3 py-2 text-sm border rounded-lg outline-none transition-all',
            'bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100',
            'border-gray-300 dark:border-gray-600',
            'focus:border-unt-primary focus:ring-1 focus:ring-unt-primary/30',
            'placeholder:text-gray-400 dark:placeholder:text-gray-600',
            error && 'border-red-400 focus:border-red-400',
            icon && 'pl-9',
            className
          )}
          {...props}
        />
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

// ─── Select ──────────────────────────────────────────────────
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string; error?: string;
}
export function Select({ label, error, className, children, ...props }: SelectProps) {
  return (
    <div className="space-y-1">
      {label && <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>}
      <select
        className={cn(
          'w-full px-3 py-2 text-sm border rounded-lg outline-none bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:border-unt-primary',
          error && 'border-red-400',
          className
        )}
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

// ─── Textarea ────────────────────────────────────────────────
export function Textarea({ label, error, className, ...props }: { label?: string; error?: string } & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <div className="space-y-1">
      {label && <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>}
      <textarea
        className={cn('w-full px-3 py-2 text-sm border rounded-lg outline-none bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:border-unt-primary resize-y min-h-[80px]', error && 'border-red-400', className)}
        {...props}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

// ─── Modal ───────────────────────────────────────────────────
interface ModalProps {
  open: boolean; onClose: () => void; title?: string; children: React.ReactNode; size?: 'sm' | 'md' | 'lg' | 'xl';
}
const MODAL_SIZES = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };
export function Modal({ open, onClose, title, children, size = 'md' }: ModalProps) {
  React.useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className={cn('relative w-full bg-white dark:bg-gray-900 rounded-2xl shadow-2xl animate-fade-in', MODAL_SIZES[size])}>
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b dark:border-gray-800">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">{title}</h2>
            <button onClick={onClose} className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800"><X className="w-4 h-4" /></button>
          </div>
        )}
        <div className="px-6 py-4">{children}</div>
      </div>
    </div>
  );
}

// ─── Table ───────────────────────────────────────────────────
export function Table({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
      <table className={cn('w-full text-sm', className)}>{children}</table>
    </div>
  );
}
export function Thead({ children }: { children: React.ReactNode }) {
  return <thead className="bg-gray-50 dark:bg-gray-800 text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">{children}</thead>;
}
export function Tbody({ children }: { children: React.ReactNode }) {
  return <tbody className="divide-y divide-gray-100 dark:divide-gray-800">{children}</tbody>;
}
export function Th({ children, className }: { children: React.ReactNode; className?: string }) {
  return <th className={cn('px-4 py-3 text-left font-medium', className)}>{children}</th>;
}
export function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={cn('px-4 py-3 text-gray-700 dark:text-gray-300', className)}>{children}</td>;
}
export function Tr({ children, className, onClick }: { children: React.ReactNode; className?: string; onClick?: () => void }) {
  return <tr className={cn('hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors', onClick && 'cursor-pointer', className)} onClick={onClick}>{children}</tr>;
}

// ─── Skeleton ────────────────────────────────────────────────
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton h-4 rounded', className)} />;
}
export function SkeletonCard() {
  return (
    <Card className="p-5 space-y-3">
      <Skeleton className="h-5 w-2/3" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-4/5" />
    </Card>
  );
}

// ─── KPI Card ────────────────────────────────────────────────
interface KpiCardProps {
  title: string; value: number | string; icon: React.ReactNode;
  color?: string; subtitle?: string; loading?: boolean;
}
export function KpiCard({ title, value, icon, color = 'blue', subtitle, loading }: KpiCardProps) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
    red: 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400',
    green: 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400',
    yellow: 'bg-yellow-50 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400',
    purple: 'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400',
    orange: 'bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400',
  };

  return (
    <Card className="p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{title}</p>
          {loading ? (
            <Skeleton className="h-9 w-20 mt-1" />
          ) : (
            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
          )}
          {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
        </div>
        <div className={cn('p-3 rounded-xl', colors[color] || colors.blue)}>
          {icon}
        </div>
      </div>
    </Card>
  );
}

// ─── Empty State ─────────────────────────────────────────────
export function EmptyState({ message = 'Sin datos', description, action }: { message?: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
        <Info className="w-8 h-8 text-gray-400" />
      </div>
      <p className="text-gray-600 dark:text-gray-400 font-medium">{message}</p>
      {description && <p className="text-sm text-gray-400 mt-1 max-w-xs">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

// ─── Pagination ──────────────────────────────────────────────
interface PaginationProps {
  page: number; pages: number; total: number; onPage: (p: number) => void;
}
export function Pagination({ page, pages, total, onPage }: PaginationProps) {
  if (pages <= 1) return null;
  return (
    <div className="flex items-center justify-between px-1 py-3">
      <p className="text-sm text-gray-500">{total} registros totales</p>
      <div className="flex items-center gap-1">
        <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onPage(page - 1)}>Anterior</Button>
        <span className="px-3 py-1.5 text-sm text-gray-600">{page} / {pages}</span>
        <Button variant="outline" size="sm" disabled={page >= pages} onClick={() => onPage(page + 1)}>Siguiente</Button>
      </div>
    </div>
  );
}

// ─── Confirm Dialog ──────────────────────────────────────────
export function ConfirmDialog({ open, onClose, onConfirm, title, message, danger = false }: {
  open: boolean; onClose: () => void; onConfirm: () => void; title: string; message: string; danger?: boolean;
}) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{message}</p>
      <div className="flex gap-2 justify-end">
        <Button variant="secondary" size="sm" onClick={onClose}>Cancelar</Button>
        <Button variant={danger ? 'danger' : 'primary'} size="sm" onClick={() => { onConfirm(); onClose(); }}>
          Confirmar
        </Button>
      </div>
    </Modal>
  );
}

// ─── Status Badge ────────────────────────────────────────────
const ESTADO_BADGE: Record<string, { label: string; variant: string }> = {
  borrador: { label: 'Borrador', variant: 'default' },
  en_revision: { label: 'En Revisión', variant: 'info' },
  aprobado: { label: 'Aprobado', variant: 'success' },
  rechazado: { label: 'Rechazado', variant: 'danger' },
  archivado: { label: 'Archivado', variant: 'default' },
  activo: { label: 'Activo', variant: 'success' },
  mitigado: { label: 'Mitigado', variant: 'info' },
  aceptado: { label: 'Aceptado', variant: 'warning' },
  eliminado: { label: 'Eliminado', variant: 'default' },
  registrada: { label: 'Registrada', variant: 'default' },
  en_implementacion: { label: 'En Implementación', variant: 'info' },
  implementada: { label: 'Implementada', variant: 'primary' },
  verificada: { label: 'Verificada', variant: 'warning' },
  cerrada: { label: 'Cerrada', variant: 'success' },
  rechazada: { label: 'Rechazada', variant: 'danger' },
  planificado: { label: 'Planificado', variant: 'default' },
  en_ejecucion: { label: 'En Ejecución', variant: 'info' },
  completado: { label: 'Completado', variant: 'success' },
  cancelado: { label: 'Cancelado', variant: 'danger' },
  publicada: { label: 'Publicada', variant: 'success' },
  en_proceso: { label: 'En Proceso', variant: 'info' },
  abierto: { label: 'Abierto', variant: 'warning' },
};

export function EstadoBadge({ estado }: { estado: string }) {
  const cfg = ESTADO_BADGE[estado] || { label: estado, variant: 'default' };
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
}

// ─── Nivel Riesgo Badge ──────────────────────────────────────
export function NivelRiesgoBadge({ nivel }: { nivel: number }) {
  if (nivel >= 17) return <Badge variant="danger">Crítico ({nivel})</Badge>;
  if (nivel >= 10) return <Badge variant="warning">Alto ({nivel})</Badge>;
  if (nivel >= 5) return <Badge variant="info">Medio ({nivel})</Badge>;
  return <Badge variant="success">Bajo ({nivel})</Badge>;
}

// ─── Progress bar ────────────────────────────────────────────
export function ProgressBar({ value, max = 100, color = 'blue', showLabel = true }: { value: number; max?: number; color?: string; showLabel?: boolean }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const colors: Record<string, string> = { blue: 'bg-blue-500', green: 'bg-green-500', yellow: 'bg-yellow-500', red: 'bg-red-500' };
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
        <div className={cn('h-2 rounded-full transition-all', colors[color] || colors.blue)} style={{ width: `${pct}%` }} />
      </div>
      {showLabel && <span className="text-xs text-gray-500 w-10 text-right">{value}%</span>}
    </div>
  );
}


