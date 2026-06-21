'use strict';
const { Op } = require('sequelize');
const { Capa, SeguimientoCapa, Hallazgo, Usuario, ArchivoAdjunto } = require('../models');
const { createError } = require('../middleware/errorHandler');
const pdfService = require('../services/pdfService');
const notifService = require('../services/notificacionService');
const n8nService = require('../services/n8nService');

const ESTADOS_VALIDOS = ['registrada','en_implementacion','implementada','verificada','cerrada','rechazada'];
const TRANSICIONES = {
  registrada: ['en_implementacion', 'rechazada'],
  en_implementacion: ['implementada', 'rechazada'],
  implementada: ['verificada'],
  verificada: ['cerrada', 'en_implementacion'],
  cerrada: [],
  rechazada: ['registrada'],
};

exports.listar = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, estado, tipo, responsable_id, vencidas, q } = req.query;
    const where = {};
    if (estado) where.estado = estado;
    if (tipo) where.tipo = tipo;
    if (responsable_id) where.responsable_id = responsable_id;
    if (vencidas === 'true') {
      where.estado = { [Op.notIn]: ['cerrada', 'rechazada'] };
      where.fecha_implementacion = { [Op.lt]: new Date() };
    }
    if (q) where[Op.or] = [
      { codigo: { [Op.iLike]: `%${q}%` } },
      { descripcion: { [Op.iLike]: `%${q}%` } },
    ];

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const { count, rows } = await Capa.findAndCountAll({
      where,
      include: [
        { model: Usuario, as: 'responsable', attributes: ['id', 'nombre', 'apellido', 'email'] },
        { model: Usuario, as: 'creador', attributes: ['id', 'nombre', 'apellido'] },
        { model: Hallazgo, as: 'hallazgo', attributes: ['id', 'codigo', 'tipo', 'gravedad'] },
      ],
      order: [['creado_en', 'DESC']],
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
    const capa = await Capa.findByPk(req.params.id, {
      include: [
        { model: Usuario, as: 'responsable', attributes: ['id', 'nombre', 'apellido', 'email'] },
        { model: Hallazgo, as: 'hallazgo' },
        { model: SeguimientoCapa, as: 'seguimientos',
          include: [{ model: Usuario, as: 'registrador', foreignKey: 'registrado_por', attributes: ['id','nombre','apellido'] }],
          order: [['creado_en', 'DESC']],
        },
      ],
    });
    if (!capa) return next(createError(404, 'CAPA no encontrada'));
    res.json({ data: capa });
  } catch (err) { next(err); }
};

exports.crear = async (req, res, next) => {
  try {
    const { codigo, tipo, hallazgo_id, descripcion, causa_raiz, accion_propuesta, responsable_id, fecha_implementacion, fecha_verificacion } = req.body;

    const existe = await Capa.findOne({ where: { codigo } });
    if (existe) return next(createError(409, 'El código CAPA ya existe'));

    const capa = await Capa.create({
      codigo, tipo, hallazgo_id, descripcion, causa_raiz, accion_propuesta,
      responsable_id, fecha_implementacion, fecha_verificacion,
      estado: 'registrada', creado_por: req.userId,
    });

    // Vincular hallazgo a esta CAPA y mover a en_tratamiento
    if (hallazgo_id) {
      await Hallazgo.update({ capa_id: capa.id, estado: 'en_tratamiento' }, { where: { id: hallazgo_id } });
    }

    // Notificar al responsable
    if (responsable_id) {
      await notifService.crear({
        usuario_id: responsable_id, tipo: 'info',
        titulo: `Nueva CAPA asignada: ${codigo}`,
        mensaje: `Se le ha asignado la CAPA ${codigo}: ${descripcion.substring(0, 100)}...`,
        modulo: 'capas', registro_id: capa.id,
      });
    }

    res.status(201).json({ data: capa });
  } catch (err) { next(err); }
};

exports.actualizar = async (req, res, next) => {
  try {
    const capa = await Capa.findByPk(req.params.id);
    if (!capa) return next(createError(404, 'CAPA no encontrada'));
    if (['cerrada', 'rechazada'].includes(capa.estado)) {
      return next(createError(400, 'No se puede modificar una CAPA cerrada o rechazada'));
    }

    req.datosAnteriores = capa.toJSON();
    await capa.update({ ...req.body, modificado_por: req.userId });
    res.json({ data: capa });
  } catch (err) { next(err); }
};

