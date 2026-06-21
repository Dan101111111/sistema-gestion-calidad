'use strict';
const { Op, literal } = require('sequelize');
const { Documento, VersionDocumento, AprobacionDocumento, TipoDocumento, Usuario, ArchivoAdjunto, Proceso } = require('../models');
const { createError } = require('../middleware/errorHandler');
const pdfService = require('../services/pdfService');
const notifService = require('../services/notificacionService');
const n8nService = require('../services/n8nService');

const ESTADO_TRANSICIONES = {
  borrador: ['en_revision'],
  en_revision: ['aprobado', 'borrador'],
  aprobado: ['archivado', 'obsoleto'],
  archivado: [],
  obsoleto: [],
};

exports.listar = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, estado, tipo_id, proceso_id, responsable_id, q } = req.query;
    const where = {};
    if (estado) where.estado = estado;
    if (tipo_id) where.tipo_id = tipo_id;
    if (proceso_id) where.proceso_id = proceso_id;
    if (responsable_id) where.responsable_id = responsable_id;
    if (q) where[Op.or] = [
      { codigo: { [Op.iLike]: `%${q}%` } },
      { titulo: { [Op.iLike]: `%${q}%` } },
    ];

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const { count, rows } = await Documento.findAndCountAll({
      where,
      include: [
        { model: TipoDocumento, as: 'tipo', attributes: ['id', 'nombre', 'codigo'] },
        { model: Usuario, as: 'responsable', attributes: ['id', 'nombre', 'apellido', 'email'] },
        { model: Usuario, as: 'creador', attributes: ['id', 'nombre', 'apellido'] },
      ],
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
    const doc = await Documento.findByPk(req.params.id, {
      include: [
        { model: TipoDocumento, as: 'tipo' },
        { model: Proceso, as: 'proceso', attributes: ['id', 'nombre', 'codigo'] },
        { model: Usuario, as: 'responsable', attributes: ['id', 'nombre', 'apellido', 'email'] },
        { model: Usuario, as: 'creador', attributes: ['id', 'nombre', 'apellido'] },
        { model: VersionDocumento, as: 'versiones', order: [['numero_version', 'DESC']], limit: 10,
          include: [{ model: Usuario, as: 'modificado_por_usuario', foreignKey: 'modificado_por', attributes: ['id','nombre','apellido'] }] },
        { model: AprobacionDocumento, as: 'aprobaciones', order: [['creado_en', 'DESC']],
          include: [{ model: Usuario, as: 'aprobador', attributes: ['id','nombre','apellido'] }] },
      ],
    });
    if (!doc) return next(createError(404, 'Documento no encontrado'));
    res.json({ data: doc });
  } catch (err) { next(err); }
};

exports.crear = async (req, res, next) => {
  try {
    const { codigo, titulo, tipo_id, contenido, proceso_id, responsable_id, fecha_vigencia_inicio, fecha_vigencia_fin } = req.body;

    const existe = await Documento.findOne({ where: { codigo } });
    if (existe) return next(createError(409, 'El código de documento ya existe', 'CODIGO_DUPLICATE'));

    const doc = await Documento.create({
      codigo, titulo, tipo_id, contenido, proceso_id, responsable_id,
      fecha_vigencia_inicio, fecha_vigencia_fin, creado_por: req.userId,
      estado: 'borrador', version_actual: 1,
    });

    await n8nService.trigger('nuevo-documento', { documentoId: doc.id, codigo, titulo, creadoPor: req.userId });
    res.status(201).json({ data: doc });
  } catch (err) { next(err); }
};

