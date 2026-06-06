'use strict';
const Redis = require('ioredis');
const logger = require('./logger');

const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD || undefined,
  db: parseInt(process.env.REDIS_DB || '0'),
  retryStrategy: (times) => {
    if (times > 10) {
      logger.error('Redis: máximo de reintentos alcanzado');
      return null;
    }
    return Math.min(times * 100, 3000);
  },
  enableOfflineQueue: true,
  lazyConnect: false,
};

const redisClient = new Redis(redisConfig);

redisClient.on('connect', () => logger.info('Redis: conectado'));
redisClient.on('error', (err) => logger.error('Redis error:', err.message));
redisClient.on('reconnecting', () => logger.warn('Redis: reconectando...'));

// Helpers
const RedisKeys = {
  refreshToken: (token) => `rt:${token}`,
  userSession: (userId) => `sess:${userId}`,
  loginAttempts: (email) => `login:attempts:${email}`,
  accountLock: (email) => `login:lock:${email}`,
  passwordReset: (token) => `pwd:reset:${token}`,
  rateLimit: (key) => `rl:${key}`,
  cache: (key) => `cache:${key}`,
  notification: (userId) => `notif:${userId}`,
};

const TTL = {
  REFRESH_TOKEN: 7 * 24 * 60 * 60,       // 7 días
  PASSWORD_RESET: 60 * 60,                 // 1 hora
  ACCOUNT_LOCK: 15 * 60,                   // 15 minutos
  CACHE_SHORT: 5 * 60,                     // 5 minutos
  CACHE_MEDIUM: 30 * 60,                   // 30 minutos
  CACHE_LONG: 24 * 60 * 60,               // 24 horas
};

module.exports = { redisClient, RedisKeys, TTL };
