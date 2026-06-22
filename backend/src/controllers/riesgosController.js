'use strict';
const { Op } = require('sequelize');
const { Riesgo, PlanMitigacion, Usuario, Proceso } = require('../models');
const { createError } = require('../middleware/errorHandler');
const pdfService = require('../services/pdfService');
const n8nService = require('../services/n8nService');
const notifService = require('../services/notificacionService');

exports.listar = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, estado, tipo, proceso_id, nivel_min, q } = req.query;
    const where = {};
    if (estado) where.estado = estado;
    if (tipo) where.tipo = tipo;
    if (proceso_id) where.proceso_id = proceso_id;
    if (nivel_min) where.nivel_riesgo = { [Op.gte]: parseInt(nivel_min) };
    if (q) where[Op.or] = [
      { codigo: { [Op.iLike]: `%${q}%` } },
      { nombre: { [Op.iLike]: `%${q}%` } },
    ];

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const { count, rows } = await Riesgo.findAndCountAll({
      where,
      include: [
        { model: Usuario, as: 'responsable', attributes: ['id', 'nombre', 'apellido'] },
        { model: Proceso, as: 'proceso', attributes: ['id', 'codigo', 'nombre'] },
      ],
      order: [['nivel_riesgo', 'DESC']],
      limit: parseInt(limit),
      offset,
    });

    res.json({
      data: rows,
      meta: { total: count, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(count / parseInt(limit)) },
    });
  } catch (err) { next(err); }
};

exports.obtener = async (req, res, next) => {
  try {
    const riesgo = await Riesgo.findByPk(req.params.id, {
      include: [
        { model: Usuario, as: 'responsable', attributes: ['id', 'nombre', 'apellido', 'email'] },
        { model: Proceso, as: 'proceso' },
        { model: PlanMitigacion, as: 'planes_mitigacion',
          include: [{ model: Usuario, as: 'responsable', attributes: ['id','nombre','apellido'] }] },
      ],
    });
    if (!riesgo) return next(createError(404, 'Riesgo no encontrado'));
    res.json({ data: riesgo });
  } catch (err) { next(err); }
};

exports.crear = async (req, res, next) => {
  try {
    const { codigo, nombre, descripcion, tipo, proceso_id, probabilidad, impacto, responsable_id } = req.body;

    const existe = await Riesgo.findOne({ where: { codigo } });
    if (existe) return next(createError(409, 'El código de riesgo ya existe'));

    const camposGuardar = ['codigo', 'nombre', 'descripcion', 'tipo', 'proceso_id', 'probabilidad', 'impacto', 'responsable_id', 'estado', 'creado_por'];
    const riesgo = await Riesgo.create({
      codigo, nombre, descripcion, tipo, proceso_id, probabilidad, impacto,
      responsable_id, estado: 'activo', creado_por: req.userId,
    }, { fields: camposGuardar });

    // Recargar para obtener el nivel_riesgo generado por PostgreSQL
    await riesgo.reload();

    // Alerta si nivel crítico (>= 17)
    if (riesgo.nivel_riesgo >= 17) {
      await n8nService.trigger('riesgo-critico', {
        riesgoId: riesgo.id, codigo, nombre, nivel: riesgo.nivel_riesgo,
        probabilidad, impacto,
      });
      await notifService.crearParaRol('gestor_calidad', {
        tipo: 'alerta',
        titulo: `⚠️ Riesgo Crítico: ${codigo}`,
        mensaje: `Se registró un riesgo crítico: "${nombre}" con nivel ${riesgo.nivel_riesgo} (P:${probabilidad} × I:${impacto})`,
        modulo: 'riesgos', registro_id: riesgo.id,
      });
    }

    res.status(201).json({ data: riesgo });
  } catch (err) { next(err); }
};

exports.actualizar = async (req, res, next) => {
  try {
    const riesgo = await Riesgo.findByPk(req.params.id);
    if (!riesgo) return next(createError(404, 'Riesgo no encontrado'));

    req.datosAnteriores = riesgo.toJSON();
    const { codigo, nombre, descripcion, tipo, proceso_id, probabilidad, impacto, responsable_id, estado } = req.body;
    await riesgo.update(
      { codigo, nombre, descripcion, tipo, proceso_id, probabilidad, impacto, responsable_id, estado, modificado_por: req.userId },
      { fields: ['codigo', 'nombre', 'descripcion', 'tipo', 'proceso_id', 'probabilidad', 'impacto', 'responsable_id', 'estado', 'modificado_por'] }
    );

    await riesgo.reload();

    if (riesgo.nivel_riesgo >= 17) {
      await n8nService.trigger('riesgo-critico', { riesgoId: riesgo.id, nivel: riesgo.nivel_riesgo });
    }

    res.json({ data: riesgo });
  } catch (err) { next(err); }
};

