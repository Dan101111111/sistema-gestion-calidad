'use strict';
// ============================================================
// CONTROLADOR: Procesos (Macroprocesos, Procesos, Actividades)
// ============================================================
const { Op, literal } = require('sequelize');
const {
  Macroproceso, Proceso, ActividadProceso, FlujoDeTrabajo,
  EstandarAcreditacion, FactorCriterio, Autoevaluacion, EvaluacionCriterio,
  PlanAuditoria, EquipoAuditoria, Hallazgo,
  Encuesta, PreguntaEncuesta, RespuestaEncuesta,
  Notificacion, ArchivoAdjunto, AuditoriaLog, ParametroSistema,
  Usuario, Documento, Capa, Riesgo, Indicador, MedicionIndicador,
} = require('../models');
const { sequelize } = require('../models');
const { createError } = require('../middleware/errorHandler');
const pdfService = require('../services/pdfService');
const notifService = require('../services/notificacionService');
const n8nService = require('../services/n8nService');
const archivoService = require('../services/archivoService');

// ── PROCESOS ──────────────────────────────────────────────────

exports.listarMacroprocesos = async (req, res, next) => {
  try {
    const macros = await Macroproceso.findAll({
      where: { activo: true },
      include: [
        { model: Proceso, as: 'procesos', where: { activo: true }, required: false,
          attributes: ['id', 'codigo', 'nombre', 'orden'] },
        { model: Usuario, as: 'responsable', attributes: ['id', 'nombre', 'apellido'] },
      ],
      order: [['orden', 'ASC'], [{ model: Proceso, as: 'procesos' }, 'orden', 'ASC']],
    });
    res.json({ data: macros });
  } catch (err) { next(err); }
};

exports.crearMacroproceso = async (req, res, next) => {
  try {
    const existe = await Macroproceso.findOne({ where: { codigo: req.body.codigo } });
    if (existe) return next(createError(409, 'El código de macroproceso ya existe'));
    const macro = await Macroproceso.create({ ...req.body, creado_por: req.userId });
    res.status(201).json({ data: macro });
  } catch (err) { next(err); }
};

exports.actualizarMacroproceso = async (req, res, next) => {
  try {
    const macro = await Macroproceso.findByPk(req.params.id);
    if (!macro) return next(createError(404, 'Macroproceso no encontrado'));
    await macro.update({ ...req.body, modificado_por: req.userId });
    res.json({ data: macro });
  } catch (err) { next(err); }
};

exports.listarProcesos = async (req, res, next) => {
  try {
    const { macroproceso_id, q } = req.query;
    const where = { activo: true };
    if (macroproceso_id) where.macroproceso_id = macroproceso_id;
    if (q) where[Op.or] = [{ nombre: { [Op.iLike]: `%${q}%` } }, { codigo: { [Op.iLike]: `%${q}%` } }];

    const procesos = await Proceso.findAll({
      where,
      include: [
        { model: Macroproceso, as: 'macroproceso', attributes: ['id', 'codigo', 'nombre', 'tipo'] },
        { model: Usuario, as: 'responsable', attributes: ['id', 'nombre', 'apellido'] },
        { model: ActividadProceso, as: 'actividades', where: { activo: true }, required: false, order: [['secuencia', 'ASC']] },
      ],
      order: [['orden', 'ASC']],
    });
    res.json({ data: procesos });
  } catch (err) { next(err); }
};

exports.obtenerProceso = async (req, res, next) => {
  try {
    const proceso = await Proceso.findByPk(req.params.id, {
      include: [
        { model: Macroproceso, as: 'macroproceso' },
        { model: Usuario, as: 'responsable', attributes: ['id', 'nombre', 'apellido', 'email'] },
        { model: ActividadProceso, as: 'actividades', order: [['secuencia', 'ASC']] },
        { model: FlujoDeTrabajo, as: 'flujos', where: { activo: true }, required: false },
        { model: Documento, as: 'documentos', attributes: ['id', 'codigo', 'titulo', 'estado'], limit: 5 },
      ],
    });
    if (!proceso) return next(createError(404, 'Proceso no encontrado'));
    res.json({ data: proceso });
  } catch (err) { next(err); }
};

exports.crearProceso = async (req, res, next) => {
  try {
    const existe = await Proceso.findOne({ where: { codigo: req.body.codigo } });
    if (existe) return next(createError(409, 'El código de proceso ya existe'));
    const proceso = await Proceso.create({ ...req.body, creado_por: req.userId });
    res.status(201).json({ data: proceso });
  } catch (err) { next(err); }
};

