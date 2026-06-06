'use strict';
const nodemailer = require('nodemailer');
const logger = require('./logger');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: { rejectUnauthorized: false },
  pool: true,
  maxConnections: 5,
  maxMessages: 100,
});

transporter.verify((error) => {
  if (error) {
    logger.warn('SMTP: No se pudo verificar conexión:', error.message);
  } else {
    logger.info('SMTP: Conexión verificada correctamente');
  }
});

const FROM = process.env.SMTP_FROM || '"SGC-UNT" <sgc@unitru.edu.pe>';

// Plantilla HTML base para correos
function getBaseTemplate(titulo, contenido) {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 8px; overflow: hidden; }
    .header { background: #003366; color: white; padding: 20px 30px; }
    .header h1 { margin: 0; font-size: 22px; }
    .header p { margin: 5px 0 0; font-size: 13px; opacity: 0.8; }
    .body { padding: 30px; color: #333; line-height: 1.6; }
    .footer { background: #f8f8f8; border-top: 1px solid #e0e0e0; padding: 15px 30px; font-size: 12px; color: #888; text-align: center; }
    .btn { display: inline-block; background: #003366; color: white; padding: 12px 24px; border-radius: 4px; text-decoration: none; margin: 10px 0; }
    .alert { background: #fff3cd; border-left: 4px solid #F7B731; padding: 12px; border-radius: 4px; margin: 10px 0; }
    .danger { background: #fde8e8; border-left: 4px solid #C8102E; }
    table { width: 100%; border-collapse: collapse; }
    th { background: #003366; color: white; padding: 8px 12px; text-align: left; font-size: 13px; }
    td { padding: 8px 12px; border-bottom: 1px solid #eee; font-size: 13px; }
    tr:hover td { background: #f9f9f9; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎓 Universidad Nacional de Trujillo</h1>
      <p>Sistema de Gestión de la Calidad — SGC-UNT v2.0</p>
    </div>
    <div class="body">
      <h2 style="color:#003366; margin-top:0">${titulo}</h2>
      ${contenido}
    </div>
    <div class="footer">
      <p>Este correo fue generado automáticamente por el SGC-UNT v2.0</p>
      <p>Universidad Nacional de Trujillo | Trujillo, Perú</p>
    </div>
  </div>
</body>
</html>`;
}

async function sendMail({ to, subject, html, text }) {
  try {
    const info = await transporter.sendMail({ from: FROM, to, subject, html, text });
    logger.info(`Mail enviado a ${to}: ${info.messageId}`);
    return { ok: true, messageId: info.messageId };
  } catch (err) {
    logger.error(`Error al enviar mail a ${to}:`, err.message);
    return { ok: false, error: err.message };
  }
}

module.exports = { transporter, sendMail, getBaseTemplate };
