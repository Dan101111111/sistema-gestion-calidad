'use strict';
const rateLimit = require('express-rate-limit');

const global = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'),
  max: parseInt(process.env.RATE_LIMIT_MAX || '100'),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { code: 'RATE_LIMIT', message: 'Demasiadas solicitudes. Intente más tarde.' } },
  skip: (req) => req.path === '/api/v1/health',
});

const auth = rateLimit({
  windowMs: 60000,
  max: parseInt(process.env.AUTH_RATE_LIMIT_MAX || '10'),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { code: 'RATE_LIMIT_AUTH', message: 'Demasiados intentos de autenticación.' } },
});

const upload = rateLimit({
  windowMs: 60000,
  max: 20,
  message: { error: { code: 'RATE_LIMIT_UPLOAD', message: 'Límite de cargas alcanzado.' } },
});

module.exports = { global, auth, upload };