exports.actualizarProceso = async (req, res, next) => {
  try {
    const proceso = await Proceso.findByPk(req.params.id);
    if (!proceso) return next(createError(404, 'Proceso no encontrado'));
    req.datosAnteriores = proceso.toJSON();
    await proceso.update({ ...req.body, modificado_por: req.userId });
    res.json({ data: proceso });
  } catch (err) { next(err); }
};

exports.crearActividad = async (req, res, next) => {
  try {
    const proceso = await Proceso.findByPk(req.params.procesoId);
    if (!proceso) return next(createError(404, 'Proceso no encontrado'));
    const act = await ActividadProceso.create({ ...req.body, proceso_id: proceso.id });
    res.status(201).json({ data: act });
  } catch (err) { next(err); }
};

exports.actualizarActividad = async (req, res, next) => {
  try {
    const act = await ActividadProceso.findByPk(req.params.id);
    if (!act) return next(createError(404, 'Actividad no encontrada'));
    await act.update(req.body);
    res.json({ data: act });
  } catch (err) { next(err); }
};

exports.reportePDFProcesos = async (req, res, next) => {
  try {
    const macros = await Macroproceso.findAll({
      where: { activo: true }, order: [['orden', 'ASC']],
      include: [{ model: Proceso, as: 'procesos', where: { activo: true }, required: false,
        include: [{ model: ActividadProceso, as: 'actividades', where: { activo: true }, required: false }] }],
    });

    const html = macros.map(m => `
      <h3 style="color:#003366">${m.codigo} — ${m.nombre} <span style="font-size:11px;background:#003366;color:white;padding:2px 8px;border-radius:10px">${m.tipo}</span></h3>
      ${(m.procesos || []).map(p => `
        <div style="margin-left:20px;margin-bottom:12px">
          <strong>${p.codigo} — ${p.nombre}</strong>
          <ul style="margin:4px 0">
            ${(p.actividades || []).map(a => `<li>${a.secuencia}. ${a.nombre}</li>`).join('')}
          </ul>
        </div>
      `).join('')}
    `).join('<hr>');

    const pdf = await pdfService.generar({ titulo: 'Mapa de Procesos Institucional', contenido: html, modulo: 'procesos' });
    res.set({ 'Content-Type': 'application/pdf', 'Content-Disposition': 'attachment; filename="mapa-procesos.pdf"' });
    res.send(pdf);
  } catch (err) { next(err); }
};

// ── ACREDITACIÓN ──────────────────────────────────────────────

exports.listarEstandares = async (req, res, next) => {
  try {
    const estandares = await EstandarAcreditacion.findAll({
      where: { activo: true },
      include: [{ model: FactorCriterio, as: 'factores', where: { padre_id: null }, required: false,
        include: [{ model: FactorCriterio, as: 'hijos' }] }],
    });
    res.json({ data: estandares });
  } catch (err) { next(err); }
};

exports.crearEstandar = async (req, res, next) => {
  try {
    const estandar = await EstandarAcreditacion.create({ ...req.body, creado_por: req.userId });
    res.status(201).json({ data: estandar });
  } catch (err) { next(err); }
};

exports.crearFactor = async (req, res, next) => {
  try {
    const factor = await FactorCriterio.create(req.body);
    res.status(201).json({ data: factor });
  } catch (err) { next(err); }
};

exports.listarAutoevaluaciones = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, estado, periodo } = req.query;
    const where = {};
    if (estado) where.estado = estado;
    if (periodo) where.periodo_academico = periodo;

    const { count, rows } = await Autoevaluacion.findAndCountAll({
      where,
      include: [
        { model: EstandarAcreditacion, as: 'estandar', attributes: ['id', 'codigo', 'nombre'] },
        { model: Usuario, as: 'responsable', attributes: ['id', 'nombre', 'apellido'] },
      ],
      order: [['creado_en', 'DESC']],
      limit: parseInt(limit), offset: (parseInt(page) - 1) * parseInt(limit),
    });
    res.json({ data: rows, meta: { total: count, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(count / limit) } });
  } catch (err) { next(err); }
};

exports.crearAutoevaluacion = async (req, res, next) => {
  try {
    const existe = await Autoevaluacion.findOne({ where: { codigo: req.body.codigo } });
    if (existe) return next(createError(409, 'Código de autoevaluación duplicado'));
    const ae = await Autoevaluacion.create({ ...req.body, creado_por: req.userId });
    res.status(201).json({ data: ae });
  } catch (err) { next(err); }
};

