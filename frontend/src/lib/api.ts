import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

let _accessToken: string | null = null;
let _refreshPromise: Promise<string | null> | null = null;

export function setAuthToken(token: string) {
  _accessToken = token;
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

export function clearAuthToken() {
  _accessToken = null;
  delete api.defaults.headers.common['Authorization'];
}

// Request interceptor
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (_accessToken && !config.headers['Authorization']) {
    config.headers['Authorization'] = `Bearer ${_accessToken}`;
  }
  return config;
});

// Response interceptor — refresh silencioso
api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url?.includes('/auth/')) {
      originalRequest._retry = true;
      try {
        if (!_refreshPromise) {
          _refreshPromise = api.post('/auth/refresh', {}, { withCredentials: true })
            .then((r) => r.data.data.accessToken)
            .finally(() => { _refreshPromise = null; });
        }
        const newToken = await _refreshPromise;
        if (newToken) {
          setAuthToken(newToken);
          originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
          return api(originalRequest);
        }
      } catch {
        clearAuthToken();
        if (typeof window !== 'undefined') window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ─── API helpers ─────────────────────────────────────────────
export const apiHelpers = {
  // Respuesta estándar
  getData: <T>(res: { data: { data: T } }) => res.data.data,
  getMeta: (res: { data: { meta: unknown } }) => res.data.meta,

  // Manejo de errores
  getErrorMessage: (error: unknown): string => {
    if (axios.isAxiosError(error)) {
      return error.response?.data?.error?.message || error.message || 'Error desconocido';
    }
    return 'Error inesperado';
  },
};

// ─── Módulos API ─────────────────────────────────────────────
export const authApi = {
  login:           (email: string, password: string) => api.post('/auth/login', { email, password }),
  logout:          () => api.post('/auth/logout'),
  me:              () => api.get('/auth/me'),
  recuperar:       (email: string) => api.post('/auth/recuperar', { email }),
  resetPassword:   (token: string, password: string) => api.post('/auth/reset-password', { token, password }),
  cambiarPassword: (password_actual: string, password_nuevo: string) => api.post('/auth/cambiar-password', { password_actual, password_nuevo }),
  actualizarPerfil:(data: object) => api.put('/usuarios/perfil', data),
  sesionesActivas: () => api.get('/auth/sesiones'),
  revocarSesion:   (id: string) => api.delete(`/auth/sesiones/${id}`),
};

export const dashboardApi = {
  kpis: () => api.get('/dashboard/kpis'),
  graficos: () => api.get('/dashboard/graficos'),
};

export const documentosApi = {
  listar: (params?: object) => api.get('/documentos', { params }),
  obtener: (id: string) => api.get(`/documentos/${id}`),
  crear: (data: object) => api.post('/documentos', data),
  actualizar: (id: string, data: object) => api.put(`/documentos/${id}`, data),
  cambiarEstado: (id: string, accion: string, comentario?: string) => api.patch(`/documentos/${id}/estado`, { accion, comentario }),
  eliminar: (id: string) => api.delete(`/documentos/${id}`),
  versiones: (id: string) => api.get(`/documentos/${id}/versiones`),
  reporte: (params?: object) => api.get('/documentos/reporte/pdf', { params, responseType: 'blob' }),
};

export const procesosApi = {
  listarMacroprocesos: () => api.get('/macroprocesos'),
  crearMacroproceso: (data: object) => api.post('/macroprocesos', data),
  actualizarMacroproceso: (id: string, data: object) => api.put(`/macroprocesos/${id}`, data),
  eliminarMacroproceso: (id: string) => api.delete(`/macroprocesos/${id}`),
  listar: (params?: object) => api.get('/procesos', { params }),
  obtener: (id: string) => api.get(`/procesos/${id}`),
  crear: (data: object) => api.post('/procesos', data),
  actualizar: (id: string, data: object) => api.put(`/procesos/${id}`, data),
  eliminarProceso: (id: string) => api.delete(`/procesos/${id}`),
  crearActividad: (procesoId: string, data: object) => api.post(`/procesos/${procesoId}/actividades`, data),
  actualizarActividad: (id: string, data: object) => api.put(`/actividades/${id}`, data),
  eliminarActividad: (id: string) => api.delete(`/actividades/${id}`),
  reordenarActividades: (procesoId: string, ordenadosIds: string[]) => api.post(`/procesos/${procesoId}/actividades/reordenar`, { ordenadosIds }),
  guardarFlujo: (procesoId: string, data: object) => api.post(`/procesos/${procesoId}/flujo`, data),
  reporte: () => api.get('/procesos/reporte/pdf', { responseType: 'blob' }),
};

export const acreditacionApi = {
  listarEstandares: () => api.get('/estandares'),
  crearEstandar: (data: object) => api.post('/estandares', data),
  crearFactor: (data: object) => api.post('/factores', data),
  listarAutoevaluaciones: (params?: object) => api.get('/autoevaluaciones', { params }),
  crearAutoevaluacion: (data: object) => api.post('/autoevaluaciones', data),
  evaluarCriterio: (data: object) => api.post('/evaluaciones-criterio', data),
  comparativa: (params?: object) => api.get('/autoevaluaciones/comparativa', { params }),
  reporte: (id: string) => api.get(`/autoevaluaciones/${id}/reporte/pdf`, { responseType: 'blob' }),
};

export const auditoriasApi = {
  listarPlanes: (params?: object) => api.get('/planes-auditoria', { params }),
  crearPlan: (data: object) => api.post('/planes-auditoria', data),
  actualizarPlan: (id: string, data: object) => api.put(`/planes-auditoria/${id}`, data),
  eliminarPlan: (id: string) => api.delete(`/planes-auditoria/${id}`),
  listarHallazgos: (params?: object) => api.get('/hallazgos', { params }),
  crearHallazgo: (data: object) => api.post('/hallazgos', data),
  actualizarHallazgo: (id: string, data: object) => api.put(`/hallazgos/${id}`, data),
  eliminarHallazgo: (id: string) => api.delete(`/hallazgos/${id}`),
  reporte: (id: string) => api.get(`/planes-auditoria/${id}/reporte/pdf`, { responseType: 'blob' }),
};

export const capasApi = {
  listar: (params?: object) => api.get('/capas', { params }),
  obtener: (id: string) => api.get(`/capas/${id}`),
  crear: (data: object) => api.post('/capas', data),
  actualizar: (id: string, data: object) => api.put(`/capas/${id}`, data),
  eliminar: (id: string) => api.delete(`/capas/${id}`),
  cambiarEstado: (id: string, data: object) => api.patch(`/capas/${id}/estado`, data),
  agregarSeguimiento: (id: string, data: object) => api.post(`/capas/${id}/seguimientos`, data),
  reporte: (params?: object) => api.get('/capas/reporte/pdf', { params, responseType: 'blob' }),
};

export const riesgosApi = {
  listar: (params?: object) => api.get('/riesgos', { params }),
  obtener: (id: string) => api.get(`/riesgos/${id}`),
  crear: (data: object) => api.post('/riesgos', data),
  actualizar: (id: string, data: object) => api.put(`/riesgos/${id}`, data),
  eliminar: (id: string) => api.delete(`/riesgos/${id}`),
  matrizCalor: () => api.get('/riesgos/matriz-calor'),
  ranking: () => api.get('/riesgos/ranking'),
  agregarMitigacion: (id: string, data: object) => api.post(`/riesgos/${id}/mitigaciones`, data),
  reporte: () => api.get('/riesgos/reporte/pdf', { responseType: 'blob' }),
};

export const indicadoresApi = {
  listar: (params?: object) => api.get('/indicadores', { params }),
  obtener: (id: string) => api.get(`/indicadores/${id}`),
  crear: (data: object) => api.post('/indicadores', data),
  actualizar: (id: string, data: object) => api.put(`/indicadores/${id}`, data),
  registrarMedicion: (id: string, data: object) => api.post(`/indicadores/${id}/mediciones`, data),
  tendencias: (id: string) => api.get(`/indicadores/${id}/tendencias`),
  reporte: () => api.get('/indicadores/reporte/pdf', { responseType: 'blob' }),
};

export const encuestasApi = {
  listar: (params?: object) => api.get('/encuestas', { params }),
  obtener: (id: string) => api.get(`/encuestas/${id}`),
  crear: (data: object) => api.post('/encuestas', data),
  actualizar: (id: string, data: object) => api.put(`/encuestas/${id}`, data),
  eliminar: (id: string) => api.delete(`/encuestas/${id}`),
  publicar: (id: string) => api.patch(`/encuestas/${id}/publicar`),
  responder: (id: string, data: object) => api.post(`/encuestas/${id}/responder`, data),
  resultados: (id: string) => api.get(`/encuestas/${id}/resultados`),
  reporte: (id: string) => api.get(`/encuestas/${id}/reporte/pdf`, { responseType: 'blob' }),
};

export const notificacionesApi = {
  listar: (params?: object) => api.get('/notificaciones', { params }),
  noLeidas: () => api.get('/notificaciones/no-leidas'),
  marcarLeida: (id: string) => api.patch(`/notificaciones/${id}/leida`),
  marcarTodas: () => api.patch('/notificaciones/marcar-todas'),
};

export const archivosApi = {
  subir: (formData: FormData) => api.post('/archivos', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getUrl: (id: string) => api.get(`/archivos/${id}/url`),
  eliminar: (id: string) => api.delete(`/archivos/${id}`),
};

export const busquedaApi = {
  buscar: (q: string, tipo?: string) => api.get('/buscar', { params: { q, tipo } }),
};

export const adminApi = {
  usuarios: { listar: (p?: object) => api.get('/usuarios', { params: p }), crear: (d: object) => api.post('/usuarios', d), actualizar: (id: string, d: object) => api.put(`/usuarios/${id}`, d), toggleActivo: (id: string) => api.patch(`/usuarios/${id}/toggle-activo`), asignarRol: (id: string, rol: string) => api.patch(`/usuarios/${id}/rol`, { rol }), resetPassword: (id: string, password: string) => api.post(`/usuarios/${id}/reset-password`, { password }) },
  auditoria: { log: (p?: object) => api.get('/auditoria', { params: p }), historial: (tabla: string, id: string) => api.get(`/auditoria/${tabla}/${id}`) },
  configuracion: { obtener: () => api.get('/configuracion'), actualizar: (d: object) => api.put('/configuracion', d) },
  tiposDocumento: {
    listar: (params?: object) => api.get('/tipos-documento', { params }),
    crear: (data: object) => api.post('/tipos-documento', data),
    actualizar: (id: string, data: object) => api.put(`/tipos-documento/${id}`, data),
    eliminar: (id: string) => api.delete(`/tipos-documento/${id}`),
  },
};

export default api;
