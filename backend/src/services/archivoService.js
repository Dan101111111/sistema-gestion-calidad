'use strict';
const crypto = require('crypto');
const path = require('path');
const { minioClient, BUCKETS, URL_EXPIRY } = require('../config/minio');
const { ArchivoAdjunto } = require('../models');
const logger = require('../config/logger');

function getBucket(moduloOrigen) {
  const evidenciasModulos = ['auditorias', 'hallazgos', 'capas', 'riesgos', 'acreditacion', 'encuestas'];
  return evidenciasModulos.includes(moduloOrigen) ? BUCKETS.EVIDENCIAS : BUCKETS.DOCUMENTOS;
}

function generarNombreArchivo(nombreOriginal) {
  const ext = path.extname(nombreOriginal);
  const ts = Date.now();
  const rand = crypto.randomBytes(8).toString('hex');
  return `${ts}_${rand}${ext}`;
}

async function subir({ file, subido_por, modulo_origen, registro_id }) {
  const bucket = getBucket(modulo_origen);
  const nombreAlmacenado = generarNombreArchivo(file.originalname);
  const ruta = `${modulo_origen || 'general'}/${nombreAlmacenado}`;

  // Calcular checksum
  const checksum = crypto.createHash('sha256').update(file.buffer).digest('hex');

  // Subir a MinIO
  await minioClient.putObject(bucket, ruta, file.buffer, file.size, {
    'Content-Type': file.mimetype,
    'x-amz-meta-original-name': encodeURIComponent(file.originalname),
    'x-amz-meta-uploaded-by': subido_por || 'system',
  });

  // Guardar metadatos en BD
  const archivo = await ArchivoAdjunto.create({
    nombre_original: file.originalname,
    nombre_almacenado: nombreAlmacenado,
    mime_type: file.mimetype,
    tamano_bytes: file.size,
    checksum_sha256: checksum,
    bucket,
    ruta_minio: ruta,
    subido_por,
    modulo_origen,
    registro_id,
  });

  logger.info(`Archivo subido: ${ruta} (${file.size} bytes)`);

  // Generar URL firmada temporal
  const url = await generarUrl(bucket, ruta);
  return { ...archivo.toJSON(), url };
}

async function generarUrl(bucket, ruta) {
  try {
    return await minioClient.presignedGetObject(bucket, ruta, URL_EXPIRY);
  } catch (err) {
    logger.error('Error generando URL firmada:', err.message);
    return null;
  }
}

async function eliminar(bucket, ruta) {
  try {
    await minioClient.removeObject(bucket, ruta);
    logger.info(`Archivo eliminado de MinIO: ${bucket}/${ruta}`);
  } catch (err) {
    logger.error('Error eliminando archivo de MinIO:', err.message);
    throw err;
  }
}

module.exports = { subir, generarUrl, eliminar };