exports.actualizar = async (req, res, next) => {
  try {
    const doc = await Documento.findByPk(req.params.id);
    if (!doc) return next(createError(404, 'Documento no encontrado'));

    const esAdminOGestor = ['admin', 'gestor_calidad'].includes(req.user.rol);
    const esCreador = doc.creado_por === req.userId;

    if (!esAdminOGestor && !esCreador) {
      return next(createError(403, 'No tiene permisos para modificar este documento', 'FORBIDDEN'));
    }

    if (!['borrador', 'rechazado'].includes(doc.estado)) {
      return next(createError(400, 'Solo se pueden editar documentos en borrador o rechazados'));
    }

    req.datosAnteriores = doc.toJSON();

    // Crear versión del contenido anterior
    await VersionDocumento.create({
      documento_id: doc.id,
      numero_version: doc.version_actual,
      contenido_anterior: doc.contenido,
      contenido_nuevo: req.body.contenido,
      estado_anterior: doc.estado,
      estado_nuevo: doc.estado,
      modificado_por: req.userId,
      comentario: req.body.comentario_version,
    });

    const nuevoNumeroVersion = doc.version_actual + 1;
    await doc.update({ ...req.body, version_actual: nuevoNumeroVersion, modificado_por: req.userId });
    res.json({ data: doc });
  } catch (err) { next(err); }
};

exports.cambiarEstado = async (req, res, next) => {
  try {
    const { accion, comentario } = req.body;
    const doc = await Documento.findByPk(req.params.id, {
      include: [{ model: Usuario, as: 'creador', attributes: ['id', 'email', 'nombre'] }],
    });
    if (!doc) return next(createError(404, 'Documento no encontrado'));

    // 1. Control de accesos por rol y autoría
    const esAdminOGestor = ['admin', 'gestor_calidad'].includes(req.user.rol);
    const esCreador = doc.creado_por === req.userId;

    if (!esAdminOGestor) {
      if (esCreador) {
        if (accion !== 'enviar_revision') {
          return next(createError(403, 'El creador solo puede enviar a revisión el documento', 'FORBIDDEN'));
        }
        if (doc.estado !== 'borrador') {
          return next(createError(400, 'El documento debe estar en borrador para enviarse a revisión', 'INVALID_STATE'));
        }
      } else {
        return next(createError(403, 'No tiene permisos para gestionar este documento', 'FORBIDDEN'));
      }
    }

    // 2. Validación de comentario al rechazar
    if (accion === 'rechazar' && (!comentario || !comentario.trim())) {
      return next(createError(422, 'El comentario es obligatorio al rechazar', 'COMMENT_REQUIRED'));
    }

    const transiciones = ESTADO_TRANSICIONES[doc.estado] || [];
    const ACCION_ESTADO = {
      enviar_revision: 'en_revision',
      aprobar: 'aprobado',
      rechazar: 'borrador',
      archivar: 'archivado',
      obsoletar: 'obsoleto',
    };
    const nuevoEstado = ACCION_ESTADO[accion];
    if (!nuevoEstado || !transiciones.includes(nuevoEstado)) {
      return next(createError(400, `Transición no permitida: ${doc.estado} → ${accion}`, 'INVALID_TRANSITION'));
    }

    // 3. Registrar fecha de última revisión si cambia de en_revision a aprobado o borrador (rechazado)
    const updateData = { estado: nuevoEstado, modificado_por: req.userId };
    if (doc.estado === 'en_revision' && ['aprobado', 'borrador'].includes(nuevoEstado)) {
      updateData.fecha_revision = new Date();
    }

    await doc.update(updateData);

    await AprobacionDocumento.create({
      documento_id: doc.id, aprobador_id: req.userId,
      accion, comentario, estado_resultante: nuevoEstado,
    });

    // Notificación interna al creador
    await notifService.crear({
      usuario_id: doc.creado_por,
      tipo: 'aprobacion_pendiente',
      titulo: `Documento ${nuevoEstado}: ${doc.codigo}`,
      mensaje: `El documento "${doc.titulo}" ha cambiado a estado: ${nuevoEstado}. ${comentario ? 'Comentario: ' + comentario : ''}`,
      modulo: 'documentos', registro_id: doc.id,
    });

    // Disparar webhook n8n
    await n8nService.trigger('estado-documento', { documentoId: doc.id, estadoAnterior: doc.estado, nuevoEstado, accion, comentario });

    res.json({ data: doc });
  } catch (err) { next(err); }
};