exports.eliminar = async (req, res, next) => {
  try {
    const riesgo = await Riesgo.findByPk(req.params.id);
    if (!riesgo) return next(createError(404, 'Riesgo no encontrado'));
    req.datosAnteriores = riesgo.toJSON();
    await riesgo.destroy();
    res.json({ data: { message: 'Riesgo eliminado' } });
  } catch (err) { next(err); }
};

exports.matrizCalor = async (req, res, next) => {
  try {
    const riesgos = await Riesgo.findAll({
      where: { estado: 'activo' },
      attributes: ['id', 'codigo', 'nombre', 'probabilidad', 'impacto', 'nivel_riesgo', 'tipo'],
    });

    // Construir matriz 5x5
    const matriz = {};
    for (let p = 1; p <= 5; p++) {
      for (let i = 1; i <= 5; i++) {
        matriz[`${p}_${i}`] = { probabilidad: p, impacto: i, nivel: p * i, riesgos: [] };
      }
    }
    riesgos.forEach(r => {
      const key = `${r.probabilidad}_${r.impacto}`;
      if (matriz[key]) matriz[key].riesgos.push({ id: r.id, codigo: r.codigo, nombre: r.nombre });
    });

    res.json({ data: Object.values(matriz) });
  } catch (err) { next(err); }
};

exports.ranking = async (req, res, next) => {
  try {
    const riesgos = await Riesgo.findAll({
      where: { estado: 'activo' },
      include: [{ model: Usuario, as: 'responsable', attributes: ['id','nombre','apellido'] }],
      order: [['nivel_riesgo', 'DESC']],
      limit: 10,
    });
    res.json({ data: riesgos });
  } catch (err) { next(err); }
};

exports.agregarMitigacion = async (req, res, next) => {
  try {
    const riesgo = await Riesgo.findByPk(req.params.id);
    if (!riesgo) return next(createError(404, 'Riesgo no encontrado'));

    const plan = await PlanMitigacion.create({
      ...req.body, riesgo_id: riesgo.id, creado_por: req.userId,
    });
    res.status(201).json({ data: plan });
  } catch (err) { next(err); }
};

exports.reportePDF = async (req, res, next) => {
  try {
    const riesgos = await Riesgo.findAll({
      where: { estado: 'activo' },
      include: [{ model: Usuario, as: 'responsable', attributes: ['nombre', 'apellido'] }],
      order: [['nivel_riesgo', 'DESC']],
      limit: 50,
    });

    const nivelColor = (n) => n >= 17 ? '#C8102E' : n >= 10 ? '#FF6B00' : n >= 5 ? '#F7B731' : '#27AE60';

    const html = `
      <h2>Registro de Riesgos</h2>
      <table>
        <thead><tr>
          <th>Código</th><th>Nombre</th><th>Tipo</th>
          <th>P</th><th>I</th><th style="text-align:center">Nivel</th>
          <th>Estado</th><th>Responsable</th>
        </tr></thead>
        <tbody>
          ${riesgos.map(r => `
            <tr>
              <td>${r.codigo}</td>
              <td>${r.nombre}</td>
              <td>${r.tipo}</td>
              <td style="text-align:center">${r.probabilidad}</td>
              <td style="text-align:center">${r.impacto}</td>
              <td style="text-align:center;background:${nivelColor(r.nivel_riesgo)};color:white;font-weight:bold">
                ${r.nivel_riesgo}
              </td>
              <td>${r.estado}</td>
              <td>${r.responsable ? r.responsable.nombre + ' ' + r.responsable.apellido : '-'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      <br>
      <h3>Leyenda de Nivel de Riesgo</h3>
      <table style="width:300px">
        <tr><td style="background:#27AE60;color:white;padding:6px">1-4</td><td style="padding:6px">Bajo</td></tr>
        <tr><td style="background:#F7B731;color:white;padding:6px">5-9</td><td style="padding:6px">Medio</td></tr>
        <tr><td style="background:#FF6B00;color:white;padding:6px">10-16</td><td style="padding:6px">Alto</td></tr>
        <tr><td style="background:#C8102E;color:white;padding:6px">17-25</td><td style="padding:6px">Crítico</td></tr>
      </table>
    `;

    const pdf = await pdfService.generar({ titulo: 'Gestión de Riesgos — Matriz', contenido: html, modulo: 'riesgos' });
    res.set({ 'Content-Type': 'application/pdf', 'Content-Disposition': 'attachment; filename="riesgos.pdf"' });
    res.send(pdf);
  } catch (err) { next(err); }
};
