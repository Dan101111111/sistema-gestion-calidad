require('dotenv').config({ path: '../backend/.env' });
const { Riesgo } = require('../backend/src/models');

async function main() {
  try {
    const fieldsToSave = ['codigo', 'nombre', 'descripcion', 'tipo', 'proceso_id', 'probabilidad', 'impacto', 'responsable_id', 'estado', 'creado_por'];
    const riesgo = await Riesgo.create({
      codigo: 'TEST-' + Date.now(),
      nombre: 'Prueba de riesgo',
      descripcion: 'Prueba',
      tipo: 'operativo',
      probabilidad: 2,
      impacto: 3,
      estado: 'activo',
    }, { fields: fieldsToSave, returning: true });
    
    console.log('Riesgo creado exitosamente:', riesgo.toJSON());
  } catch (err) {
    console.error('Error al crear riesgo:', err);
  }
  process.exit();
}

main();