exports.evaluarCriterio = async (req, res, next) => {
  try {
    const { autoevaluacion_id, factor_id, puntaje, nivel_cumplimiento, evidencias, observaciones } = req.body;
    const [eval_, created] = await EvaluacionCriterio.findOrCreate({
      where: { autoevaluacion_id, factor_id },
      defaults: { puntaje, nivel_cumplimiento, evidencias, observaciones, evaluado_por: req.userId },
    });
    if (!created) await eval_.update({ puntaje, nivel_cumplimiento, evidencias, observaciones, evaluado_por: req.userId });

    // Recalcular puntaje total de autoevaluacion
    const evals = await EvaluacionCriterio.findAll({ where: { autoevaluacion_id }, include: [{ model: FactorCriterio, as: 'factor' }] });
    const puntajeTotal = evals.reduce((acc, e) => {
      const peso = parseFloat(e.factor?.peso_porcentual || 0) / 100;
      return acc + (parseFloat(e.puntaje) * peso);
    }, 0);
    await Autoevaluacion.update({ puntaje_total: puntajeTotal.toFixed(2) }, { where: { id: autoevaluacion_id } });

    res.json({ data: eval_ });
  } catch (err) { next(err); }
};

exports.comparativaAutoevaluaciones = async (req, res, next) => {
  try {
    const { estandar_id } = req.query;
    const aes = await Autoevaluacion.findAll({
      where: estandar_id ? { estandar_id } : {},
      attributes: ['id', 'codigo', 'periodo_academico', 'puntaje_total', 'estado'],
      order: [['periodo_academico', 'ASC']],
    });
    res.json({ data: aes });
  } catch (err) { next(err); }
};

exports.reportePDFAcreditacion = async (req, res, next) => {
  try {
    const { id } = req.params;
    const ae = await Autoevaluacion.findByPk(id, {
      include: [
        { model: EstandarAcreditacion, as: 'estandar' },
        { model: EvaluacionCriterio, as: 'evaluaciones', include: [{ model: FactorCriterio, as: 'factor' }] },
        { model: Usuario, as: 'responsable', attributes: ['nombre', 'apellido'] },
      ],
    });
    if (!ae) return next(createError(404, 'Autoevaluación no encontrada'));

    const color = (n) => n >= 80 ? '#27AE60' : n >= 60 ? '#F7B731' : '#C8102E';

    const html = `
      <h2>${ae.nombre}</h2>
      <p><strong>Estándar:</strong> ${ae.estandar?.nombre} | <strong>Período:</strong> ${ae.periodo_academico}</p>
      <p><strong>Puntaje Total:</strong> <span style="font-size:20px;font-weight:bold;color:${color(ae.puntaje_total)}">${ae.puntaje_total}%</span></p>
      <table>
        <thead><tr><th>Factor</th><th>Peso %</th><th>Puntaje</th><th>Cumplimiento</th><th>Evidencias</th></tr></thead>
        <tbody>
          ${ae.evaluaciones?.map(e => `
            <tr>
              <td>${e.factor?.codigo} — ${e.factor?.nombre}</td>
              <td style="text-align:center">${e.factor?.peso_porcentual}%</td>
              <td style="text-align:center">${e.puntaje}</td>
              <td style="text-align:center;background:${color(parseFloat(e.puntaje))};color:white">${e.nivel_cumplimiento}</td>
              <td style="font-size:11px">${e.evidencias || '-'}</td>
            </tr>
          `).join('') || '<tr><td colspan="5">Sin evaluaciones</td></tr>'}
        </tbody>
      </table>
    `;

    const pdf = await pdfService.generar({ titulo: 'Autoevaluación — ' + ae.estandar?.nombre, contenido: html, modulo: 'acreditacion' });
    res.set({ 'Content-Type': 'application/pdf', 'Content-Disposition': 'attachment; filename="autoevaluacion.pdf"' });
    res.send(pdf);
  } catch (err) { next(err); }
};

// ── AUDITORÍAS ────────────────────────────────────────────────

exports.listarPlanes = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, estado, tipo } = req.query;
    const where = {};
    if (estado) where.estado = estado;
    if (tipo) where.tipo = tipo;

    const { count, rows } = await PlanAuditoria.findAndCountAll({
      where, include: [
        { model: Usuario, as: 'lider', attributes: ['id', 'nombre', 'apellido'] },
        { model: EquipoAuditoria, as: 'equipo', include: [{ model: Usuario, as: 'auditor', attributes: ['id', 'nombre', 'apellido'] }] },
      ],
      order: [['fecha_inicio', 'DESC']],
      limit: parseInt(limit), offset: (parseInt(page) - 1) * parseInt(limit),
    });
    res.json({ data: rows, meta: { total: count, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(count / limit) } });
  } catch (err) { next(err); }
};

