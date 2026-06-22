'use strict';
const { sequelize } = require('../config/database');
const { DataTypes } = require('sequelize');
const S = process.env.DB_SCHEMA || 'sgc';

// ============================================================
// MODELO: Usuario
// ============================================================
const Usuario = sequelize.define('Usuario', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  nombre: { type: DataTypes.STRING(100), allowNull: false },
  apellido: { type: DataTypes.STRING(100), allowNull: false },
  codigo: { type: DataTypes.STRING(50), allowNull: true, unique: true },
  email: { type: DataTypes.STRING(255), allowNull: false, unique: true },
  password_hash: { type: DataTypes.TEXT, allowNull: false },
  rol: { type: DataTypes.STRING(50), allowNull: false, defaultValue: 'invitado',
    validate: { isIn: [['admin','gestor_calidad','auditor','docente','estudiante','egresado','invitado']] } },
  facultad: DataTypes.STRING(150),
  escuela: DataTypes.STRING(150),
  telefono: DataTypes.STRING(20),
  activo: { type: DataTypes.BOOLEAN, defaultValue: true },
  intentos_fallidos: { type: DataTypes.INTEGER, defaultValue: 0 },
  bloqueado_hasta: DataTypes.DATE,
  ultimo_acceso: DataTypes.DATE,
  token_recuperacion: DataTypes.TEXT,
  token_exp_recuperacion: DataTypes.DATE,
  creado_por: DataTypes.UUID,
  modificado_por: DataTypes.UUID,
}, { schema: S, tableName: 'usuarios', timestamps: true, createdAt: 'creado_en', updatedAt: 'modificado_en' });

// ============================================================
// MODELO: Sesion
// ============================================================
const Sesion = sequelize.define('Sesion', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  usuario_id: { type: DataTypes.UUID, allowNull: false },
  refresh_token: { type: DataTypes.TEXT, allowNull: false },
  ip: DataTypes.STRING(45),
  user_agent: DataTypes.TEXT,
  expira_en: { type: DataTypes.DATE, allowNull: false },
  activo: { type: DataTypes.BOOLEAN, defaultValue: true },
}, { schema: S, tableName: 'sesiones', timestamps: true, createdAt: 'creado_en', updatedAt: false });

// ============================================================
// MODELO: TipoDocumento
// ============================================================
const TipoDocumento = sequelize.define('TipoDocumento', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  nombre: { type: DataTypes.STRING(100), allowNull: false, unique: true },
  codigo: { type: DataTypes.STRING(10), allowNull: false, unique: true },
  descripcion: DataTypes.TEXT,
  activo: { type: DataTypes.BOOLEAN, defaultValue: true },
  requiere_aprobacion: { type: DataTypes.BOOLEAN, defaultValue: true },
}, { schema: S, tableName: 'tipos_documento', timestamps: true, createdAt: 'creado_en', updatedAt: false });

// ============================================================
// MODELO: Macroproceso
// ============================================================
const Macroproceso = sequelize.define('Macroproceso', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  codigo: { type: DataTypes.STRING(20), allowNull: false, unique: true },
  nombre: { type: DataTypes.STRING(200), allowNull: false },
  descripcion: DataTypes.TEXT,
  tipo: { type: DataTypes.STRING(50), defaultValue: 'estrategico',
    validate: { isIn: [['estrategico','misional','apoyo','evaluacion']] } },
  orden: { type: DataTypes.INTEGER, defaultValue: 0 },
  responsable_id: DataTypes.UUID,
  activo: { type: DataTypes.BOOLEAN, defaultValue: true },
  creado_por: DataTypes.UUID,
  modificado_por: DataTypes.UUID,
}, { schema: S, tableName: 'macroprocesos', timestamps: true, createdAt: 'creado_en', updatedAt: 'modificado_en' });

// ============================================================
// MODELO: Proceso
// ============================================================
const Proceso = sequelize.define('Proceso', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  codigo: { type: DataTypes.STRING(20), allowNull: false, unique: true },
  nombre: { type: DataTypes.STRING(200), allowNull: false },
  objetivo: DataTypes.TEXT,
  alcance: DataTypes.TEXT,
  macroproceso_id: DataTypes.UUID,
  responsable_id: DataTypes.UUID,
  orden: { type: DataTypes.INTEGER, defaultValue: 0 },
  estado: { type: DataTypes.STRING(30), defaultValue: 'activo',
    validate: { isIn: [['activo', 'inactivo', 'en_mejora']] } },
  activo: { type: DataTypes.BOOLEAN, defaultValue: true },
  creado_por: DataTypes.UUID,
  modificado_por: DataTypes.UUID,
}, { schema: S, tableName: 'procesos', timestamps: true, createdAt: 'creado_en', updatedAt: 'modificado_en' });

