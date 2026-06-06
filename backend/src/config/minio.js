'use strict';
const Minio = require('minio');
const logger = require('./logger');

const minioClient = new Minio.Client({
  endPoint: process.env.MINIO_ENDPOINT || 'localhost',
  port: parseInt(process.env.MINIO_PORT || '9000'),
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY || 'sgc_minio_admin',
  secretKey: process.env.MINIO_SECRET_KEY || 'minio_secure_2024',
});

const BUCKETS = {
  DOCUMENTOS: process.env.MINIO_BUCKET_DOCS || 'sgc-documentos',
  EVIDENCIAS: process.env.MINIO_BUCKET_EVIDENCIAS || 'sgc-evidencias',
};

const URL_EXPIRY = parseInt(process.env.MINIO_URL_EXPIRY || '3600');

// Verificar/crear buckets
async function initializeBuckets() {
  for (const bucket of Object.values(BUCKETS)) {
    try {
      const exists = await minioClient.bucketExists(bucket);
      if (!exists) {
        await minioClient.makeBucket(bucket, 'us-east-1');
        logger.info(`MinIO: Bucket '${bucket}' creado`);
      }
    } catch (err) {
      logger.error(`MinIO: Error al verificar bucket '${bucket}':`, err.message);
    }
  }
}

module.exports = { minioClient, BUCKETS, URL_EXPIRY, initializeBuckets };
