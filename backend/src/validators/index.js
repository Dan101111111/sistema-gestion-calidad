'use strict';
const Joi = require('joi');

// ── Helpers ───────────────────────────────────────────────────
const uuid = Joi.string().uuid({ version: 'uuidv4' });
const fecha = Joi.string().isoDate();
const paginacion = {
  page:  Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
};

// ── Auth ──────────────────────────────────────────────────────
const authSchemas = {
  login: Joi.object({
    email:    Joi.string().email().lowercase().required().messages({ 'string.email': 'Email inválido' }),
    password: Joi.string().min(6).max(100).required(),
  }),
  recuperar: Joi.object({
    email: Joi.string().email().lowercase().required(),
  }),
  resetPassword: Joi.object({
    token:    Joi.string().length(64).hex().required(),
    password: Joi.string().min(8).max(100).required()
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .messages({ 'string.pattern.base': 'La contraseña debe tener mayúsculas, minúsculas y números' }),
  }),
  cambiarPassword: Joi.object({
    password_actual: Joi.string().required(),
    password_nuevo:  Joi.string().min(8).max(100).required()
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .messages({ 'string.pattern.base': 'La contraseña debe tener mayúsculas, minúsculas y números' }),
  }),
};

// ── Usuarios ──────────────────────────────────────────────────
const usuarioSchemas = {
  crear: Joi.object({
    nombre:   Joi.string().min(2).max(100).required(),
    apellido: Joi.string().min(2).max(100).required(),
    email:    Joi.string().email().lowercase().required(),
    password: Joi.string().min(8).max(100).required(),
    rol:      Joi.string().valid('admin','gestor_calidad','auditor','docente','estudiante','egresado','invitado').default('invitado'),
    facultad: Joi.string().max(150).optional().allow(''),
    escuela:  Joi.string().max(150).optional().allow(''),
    telefono: Joi.string().max(20).optional().allow(''),
  }),
  actualizar: Joi.object({
    nombre:   Joi.string().min(2).max(100),
    apellido: Joi.string().min(2).max(100),
    rol:      Joi.string().valid('admin','gestor_calidad','auditor','docente','estudiante','egresado','invitado'),
    facultad: Joi.string().max(150).allow(''),
    escuela:  Joi.string().max(150).allow(''),
    telefono: Joi.string().max(20).allow(''),
  }),
};

// ── Documentos ────────────────────────────────────────────────
const documentoSchemas = {
  crear: Joi.object({
    codigo:                Joi.string().min(2).max(30).uppercase().required(),
    titulo:                Joi.string().min(3).max(300).required(),
    tipo_id:               uuid.optional(),
    contenido:             Joi.string().max(50000).optional().allow(''),
    proceso_id:            uuid.optional(),
    responsable_id:        uuid.optional(),
    fecha_vigencia_inicio: fecha.optional(),
    fecha_vigencia_fin:    fecha.optional(),
  }),
  actualizar: Joi.object({
    titulo:                Joi.string().min(3).max(300),
    tipo_id:               uuid,
    contenido:             Joi.string().max(50000).allow(''),
    proceso_id:            uuid,
    responsable_id:        uuid,
    fecha_vigencia_inicio: fecha,
    fecha_vigencia_fin:    fecha,
    comentario_version:    Joi.string().max(500).optional().allow(''),
  }),
  cambiarEstado: Joi.object({
    accion:     Joi.string().valid('enviar_revision','aprobar','rechazar','archivar').required(),
    comentario: Joi.string().max(1000).optional().allow(''),
  }),
};

// ── Macroprocesos ─────────────────────────────────────────────
const macroprocesoSchemas = {
  crear: Joi.object({
    codigo:         Joi.string().min(2).max(20).required(),
    nombre:         Joi.string().min(3).max(200).required(),
    descripcion:    Joi.string().max(2000).optional().allow(''),
    tipo:           Joi.string().valid('estrategico','misional','apoyo').default('estrategico'),
    orden:          Joi.number().integer().min(0).default(0),
    responsable_id: uuid.optional(),
  }),
};