exports.crearPlan = async (req, res, next) => {
  try {
    const existe = await PlanAuditoria.findOne({ where: { codigo: req.body.codigo } });
    if (existe) return next(createError(409, 'Código de plan duplicado'));
    const plan = await PlanAuditoria.create({ ...req.body, creado_por: req.userId });
    if (req.body.miembros?.length) {
      const equipo = req.body.miembros.map(m => ({ plan_id: plan.id, auditor_id: m.auditor_id, rol_en_equipo: m.rol || 'auditor' }));
      await EquipoAuditoria.bulkCreate(equipo, { ignoreDuplicates: true });
    }
    res.status(201).json({ data: plan });
  } catch (err) { next(err); }
};

exports.actualizarPlan = async (req, res, next) => {
  try {
    const plan = await PlanAuditoria.findByPk(req.params.id);
    if (!plan) return next(createError(404, 'Plan no encontrado'));
    await plan.update({ ...req.body });
    res.json({ data: plan });
  } catch (err) { next(err); }
};

exports.listarHallazgos = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, plan_id, estado, gravedad, tipo } = req.query;
    const where = {};
    if (plan_id) where.plan_id = plan_id;
    if (estado) where.estado = estado;
    if (gravedad) where.gravedad = gravedad;
    if (tipo) where.tipo = tipo;

    const { count, rows } = await Hallazgo.findAndCountAll({
      where,
      include: [
        { model: PlanAuditoria, as: 'plan', attributes: ['id', 'codigo', 'nombre'] },
        { model: Capa, as: 'capa', attributes: ['id', 'codigo', 'estado'] },
      ],
      order: [['creado_en', 'DESC']],
      limit: parseInt(limit), offset: (parseInt(page) - 1) * parseInt(limit),
    });
    res.json({ data: rows, meta: { total: count, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(count / limit) } });
  } catch (err) { next(err); }
};

exports.crearHallazgo = async (req, res, next) => {
  try {
    const existe = await Hallazgo.findOne({ where: { codigo: req.body.codigo } });
    if (existe) return next(createError(409, 'Código de hallazgo duplicado'));
    const hallazgo = await Hallazgo.create({ ...req.body, creado_por: req.userId });

    if (hallazgo.gravedad === 'critica') {
      await notifService.crearParaRol('gestor_calidad', {
        tipo: 'alerta',
        titulo: `🚨 Hallazgo Crítico: ${hallazgo.codigo}`,
        mensaje: `Hallazgo crítico registrado: "${hallazgo.descripcion.substring(0, 100)}..."`,
        modulo: 'auditorias', registro_id: hallazgo.id,
      });
    }

    res.status(201).json({ data: hallazgo });
  } catch (err) { next(err); }
};

exports.actualizarHallazgo = async (req, res, next) => {
  try {
    const h = await Hallazgo.findByPk(req.params.id);
    if (!h) return next(createError(404, 'Hallazgo no encontrado'));
    await h.update(req.body);
    res.json({ data: h });
  } catch (err) { next(err); }
};

exports.reportePDFAuditoria = async (req, res, next) => {
  try {
    const plan = await PlanAuditoria.findByPk(req.params.id, {
      include: [
        { model: Usuario, as: 'lider', attributes: ['nombre', 'apellido'] },
        { model: EquipoAuditoria, as: 'equipo', include: [{ model: Usuario, as: 'auditor', attributes: ['nombre', 'apellido'] }] },
        { model: Hallazgo, as: 'hallazgos', include: [{ model: Capa, as: 'capa', attributes: ['codigo', 'estado'] }] },
      ],
    });
    if (!plan) return next(createError(404, 'Plan no encontrado'));

    const html = `
      <h2>${plan.codigo} — ${plan.nombre}</h2>
      <p><strong>Tipo:</strong> ${plan.tipo} | <strong>Estado:</strong> ${plan.estado}</p>
      <p><strong>Período:</strong> ${plan.fecha_inicio} al ${plan.fecha_fin}</p>
      <p><strong>Líder:</strong> ${plan.lider?.nombre} ${plan.lider?.apellido}</p>
      <h3>Hallazgos (${plan.hallazgos?.length || 0})</h3>
      <table>
        <thead><tr><th>Código</th><th>Tipo</th><th>Gravedad</th><th>Descripción</th><th>Estado</th><th>CAPA</th></tr></thead>
        <tbody>
          ${plan.hallazgos?.map(h => `
            <tr>
              <td>${h.codigo}</td>
              <td>${h.tipo}</td>
              <td style="color:${h.gravedad === 'critica' ? '#C8102E' : '#333'};font-weight:bold">${h.gravedad}</td>
              <td>${h.descripcion.substring(0, 80)}...</td>
              <td>${h.estado}</td>
              <td>${h.capa?.codigo || 'Sin CAPA'}</td>
            </tr>
          `).join('') || '<tr><td colspan="6">Sin hallazgos</td></tr>'}
        </tbody>
      </table>
    `;

    const pdf = await pdfService.generar({ titulo: 'Plan de Auditoría', contenido: html, modulo: 'auditorias' });
    res.set({ 'Content-Type': 'application/pdf', 'Content-Disposition': 'attachment; filename="auditoria.pdf"' });
    res.send(pdf);
  } catch (err) { next(err); }
};