// ============================================================
// MODELO: ActividadProceso
// ============================================================
const ActividadProceso = sequelize.define('ActividadProceso', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  proceso_id: { type: DataTypes.UUID, allowNull: false },
  codigo: { type: DataTypes.STRING(50), allowNull: false, unique: true },
  nombre: { type: DataTypes.STRING(200), allowNull: false },
  descripcion: DataTypes.TEXT,
  entradas: DataTypes.TEXT,
  salidas: DataTypes.TEXT,
  indicadores: DataTypes.TEXT,
  responsable_id: DataTypes.UUID,
  secuencia: { type: DataTypes.INTEGER, defaultValue: 0 },
  activo: { type: DataTypes.BOOLEAN, defaultValue: true },
}, { schema: S, tableName: 'actividades_proceso', timestamps: true, createdAt: 'creado_en', updatedAt: 'modificado_en' });

// ============================================================
// MODELO: FlujoDeTrabajo
// ============================================================
const FlujoDeTrabajo = sequelize.define('FlujoDeTrabajo', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  proceso_id: { type: DataTypes.UUID, allowNull: false },
  nombre: { type: DataTypes.STRING(200), allowNull: false },
  definicion_bpmn: { type: DataTypes.JSONB, defaultValue: {} },
  version: { type: DataTypes.STRING(10), defaultValue: '1.0' },
  activo: { type: DataTypes.BOOLEAN, defaultValue: true },
  creado_por: DataTypes.UUID,
}, { schema: S, tableName: 'flujos_trabajo', timestamps: true, createdAt: 'creado_en', updatedAt: 'modificado_en' });

// ============================================================
// MODELO: Documento
// ============================================================
const Documento = sequelize.define('Documento', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  codigo: { type: DataTypes.STRING(30), allowNull: false, unique: true },
  titulo: { type: DataTypes.STRING(300), allowNull: false },
  tipo_id: DataTypes.UUID,
  contenido: DataTypes.TEXT,
  estado: { type: DataTypes.STRING(30), defaultValue: 'borrador',
    validate: { isIn: [['borrador','en_revision','aprobado','rechazado','archivado','obsoleto']] } },
  version_actual: { type: DataTypes.INTEGER, defaultValue: 1 },
  proceso_id: DataTypes.UUID,
  responsable_id: DataTypes.UUID,
  fecha_vigencia_inicio: DataTypes.DATEONLY,
  fecha_vigencia_fin: DataTypes.DATEONLY,
  archivo_id: DataTypes.UUID,
  creado_por: DataTypes.UUID,
  modificado_por: DataTypes.UUID,
}, { schema: S, tableName: 'documentos', timestamps: true, createdAt: 'creado_en', updatedAt: 'modificado_en' });

// ============================================================
// MODELO: VersionDocumento
// ============================================================
const VersionDocumento = sequelize.define('VersionDocumento', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  documento_id: { type: DataTypes.UUID, allowNull: false },
  numero_version: { type: DataTypes.INTEGER, allowNull: false },
  contenido_anterior: DataTypes.TEXT,
  contenido_nuevo: DataTypes.TEXT,
  estado_anterior: DataTypes.STRING(30),
  estado_nuevo: DataTypes.STRING(30),
  modificado_por: DataTypes.UUID,
  comentario: DataTypes.TEXT,
}, { schema: S, tableName: 'versiones_documento', timestamps: true, createdAt: 'creado_en', updatedAt: false });

// ============================================================
// MODELO: AprobacionDocumento
// ============================================================
const AprobacionDocumento = sequelize.define('AprobacionDocumento', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  documento_id: { type: DataTypes.UUID, allowNull: false },
  aprobador_id: DataTypes.UUID,
  accion: { type: DataTypes.STRING(30), allowNull: false,
    validate: { isIn: [['enviar_revision','aprobar','rechazar','archivar']] } },
  comentario: DataTypes.TEXT,
  estado_resultante: DataTypes.STRING(30),
}, { schema: S, tableName: 'aprobaciones_documento', timestamps: true, createdAt: 'creado_en', updatedAt: false });

// ============================================================
// MODELO: EstandarAcreditacion
// ============================================================
const EstandarAcreditacion = sequelize.define('EstandarAcreditacion', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  codigo: { type: DataTypes.STRING(30), allowNull: false, unique: true },
  nombre: { type: DataTypes.STRING(200), allowNull: false },
  descripcion: DataTypes.TEXT,
  tipo: { type: DataTypes.STRING(50), defaultValue: 'ISO_21001',
    validate: { isIn: [['ISO_21001','SUNEDU','SINEACE','ABET','OTRO']] } },
  activo: { type: DataTypes.BOOLEAN, defaultValue: true },
  creado_por: DataTypes.UUID,
}, { schema: S, tableName: 'estandares_acreditacion', timestamps: true, createdAt: 'creado_en', updatedAt: 'modificado_en' });

