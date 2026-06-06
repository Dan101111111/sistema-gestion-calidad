'use strict';
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { Op } = require('sequelize');
const { Usuario, Sesion, AuditoriaLog } = require('../models');
const { redisClient, RedisKeys, TTL } = require('../config/redis');
const { sendMail, getBaseTemplate } = require('../config/mail');
const { createError } = require('../middleware/errorHandler');
const logger = require('../config/logger');

const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS || '12');
const MAX_ATTEMPTS = parseInt(process.env.MAX_LOGIN_ATTEMPTS || '5');
const LOCK_DURATION = parseInt(process.env.ACCOUNT_LOCK_DURATION || '900'); // 15 min

// ── Helpers ────────────────────────────────────────────────

function generateAccessToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email, rol: user.rol },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
  );
}

async function generateRefreshToken(userId, ip, userAgent) {
  const token = crypto.randomBytes(64).toString('hex');
  const expira_en = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await Sesion.create({ usuario_id: userId, refresh_token: token, ip, user_agent: userAgent, expira_en });
  await redisClient.setex(RedisKeys.refreshToken(token), TTL.REFRESH_TOKEN, userId);

  return { token, expira_en };
}

async function logAudit(accion, userId, ip, userAgent, datos = {}) {
  try {
    await AuditoriaLog.create({
      tabla: 'usuarios', registro_id: userId, accion,
      datos_nuevos: datos, usuario_id: userId, ip, user_agent: userAgent,
    });
  } catch (e) { logger.error('Audit log error:', e.message); }
}

// ── Controllers ────────────────────────────────────────────

exports.login = async (req, res, next) => {
  const { email, password } = req.body;
  const ip = req.ip;
  const userAgent = req.headers['user-agent'];

  try {
    // Verificar bloqueo por Redis
    const locked = await redisClient.get(RedisKeys.accountLock(email));
    if (locked) {
      return res.status(429).json({
        error: { code: 'ACCOUNT_LOCKED', message: 'Cuenta bloqueada temporalmente por intentos fallidos. Intente en 15 minutos.' },
      });
    }

    const user = await Usuario.findOne({ where: { email: email.toLowerCase() } });

    if (!user) {
      await redisClient.incr(RedisKeys.loginAttempts(email));
      await redisClient.expire(RedisKeys.loginAttempts(email), LOCK_DURATION);
      return res.status(401).json({ error: { code: 'INVALID_CREDENTIALS', message: 'Credenciales inválidas' } });
    }

    if (!user.activo) {
      return res.status(403).json({ error: { code: 'ACCOUNT_INACTIVE', message: 'Cuenta desactivada' } });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      const attempts = await redisClient.incr(RedisKeys.loginAttempts(email));
      await redisClient.expire(RedisKeys.loginAttempts(email), LOCK_DURATION);

      if (parseInt(attempts) >= MAX_ATTEMPTS) {
        await redisClient.setex(RedisKeys.accountLock(email), LOCK_DURATION, '1');
        await redisClient.del(RedisKeys.loginAttempts(email));
        logger.warn(`Cuenta bloqueada: ${email} tras ${MAX_ATTEMPTS} intentos`);
        return res.status(429).json({
          error: { code: 'ACCOUNT_LOCKED', message: 'Cuenta bloqueada por 15 minutos' },
        });
      }

      return res.status(401).json({
        error: { code: 'INVALID_CREDENTIALS', message: `Credenciales inválidas. Intentos restantes: ${MAX_ATTEMPTS - attempts}` },
      });
    }

    // Login exitoso: limpiar intentos
    await redisClient.del(RedisKeys.loginAttempts(email));

    // Actualizar último acceso
    await user.update({ ultimo_acceso: new Date(), intentos_fallidos: 0 });

    const accessToken = generateAccessToken(user);
    const { token: refreshToken, expira_en } = await generateRefreshToken(user.id, ip, userAgent);

    // Cookie httpOnly para refresh token
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/api/v1/auth',
    });

    await logAudit('LOGIN', user.id, ip, userAgent, { email: user.email, rol: user.rol });

    res.json({
      data: {
        accessToken,
        expiresIn: 900,
        user: {
          id: user.id, nombre: user.nombre, apellido: user.apellido,
          email: user.email, rol: user.rol, facultad: user.facultad, escuela: user.escuela,
        },
      },
    });
  } catch (err) { next(err); }
};

exports.refresh = async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken || req.body?.refreshToken;
    if (!token) return res.status(401).json({ error: { code: 'NO_REFRESH_TOKEN', message: 'Refresh token requerido' } });

    // Verificar en Redis
    const userId = await redisClient.get(RedisKeys.refreshToken(token));
    if (!userId) return res.status(401).json({ error: { code: 'REFRESH_INVALID', message: 'Refresh token inválido o expirado' } });

    // Verificar en BD
    const sesion = await Sesion.findOne({ where: { refresh_token: token, activo: true } });
    if (!sesion || new Date(sesion.expira_en) < new Date()) {
      await redisClient.del(RedisKeys.refreshToken(token));
      return res.status(401).json({ error: { code: 'REFRESH_EXPIRED', message: 'Sesión expirada' } });
    }

    const user = await Usuario.findByPk(userId, { attributes: ['id','nombre','apellido','email','rol','activo','facultad','escuela'] });
    if (!user || !user.activo) return res.status(401).json({ error: { code: 'USER_INACTIVE', message: 'Usuario inactivo' } });

    const accessToken = generateAccessToken(user);
    res.json({ data: { accessToken, expiresIn: 900 } });
  } catch (err) { next(err); }
};

