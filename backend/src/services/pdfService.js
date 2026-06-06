'use strict';
const puppeteer = require('puppeteer');
const logger = require('../config/logger');

const UNT_COLORS = { primary: '#003366', secondary: '#C8102E', accent: '#F7B731' };

function buildHtml(titulo, contenido, modulo) {
  const fecha = new Date().toLocaleDateString('es-PE', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, Helvetica, sans-serif; font-size: 11px; color: #222; background: white; }
    .header { background: ${UNT_COLORS.primary}; color: white; padding: 16px 24px; display: flex; align-items: center; justify-content: space-between; }
    .header-logo { display: flex; align-items: center; gap: 12px; }
    .header-logo .escudo { width: 50px; height: 50px; background: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 22px; }
    .header-text h1 { font-size: 14px; font-weight: bold; letter-spacing: 0.5px; }
    .header-text p { font-size: 10px; opacity: 0.85; margin-top: 2px; }
    .header-badge { background: ${UNT_COLORS.secondary}; padding: 4px 10px; border-radius: 12px; font-size: 10px; font-weight: bold; text-align: center; }
    .subheader { background: ${UNT_COLORS.accent}; color: ${UNT_COLORS.primary}; padding: 8px 24px; font-weight: bold; font-size: 13px; border-left: 4px solid ${UNT_COLORS.secondary}; }
    .content { padding: 20px 24px; }
    .content h2 { color: ${UNT_COLORS.primary}; font-size: 14px; margin-bottom: 10px; border-bottom: 2px solid ${UNT_COLORS.accent}; padding-bottom: 4px; }
    .content h3 { color: ${UNT_COLORS.primary}; font-size: 12px; margin: 12px 0 6px; }
    table { width: 100%; border-collapse: collapse; margin: 10px 0; font-size: 10px; }
    thead tr { background: ${UNT_COLORS.primary}; color: white; }
    th { padding: 6px 8px; text-align: left; font-weight: bold; font-size: 10px; }
    td { padding: 5px 8px; border-bottom: 1px solid #e0e0e0; vertical-align: top; }
    tr:nth-child(even) td { background: #f7f9fc; }
    tr:hover td { background: #eef2f8; }
    p { margin: 4px 0; line-height: 1.5; }
    .alert { background: #fff3cd; border-left: 3px solid ${UNT_COLORS.accent}; padding: 8px 12px; margin: 8px 0; border-radius: 2px; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 10px; font-size: 9px; font-weight: bold; }
    .badge-success { background: #27AE60; color: white; }
    .badge-warning { background: #F7B731; color: #333; }
    .badge-danger { background: #C8102E; color: white; }
    .footer { position: fixed; bottom: 0; left: 0; right: 0; background: #f1f3f5; border-top: 2px solid ${UNT_COLORS.primary}; padding: 6px 24px; font-size: 9px; color: #666; display: flex; justify-content: space-between; }
    @page { margin: 15mm 15mm 25mm 15mm; size: A4; }
    @media print { .no-print { display: none; } }
  </style>
</head>
<body>
  <div class="header">
    <div class="header-logo">
      <div class="escudo">🎓</div>
      <div class="header-text">
        <h1>UNIVERSIDAD NACIONAL DE TRUJILLO</h1>
        <p>Sistema de Gestión de la Calidad — SGC-UNT v2.0</p>
      </div>
    </div>
    <div class="header-badge">
      Módulo:<br>${modulo.toUpperCase()}
    </div>
  </div>

  <div class="subheader">${titulo}</div>

  <div class="content">
    ${contenido}
  </div>

  <div class="footer">
    <span>Documento generado el ${fecha}</span>
    <span>SGC-UNT v2.0 | Módulo: ${modulo}</span>
    <span>Universidad Nacional de Trujillo — Trujillo, Perú</span>
  </div>
</body>
</html>`;
}

let browser = null;

async function getBrowser() {
  if (!browser || !browser.isConnected()) {
    browser = await puppeteer.launch({
      headless: 'new',
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--no-zygote',
        '--single-process',
      ],
    });
  }
  return browser;
}

/**
 * Genera un PDF desde contenido HTML
 * @param {Object} opts - { titulo, contenido, modulo, orientacion }
 * @returns {Buffer} PDF buffer
 */
async function generar({ titulo, contenido, modulo = 'sgc', orientacion = 'portrait' }) {
  let page;
  try {
    const b = await getBrowser();
    page = await b.newPage();

    const html = buildHtml(titulo, contenido, modulo);
    await page.setContent(html, { waitUntil: 'networkidle0', timeout: 30000 });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      landscape: orientacion === 'landscape',
      printBackground: true,
      margin: { top: '15mm', right: '15mm', bottom: '25mm', left: '15mm' },
      displayHeaderFooter: false,
    });

    logger.info(`PDF generado: ${titulo} (${pdfBuffer.length} bytes)`);
    return pdfBuffer;
  } catch (err) {
    logger.error('Error generando PDF:', err.message);
    throw err;
  } finally {
    if (page) await page.close().catch(() => {});
  }
}

module.exports = { generar };