// ============================================================
// MODELO: FactorCriterio
// ============================================================
const FactorCriterio = sequelize.define('FactorCriterio', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  estandar_id: { type: DataTypes.UUID, allowNull: false },
  codigo: { type: DataTypes.STRING(30), allowNull: false },
  nombre: { type: DataTypes.STRING(200), allowNull: false },
  descripcion: DataTypes.TEXT,
  peso_porcentual: { type: DataTypes.DECIMAL(5, 2), defaultValue: 0 },
  nivel: { type: DataTypes.INTEGER, defaultValue: 1 },
  padre_id: DataTypes.UUID,
}, { schema: S, tableName: 'factores_criterio', timestamps: true, createdAt: 'creado_en', updatedAt: 'modificado_en' });

// ============================================================
// MODELO: Autoevaluacion
// ============================================================
const Autoevaluacion = sequelize.define('Autoevaluacion', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  codigo: { type: DataTypes.STRING(30), allowNull: false, unique: true },
  nombre: { type: DataTypes.STRING(200), allowNull: false },
  estandar_id: DataTypes.UUID,
  periodo_academico: { type: DataTypes.STRING(20), allowNull: false },
  fecha_inicio: { type: DataTypes.DATEONLY, allowNull: false },
  fecha_fin: { type: DataTypes.DATEONLY, allowNull: false },
  estado: { type: DataTypes.STRING(30), defaultValue: 'en_proceso',
    validate: { isIn: [['en_proceso','completada','revisada','aprobada']] } },
  puntaje_total: { type: DataTypes.DECIMAL(5, 2), defaultValue: 0 },
  responsable_id: DataTypes.UUID,
  creado_por: DataTypes.UUID,
}, { schema: S, tableName: 'autoevaluaciones', timestamps: true, createdAt: 'creado_en', updatedAt: 'modificado_en' });

// ============================================================
// MODELO: EvaluacionCriterio
// ============================================================
const EvaluacionCriterio = sequelize.define('EvaluacionCriterio', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  autoevaluacion_id: { type: DataTypes.UUID, allowNull: false },
  factor_id: { type: DataTypes.UUID, allowNull: false },
  puntaje: { type: DataTypes.DECIMAL(5, 2), defaultValue: 0 },
  nivel_cumplimiento: { type: DataTypes.STRING(30), defaultValue: 'no_cumple',
    validate: { isIn: [['no_cumple','cumple_parcialmente','cumple','supera']] } },
  evidencias: DataTypes.TEXT,
  observaciones: DataTypes.TEXT,
  archivo_id: DataTypes.UUID,
  evaluado_por: DataTypes.UUID,
}, { schema: S, tableName: 'evaluaciones_criterio', timestamps: true, createdAt: 'creado_en', updatedAt: 'modificado_en' });

// ============================================================
// MODELO: PlanAuditoria
// ============================================================
const PlanAuditoria = sequelize.define('PlanAuditoria', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  codigo: { type: DataTypes.STRING(30), allowNull: false, unique: true },
  nombre: { type: DataTypes.STRING(200), allowNull: false },
  tipo: { type: DataTypes.STRING(30), defaultValue: 'interna',
    validate: { isIn: [['interna','externa','especial','seguimiento','certificacion']] } },
  alcance: DataTypes.TEXT,
  fecha_inicio: { type: DataTypes.DATEONLY, allowNull: false },
  fecha_fin: { type: DataTypes.DATEONLY, allowNull: false },
  estado: { type: DataTypes.STRING(30), defaultValue: 'planificado',
    validate: { isIn: [['planificado','en_ejecucion','ejecutado','cerrado','cancelado']] } },
  lider_id: DataTypes.UUID,
  objetivo: DataTypes.TEXT,
  creado_por: DataTypes.UUID,
}, { schema: S, tableName: 'planes_auditoria', timestamps: true, createdAt: 'creado_en', updatedAt: 'modificado_en' });

// ============================================================
// MODELO: EquipoAuditoria
// ============================================================
const EquipoAuditoria = sequelize.define('EquipoAuditoria', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  plan_id: { type: DataTypes.UUID, allowNull: false },
  auditor_id: { type: DataTypes.UUID, allowNull: false },
  rol_en_equipo: { type: DataTypes.STRING(30), defaultValue: 'auditor',
    validate: { isIn: [['lider','auditor','observador','tecnico']] } },
}, { schema: S, tableName: 'equipos_auditoria', timestamps: true, createdAt: 'asignado_en', updatedAt: false });

