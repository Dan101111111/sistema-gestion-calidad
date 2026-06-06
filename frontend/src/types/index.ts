// ============================================================
// SGC-UNT v2.0 — Definiciones de tipos TypeScript
// ============================================================

// ── Roles ────────────────────────────────────────────────────
export type Rol = 'admin' | 'gestor_calidad' | 'auditor' | 'docente' | 'estudiante' | 'egresado' | 'invitado';

// ── Paginación ────────────────────────────────────────────────
export interface PaginatedMeta {
  total: number;
  page: number;
  limit: number;
  pages: number;
  no_leidas?: number;
}
export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginatedMeta;
}

// ── Usuario ───────────────────────────────────────────────────
export interface Usuario {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  rol: Rol;
  facultad?: string;
  escuela?: string;
  telefono?: string;
  activo: boolean;
  ultimo_acceso?: string;
  creado_en: string;
}

// ── Sesion ────────────────────────────────────────────────────
export interface Sesion {
  id: string;
  usuario_id: string;
  ip?: string;
  user_agent?: string;
  expira_en: string;
  creado_en: string;
}

// ── Tipo Documento ────────────────────────────────────────────
export interface TipoDocumento {
  id: string;
  nombre: string;
  codigo: string;
  descripcion?: string;
  activo: boolean;
}

// ── Documento ─────────────────────────────────────────────────
export type EstadoDocumento = 'borrador' | 'en_revision' | 'aprobado' | 'rechazado' | 'archivado';

export interface Documento {
  id: string;
  codigo: string;
  titulo: string;
  tipo_id?: string;
  tipo?: TipoDocumento;
  contenido?: string;
  estado: EstadoDocumento;
  version_actual: number;
  proceso_id?: string;
  responsable_id?: string;
  responsable?: Partial<Usuario>;
  creado_por?: string;
  creador?: Partial<Usuario>;
  fecha_vigencia_inicio?: string;
  fecha_vigencia_fin?: string;
  archivo_id?: string;
  versiones?: VersionDocumento[];
  aprobaciones?: AprobacionDocumento[];
  creado_en: string;
  modificado_en: string;
}

export interface VersionDocumento {
  id: string;
  documento_id: string;
  numero_version: number;
  contenido_anterior?: string;
  contenido_nuevo?: string;
  estado_anterior?: string;
  estado_nuevo?: string;
  modificado_por?: string;
  comentario?: string;
  creado_en: string;
}

export interface AprobacionDocumento {
  id: string;
  documento_id: string;
  aprobador_id?: string;
  aprobador?: Partial<Usuario>;
  accion: 'enviar_revision' | 'aprobar' | 'rechazar' | 'archivar';
  comentario?: string;
  estado_resultante?: string;
  creado_en: string;
}

// ── Macroproceso ──────────────────────────────────────────────
export type TipoMacroproceso = 'estrategico' | 'misional' | 'apoyo';

export interface Macroproceso {
  id: string;
  codigo: string;
  nombre: string;
  descripcion?: string;
  tipo: TipoMacroproceso;
  orden: number;
  responsable_id?: string;
  responsable?: Partial<Usuario>;
  activo: boolean;
  procesos?: Proceso[];
  creado_en: string;
}

// ── Proceso ───────────────────────────────────────────────────
export interface Proceso {
  id: string;
  codigo: string;
  nombre: string;
  objetivo?: string;
  alcance?: string;
  macroproceso_id?: string;
  macroproceso?: Partial<Macroproceso>;
  responsable_id?: string;
  responsable?: Partial<Usuario>;
  orden: number;
  activo: boolean;
  actividades?: ActividadProceso[];
  documentos?: Partial<Documento>[];
  creado_en: string;
}

export interface ActividadProceso {
  id: string;
  proceso_id: string;
  nombre: string;
  descripcion?: string;
  entradas?: string;
  salidas?: string;
  responsable_id?: string;
  secuencia: number;
  activo: boolean;
  creado_en: string;
}

// ── Estándar y Acreditación ───────────────────────────────────
export type TipoEstandar = 'ISO_21001' | 'SUNEDU' | 'SINEACE' | 'ABET' | 'OTRO';

export interface EstandarAcreditacion {
  id: string;
  codigo: string;
  nombre: string;
  descripcion?: string;
  tipo: TipoEstandar;
  activo: boolean;
  factores?: FactorCriterio[];
}

export interface FactorCriterio {
  id: string;
  estandar_id: string;
  codigo: string;
  nombre: string;
  descripcion?: string;
  peso_porcentual: number;
  nivel: number;
  padre_id?: string;
  hijos?: FactorCriterio[];
}

export type EstadoAutoevaluacion = 'en_proceso' | 'completada' | 'revisada' | 'aprobada';