exports.eliminar = async (req, res, next) => {
  try {
    const doc = await Documento.findByPk(req.params.id);
    if (!doc) return next(createError(404, 'Documento no encontrado'));

    const esAdminOGestor = ['admin', 'gestor_calidad'].includes(req.user.rol);
    const esCreador = doc.creado_por === req.userId;

    if (!esAdminOGestor && !esCreador) {
      return next(createError(403, 'No tiene permisos para eliminar este documento', 'FORBIDDEN'));
    }

    if (!esAdminOGestor && doc.estado !== 'borrador') {
      return next(createError(400, 'Solo se pueden eliminar documentos en estado borrador', 'INVALID_STATE'));
    }

    if (esAdminOGestor && doc.estado === 'aprobado') {
      return next(createError(400, 'No se puede eliminar un documento aprobado', 'INVALID_STATE'));
    }

    req.datosAnteriores = doc.toJSON();
    await doc.destroy();
    res.json({ data: { message: 'Documento eliminado' } });
  } catch (err) { next(err); }
};

exports.versiones = async (req, res, next) => {
  try {
    const versiones = await VersionDocumento.findAll({
      where: { documento_id: req.params.id },
      order: [['numero_version', 'DESC']],
    });
    res.json({ data: versiones });
  } catch (err) { next(err); }
};

exports.reportePDF = async (req, res, next) => {
  try {
    const { estado, tipo_id } = req.query;
    const where = {};
    if (estado) where.estado = estado;
    if (tipo_id) where.tipo_id = tipo_id;

    const documentos = await Documento.findAll({
      where,
      include: [
        { model: TipoDocumento, as: 'tipo', attributes: ['nombre'] },
        { model: Usuario, as: 'responsable', attributes: ['nombre', 'apellido'] },
      ],
      order: [['codigo', 'ASC']],
      limit: 50,
    });

    const html = `
      <h2>Listado de Documentos</h2>
      <p><strong>Filtros:</strong> Estado: ${estado || 'Todos'} | Tipo: ${tipo_id || 'Todos'}</p>
      <p><strong>Total:</strong> ${documentos.length} documentos</p>
      <table>
        <thead><tr>
          <th>Código</th><th>Título</th><th>Tipo</th><th>Versión</th>
          <th>Estado</th><th>Responsable</th><th>Vigencia Fin</th>
        </tr></thead>
        <tbody>
          ${documentos.map(d => `
            <tr>
              <td>${d.codigo}</td>
              <td>${d.titulo}</td>
              <td>${d.tipo?.nombre || '-'}</td>
              <td>v${d.version_actual}</td>
              <td>${d.estado}</td>
              <td>${d.responsable ? d.responsable.nombre + ' ' + d.responsable.apellido : '-'}</td>
              <td>${d.fecha_vigencia_fin || '-'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;

    const pdf = await pdfService.generar({ titulo: 'Gestión Documental', contenido: html, modulo: 'documentos' });
    res.set({ 'Content-Type': 'application/pdf', 'Content-Disposition': 'attachment; filename="documentos.pdf"' });
    res.send(pdf);
  } catch (err) { next(err); }
};

exports.busqueda = async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) return res.json({ data: [] });

    const docs = await Documento.findAll({
      where: {
        [Op.or]: [
          { codigo: { [Op.iLike]: `%${q}%` } },
          { titulo: { [Op.iLike]: `%${q}%` } },
          literal(`busqueda_fts @@ plainto_tsquery('spanish', '${q.replace(/'/g, "''")}')`)
        ],
      },
      include: [{ model: TipoDocumento, as: 'tipo', attributes: ['nombre'] }],
      limit: 10,
    });
    res.json({ data: docs });
  } catch (err) { next(err); }
};