// ============================================================
// MODELO: ArchivoAdjunto
// ============================================================
const ArchivoAdjunto = sequelize.define('ArchivoAdjunto', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  nombre_original: { type: DataTypes.STRING(500), allowNull: false },
  nombre_almacenado: { type: DataTypes.STRING(500), allowNull: false },
  mime_type: { type: DataTypes.STRING(100), allowNull: false },
  tamano_bytes: { type: DataTypes.BIGINT, allowNull: false },
  checksum_sha256: DataTypes.STRING(64),
  bucket: { type: DataTypes.STRING(100), allowNull: false },
  ruta_minio: { type: DataTypes.TEXT, allowNull: false },
  subido_por: DataTypes.UUID,
  modulo_origen: DataTypes.STRING(50),
  registro_id: DataTypes.UUID,
}, { schema: S, tableName: 'archivos_adjuntos', timestamps: true, createdAt: 'creado_en', updatedAt: false });

// ============================================================
// MODELO: Capa
// ============================================================
const Capa = sequelize.define('Capa', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  codigo: { type: DataTypes.STRING(30), allowNull: false, unique: true },
  tipo: { type: DataTypes.STRING(30), defaultValue: 'correctiva',
    validate: { isIn: [['correctiva','preventiva','mejora']] } },
  hallazgo_id: DataTypes.UUID,
  descripcion: { type: DataTypes.TEXT, allowNull: false },
  causa_raiz: DataTypes.TEXT,
  accion_propuesta: { type: DataTypes.TEXT, allowNull: false },
  responsable_id: DataTypes.UUID,
  fecha_implementacion: { type: DataTypes.DATEONLY, allowNull: false },
  fecha_verificacion: DataTypes.DATEONLY,
  estado: { type: DataTypes.STRING(30), defaultValue: 'registrada',
    validate: { isIn: [['registrada','en_implementacion','implementada','verificada','cerrada','rechazada']] } },
  efectividad: { type: DataTypes.STRING(30),
    validate: { isIn: [[null,'efectiva','parcial','parcialmente_efectiva','no_efectiva','pendiente']] } },
  capa_origen_id: DataTypes.UUID,
  creado_por: DataTypes.UUID,
  modificado_por: DataTypes.UUID,
}, { schema: S, tableName: 'capas', timestamps: true, createdAt: 'creado_en', updatedAt: 'modificado_en' });

// ============================================================
// MODELO: Hallazgo
// ============================================================
const Hallazgo = sequelize.define('Hallazgo', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  codigo: { type: DataTypes.STRING(30), allowNull: false, unique: true },
  plan_id: DataTypes.UUID,
  tipo: { type: DataTypes.STRING(30), defaultValue: 'no_conformidad',
    validate: { isIn: [['no_conformidad','observacion','oportunidad_mejora','buena_practica']] } },
  gravedad: { type: DataTypes.STRING(20), defaultValue: 'mayor',
    validate: { isIn: [['baja','media','alta','critica','mayor','menor','observacion']] } },
  descripcion: { type: DataTypes.TEXT, allowNull: false },
  proceso_id: DataTypes.UUID,
  area_responsable_id: DataTypes.UUID,
  evidencia: DataTypes.TEXT,
  estado: { type: DataTypes.STRING(30), defaultValue: 'abierto',
    validate: { isIn: [['abierto','en_proceso','en_tratamiento','cerrado']] } },
  capa_id: DataTypes.UUID,
  justificacion: DataTypes.TEXT,
  archivo_id: DataTypes.UUID,
  creado_por: DataTypes.UUID,
}, { schema: S, tableName: 'hallazgos', timestamps: true, createdAt: 'creado_en', updatedAt: 'modificado_en' });

// ============================================================
// MODELO: SeguimientoCapa
// ============================================================
const SeguimientoCapa = sequelize.define('SeguimientoCapa', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  capa_id: { type: DataTypes.UUID, allowNull: false },
  avance_porcentaje: { type: DataTypes.INTEGER, defaultValue: 0 },
  observaciones: DataTypes.TEXT,
  archivo_id: DataTypes.UUID,
  estado_capa: DataTypes.STRING(30),
  registrado_por: DataTypes.UUID,
}, { schema: S, tableName: 'seguimientos_capa', timestamps: true, createdAt: 'creado_en', updatedAt: false });