// ── ENCUESTAS ─────────────────────────────────────────────────

exports.listarEncuestas = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, estado, grupo_objetivo } = req.query;
    const where = {};
    if (estado) where.estado = estado;
    if (grupo_objetivo) where.grupo_objetivo = { [Op.in]: [grupo_objetivo, 'todos'] };

    const { count, rows } = await Encuesta.findAndCountAll({
      where,
      attributes: ['id', 'codigo', 'titulo', 'grupo_objetivo', 'fecha_inicio', 'fecha_fin', 'anonima', 'estado', 'creado_en'],
      order: [['creado_en', 'DESC']],
      limit: parseInt(limit), offset: (parseInt(page) - 1) * parseInt(limit),
    });
    res.json({ data: rows, meta: { total: count, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(count / limit) } });
  } catch (err) { next(err); }
};

exports.obtenerEncuesta = async (req, res, next) => {
  try {
    const encuesta = await Encuesta.findByPk(req.params.id, {
      include: [{ model: PreguntaEncuesta, as: 'preguntas', order: [['orden', 'ASC']] }],
    });
    if (!encuesta) return next(createError(404, 'Encuesta no encontrada'));
    res.json({ data: encuesta });
  } catch (err) { next(err); }
};

exports.crearEncuesta = async (req, res, next) => {
  try {
    const { codigo, titulo, descripcion, grupo_objetivo, fecha_inicio, fecha_fin, anonima, preguntas } = req.body;
    const existe = await Encuesta.findOne({ where: { codigo } });
    if (existe) return next(createError(409, 'Código de encuesta duplicado'));

    const encuesta = await Encuesta.create({ codigo, titulo, descripcion, grupo_objetivo, fecha_inicio, fecha_fin, anonima, creado_por: req.userId });

    if (preguntas?.length) {
      await PreguntaEncuesta.bulkCreate(preguntas.map((p, i) => ({ ...p, encuesta_id: encuesta.id, orden: p.orden ?? i })));
    }

    res.status(201).json({ data: encuesta });
  } catch (err) { next(err); }
};

exports.publicarEncuesta = async (req, res, next) => {
  try {
    const encuesta = await Encuesta.findByPk(req.params.id);
    if (!encuesta) return next(createError(404, 'Encuesta no encontrada'));
    if (encuesta.estado !== 'borrador') return next(createError(400, 'Solo se puede publicar desde borrador'));

    await encuesta.update({ estado: 'publicada' });
    await n8nService.trigger('encuesta-publicada', { encuestaId: encuesta.id, titulo: encuesta.titulo, grupo: encuesta.grupo_objetivo });

    res.json({ data: encuesta });
  } catch (err) { next(err); }
};

exports.responderEncuesta = async (req, res, next) => {
  try {
    const encuesta = await Encuesta.findByPk(req.params.id, {
      include: [{ model: PreguntaEncuesta, as: 'preguntas' }],
    });
    if (!encuesta || encuesta.estado !== 'publicada') return next(createError(404, 'Encuesta no disponible'));

    const hoy = new Date();
    if (hoy < new Date(encuesta.fecha_inicio) || hoy > new Date(encuesta.fecha_fin)) {
      return next(createError(400, 'La encuesta no está vigente'));
    }

    // Verificar respuesta única (si no es anónima)
    if (!encuesta.anonima && req.userId) {
      const yaRespondio = await RespuestaEncuesta.findOne({ where: { encuesta_id: encuesta.id, usuario_id: req.userId } });
      if (yaRespondio) return next(createError(409, 'Ya respondió esta encuesta'));
    }

    const { respuestas } = req.body;
    const inserts = respuestas.map(r => ({
      encuesta_id: encuesta.id, pregunta_id: r.pregunta_id,
      usuario_id: encuesta.anonima ? null : req.userId,
      respuesta: { valor: r.valor },
    }));

    await RespuestaEncuesta.bulkCreate(inserts);
    res.status(201).json({ data: { message: 'Respuestas registradas correctamente' } });
  } catch (err) { next(err); }
};

