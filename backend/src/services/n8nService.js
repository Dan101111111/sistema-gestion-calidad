'use strict';
const logger = require('../config/logger');

const N8N_BASE = process.env.N8N_WEBHOOK_BASE_URL || 'http://n8n:5678/webhook';

const WEBHOOKS = {
  'nuevo-documento': 'sgc-nuevo-documento',
  'estado-documento': 'sgc-estado-documento',
  'riesgo-critico': 'sgc-riesgo-critico',
  'indicador-bajo-meta': 'sgc-indicador-bajo-meta',
  'encuesta-publicada': 'sgc-encuesta-publicada',
  'capa-vencida': 'sgc-capa-vencida',
};

async function trigger(evento, payload = {}) {
  const path = WEBHOOKS[evento];
  if (!path) {
    logger.warn(`n8n: webhook desconocido: ${evento}`);
    return;
  }

  const url = `${N8N_BASE}/${path}`;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-SGC-API-Key': process.env.N8N_API_KEY || '' },
      body: JSON.stringify({ evento, timestamp: new Date().toISOString(), ...payload }),
      signal: controller.signal,
    });

    clearTimeout(timeout);
    logger.info(`n8n trigger: ${evento} → ${res.status}`);
  } catch (err) {
    // No bloquear el flujo principal si n8n falla
    logger.warn(`n8n trigger fallido (${evento}): ${err.message}`);
  }
}

module.exports = { trigger };