export interface Autoevaluacion {
  id: string;
  codigo: string;
  nombre: string;
  estandar_id?: string;
  estandar?: Partial<EstandarAcreditacion>;
  periodo_academico: string;
  fecha_inicio: string;
  fecha_fin: string;
  estado: EstadoAutoevaluacion;
  puntaje_total: number;
  responsable_id?: string;
  responsable?: Partial<Usuario>;
  evaluaciones?: EvaluacionCriterio[];
  creado_en: string;
}

export type NivelCumplimiento = 'no_cumple' | 'cumple_parcialmente' | 'cumple' | 'supera';

export interface EvaluacionCriterio {
  id: string;
  autoevaluacion_id: string;
  factor_id: string;
  factor?: Partial<FactorCriterio>;
  puntaje: number;
  nivel_cumplimiento: NivelCumplimiento;
  evidencias?: string;
  observaciones?: string;
  archivo_id?: string;
  evaluado_por?: string;
  creado_en: string;
}

// ── Auditorías ────────────────────────────────────────────────
export type TipoPlan = 'interna' | 'externa' | 'seguimiento' | 'certificacion';
export type EstadoPlan = 'planificado' | 'en_ejecucion' | 'completado' | 'cancelado';

export interface PlanAuditoria {
  id: string;
  codigo: string;
  nombre: string;
  tipo: TipoPlan;
  alcance?: string;
  fecha_inicio: string;
  fecha_fin: string;
  estado: EstadoPlan;
  lider_id?: string;
  lider?: Partial<Usuario>;
  objetivo?: string;
  equipo?: EquipoAuditoria[];
  hallazgos?: Hallazgo[];
  creado_en: string;
}

export interface EquipoAuditoria {
  id: string;
  plan_id: string;
  auditor_id: string;
  auditor?: Partial<Usuario>;
  rol_en_equipo: 'lider' | 'auditor' | 'observador' | 'tecnico';
}

export type TipoHallazgo = 'no_conformidad' | 'observacion' | 'oportunidad_mejora' | 'buena_practica';
export type GravedadHallazgo = 'critica' | 'mayor' | 'menor' | 'observacion';
export type EstadoHallazgo = 'abierto' | 'en_proceso' | 'cerrado';

export interface Hallazgo {
  id: string;
  codigo: string;
  plan_id?: string;
  plan?: Partial<PlanAuditoria>;
  tipo: TipoHallazgo;
  gravedad: GravedadHallazgo;
  descripcion: string;
  proceso_id?: string;
  area_responsable_id?: string;
  evidencia?: string;
  estado: EstadoHallazgo;
  capa_id?: string;
  capa?: Partial<Capa>;
  archivo_id?: string;
  creado_en: string;
}

// ── CAPA ──────────────────────────────────────────────────────
export type TipoCapa = 'correctiva' | 'preventiva' | 'mejora';
export type EstadoCapa = 'registrada' | 'en_implementacion' | 'implementada' | 'verificada' | 'cerrada' | 'rechazada';
export type EfectividadCapa = 'efectiva' | 'parcialmente_efectiva' | 'no_efectiva';

export interface Capa {
  id: string;
  codigo: string;
  tipo: TipoCapa;
  hallazgo_id?: string;
  hallazgo?: Partial<Hallazgo>;
  descripcion: string;
  causa_raiz?: string;
  accion_propuesta: string;
  responsable_id?: string;
  responsable?: Partial<Usuario>;
  fecha_implementacion: string;
  fecha_verificacion?: string;
  estado: EstadoCapa;
  efectividad?: EfectividadCapa;
  capa_origen_id?: string;
  seguimientos?: SeguimientoCapa[];
  creado_en: string;
  modificado_en: string;
}

export interface SeguimientoCapa {
  id: string;
  capa_id: string;
  avance_porcentaje: number;
  observaciones?: string;
  archivo_id?: string;
  estado_capa?: string;
  registrado_por?: string;
  registrador?: Partial<Usuario>;
  creado_en: string;
}

// ── Riesgos ───────────────────────────────────────────────────
export type TipoRiesgo = 'estrategico' | 'operativo' | 'academico' | 'financiero' | 'legal' | 'tecnologico' | 'reputacional';
export type EstadoRiesgo = 'activo' | 'mitigado' | 'aceptado' | 'eliminado';

export interface Riesgo {
  id: string;
  codigo: string;
  nombre: string;
  descripcion?: string;
  tipo: TipoRiesgo;
  proceso_id?: string;
  proceso?: Partial<Proceso>;
  probabilidad: number;
  impacto: number;
  nivel_riesgo: number;
  estado: EstadoRiesgo;
  responsable_id?: string;
  responsable?: Partial<Usuario>;
  planes_mitigacion?: PlanMitigacion[];
  creado_en: string;
  modificado_en: string;
}