// ============================================================
// MODELO: Riesgo
// ============================================================
const Riesgo = sequelize.define('Riesgo', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  codigo: { type: DataTypes.STRING(30), allowNull: false, unique: true },
  nombre: { type: DataTypes.STRING(200), allowNull: false },
  descripcion: DataTypes.TEXT,
  tipo: { type: DataTypes.STRING(30), defaultValue: 'operativo',
    validate: { isIn: [['estrategico','operativo','academico','financiero','legal','tecnologico','reputacional']] } },
  proceso_id: DataTypes.UUID,
  probabilidad: { type: DataTypes.INTEGER, defaultValue: 1, validate: { min: 1, max: 5 } },
  impacto: { type: DataTypes.INTEGER, defaultValue: 1, validate: { min: 1, max: 5 } },
  nivel_riesgo: { type: DataTypes.INTEGER },
  estado: { type: DataTypes.STRING(30), defaultValue: 'activo',
    validate: { isIn: [['activo','mitigado','aceptado','eliminado']] } },
  responsable_id: DataTypes.UUID,
  creado_por: DataTypes.UUID,
  modificado_por: DataTypes.UUID,
}, {
  schema: S, tableName: 'riesgos', timestamps: true, createdAt: 'creado_en', updatedAt: 'modificado_en',
});

// ============================================================
// MODELO: PlanMitigacion
// ============================================================
const PlanMitigacion = sequelize.define('PlanMitigacion', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  riesgo_id: { type: DataTypes.UUID, allowNull: false },
  nombre: { type: DataTypes.STRING(200), allowNull: false },
  descripcion: DataTypes.TEXT,
  tipo_respuesta: { type: DataTypes.STRING(30), defaultValue: 'mitigar',
    validate: { isIn: [['mitigar','transferir','aceptar','eliminar']] } },
  responsable_id: DataTypes.UUID,
  fecha_limite: DataTypes.DATEONLY,
  estado: { type: DataTypes.STRING(30), defaultValue: 'pendiente',
    validate: { isIn: [['pendiente','en_proceso','completado','cancelado']] } },
  costo_estimado: DataTypes.DECIMAL(12, 2),
  creado_por: DataTypes.UUID,
}, { schema: S, tableName: 'planes_mitigacion', timestamps: true, createdAt: 'creado_en', updatedAt: 'modificado_en' });

// ============================================================
// MODELO: Indicador
// ============================================================
const Indicador = sequelize.define('Indicador', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  codigo: { type: DataTypes.STRING(30), allowNull: false, unique: true },
  nombre: { type: DataTypes.STRING(200), allowNull: false },
  tipo: { type: DataTypes.STRING(30), defaultValue: 'eficacia',
    validate: { isIn: [['eficacia','eficiencia','impacto','satisfaccion','cobertura']] } },
  formula: DataTypes.TEXT,
  meta: { type: DataTypes.DECIMAL(10, 4), allowNull: false },
  unidad: DataTypes.STRING(50),
  frecuencia: { type: DataTypes.STRING(20), defaultValue: 'mensual',
    validate: { isIn: [['diario','semanal','mensual','trimestral','semestral','anual']] } },
  proceso_id: DataTypes.UUID,
  estandar_id: DataTypes.UUID,
  activo: { type: DataTypes.BOOLEAN, defaultValue: true },
  creado_por: DataTypes.UUID,
}, { schema: S, tableName: 'indicadores', timestamps: true, createdAt: 'creado_en', updatedAt: 'modificado_en' });

// ============================================================
// MODELO: MedicionIndicador
// ============================================================
const MedicionIndicador = sequelize.define('MedicionIndicador', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  indicador_id: { type: DataTypes.UUID, allowNull: false },
  periodo: { type: DataTypes.STRING(20), allowNull: false },
  valor_real: { type: DataTypes.DECIMAL(10, 4), allowNull: false },
  valor_esperado: { type: DataTypes.DECIMAL(10, 4), allowNull: false },
  cumplimiento: DataTypes.DECIMAL(6, 2),
  observaciones: DataTypes.TEXT,
  registrado_por: DataTypes.UUID,
}, {
  schema: S, tableName: 'mediciones_indicador', timestamps: true, createdAt: 'creado_en', updatedAt: false,
});

