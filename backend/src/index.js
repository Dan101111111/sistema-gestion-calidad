'use strict';
require('dotenv').config();

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const compression = require('compression');
const cookieParser = require('cookie-parser');

const { sequelize } = require('./models');
const { redisClient } = require('./config/redis');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');
const requestLogger = require('./middleware/requestLogger');
const rateLimitMiddleware = require('./middleware/rateLimit');
const logger = require('./config/logger');

const app = express();
const PORT = process.env.PORT || 3001;

// ── Trust proxy (para Docker/Nginx) ──────────────────────────
app.set('trust proxy', 1);

// ── Seguridad: Helmet ─────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc:  ["'self'"],
      styleSrc:   ["'self'", "'unsafe-inline'"],
      imgSrc:     ["'self'", 'data:', 'blob:'],
      connectSrc: ["'self'"],
      fontSrc:    ["'self'"],
      objectSrc:  ["'none'"],
      frameSrc:   ["'none'"],
    },
  },
  hsts:           { maxAge: 31536000, includeSubDomains: true, preload: true },
  noSniff:        true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
}));

// ── CORS ──────────────────────────────────────────────────────
const corsOptions = {
  origin: (origin, callback) => {
    const allowed = (process.env.CORS_ORIGINS || 'http://localhost:3000')
      .split(',').map(o => o.trim());
    if (!origin || allowed.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: Origin ${origin} no permitido`));
    }
  },
  methods:          ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders:   ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials:      true,
  maxAge:           86400,
};
app.use(cors(corsOptions));


// ── Parsers ───────────────────────────────────────────────────
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser()); // Necesario para leer refresh token de cookie httpOnly

// ── Logging HTTP ──────────────────────────────────────────────
app.use(morgan('combined', {
  stream: { write: (msg) => logger.http(msg.trim()) },
  skip:   (req) => req.url === '/api/v1/health',
}));
app.use(requestLogger);

// ── Rate limiting global ──────────────────────────────────────
app.use('/api/', rateLimitMiddleware.global);

// ── Rutas ─────────────────────────────────────────────────────
app.use('/api/v1', routes);

// ── Health check ──────────────────────────────────────────────
app.get('/api/v1/health', async (req, res) => {
  try {
    await sequelize.authenticate();
    await redisClient.ping();
    res.json({
      status:    'ok',
      timestamp: new Date().toISOString(),
      version:   '2.0.0',
      services:  { database: 'ok', redis: 'ok' },
    });
  } catch (err) {
    logger.error('Health check failed:', err);
    res.status(503).json({ status: 'error', message: err.message });
  }
});

// ── 404 ───────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    error: { code: 'NOT_FOUND', message: `Ruta ${req.method} ${req.path} no encontrada` },
  });
});

// ── Error handler global ──────────────────────────────────────
app.use(errorHandler);

// ── Iniciar servidor ──────────────────────────────────────────
async function startServer() {
  try {
    await sequelize.authenticate();
    logger.info('✅ PostgreSQL conectado');

    await redisClient.ping();
    logger.info('✅ Redis conectado');

    const server = app.listen(PORT, '0.0.0.0', () => {
      logger.info(`🚀 SGC-UNT Backend corriendo en puerto ${PORT}`);
      logger.info(`📚 Ambiente: ${process.env.NODE_ENV}`);
    });

    const shutdown = async (signal) => {
      logger.info(`${signal} recibido. Cerrando servidor...`);
      server.close(async () => {
        await sequelize.close();
        await redisClient.quit();
        logger.info('Servidor cerrado limpiamente');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT',  () => shutdown('SIGINT'));

  } catch (error) {
    logger.error('Error al iniciar el servidor:', error);
    process.exit(1);
  }
}

startServer();
module.exports = app;