exports.resultadosEncuesta = async (req, res, next) => {
  try {
    const encuesta = await Encuesta.findByPk(req.params.id, {
      include: [{ model: PreguntaEncuesta, as: 'preguntas', order: [['orden', 'ASC']] }],
    });
    if (!encuesta) return next(createError(404, 'Encuesta no encontrada'));

    const resultados = await Promise.all(encuesta.preguntas.map(async (preg) => {
      const respuestas = await RespuestaEncuesta.findAll({ where: { pregunta_id: preg.id } });

      let analisis = { total: respuestas.length };

      if (['likert_5', 'likert_7', 'numerica'].includes(preg.tipo)) {
        const valores = respuestas.map(r => parseFloat(r.respuesta?.valor || 0)).filter(v => !isNaN(v));
        analisis.promedio = valores.length ? (valores.reduce((a, b) => a + b, 0) / valores.length).toFixed(2) : 0;
        analisis.distribucion = {};
        valores.forEach(v => { analisis.distribucion[v] = (analisis.distribucion[v] || 0) + 1; });
      } else if (preg.tipo === 'si_no') {
        const si = respuestas.filter(r => r.respuesta?.valor === 'si').length;
        analisis.si = si;
        analisis.no = respuestas.length - si;
        analisis.pct_si = respuestas.length ? ((si / respuestas.length) * 100).toFixed(1) : 0;
      } else if (preg.tipo === 'multiple_choice') {
        analisis.distribucion = {};
        respuestas.forEach(r => {
          const v = r.respuesta?.valor;
          if (v) analisis.distribucion[v] = (analisis.distribucion[v] || 0) + 1;
        });
      } else if (preg.tipo === 'abierta') {
        analisis.respuestas_texto = respuestas.slice(0, 20).map(r => r.respuesta?.valor);
      }

      return { pregunta: { id: preg.id, texto: preg.texto, tipo: preg.tipo }, analisis };
    }));

    res.json({ data: { encuesta: { id: encuesta.id, titulo: encuesta.titulo }, resultados } });
  } catch (err) { next(err); }
};

exports.reportePDFEncuesta = async (req, res, next) => {
  try {
    const encuesta = await Encuesta.findByPk(req.params.id);
    if (!encuesta) return next(createError(404, 'Encuesta no encontrada'));
    const total_resp = await RespuestaEncuesta.count({ where: { encuesta_id: encuesta.id } });

    const html = `
      <h2>${encuesta.titulo}</h2>
      <p><strong>Grupo objetivo:</strong> ${encuesta.grupo_objetivo} | <strong>Estado:</strong> ${encuesta.estado}</p>
      <p><strong>Período:</strong> ${encuesta.fecha_inicio} — ${encuesta.fecha_fin}</p>
      <p><strong>Total respuestas:</strong> ${total_resp}</p>
      <p><em>Para ver el análisis completo por pregunta, consulte la vista web de resultados.</em></p>
    `;

    const pdf = await pdfService.generar({ titulo: 'Encuesta — ' + encuesta.titulo, contenido: html, modulo: 'encuestas' });
    res.set({ 'Content-Type': 'application/pdf', 'Content-Disposition': 'attachment; filename="encuesta.pdf"' });
    res.send(pdf);
  } catch (err) { next(err); }
};

// ── NOTIFICACIONES ────────────────────────────────────────────

exports.listarNotificaciones = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, tipo, leida } = req.query;
    const where = { usuario_id: req.userId };
    if (tipo) where.tipo = tipo;
    if (leida !== undefined) where.leida = leida === 'true';

    const { count, rows } = await Notificacion.findAndCountAll({
      where, order: [['creado_en', 'DESC']],
      limit: parseInt(limit), offset: (parseInt(page) - 1) * parseInt(limit),
    });
    const noLeidas = await Notificacion.count({ where: { usuario_id: req.userId, leida: false } });

    res.json({ data: rows, meta: { total: count, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(count / limit), no_leidas: noLeidas } });
  } catch (err) { next(err); }
};

exports.marcarLeida = async (req, res, next) => {
  try {
    const notif = await Notificacion.findOne({ where: { id: req.params.id, usuario_id: req.userId } });
    if (!notif) return next(createError(404, 'Notificación no encontrada'));
    await notif.update({ leida: true, leida_en: new Date() });
    res.json({ data: notif });
  } catch (err) { next(err); }
};

exports.marcarTodasLeidas = async (req, res, next) => {
  try {
    await Notificacion.update({ leida: true, leida_en: new Date() }, { where: { usuario_id: req.userId, leida: false } });
    res.json({ data: { message: 'Todas las notificaciones marcadas como leídas' } });
  } catch (err) { next(err); }
};

exports.conteoNoLeidas = async (req, res, next) => {
  try {
    const count = await Notificacion.count({ where: { usuario_id: req.userId, leida: false } });
    res.json({ data: { count } });
  } catch (err) { next(err); }
};

