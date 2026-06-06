'use strict';
const { Op, fn, col } = require('sequelize');
const { Indicador, MedicionIndicador, Proceso, EstandarAcreditacion, Usuario } = require('../models');
const { createError } = require('../middleware/errorHandler');
const pdfService = require('../services/pdfService');
const n8nService = require('../services/n8nService');
const notifService = require('../services/notificacionService');

exports.listar = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, tipo, proceso_id, activo, q } = req.query;
    const where = {};
    if (tipo) where.tipo = tipo;
    if (proceso_id) where.proceso_id = proceso_id;
    if (activo !== undefined) where.activo = activo === 'true';
    if (q) where[Op.or] = [
      { codigo: { [Op.iLike]: `%${q}%` } },
      { nombre: { [Op.iLike]: `%${q}%` } },
    ];

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const { count, rows } = await Indicador.findAndCountAll({
      where,
      include: [
        { model: Proceso, as: 'proceso', attributes: ['id', 'codigo', 'nombre'] },
        {
          model: MedicionIndicador, as: 'mediciones',
          order: [['creado_en', 'DESC']], limit: 1,
          attributes: ['periodo', 'valor_real', 'valor_esperado', 'cumplimiento'],
        },
      ],
      order: [['codigo', 'ASC']],
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
    const ind = await Indicador.findByPk(req.params.id, {
      include: [
        { model: Proceso, as: 'proceso' },
        { model: EstandarAcreditacion, as: 'estandar', attributes: ['id', 'codigo', 'nombre'] },
        { model: MedicionIndicador, as: 'mediciones', order: [['periodo', 'ASC']] },
      ],
    });
    if (!ind) return next(createError(404, 'Indicador no encontrado'));
    res.json({ data: ind });
  } catch (err) { next(err); }
};

exports.crear = async (req, res, next) => {
  try {
    const existe = await Indicador.findOne({ where: { codigo: req.body.codigo } });
    if (existe) return next(createError(409, 'El código de indicador ya existe'));

    const ind = await Indicador.create({ ...req.body, creado_por: req.userId });
    res.status(201).json({ data: ind });
  } catch (err) { next(err); }
};

exports.actualizar = async (req, res, next) => {
  try {
    const ind = await Indicador.findByPk(req.params.id);
    if (!ind) return next(createError(404, 'Indicador no encontrado'));
    req.datosAnteriores = ind.toJSON();
    await ind.update({ ...req.body });
    res.json({ data: ind });
  } catch (err) { next(err); }
};

exports.registrarMedicion = async (req, res, next) => {
  try {
    const ind = await Indicador.findByPk(req.params.id);
    if (!ind) return next(createError(404, 'Indicador no encontrado'));

    const { periodo, valor_real, valor_esperado, observaciones } = req.body;
    const existe = await MedicionIndicador.findOne({ where: { indicador_id: ind.id, periodo } });
    if (existe) return next(createError(409, `Ya existe medición para el periodo ${periodo}`));

    const medicion = await MedicionIndicador.create({
      indicador_id: ind.id, periodo, valor_real,
      valor_esperado: valor_esperado || ind.meta, observaciones, registrado_por: req.userId,
    });

    const umbral = parseInt(process.env.UMBRAL_CUMPLIMIENTO || '80');
    if (medicion.cumplimiento < umbral) {
      await n8nService.trigger('indicador-bajo-meta', {
        indicadorId: ind.id, codigo: ind.codigo, nombre: ind.nombre,
        cumplimiento: medicion.cumplimiento, meta: ind.meta, periodo,
      });
      await notifService.crearParaRol('gestor_calidad', {
        tipo: 'alerta',
        titulo: `📉 Indicador bajo meta: ${ind.codigo}`,
        mensaje: `El indicador "${ind.nombre}" tiene ${medicion.cumplimiento}% de cumplimiento en ${periodo} (meta: ${ind.meta} ${ind.unidad})`,
        modulo: 'indicadores', registro_id: ind.id,
      });
    }

    res.status(201).json({ data: medicion });
  } catch (err) { next(err); }
};

exports.tendencias = async (req, res, next) => {
  try {
    const ind = await Indicador.findByPk(req.params.id);
    if (!ind) return next(createError(404, 'Indicador no encontrado'));

    const mediciones = await MedicionIndicador.findAll({
      where: { indicador_id: ind.id },
      order: [['periodo', 'ASC']],
      attributes: ['periodo', 'valor_real', 'valor_esperado', 'cumplimiento', 'creado_en'],
    });

    // Análisis de tendencia
    let tendencia = 'estable';
    if (mediciones.length >= 3) {
      const ultimas = mediciones.slice(-3).map(m => parseFloat(m.cumplimiento));
      if (ultimas[2] > ultimas[0]) tendencia = 'creciente';
      else if (ultimas[2] < ultimas[0]) tendencia = 'decreciente';
    }

    const promedio = mediciones.length > 0
      ? mediciones.reduce((acc, m) => acc + parseFloat(m.cumplimiento), 0) / mediciones.length
      : 0;

    res.json({
      data: {
        indicador: { id: ind.id, codigo: ind.codigo, nombre: ind.nombre, meta: ind.meta, unidad: ind.unidad },
        mediciones,
        analisis: { tendencia, promedio: promedio.toFixed(2), totalMediciones: mediciones.length },
      },
    });
  } catch (err) { next(err); }
};

exports.reportePDF = async (req, res, next) => {
  try {
    const indicadores = await Indicador.findAll({
      where: { activo: true },
      include: [
        { model: MedicionIndicador, as: 'mediciones', order: [['periodo', 'DESC']], limit: 1 },
      ],
      order: [['codigo', 'ASC']],
      limit: 50,
    });

    const cumplColor = (c) => c >= 100 ? '#27AE60' : c >= 80 ? '#F7B731' : '#C8102E';

    const html = `
      <h2>Reporte de Indicadores de Gestión</h2>
      <table>
        <thead><tr>
          <th>Código</th><th>Nombre</th><th>Tipo</th><th>Meta</th>
          <th>Último Período</th><th>Valor Real</th><th>Cumplimiento %</th>
        </tr></thead>
        <tbody>
          ${indicadores.map(i => {
            const ult = i.mediciones?.[0];
            return `
              <tr>
                <td>${i.codigo}</td>
                <td>${i.nombre}</td>
                <td>${i.tipo}</td>
                <td>${i.meta} ${i.unidad || ''}</td>
                <td>${ult?.periodo || '-'}</td>
                <td>${ult?.valor_real || '-'}</td>
                <td style="background:${ult ? cumplColor(ult.cumplimiento) : '#ccc'};color:white;text-align:center;font-weight:bold">
                  ${ult ? ult.cumplimiento + '%' : '-'}
                </td>
              </tr>`;
          }).join('')}
        </tbody>
      </table>
    `;

    const pdf = await pdfService.generar({ titulo: 'Indicadores de Gestión', contenido: html, modulo: 'indicadores' });
    res.set({ 'Content-Type': 'application/pdf', 'Content-Disposition': 'attachment; filename="indicadores.pdf"' });
    res.send(pdf);
  } catch (err) { next(err); }
};
