'use strict';
const jwt = require('jsonwebtoken');
const { redisClient, RedisKeys } = require('../config/redis');
const { Usuario } = require('../models');
const logger = require('../config/logger');

/**
 * Middleware de autenticación JWT
 */
async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: { code: 'UNAUTHORIZED', message: 'Token de acceso requerido' },
      });
    }

    const token = authHeader.split(' ')[1];

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      const msg = err.name === 'TokenExpiredError' ? 'Token expirado' : 'Token inválido';
      return res.status(401).json({ error: { code: 'TOKEN_INVALID', message: msg } });
    }

    // Verificar que el usuario existe y está activo
    const user = await Usuario.findByPk(decoded.sub, {
      attributes: ['id', 'nombre', 'apellido', 'email', 'rol', 'activo', 'facultad', 'escuela'],
    });

    if (!user || !user.activo) {
      return res.status(401).json({
        error: { code: 'USER_INACTIVE', message: 'Usuario inactivo o no encontrado' },
      });
    }

    req.user = user;
    req.userId = user.id;
    next();
  } catch (err) {
    logger.error('Auth middleware error:', err);
    next(err);
  }
}

/**
 * Middleware opcional: autentica si hay token, continúa sin error si no hay
 */
async function authenticateOptional(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }
  return authenticate(req, res, next);
}

module.exports = { authenticate, authenticateOptional };