// ── ARCHIVOS ──────────────────────────────────────────────────

exports.subirArchivo = async (req, res, next) => {
  try {
    if (!req.file) return next(createError(400, 'No se recibió archivo'));

    const { modulo_origen, registro_id } = req.body;
    const archivo = await archivoService.subir({
      file: req.file,
      subido_por: req.userId,
      modulo_origen, registro_id,
    });

    res.status(201).json({ data: archivo });
  } catch (err) { next(err); }
};

exports.obtenerUrlArchivo = async (req, res, next) => {
  try {
    const archivo = await ArchivoAdjunto.findByPk(req.params.id);
    if (!archivo) return next(createError(404, 'Archivo no encontrado'));

    const url = await archivoService.generarUrl(archivo.bucket, archivo.ruta_minio);
    res.json({ data: { url, expira_en: new Date(Date.now() + 3600 * 1000) } });
  } catch (err) { next(err); }
};

exports.eliminarArchivo = async (req, res, next) => {
  try {
    const archivo = await ArchivoAdjunto.findByPk(req.params.id);
    if (!archivo) return next(createError(404, 'Archivo no encontrado'));

    await archivoService.eliminar(archivo.bucket, archivo.ruta_minio);
    await archivo.destroy();
    res.json({ data: { message: 'Archivo eliminado' } });
  } catch (err) { next(err); }
};

// ── BÚSQUEDA GLOBAL ───────────────────────────────────────────

exports.busquedaGlobal = async (req, res, next) => {
  try {
    const { q, tipo, page = 1, limit = 10 } = req.query;
    if (!q || q.length < 2) return res.json({ data: [], meta: { total: 0 } });

    const tsQuery = q.replace(/[^\w\s]/g, ' ').trim();
    const ilike = `%${q}%`;
    const resultados = [];

    if (!tipo || tipo === 'documento') {
      const docs = await Documento.findAll({
        where: { [Op.or]: [{ titulo: { [Op.iLike]: ilike } }, { codigo: { [Op.iLike]: ilike } }] },
        attributes: ['id', 'codigo', 'titulo', 'estado', 'version_actual'],
        limit: 5,
      });
      resultados.push(...docs.map(d => ({ tipo: 'documento', id: d.id, titulo: d.titulo, subtitulo: d.codigo, estado: d.estado, url: `/documentos/${d.id}` })));
    }

    if (!tipo || tipo === 'proceso') {
      const procs = await Proceso.findAll({
        where: { [Op.or]: [{ nombre: { [Op.iLike]: ilike } }, { codigo: { [Op.iLike]: ilike } }] },
        attributes: ['id', 'codigo', 'nombre'],
        limit: 5,
      });
      resultados.push(...procs.map(p => ({ tipo: 'proceso', id: p.id, titulo: p.nombre, subtitulo: p.codigo, url: `/procesos/${p.id}` })));
    }

    if (!tipo || tipo === 'riesgo') {
      const riesgos = await Riesgo.findAll({
        where: { [Op.or]: [{ nombre: { [Op.iLike]: ilike } }, { codigo: { [Op.iLike]: ilike } }] },
        attributes: ['id', 'codigo', 'nombre', 'nivel_riesgo', 'estado'],
        limit: 5,
      });
      resultados.push(...riesgos.map(r => ({ tipo: 'riesgo', id: r.id, titulo: r.nombre, subtitulo: `Nivel: ${r.nivel_riesgo}`, estado: r.estado, url: `/riesgos/${r.id}` })));
    }

    if (!tipo || tipo === 'indicador') {
      const inds = await Indicador.findAll({
        where: { [Op.or]: [{ nombre: { [Op.iLike]: ilike } }, { codigo: { [Op.iLike]: ilike } }] },
        attributes: ['id', 'codigo', 'nombre', 'tipo'],
        limit: 5,
      });
      resultados.push(...inds.map(i => ({ tipo: 'indicador', id: i.id, titulo: i.nombre, subtitulo: i.codigo, url: `/indicadores/${i.id}` })));
    }

    if (!tipo || tipo === 'capa') {
      const capas = await Capa.findAll({
        where: { [Op.or]: [{ descripcion: { [Op.iLike]: ilike } }, { codigo: { [Op.iLike]: ilike } }] },
        attributes: ['id', 'codigo', 'descripcion', 'estado'],
        limit: 5,
      });
      resultados.push(...capas.map(c => ({ tipo: 'capa', id: c.id, titulo: c.codigo, subtitulo: c.descripcion.substring(0, 80), estado: c.estado, url: `/capas/${c.id}` })));
    }

    res.json({ data: resultados, meta: { total: resultados.length, query: q } });
  } catch (err) { next(err); }
};