// ── Procesos ──────────────────────────────────────────────────
const procesoSchemas = {
  crear: Joi.object({
    codigo:          Joi.string().min(2).max(20).required(),
    nombre:          Joi.string().min(3).max(200).required(),
    objetivo:        Joi.string().max(2000).optional().allow(''),
    alcance:         Joi.string().max(2000).optional().allow(''),
    macroproceso_id: uuid.optional(),
    responsable_id:  uuid.optional(),
    orden:           Joi.number().integer().min(0).default(0),
  }),
  actividad: Joi.object({
    nombre:         Joi.string().min(2).max(200).required(),
    descripcion:    Joi.string().max(2000).optional().allow(''),
    entradas:       Joi.string().max(1000).optional().allow(''),
    salidas:        Joi.string().max(1000).optional().allow(''),
    responsable_id: uuid.optional(),
    secuencia:      Joi.number().integer().min(0).default(0),
  }),
};

// ── CAPAs ─────────────────────────────────────────────────────
const capaSchemas = {
  crear: Joi.object({
    codigo:                Joi.string().min(3).max(30).required(),
    tipo:                  Joi.string().valid('correctiva','preventiva','mejora').required(),
    hallazgo_id:           uuid.optional(),
    descripcion:           Joi.string().min(10).max(5000).required(),
    causa_raiz:            Joi.string().max(3000).optional().allow(''),
    accion_propuesta:      Joi.string().min(10).max(5000).required(),
    responsable_id:        uuid.optional(),
    fecha_implementacion:  fecha.required(),
    fecha_verificacion:    fecha.optional(),
  }),
  cambiarEstado: Joi.object({
    nuevo_estado: Joi.string().valid('en_implementacion','implementada','verificada','cerrada','rechazada').required(),
    comentario:   Joi.string().max(2000).optional().allow(''),
    efectividad:  Joi.string().valid('efectiva','parcialmente_efectiva','no_efectiva').optional(),
  }),
  seguimiento: Joi.object({
    avance_porcentaje: Joi.number().integer().min(0).max(100).required(),
    observaciones:     Joi.string().max(3000).optional().allow(''),
    archivo_id:        uuid.optional(),
  }),
};

// ── Riesgos ───────────────────────────────────────────────────
const riesgoSchemas = {
  crear: Joi.object({
    codigo:         Joi.string().min(3).max(30).required(),
    nombre:         Joi.string().min(3).max(200).required(),
    descripcion:    Joi.string().max(3000).optional().allow(''),
    tipo:           Joi.string().valid('estrategico','operativo','academico','financiero','legal','tecnologico','reputacional').required(),
    proceso_id:     uuid.optional(),
    probabilidad:   Joi.number().integer().min(1).max(5).required(),
    impacto:        Joi.number().integer().min(1).max(5).required(),
    responsable_id: uuid.optional(),
  }),
  mitigacion: Joi.object({
    nombre:         Joi.string().min(3).max(200).required(),
    descripcion:    Joi.string().max(2000).optional().allow(''),
    tipo_respuesta: Joi.string().valid('mitigar','transferir','aceptar','eliminar').required(),
    responsable_id: uuid.optional(),
    fecha_limite:   fecha.optional(),
    costo_estimado: Joi.number().positive().optional(),
  }),
};

// ── Indicadores ───────────────────────────────────────────────
const indicadorSchemas = {
  crear: Joi.object({
    codigo:      Joi.string().min(2).max(30).required(),
    nombre:      Joi.string().min(3).max(200).required(),
    tipo:        Joi.string().valid('eficacia','eficiencia','impacto','satisfaccion','cobertura').required(),
    formula:     Joi.string().max(1000).optional().allow(''),
    meta:        Joi.number().required(),
    unidad:      Joi.string().max(50).optional().allow(''),
    frecuencia:  Joi.string().valid('diario','semanal','mensual','trimestral','semestral','anual').required(),
    proceso_id:  uuid.optional(),
    estandar_id: uuid.optional(),
  }),
  medicion: Joi.object({
    periodo:        Joi.string().min(4).max(20).required(),
    valor_real:     Joi.number().required(),
    valor_esperado: Joi.number().optional(),
    observaciones:  Joi.string().max(2000).optional().allow(''),
  }),
};

// ── Encuestas ─────────────────────────────────────────────────
const encuestaSchemas = {
  crear: Joi.object({
    codigo:         Joi.string().min(3).max(30).required(),
    titulo:         Joi.string().min(5).max(300).required(),
    descripcion:    Joi.string().max(3000).optional().allow(''),
    grupo_objetivo: Joi.string().valid('estudiantes','docentes','egresados','administrativos','todos').required(),
    fecha_inicio:   fecha.required(),
    fecha_fin:      fecha.required(),
    anonima:        Joi.boolean().default(false),
    preguntas:      Joi.array().items(Joi.object({
      texto:              Joi.string().min(5).required(),
      tipo:               Joi.string().valid('likert_5','likert_7','si_no','abierta','numerica','multiple_choice').required(),
      opciones:           Joi.array().optional(),
      logica_condicional: Joi.object().optional(),
      obligatoria:        Joi.boolean().default(true),
      orden:              Joi.number().integer().min(0).optional(),
    })).optional(),
  }),
  responder: Joi.object({
    respuestas: Joi.array().items(Joi.object({
      pregunta_id: uuid.required(),
      valor:       Joi.alternatives().try(Joi.number(), Joi.string(), Joi.boolean()).required(),
    })).min(1).required(),
  }),
};