// ============================================================
// MODELO: Encuesta
// ============================================================
const Encuesta = sequelize.define('Encuesta', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  codigo: { type: DataTypes.STRING(30), allowNull: false, unique: true },
  titulo: { type: DataTypes.STRING(300), allowNull: false },
  descripcion: DataTypes.TEXT,
  grupo_objetivo: { type: DataTypes.STRING(30), defaultValue: 'todos',
    validate: { isIn: [['estudiantes','docentes','egresados','administrativos','todos']] } },
  fecha_inicio: { type: DataTypes.DATEONLY, allowNull: false },
  fecha_fin: { type: DataTypes.DATEONLY, allowNull: false },
  anonima: { type: DataTypes.BOOLEAN, defaultValue: false },
  estado: { type: DataTypes.STRING(20), defaultValue: 'borrador',
    validate: { isIn: [['borrador','publicada','cerrada','archivada']] } },
  creado_por: DataTypes.UUID,
}, { schema: S, tableName: 'encuestas', timestamps: true, createdAt: 'creado_en', updatedAt: 'modificado_en' });

// ============================================================
// MODELO: PreguntaEncuesta
// ============================================================
const PreguntaEncuesta = sequelize.define('PreguntaEncuesta', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  encuesta_id: { type: DataTypes.UUID, allowNull: false },
  texto: { type: DataTypes.TEXT, allowNull: false },
  tipo: { type: DataTypes.STRING(30), allowNull: false,
    validate: { isIn: [['likert_5','likert_7','si_no','abierta','numerica','multiple_choice']] } },
  opciones: { type: DataTypes.JSONB, defaultValue: [] },
  logica_condicional: { type: DataTypes.JSONB, defaultValue: {} },
  obligatoria: { type: DataTypes.BOOLEAN, defaultValue: true },
  orden: { type: DataTypes.INTEGER, defaultValue: 0 },
}, { schema: S, tableName: 'preguntas_encuesta', timestamps: true, createdAt: 'creado_en', updatedAt: false });

// ============================================================
// MODELO: RespuestaEncuesta
// ============================================================
const RespuestaEncuesta = sequelize.define('RespuestaEncuesta', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  encuesta_id: { type: DataTypes.UUID, allowNull: false },
  pregunta_id: { type: DataTypes.UUID, allowNull: false },
  usuario_id: DataTypes.UUID,
  respuesta: { type: DataTypes.JSONB, defaultValue: {} },
}, { schema: S, tableName: 'respuestas_encuesta', timestamps: true, createdAt: 'creado_en', updatedAt: false });

// ============================================================
// MODELO: Notificacion
// ============================================================
const Notificacion = sequelize.define('Notificacion', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  usuario_id: { type: DataTypes.UUID, allowNull: false },
  tipo: { type: DataTypes.STRING(30), defaultValue: 'info',
    validate: { isIn: [['alerta','recordatorio','info','aprobacion_pendiente','error']] } },
  titulo: { type: DataTypes.STRING(200), allowNull: false },
  mensaje: { type: DataTypes.TEXT, allowNull: false },
  modulo: DataTypes.STRING(50),
  registro_id: DataTypes.UUID,
  leida: { type: DataTypes.BOOLEAN, defaultValue: false },
  leida_en: DataTypes.DATE,
}, { schema: S, tableName: 'notificaciones', timestamps: true, createdAt: 'creado_en', updatedAt: false });

// ============================================================
// MODELO: AuditoriaLog
// ============================================================
const AuditoriaLog = sequelize.define('AuditoriaLog', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  tabla: { type: DataTypes.STRING(100), allowNull: false },
  registro_id: DataTypes.UUID,
  accion: { type: DataTypes.STRING(10), allowNull: false,
    validate: { isIn: [['CREATE','UPDATE','DELETE','LOGIN','LOGOUT','EXPORT']] } },
  datos_anteriores: DataTypes.JSONB,
  datos_nuevos: DataTypes.JSONB,
  usuario_id: DataTypes.UUID,
  ip: DataTypes.STRING(45),
  user_agent: DataTypes.TEXT,
}, { schema: S, tableName: 'auditoria_log', timestamps: true, createdAt: 'creado_en', updatedAt: false });

// ============================================================
// MODELO: ParametroSistema
// ============================================================
const ParametroSistema = sequelize.define('ParametroSistema', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  clave: { type: DataTypes.STRING(100), allowNull: false, unique: true },
  valor: { type: DataTypes.TEXT, allowNull: false },
  tipo: { type: DataTypes.STRING(50), defaultValue: 'string' },
  descripcion: DataTypes.TEXT,
  modificado_por: DataTypes.UUID,
}, { schema: S, tableName: 'parametros_sistema', timestamps: true, createdAt: false, updatedAt: 'modificado_en' });

// ============================================================
// ASOCIACIONES
// ============================================================
Usuario.hasMany(Sesion, { foreignKey: 'usuario_id', as: 'sesiones' });
Sesion.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'usuario' });

TipoDocumento.hasMany(Documento, { foreignKey: 'tipo_id', as: 'documentos' });
Documento.belongsTo(TipoDocumento, { foreignKey: 'tipo_id', as: 'tipo' });

