'use strict';
const logger = require('../config/logger');
const { AuditoriaLog } = require('../models');

/**
 * Middleware de logging de request
 */
function requestLogger(req, res, next) {
  req.startTime = Date.now();
  const originalJson = res.json.bind(res);

  res.json = function (data) {
    const duration = Date.now() - req.startTime;
    logger.http(`${req.method} ${req.path} ${res.statusCode} ${duration}ms user:${req.userId || 'anon'}`);
    return originalJson(data);
  };

  next();
}

/**
 * Middleware de auditoría automática para escrituras
 * @param {string} tabla - Nombre de la tabla
 * @param {string} accion - CREATE | UPDATE | DELETE
 */
function auditMiddleware(tabla, accion) {
  return async (req, res, next) => {
    const originalJson = res.json.bind(res);

    res.json = async function (data) {
      // Solo auditar respuestas exitosas
      if (res.statusCode >= 200 && res.statusCode < 300 && req.userId) {
        try {
          const registroId = data?.data?.id || req.params?.id || null;
          await AuditoriaLog.create({
            tabla,
            registro_id: registroId,
            accion,
            datos_anteriores: accion === 'UPDATE' || accion === 'DELETE' ? req.datosAnteriores : null,
            datos_nuevos: accion !== 'DELETE' ? data?.data : null,
            usuario_id: req.userId,
            ip: req.ip,
            user_agent: req.headers['user-agent'],
          });
        } catch (err) {
          logger.error('Error en auditoría:', err.message);
        }
      }
      return originalJson(data);
    };

    next();
  };
}

module.exports = requestLogger;
module.exports.auditMiddleware = auditMiddleware;
