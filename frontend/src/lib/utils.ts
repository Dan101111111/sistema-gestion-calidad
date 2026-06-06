import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date | undefined, fmt = 'dd/MM/yyyy') {
  if (!date) return '—';
  try {
    const d = typeof date === 'string' ? parseISO(date) : date;
    return format(d, fmt, { locale: es });
  } catch { return '—'; }
}

export function formatDatetime(date: string | Date | undefined) {
  return formatDate(date, "dd/MM/yyyy HH:mm");
}

export function fromNow(date: string | Date | undefined) {
  if (!date) return '—';
  try {
    const d = typeof date === 'string' ? parseISO(date) : date;
    return formatDistanceToNow(d, { addSuffix: true, locale: es });
  } catch { return '—'; }
}

export function downloadBlob(data: BlobPart, filename: string, type = 'application/pdf') {
  const blob = new Blob([data], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function nivelRiesgoLabel(nivel: number) {
  if (nivel >= 17) return { label: 'Crítico', color: '#C8102E' };
  if (nivel >= 10) return { label: 'Alto', color: '#FF6B00' };
  if (nivel >= 5) return { label: 'Medio', color: '#F7B731' };
  return { label: 'Bajo', color: '#27AE60' };
}

export function cumplimientoColor(pct: number) {
  if (pct >= 100) return 'green';
  if (pct >= 80) return 'yellow';
  return 'red';
}

export function truncate(str: string, max = 60) {
  if (!str) return '';
  return str.length > max ? str.slice(0, max) + '...' : str;
}

export function getErrorMessage(error: unknown): string {
  if (typeof error === 'object' && error !== null) {
    const e = error as { response?: { data?: { error?: { message?: string } } }; message?: string };
    return e.response?.data?.error?.message || e.message || 'Error desconocido';
  }
  return 'Error inesperado';
}
