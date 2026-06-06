'use strict';
const logger = require('../config/logger');

function errorHandler(err, req, res, next) {
  logger.error({
    message: err.message,
    stack: err.stack,
    method: req.method,
    url: req.url,
    user: req.userId,
    ip: req.ip,
  });

  // Errores de validación Sequelize
  if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
    const errors = err.errors?.map(e => ({ field: e.path, message: e.message })) || [];
    return res.status(422).json({
      error: { code: 'VALIDATION_ERROR', message: 'Error de validación', details: errors },
    });
  }

  if (err.name === 'SequelizeForeignKeyConstraintError') {
    return res.status(409).json({
      error: { code: 'CONSTRAINT_ERROR', message: 'Referencia a registro inexistente o con dependencias' },
    });
  }

  // Errores de CORS
  if (err.message && err.message.startsWith('CORS')) {
    return res.status(403).json({ error: { code: 'CORS_ERROR', message: err.message } });
  }

  // Error JWT (debería ser manejado por auth middleware, pero por si acaso)
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Token inválido' } });
  }

  // Multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: { code: 'FILE_TOO_LARGE', message: 'El archivo supera el límite permitido' } });
  }

  // Errores de aplicación con statusCode
  if (err.statusCode) {
    return res.status(err.statusCode).json({
      error: { code: err.code || 'APP_ERROR', message: err.message },
    });
  }

  // Error genérico 500
  const isDev = process.env.NODE_ENV === 'development';
  res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Error interno del servidor',
      ...(isDev && { detail: err.message, stack: err.stack }),
    },
  });
}

/**
 * Helper para crear errores de aplicación
 */
function createError(statusCode, message, code) {
  const err = new Error(message);
  err.statusCode = statusCode;
  err.code = code || 'APP_ERROR';
  return err;
}

module.exports = errorHandler;
module.exports.createError = createError;