export interface PlanMitigacion {
  id: string;
  riesgo_id: string;
  nombre: string;
  descripcion?: string;
  tipo_respuesta: 'mitigar' | 'transferir' | 'aceptar' | 'eliminar';
  responsable_id?: string;
  responsable?: Partial<Usuario>;
  fecha_limite?: string;
  estado: 'pendiente' | 'en_proceso' | 'completado' | 'cancelado';
  costo_estimado?: number;
  creado_en: string;
}

// ── Indicadores ───────────────────────────────────────────────
export type TipoIndicador = 'eficacia' | 'eficiencia' | 'impacto' | 'satisfaccion' | 'cobertura';
export type FrecuenciaIndicador = 'diario' | 'semanal' | 'mensual' | 'trimestral' | 'semestral' | 'anual';

export interface Indicador {
  id: string;
  codigo: string;
  nombre: string;
  tipo: TipoIndicador;
  formula?: string;
  meta: number;
  unidad?: string;
  frecuencia: FrecuenciaIndicador;
  proceso_id?: string;
  proceso?: Partial<Proceso>;
  estandar_id?: string;
  activo: boolean;
  mediciones?: MedicionIndicador[];
  creado_en: string;
}

export interface MedicionIndicador {
  id: string;
  indicador_id: string;
  indicador?: Partial<Indicador>;
  periodo: string;
  valor_real: number;
  valor_esperado: number;
  cumplimiento: number;
  observaciones?: string;
  registrado_por?: string;
  creado_en: string;
}

// ── Encuestas ─────────────────────────────────────────────────
export type GrupoObjetivo = 'estudiantes' | 'docentes' | 'egresados' | 'administrativos' | 'todos';
export type EstadoEncuesta = 'borrador' | 'publicada' | 'cerrada' | 'archivada';
export type TipoPregunta = 'likert_5' | 'likert_7' | 'si_no' | 'abierta' | 'numerica' | 'multiple_choice';

export interface Encuesta {
  id: string;
  codigo: string;
  titulo: string;
  descripcion?: string;
  grupo_objetivo: GrupoObjetivo;
  fecha_inicio: string;
  fecha_fin: string;
  anonima: boolean;
  estado: EstadoEncuesta;
  creado_por?: string;
  preguntas?: PreguntaEncuesta[];
  creado_en: string;
}

export interface PreguntaEncuesta {
  id: string;
  encuesta_id: string;
  texto: string;
  tipo: TipoPregunta;
  opciones: any[];
  logica_condicional: Record<string, any>;
  obligatoria: boolean;
  orden: number;
}

export interface RespuestaEncuesta {
  id: string;
  encuesta_id: string;
  pregunta_id: string;
  usuario_id?: string;
  respuesta: Record<string, any>;
  creado_en: string;
}

// ── Notificaciones ────────────────────────────────────────────
export type TipoNotificacion = 'alerta' | 'recordatorio' | 'info' | 'aprobacion_pendiente' | 'error';

export interface Notificacion {
  id: string;
  usuario_id: string;
  tipo: TipoNotificacion;
  titulo: string;
  mensaje: string;
  modulo?: string;
  registro_id?: string;
  leida: boolean;
  leida_en?: string;
  creado_en: string;
}

// ── Auditoría Log ─────────────────────────────────────────────
export type AccionAuditoria = 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'EXPORT';

export interface AuditoriaLog {
  id: string;
  tabla: string;
  registro_id?: string;
  accion: AccionAuditoria;
  datos_anteriores?: Record<string, any>;
  datos_nuevos?: Record<string, any>;
  usuario_id?: string;
  usuario?: Partial<Usuario>;
  ip?: string;
  user_agent?: string;
  creado_en: string;
}

// ── Archivos ──────────────────────────────────────────────────
export interface ArchivoAdjunto {
  id: string;
  nombre_original: string;
  nombre_almacenado: string;
  mime_type: string;
  tamano_bytes: number;
  checksum_sha256?: string;
  bucket: string;
  ruta_minio: string;
  subido_por?: string;
  modulo_origen?: string;
  registro_id?: string;
  url?: string;
  creado_en: string;
}

// ── Dashboard KPIs ────────────────────────────────────────────
export interface DashboardKpis {
  documentos_activos: number;
  capas_abiertas: number;
  riesgos_criticos: number;
  encuestas_vigentes: number;
  indicadores_bajo_meta: number;
  hallazgos_abiertos: number;
}

// ── API Response ──────────────────────────────────────────────
export interface ApiResponse<T> {
  data: T;
  meta?: PaginatedMeta;
  error?: { code: string; message: string; details?: any[] };
}

// ── Auth ──────────────────────────────────────────────────────
export interface LoginResponse {
  accessToken: string;
  expiresIn: number;
  user: Usuario;
}
