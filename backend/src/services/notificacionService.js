'use strict';
// ============================================================
// SERVICIO: Notificaciones internas
// ============================================================
const { Notificacion, Usuario } = require('../models');
const { Op } = require('sequelize');
const logger = require('../config/logger');

const notificacionService = {
  async crear({ usuario_id, tipo, titulo, mensaje, modulo, registro_id }) {
    try {
      return await Notificacion.create({ usuario_id, tipo, titulo, mensaje, modulo, registro_id });
    } catch (err) {
      logger.error('Error creando notificación:', err.message);
    }
  },

  async crearMultiples(usuarios_ids, datos) {
    try {
      const inserts = usuarios_ids.map(uid => ({ ...datos, usuario_id: uid }));
      return await Notificacion.bulkCreate(inserts);
    } catch (err) {
      logger.error('Error creando notificaciones masivas:', err.message);
    }
  },

  async crearParaRol(rol, datos) {
    try {
      const usuarios = await Usuario.findAll({ where: { rol, activo: true }, attributes: ['id'] });
      const ids = usuarios.map(u => u.id);
      if (ids.length) await notificacionService.crearMultiples(ids, datos);
    } catch (err) {
      logger.error('Error creando notificación para rol:', err.message);
    }
  },
};

module.exports = notificacionService;
