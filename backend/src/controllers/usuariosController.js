'use strict';
const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const { Usuario, Sesion, Notificacion } = require('../models');
const { createError } = require('../middleware/errorHandler');

const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS || '12');

function userPublic(u) {
  const { password_hash, token_recuperacion, token_exp_recuperacion, ...rest } = u.toJSON ? u.toJSON() : u;
  return rest;
}

exports.listar = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, rol, activo, facultad, q } = req.query;
    const where = {};
    if (rol) where.rol = rol;
    if (activo !== undefined) where.activo = activo === 'true';
    if (facultad) where.facultad = { [Op.iLike]: `%${facultad}%` };
    if (q) where[Op.or] = [
      { nombre: { [Op.iLike]: `%${q}%` } },
      { apellido: { [Op.iLike]: `%${q}%` } },
      { email: { [Op.iLike]: `%${q}%` } },
      { codigo: { [Op.iLike]: `%${q}%` } },
    ];

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const { count, rows } = await Usuario.findAndCountAll({
      where,
      attributes: { exclude: ['password_hash', 'token_recuperacion', 'token_exp_recuperacion'] },
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
    const user = await Usuario.findByPk(req.params.id, {
      attributes: { exclude: ['password_hash', 'token_recuperacion', 'token_exp_recuperacion'] },
    });
    if (!user) return next(createError(404, 'Usuario no encontrado'));
    res.json({ data: userPublic(user) });
  } catch (err) { next(err); }
};

exports.crear = async (req, res, next) => {
  try {
    const { codigo, nombre, apellido, email, password, rol, facultad, escuela, telefono } = req.body;

    const existe = await Usuario.findOne({ where: { email: email.toLowerCase() } });
    if (existe) return next(createError(409, 'El email ya está registrado', 'EMAIL_DUPLICATE'));

    if (codigo) {
      const existeCodigo = await Usuario.findOne({ where: { codigo } });
      if (existeCodigo) return next(createError(409, 'El código ya está asignado a otro usuario', 'CODE_DUPLICATE'));
    }

    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await Usuario.create({
      codigo: codigo || null,
      nombre, apellido, email: email.toLowerCase(), password_hash,
      rol: rol || 'invitado', facultad, escuela, telefono,
      creado_por: req.userId,
    });

    res.status(201).json({ data: userPublic(user) });
  } catch (err) { next(err); }
};

exports.actualizar = async (req, res, next) => {
  try {
    const user = await Usuario.findByPk(req.params.id);
    if (!user) return next(createError(404, 'Usuario no encontrado'));

    const { codigo, nombre, apellido, rol, facultad, escuela, telefono } = req.body;
    req.datosAnteriores = userPublic(user);

    if (codigo !== undefined && codigo !== user.codigo) {
      const existeCodigo = await Usuario.findOne({ where: { codigo } });
      if (existeCodigo) return next(createError(409, 'El código ya está asignado a otro usuario', 'CODE_DUPLICATE'));
    }

    await user.update({ codigo, nombre, apellido, rol, facultad, escuela, telefono, modificado_por: req.userId });
    res.json({ data: userPublic(user) });
  } catch (err) { next(err); }
};

exports.toggleActivo = async (req, res, next) => {
  try {
    const user = await Usuario.findByPk(req.params.id);
    if (!user) return next(createError(404, 'Usuario no encontrado'));
    if (user.id === req.userId) return next(createError(400, 'No puede desactivarse a sí mismo'));

    await user.update({ activo: !user.activo });
    if (!user.activo) {
      await Sesion.update({ activo: false }, { where: { usuario_id: user.id } });
    }
    res.json({ data: { activo: user.activo, message: `Usuario ${user.activo ? 'activado' : 'desactivado'}` } });
  } catch (err) { next(err); }
};

exports.asignarRol = async (req, res, next) => {
  try {
    const user = await Usuario.findByPk(req.params.id);
    if (!user) return next(createError(404, 'Usuario no encontrado'));

    const { rol } = req.body;
    await user.update({ rol, modificado_por: req.userId });
    res.json({ data: { id: user.id, email: user.email, rol: user.rol } });
  } catch (err) { next(err); }
};

exports.resetPasswordAdmin = async (req, res, next) => {
  try {
    const user = await Usuario.findByPk(req.params.id);
    if (!user) return next(createError(404, 'Usuario no encontrado'));

    const { password } = req.body;
    const hash = await bcrypt.hash(password, SALT_ROUNDS);
    await user.update({ password_hash: hash, intentos_fallidos: 0 });
    await Sesion.update({ activo: false }, { where: { usuario_id: user.id } });

    res.json({ data: { message: 'Contraseña restablecida correctamente' } });
  } catch (err) { next(err); }
};

exports.miPerfil = async (req, res, next) => {
  try {
    const user = await Usuario.findByPk(req.userId, {
      attributes: { exclude: ['password_hash', 'token_recuperacion', 'token_exp_recuperacion'] },
    });
    res.json({ data: userPublic(user) });
  } catch (err) { next(err); }
};

exports.actualizarPerfil = async (req, res, next) => {
  try {
    const user = await Usuario.findByPk(req.userId);
    const { nombre, apellido, telefono, facultad, escuela } = req.body;
    await user.update({ nombre, apellido, telefono, facultad, escuela });
    res.json({ data: userPublic(user) });
  } catch (err) { next(err); }
};