Macroproceso.hasMany(Proceso, { foreignKey: 'macroproceso_id', as: 'procesos' });
Proceso.belongsTo(Macroproceso, { foreignKey: 'macroproceso_id', as: 'macroproceso' });

Proceso.hasMany(ActividadProceso, { foreignKey: 'proceso_id', as: 'actividades' });
ActividadProceso.belongsTo(Proceso, { foreignKey: 'proceso_id', as: 'proceso' });

Proceso.hasMany(FlujoDeTrabajo, { foreignKey: 'proceso_id', as: 'flujos' });
FlujoDeTrabajo.belongsTo(Proceso, { foreignKey: 'proceso_id', as: 'proceso' });

Proceso.hasMany(Documento, { foreignKey: 'proceso_id', as: 'documentos' });
Documento.belongsTo(Proceso, { foreignKey: 'proceso_id', as: 'proceso' });

Proceso.hasMany(Riesgo, { foreignKey: 'proceso_id', as: 'riesgos' });
Proceso.hasMany(Indicador, { foreignKey: 'proceso_id', as: 'indicadores' });
Proceso.hasMany(Hallazgo, { foreignKey: 'proceso_id', as: 'hallazgos' });

Documento.hasMany(VersionDocumento, { foreignKey: 'documento_id', as: 'versiones' });
VersionDocumento.belongsTo(Documento, { foreignKey: 'documento_id', as: 'documento' });

Documento.hasMany(AprobacionDocumento, { foreignKey: 'documento_id', as: 'aprobaciones' });
AprobacionDocumento.belongsTo(Documento, { foreignKey: 'documento_id', as: 'documento' });

EstandarAcreditacion.hasMany(FactorCriterio, { foreignKey: 'estandar_id', as: 'factores' });
FactorCriterio.belongsTo(EstandarAcreditacion, { foreignKey: 'estandar_id', as: 'estandar' });

FactorCriterio.hasMany(FactorCriterio, { foreignKey: 'padre_id', as: 'hijos' });
FactorCriterio.belongsTo(FactorCriterio, { foreignKey: 'padre_id', as: 'padre' });

EstandarAcreditacion.hasMany(Autoevaluacion, { foreignKey: 'estandar_id', as: 'autoevaluaciones' });
Autoevaluacion.belongsTo(EstandarAcreditacion, { foreignKey: 'estandar_id', as: 'estandar' });

Autoevaluacion.hasMany(EvaluacionCriterio, { foreignKey: 'autoevaluacion_id', as: 'evaluaciones' });
EvaluacionCriterio.belongsTo(Autoevaluacion, { foreignKey: 'autoevaluacion_id', as: 'autoevaluacion' });

PlanAuditoria.hasMany(EquipoAuditoria, { foreignKey: 'plan_id', as: 'equipo' });
EquipoAuditoria.belongsTo(PlanAuditoria, { foreignKey: 'plan_id', as: 'plan' });

PlanAuditoria.hasMany(Hallazgo, { foreignKey: 'plan_id', as: 'hallazgos' });
Hallazgo.belongsTo(PlanAuditoria, { foreignKey: 'plan_id', as: 'plan' });

Hallazgo.hasOne(Capa, { foreignKey: 'hallazgo_id', as: 'capa' });
Capa.belongsTo(Hallazgo, { foreignKey: 'hallazgo_id', as: 'hallazgo' });

Capa.hasMany(SeguimientoCapa, { foreignKey: 'capa_id', as: 'seguimientos' });
SeguimientoCapa.belongsTo(Capa, { foreignKey: 'capa_id', as: 'capa' });

Riesgo.hasMany(PlanMitigacion, { foreignKey: 'riesgo_id', as: 'planes_mitigacion' });
PlanMitigacion.belongsTo(Riesgo, { foreignKey: 'riesgo_id', as: 'riesgo' });

Indicador.hasMany(MedicionIndicador, { foreignKey: 'indicador_id', as: 'mediciones' });
MedicionIndicador.belongsTo(Indicador, { foreignKey: 'indicador_id', as: 'indicador' });

Encuesta.hasMany(PreguntaEncuesta, { foreignKey: 'encuesta_id', as: 'preguntas' });
PreguntaEncuesta.belongsTo(Encuesta, { foreignKey: 'encuesta_id', as: 'encuesta' });

Encuesta.hasMany(RespuestaEncuesta, { foreignKey: 'encuesta_id', as: 'respuestas' });
RespuestaEncuesta.belongsTo(Encuesta, { foreignKey: 'encuesta_id', as: 'encuesta' });

