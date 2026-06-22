'use strict';
const { TipoDocumento, Documento } = require('../models');
const { createError } = require('../middleware/errorHandler');
const { Op } = require('sequelize');

exports.listar = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, q } = req.query;
    const where = {};

    if (q) {
      where[Op.or] = [
        { nombre: { [Op.iLike]: `%${q}%` } },
        { codigo: { [Op.iLike]: `%${q}%` } },
      ];
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const { count, rows } = await TipoDocumento.findAndCountAll({
      where,
      order: [['creado_en', 'DESC']],
      limit: parseInt(limit),
      offset,
    });

    res.json({
      data: rows,
      meta: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / parseInt(limit)),
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.crear = async (req, res, next) => {
  try {
    const { nombre, codigo, descripcion, activo, requiere_aprobacion } = req.body;

    const existeCodigo = await TipoDocumento.findOne({ where: { codigo } });
    if (existeCodigo) {
      return next(createError(409, 'El código de tipo de documento ya está registrado', 'CODE_DUPLICATE'));
    }

    const existeNombre = await TipoDocumento.findOne({ where: { nombre } });
    if (existeNombre) {
      return next(createError(409, 'El nombre de tipo de documento ya está registrado', 'NAME_DUPLICATE'));
    }

    const tipo = await TipoDocumento.create({
      nombre,
      codigo: codigo.toUpperCase(),
      descripcion,
      activo: activo !== undefined ? activo : true,
      requiere_aprobacion: requiere_aprobacion !== undefined ? requiere_aprobacion : true,
    });

    res.status(201).json({ data: tipo });
  } catch (err) {
    next(err);
  }
};

exports.actualizar = async (req, res, next) => {
  try {
    const tipo = await TipoDocumento.findByPk(req.params.id);
    if (!tipo) {
      return next(createError(404, 'Tipo de documento no encontrado'));
    }

    const { nombre, descripcion, activo, requiere_aprobacion } = req.body;

    if (nombre && nombre !== tipo.nombre) {
      const existeNombre = await TipoDocumento.findOne({ where: { nombre } });
      if (existeNombre) {
        return next(createError(409, 'El nombre de tipo de documento ya está registrado', 'NAME_DUPLICATE'));
      }
    }

    await tipo.update({
      nombre,
      descripcion,
      activo: activo !== undefined ? activo : tipo.activo,
      requiere_aprobacion: requiere_aprobacion !== undefined ? requiere_aprobacion : tipo.requiere_aprobacion,
    });

    res.json({ data: tipo });
  } catch (err) {
    next(err);
  }
};

exports.eliminar = async (req, res, next) => {
  try {
    const tipo = await TipoDocumento.findByPk(req.params.id);
    if (!tipo) {
      return next(createError(404, 'Tipo de documento no encontrado'));
    }

    // Verificar si está en uso por algún documento
    const count = await Documento.count({ where: { tipo_id: req.params.id } });
    if (count > 0) {
      return next(
        createError(
          400,
          'No se puede eliminar el tipo de documento porque está asociado a uno o más documentos',
          'FOREIGN_KEY_CONFLICT'
        )
      );
    }

    await tipo.destroy();
    res.json({ data: { message: 'Tipo de documento eliminado correctamente' } });
  } catch (err) {
    next(err);
  }
};