// ── AUDITORÍA LOG ─────────────────────────────────────────────

exports.historialRegistro = async (req, res, next) => {
  try {
    const { tabla, id } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const { count, rows } = await AuditoriaLog.findAndCountAll({
      where: { tabla, registro_id: id },
      include: [{ model: Usuario, as: 'usuario', attributes: ['id', 'nombre', 'apellido', 'email'] }],
      order: [['creado_en', 'DESC']],
      limit: parseInt(limit), offset: (parseInt(page) - 1) * parseInt(limit),
    });

    res.json({ data: rows, meta: { total: count, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(count / limit) } });
  } catch (err) { next(err); }
};

exports.logGeneral = async (req, res, next) => {
  try {
    const { page = 1, limit = 50, accion, tabla, usuario_id } = req.query;
    const where = {};
    if (accion) where.accion = accion;
    if (tabla) where.tabla = tabla;
    if (usuario_id) where.usuario_id = usuario_id;

    const { count, rows } = await AuditoriaLog.findAndCountAll({
      where,
      include: [{ model: Usuario, as: 'usuario', attributes: ['id', 'nombre', 'apellido'] }],
      order: [['creado_en', 'DESC']],
      limit: parseInt(limit), offset: (parseInt(page) - 1) * parseInt(limit),
    });

    res.json({ data: rows, meta: { total: count, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(count / limit) } });
  } catch (err) { next(err); }
};

// ── DASHBOARD ─────────────────────────────────────────────────

exports.dashboardKpis = async (req, res, next) => {
  try {
    const [
      documentosActivos, capasAbiertas, riesgosCriticos,
      encuestasVigentes, indicadoresBajoMeta, hallazgosAbiertos,
    ] = await Promise.all([
      Documento.count({ where: { estado: 'aprobado' } }),
      Capa.count({ where: { estado: { [Op.notIn]: ['cerrada', 'rechazada'] } } }),
      Riesgo.count({ where: { estado: 'activo', nivel_riesgo: { [Op.gte]: 17 } } }),
      Encuesta.count({ where: { estado: 'publicada', fecha_fin: { [Op.gte]: new Date() } } }),
      MedicionIndicador.count({ where: { cumplimiento: { [Op.lt]: 80 } } }),
      Hallazgo.count({ where: { estado: 'abierto' } }),
    ]);

    res.json({
      data: {
        documentos_activos: documentosActivos,
        capas_abiertas: capasAbiertas,
        riesgos_criticos: riesgosCriticos,
        encuestas_vigentes: encuestasVigentes,
        indicadores_bajo_meta: indicadoresBajoMeta,
        hallazgos_abiertos: hallazgosAbiertos,
      },
    });
  } catch (err) { next(err); }
};

exports.dashboardGraficos = async (req, res, next) => {
  try {
    // Indicadores - últimas 6 mediciones promedio
    const indicadoresTendencia = await MedicionIndicador.findAll({
      attributes: ['periodo', [sequelize.fn('AVG', sequelize.col('cumplimiento')), 'promedio_cumplimiento']],
      group: ['periodo'],
      order: [['periodo', 'DESC']],
      limit: 6,
    });

    // CAPAs por estado
    const capasPorEstado = await Capa.findAll({
      attributes: ['estado', [sequelize.fn('COUNT', sequelize.col('id')), 'cantidad']],
      group: ['estado'],
    });

    // Riesgos por nivel
    const riesgosPorNivel = await Riesgo.findAll({
      where: { estado: 'activo' },
      attributes: ['probabilidad', 'impacto', 'nivel_riesgo', [sequelize.fn('COUNT', sequelize.col('id')), 'cantidad']],
      group: ['probabilidad', 'impacto', 'nivel_riesgo'],
    });

    res.json({ data: { indicadoresTendencia: indicadoresTendencia.reverse(), capasPorEstado, riesgosPorNivel } });
  } catch (err) { next(err); }
};

// ── CONFIGURACIÓN ─────────────────────────────────────────────

exports.obtenerConfiguracion = async (req, res, next) => {
  try {
    const params = await ParametroSistema.findAll({ order: [['clave', 'ASC']] });
    const config = {};
    params.forEach(p => { config[p.clave] = p.valor; });
    res.json({ data: config });
  } catch (err) { next(err); }
};

exports.actualizarConfiguracion = async (req, res, next) => {
  try {
    const updates = req.body;
    for (const [clave, valor] of Object.entries(updates)) {
      await ParametroSistema.upsert({ clave, valor: String(valor), modificado_por: req.userId });
    }
    res.json({ data: { message: 'Configuración actualizada correctamente' } });
  } catch (err) { next(err); }
};