exports.cambiarEstado = async (req, res, next) => {
  try {
    const { nuevo_estado, comentario, efectividad } = req.body;
    const capa = await Capa.findByPk(req.params.id, {
      include: [{ model: Usuario, as: 'responsable', attributes: ['id', 'email', 'nombre'] }],
    });
    if (!capa) return next(createError(404, 'CAPA no encontrada'));

    if (nuevo_estado === 'rechazada') {
      if (!comentario || !comentario.trim()) {
        return next(createError(400, 'El comentario es obligatorio al rechazar una CAPA'));
      }
    }

    const permitidos = TRANSICIONES[capa.estado] || [];
    if (!permitidos.includes(nuevo_estado)) {
      return next(createError(400, `Transición no permitida: ${capa.estado} → ${nuevo_estado}`));
    }

    const updates = { estado: nuevo_estado, modificado_por: req.userId };
    if (nuevo_estado === 'cerrada' && efectividad) updates.efectividad = efectividad;

    await capa.update(updates);

    // Si no fue efectiva → crear CAPA derivada
    if (nuevo_estado === 'cerrada' && efectividad === 'no_efectiva') {
      const nuevoCodigo = `${capa.codigo}-D${Date.now().toString().slice(-4)}`;
      await Capa.create({
        codigo: nuevoCodigo,
        tipo: capa.tipo,
        hallazgo_id: capa.hallazgo_id,
        descripcion: `[DERIVADA de ${capa.codigo}] ${capa.descripcion}`,
        causa_raiz: capa.causa_raiz,
        accion_propuesta: 'Revisar y replantear acción correctiva. Ver CAPA origen.',
        responsable_id: capa.responsable_id,
        fecha_implementacion: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        estado: 'registrada',
        capa_origen_id: capa.id,
        creado_por: req.userId,
      });
    }

    // Registrar seguimiento automático
    await SeguimientoCapa.create({
      capa_id: capa.id,
      avance_porcentaje: nuevo_estado === 'cerrada' ? 100 : capa.avance || 0,
      observaciones: comentario || `Estado cambiado a ${nuevo_estado}`,
      estado_capa: nuevo_estado,
      registrado_por: req.userId,
    });

    // Cerrar hallazgo vinculado si CAPA se cierra
    if (nuevo_estado === 'cerrada' && capa.hallazgo_id) {
      await Hallazgo.update({ estado: 'cerrado' }, { where: { id: capa.hallazgo_id } });
    }

    res.json({ data: capa });
  } catch (err) { next(err); }
};

exports.agregarSeguimiento = async (req, res, next) => {
  try {
    const capa = await Capa.findByPk(req.params.id);
    if (!capa) return next(createError(404, 'CAPA no encontrada'));
    if (['cerrada', 'rechazada'].includes(capa.estado)) {
      return next(createError(400, 'No se puede agregar seguimiento a CAPA cerrada'));
    }

    const { avance_porcentaje, observaciones, archivo_id } = req.body;
    const seguimiento = await SeguimientoCapa.create({
      capa_id: capa.id, avance_porcentaje, observaciones,
      archivo_id, estado_capa: capa.estado, registrado_por: req.userId,
    });

    res.status(201).json({ data: seguimiento });
  } catch (err) { next(err); }
};

exports.reportePDF = async (req, res, next) => {
  try {
    const { estado, tipo } = req.query;
    const where = {};
    if (estado) where.estado = estado;
    if (tipo) where.tipo = tipo;

    const capas = await Capa.findAll({
      where,
      include: [
        { model: Usuario, as: 'responsable', attributes: ['nombre', 'apellido'] },
        { model: SeguimientoCapa, as: 'seguimientos', order: [['creado_en', 'DESC']], limit: 3 },
      ],
      order: [['creado_en', 'DESC']],
      limit: 50,
    });

    const html = `
      <h2>Reporte de CAPAs</h2>
      <table>
        <thead><tr>
          <th>Código</th><th>Tipo</th><th>Descripción</th><th>Responsable</th>
          <th>Fecha Impl.</th><th>Estado</th><th>Efectividad</th>
        </tr></thead>
        <tbody>
          ${capas.map(c => `
            <tr>
              <td>${c.codigo}</td>
              <td>${c.tipo}</td>
              <td style="max-width:200px">${c.descripcion.substring(0, 80)}...</td>
              <td>${c.responsable ? c.responsable.nombre + ' ' + c.responsable.apellido : '-'}</td>
              <td>${c.fecha_implementacion}</td>
              <td>${c.estado}</td>
              <td>${c.efectividad || '-'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;

    const pdf = await pdfService.generar({ titulo: 'Acciones Correctivas y Preventivas (CAPA)', contenido: html, modulo: 'capas' });
    res.set({ 'Content-Type': 'application/pdf', 'Content-Disposition': 'attachment; filename="capas.pdf"' });
    res.send(pdf);
  } catch (err) { next(err); }
};

exports.eliminar = async (req, res, next) => {
  try {
    const capa = await Capa.findByPk(req.params.id);
    if (!capa) return next(createError(404, 'CAPA no encontrada'));

    const seguimientosCount = await SeguimientoCapa.count({ where: { capa_id: capa.id } });
    if (seguimientosCount > 0) {
      return next(createError(400, 'No se puede eliminar una CAPA que tiene seguimientos registrados'));
    }

    await Hallazgo.update({ capa_id: null, estado: 'abierto' }, { where: { capa_id: capa.id } });
    await capa.destroy();
    res.json({ message: 'CAPA eliminada exitosamente' });
  } catch (err) { next(err); }
};