Usuario.hasMany(Notificacion, { foreignKey: 'usuario_id', as: 'notificaciones' });
Notificacion.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'usuario' });

// ── Asociaciones de responsable (modelos que tienen responsable_id) ──
[Macroproceso, Proceso, ActividadProceso, Autoevaluacion, Capa, Riesgo, PlanMitigacion].forEach(Model => {
  Model.belongsTo(Usuario, { foreignKey: 'responsable_id', as: 'responsable' });
});

// ── Asociaciones de creador (modelos que tienen creado_por) ──
[Macroproceso, Proceso, FlujoDeTrabajo, Documento, EstandarAcreditacion, Autoevaluacion,
 PlanAuditoria, Hallazgo, Capa, Riesgo, PlanMitigacion, Indicador, Encuesta].forEach(Model => {
  Model.belongsTo(Usuario, { foreignKey: 'creado_por', as: 'creador' });
});

// ── Asociaciones de modificado_por ──
[Macroproceso, Proceso, Documento, Capa, Riesgo].forEach(Model => {
  Model.belongsTo(Usuario, { foreignKey: 'modificado_por', as: 'modificador' });
});

// ── Documento → responsable ──
Documento.belongsTo(Usuario, { foreignKey: 'responsable_id', as: 'responsable' });

// ── VersionDocumento → usuario ──
VersionDocumento.belongsTo(Usuario, { foreignKey: 'modificado_por', as: 'modificado_por_usuario' });

// ── AprobacionDocumento → aprobador ──
AprobacionDocumento.belongsTo(Usuario, { foreignKey: 'aprobador_id', as: 'aprobador' });

// ── EvaluacionCriterio → evaluador ──
EvaluacionCriterio.belongsTo(FactorCriterio, { foreignKey: 'factor_id', as: 'factor' });
EvaluacionCriterio.belongsTo(Usuario, { foreignKey: 'evaluado_por', as: 'evaluador' });

// ── EquipoAuditoria → auditor ──
EquipoAuditoria.belongsTo(Usuario, { foreignKey: 'auditor_id', as: 'auditor' });

// ── SeguimientoCapa → registrador ──
SeguimientoCapa.belongsTo(Usuario, { foreignKey: 'registrado_por', as: 'registrador' });

// ── MedicionIndicador → registrador ──
MedicionIndicador.belongsTo(Usuario, { foreignKey: 'registrado_por', as: 'registrador' });

// ── AuditoriaLog → usuario ──
AuditoriaLog.belongsTo(Usuario, { foreignKey: 'usuario_id', as: 'usuario' });
Usuario.hasMany(AuditoriaLog, { foreignKey: 'usuario_id', as: 'auditoria_logs' });

// ── Indicador → proceso y estandar ──
Indicador.belongsTo(Proceso, { foreignKey: 'proceso_id', as: 'proceso' });
Indicador.belongsTo(EstandarAcreditacion, { foreignKey: 'estandar_id', as: 'estandar' });

// ── PlanAuditoria → lider ──
PlanAuditoria.belongsTo(Usuario, { foreignKey: 'lider_id', as: 'lider' });

// ── Hallazgo → proceso y área responsable ──
Hallazgo.belongsTo(Proceso, { foreignKey: 'proceso_id', as: 'proceso' });
Hallazgo.belongsTo(Usuario, { foreignKey: 'area_responsable_id', as: 'area_responsable' });
Hallazgo.belongsTo(Capa, { foreignKey: 'capa_id', as: 'capa_vinculada' });

// ── Riesgo → proceso ──
Riesgo.belongsTo(Proceso, { foreignKey: 'proceso_id', as: 'proceso' });

// ── Capa → capa origen (auto-referencia) ──
Capa.belongsTo(Capa, { foreignKey: 'capa_origen_id', as: 'capa_origen' });

// ── SeguimientoCapa → archivo ──
SeguimientoCapa.belongsTo(ArchivoAdjunto, { foreignKey: 'archivo_id', as: 'archivo' });

module.exports = {
  sequelize,
  Usuario, Sesion, TipoDocumento, Macroproceso, Proceso, ActividadProceso,
  FlujoDeTrabajo, Documento, VersionDocumento, AprobacionDocumento,
  EstandarAcreditacion, FactorCriterio, Autoevaluacion, EvaluacionCriterio,
  PlanAuditoria, EquipoAuditoria, Hallazgo, Capa, SeguimientoCapa,
  ArchivoAdjunto, Riesgo, PlanMitigacion, Indicador, MedicionIndicador,
  Encuesta, PreguntaEncuesta, RespuestaEncuesta, Notificacion, AuditoriaLog, ParametroSistema,
};
