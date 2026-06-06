'use strict';
const { Sequelize } = require('sequelize');
const logger = require('./logger');

const sequelize = new Sequelize({
  dialect: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'sgcunt',
  username: process.env.DB_USER || 'sgc_user',
  password: process.env.DB_PASSWORD || 'sgc_secure_pass_2024',
  schema: process.env.DB_SCHEMA || 'sgc',
  pool: {
    min: parseInt(process.env.DB_POOL_MIN || '2'),
    max: parseInt(process.env.DB_POOL_MAX || '10'),
    acquire: 30000,
    idle: 10000,
  },
  logging: (msg) => {
    if (process.env.NODE_ENV === 'development') logger.debug(msg);
  },
  define: {
    underscored: true,
    timestamps: true,
    createdAt: 'creado_en',
    updatedAt: 'modificado_en',
    schema: process.env.DB_SCHEMA || 'sgc',
  },
  dialectOptions: {
    ssl: process.env.DB_SSL === 'true' ? {
      require: true,
      rejectUnauthorized: false,
    } : false,
    application_name: 'sgc-unt-backend',
  },
  timezone: '-05:00', // America/Lima
});

module.exports = { sequelize };