// ── Auditorías ────────────────────────────────────────────────
const auditoriaSchemas = {
  plan: Joi.object({
    codigo:       Joi.string().min(3).max(30).required(),
    nombre:       Joi.string().min(3).max(200).required(),
    tipo:         Joi.string().valid('interna','externa','seguimiento','certificacion').required(),
    alcance:      Joi.string().max(3000).optional().allow(''),
    objetivo:     Joi.string().max(3000).optional().allow(''),
    fecha_inicio: fecha.required(),
    fecha_fin:    fecha.required(),
    lider_id:     uuid.optional(),
    miembros:     Joi.array().items(Joi.object({ auditor_id: uuid.required(), rol: Joi.string() })).optional(),
  }),
  hallazgo: Joi.object({
    codigo:              Joi.string().min(3).max(30).required(),
    plan_id:             uuid.optional(),
    tipo:                Joi.string().valid('no_conformidad','observacion','oportunidad_mejora','buena_practica').required(),
    gravedad:            Joi.string().valid('critica','mayor','menor','observacion').required(),
    descripcion:         Joi.string().min(10).max(5000).required(),
    proceso_id:          uuid.optional(),
    area_responsable_id: uuid.optional(),
    evidencia:           Joi.string().max(3000).optional().allow(''),
  }),
};

// ── Acreditación ──────────────────────────────────────────────
const acreditacionSchemas = {
  estandar: Joi.object({
    codigo:      Joi.string().min(2).max(30).required(),
    nombre:      Joi.string().min(3).max(200).required(),
    descripcion: Joi.string().max(3000).optional().allow(''),
    tipo:        Joi.string().valid('ISO_21001','SUNEDU','SINEACE','ABET','OTRO').required(),
  }),
  factor: Joi.object({
    estandar_id:      uuid.required(),
    codigo:           Joi.string().min(1).max(30).required(),
    nombre:           Joi.string().min(3).max(200).required(),
    descripcion:      Joi.string().max(2000).optional().allow(''),
    peso_porcentual:  Joi.number().min(0).max(100).required(),
    nivel:            Joi.number().integer().min(1).max(3).default(1),
    padre_id:         uuid.optional(),
  }),
  autoevaluacion: Joi.object({
    codigo:             Joi.string().min(3).max(30).required(),
    nombre:             Joi.string().min(3).max(200).required(),
    estandar_id:        uuid.optional(),
    periodo_academico:  Joi.string().min(4).max(20).required(),
    fecha_inicio:       fecha.required(),
    fecha_fin:          fecha.required(),
    responsable_id:     uuid.optional(),
  }),
  evaluarCriterio: Joi.object({
    autoevaluacion_id: uuid.required(),
    factor_id:         uuid.required(),
    puntaje:           Joi.number().min(0).max(100).required(),
    nivel_cumplimiento: Joi.string().valid('no_cumple','cumple_parcialmente','cumple','supera').required(),
    evidencias:        Joi.string().max(3000).optional().allow(''),
    observaciones:     Joi.string().max(2000).optional().allow(''),
    archivo_id:        uuid.optional(),
  }),
};

// ── Middleware de validación Joi ──────────────────────────────
function validar(schema, property = 'body') {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], { abortEarly: false, stripUnknown: true });
    if (error) {
      const detalles = error.details.map(d => ({ campo: d.path.join('.'), mensaje: d.message.replace(/"/g, '') }));
      return res.status(422).json({
        error: { code: 'VALIDATION_ERROR', message: 'Error de validación', details: detalles },
      });
    }
    req[property] = value;
    next();
  };
}

module.exports = {
  authSchemas, usuarioSchemas, documentoSchemas, macroprocesoSchemas,
  procesoSchemas, capaSchemas, riesgoSchemas, indicadorSchemas,
  encuestaSchemas, auditoriaSchemas, acreditacionSchemas, validar,
};