exports.logout = async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken || req.body?.refreshToken;
    if (token) {
      await redisClient.del(RedisKeys.refreshToken(token));
      await Sesion.update({ activo: false }, { where: { refresh_token: token } });
    }
    res.clearCookie('refreshToken', { path: '/api/v1/auth' });
    await logAudit('LOGOUT', req.userId, req.ip, req.headers['user-agent']);
    res.json({ data: { message: 'Sesión cerrada correctamente' } });
  } catch (err) { next(err); }
};

exports.me = async (req, res, next) => {
  try {
    const user = await Usuario.findByPk(req.userId, {
      attributes: { exclude: ['password_hash', 'token_recuperacion', 'token_exp_recuperacion'] },
    });
    if (!user) return next(createError(404, 'Usuario no encontrado'));
    res.json({ data: user });
  } catch (err) { next(err); }
};

exports.recuperarPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await Usuario.findOne({ where: { email: email.toLowerCase(), activo: true } });

    // Respuesta genérica para no revelar existencia
    const genericMsg = { data: { message: 'Si el correo existe, recibirá instrucciones de recuperación.' } };
    if (!user) return res.json(genericMsg);

    // Generar token HMAC
    const rawToken = crypto.randomBytes(32).toString('hex');
    const hmac = crypto.createHmac('sha256', process.env.HMAC_SECRET || 'fallback');
    hmac.update(rawToken);
    const tokenHash = hmac.digest('hex');

    await user.update({
      token_recuperacion: tokenHash,
      token_exp_recuperacion: new Date(Date.now() + TTL.PASSWORD_RESET * 1000),
    });
    await redisClient.setex(RedisKeys.passwordReset(rawToken), TTL.PASSWORD_RESET, user.id);

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${rawToken}`;
    const html = getBaseTemplate('Recuperación de contraseña', `
      <p>Hola <strong>${user.nombre}</strong>,</p>
      <p>Recibimos una solicitud para restablecer la contraseña de su cuenta en el SGC-UNT.</p>
      <p>Haga clic en el siguiente botón para crear una nueva contraseña:</p>
      <p><a href="${resetUrl}" class="btn">🔐 Restablecer contraseña</a></p>
      <div class="alert">
        <strong>⚠️ Importante:</strong> Este enlace expira en <strong>1 hora</strong>.
        Si no solicitó este cambio, puede ignorar este correo.
      </div>
      <p style="font-size:12px;color:#999">Por seguridad, nunca comparta este enlace con nadie.</p>
    `);

    await sendMail({ to: user.email, subject: 'SGC-UNT - Recuperación de contraseña', html });
    res.json(genericMsg);
  } catch (err) { next(err); }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;

    const userId = await redisClient.get(RedisKeys.passwordReset(token));
    if (!userId) return next(createError(400, 'Token inválido o expirado', 'INVALID_RESET_TOKEN'));

    const hmac = crypto.createHmac('sha256', process.env.HMAC_SECRET || 'fallback');
    hmac.update(token);
    const tokenHash = hmac.digest('hex');

    const user = await Usuario.findOne({
      where: {
        id: userId,
        token_recuperacion: tokenHash,
        token_exp_recuperacion: { [Op.gt]: new Date() },
      },
    });

    if (!user) return next(createError(400, 'Token inválido o expirado', 'INVALID_RESET_TOKEN'));

    const hash = await bcrypt.hash(password, SALT_ROUNDS);
    await user.update({
      password_hash: hash,
      token_recuperacion: null,
      token_exp_recuperacion: null,
      intentos_fallidos: 0,
    });

    await redisClient.del(RedisKeys.passwordReset(token));
    // Revocar todas las sesiones activas
    await Sesion.update({ activo: false }, { where: { usuario_id: userId } });

    res.json({ data: { message: 'Contraseña actualizada correctamente' } });
  } catch (err) { next(err); }
};

exports.cambiarPassword = async (req, res, next) => {
  try {
    const { password_actual, password_nuevo } = req.body;
    const user = await Usuario.findByPk(req.userId);

    const valid = await bcrypt.compare(password_actual, user.password_hash);
    if (!valid) return next(createError(400, 'La contraseña actual es incorrecta', 'WRONG_PASSWORD'));

    const hash = await bcrypt.hash(password_nuevo, SALT_ROUNDS);
    await user.update({ password_hash: hash });

    await logAudit('UPDATE', req.userId, req.ip, req.headers['user-agent'], { accion: 'cambio_password' });
    res.json({ data: { message: 'Contraseña actualizada correctamente' } });
  } catch (err) { next(err); }
};

exports.sesionesActivas = async (req, res, next) => {
  try {
    const sesiones = await Sesion.findAll({
      where: { usuario_id: req.userId, activo: true, expira_en: { [Op.gt]: new Date() } },
      attributes: ['id', 'ip', 'user_agent', 'creado_en', 'expira_en'],
      order: [['creado_en', 'DESC']],
    });
    res.json({ data: sesiones });
  } catch (err) { next(err); }
};

exports.revocarSesion = async (req, res, next) => {
  try {
    const sesion = await Sesion.findOne({ where: { id: req.params.id, usuario_id: req.userId } });
    if (!sesion) return next(createError(404, 'Sesión no encontrada'));

    await redisClient.del(RedisKeys.refreshToken(sesion.refresh_token));
    await sesion.update({ activo: false });
    res.json({ data: { message: 'Sesión revocada' } });
  } catch (err) { next(err); }
};
