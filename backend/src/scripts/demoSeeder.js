require('dotenv').config();
const { sequelize } = require('../config/database');
const { 
  Usuario, Documento, Capa, Riesgo, Encuesta, PreguntaEncuesta, 
  Indicador, MedicionIndicador, Autoevaluacion, EstandarAcreditacion 
} = require('../models');

async function runSeeder() {
  try {
    await sequelize.authenticate();
    console.log('Conexión a la base de datos establecida.');

    const usuario = await Usuario.findOne({ where: { activo: true } });
    if (!usuario) throw new Error('No hay usuarios activos en la base de datos.');

    const userId = usuario.id;

    // 1. 5 Documentos Activos
    console.log('Creando Documentos...');
    const [tipos] = await sequelize.query('SELECT id FROM sgc.tipos_documento LIMIT 1');
    const tipoId = tipos.length > 0 ? tipos[0].id : null;
    
    const docs = [];
    for (let i = 1; i <= 5; i++) {
      docs.push({
        codigo: `DOC-DEMO-00${i}`,
        titulo: `Documento de Prueba ${i} - ${['Manual de Calidad', 'Procedimiento Operativo', 'Guía de Auditoría', 'Instructivo de Trabajo', 'Política de Seguridad'][i-1]}`,
        estado: 'aprobado',
        tipo_id: tipoId,
        fecha_vigencia_inicio: new Date().toISOString().split('T')[0],
        fecha_vigencia_fin: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
        responsable_id: userId,
        creado_por: userId,
      });
    }
    await Documento.bulkCreate(docs, { ignoreDuplicates: true }).catch(e => console.error('Error en docs:', e));

    // 2. 5 CAPAs abiertas
    console.log('Creando CAPAs...');
    const capas = [];
    for (let i = 1; i <= 5; i++) {
      capas.push({
        codigo: `CAPA-DEMO-00${i}`,
        tipo: ['correctiva', 'preventiva', 'mejora', 'correctiva', 'preventiva'][i-1],
        descripcion: `Descripción de hallazgo de prueba ${i} encontrado en revisión interna.`,
        accion_propuesta: `Acción propuesta para la CAPA ${i}. Revisar y ajustar procesos.`,
        estado: ['registrada', 'en_implementacion', 'registrada', 'en_implementacion', 'registrada'][i-1],
        fecha_implementacion: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().split('T')[0],
        responsable_id: userId,
        creado_por: userId,
      });
    }
    await Capa.bulkCreate(capas, { ignoreDuplicates: true }).catch(e => console.error('Error en capas:', e));

    // 3. 5 Riesgos críticos
    console.log('Creando Riesgos...');
    const riesgos = [];
    for (let i = 1; i <= 5; i++) {
      riesgos.push({
        codigo: `RSG-DEMO-00${i}`,
        nombre: ['Caída de servidor principal', 'Brecha de seguridad', 'Pérdida de personal clave', 'Incumplimiento normativo', 'Fallo en respaldo de datos'][i-1],
        tipo: ['tecnologico', 'tecnologico', 'operativo', 'legal', 'tecnologico'][i-1],
        probabilidad: [4, 5, 4, 5, 4][i-1],
        impacto: [5, 4, 5, 5, 5][i-1],
        estado: 'activo',
        responsable_id: userId,
        creado_por: userId,
      });
    }
    await Riesgo.bulkCreate(riesgos, { ignoreDuplicates: true }).catch(e => console.error('Error en riesgos:', e));

    // 4. 5 Encuestas vigentes
    console.log('Creando Encuestas...');
    for (let i = 1; i <= 5; i++) {
      const encuesta = await Encuesta.create({
        codigo: `ENC-DEMO-00${i}`,
        titulo: `Encuesta de Satisfacción ${i} - ${['Docentes', 'Estudiantes', 'Egresados', 'Administrativos', 'General'][i-1]}`,
        grupo_objetivo: ['docentes', 'estudiantes', 'egresados', 'administrativos', 'todos'][i-1],
        fecha_inicio: new Date(new Date().setDate(new Date().getDate() - 5)).toISOString().split('T')[0],
        fecha_fin: new Date(new Date().setDate(new Date().getDate() + 15)).toISOString().split('T')[0],
        estado: 'publicada',
        anonima: true,
        creado_por: userId,
      }).catch(() => null);

      if (encuesta) {
        await PreguntaEncuesta.bulkCreate([
          { encuesta_id: encuesta.id, texto: '¿Cómo califica el servicio brindado por la institución?', tipo: 'likert_5', orden: 1 },
          { encuesta_id: encuesta.id, texto: '¿Qué aspectos considera que deberíamos mejorar en el corto plazo?', tipo: 'abierta', orden: 2 }
        ]).catch(() => null);
      }
    }

    // 5. 5 Indicadores bajo meta
    console.log('Creando Indicadores...');
    for (let i = 1; i <= 5; i++) {
      const indicador = await Indicador.create({
        codigo: `IND-DEMO-00${i}`,
        nombre: `Indicador de Rendimiento ${i} - ${['Satisfacción', 'Tiempos de Respuesta', 'Cobertura', 'Eficiencia', 'Impacto'][i-1]}`,
        tipo: ['satisfaccion', 'eficiencia', 'cobertura', 'eficiencia', 'impacto'][i-1],
        meta: [90.0, 95.0, 85.0, 99.0, 80.0][i-1],
        frecuencia: 'mensual',
        creado_por: userId,
      }).catch(() => null);

      if (indicador) {
        await MedicionIndicador.create({
          indicador_id: indicador.id,
          periodo: '2026-06',
          valor_esperado: indicador.meta,
          valor_real: [65.0, 70.0, 50.0, 80.0, 60.0][i-1],
          registrado_por: userId,
        }).catch(() => null);
      }
    }

    // 6. 2 Autoevaluaciones
    console.log('Creando Autoevaluaciones...');
    const [estandares] = await sequelize.query('SELECT id FROM sgc.estandares_acreditacion LIMIT 1');
    let estandarId = estandares.length > 0 ? estandares[0].id : null;
    
    if (!estandarId) {
      const nuevoEstandar = await sequelize.query(`
        INSERT INTO sgc.estandares_acreditacion (id, codigo, nombre, tipo, activo, creado_por, creado_en, modificado_en)
        VALUES (gen_random_uuid(), 'EST-DEMO-01', 'Estándar ISO 21001:2018 DEMO', 'ISO_21001', true, '${userId}', NOW(), NOW())
        RETURNING id;
      `);
      estandarId = nuevoEstandar[0][0].id;
    }
    
    const autoevals = [];
    for (let i = 1; i <= 2; i++) {
      autoevals.push({
        codigo: `AUTO-DEMO-00${i}`,
        nombre: `Autoevaluación Institucional Fase ${i}`,
        periodo_academico: `2026-${i}`,
        fecha_inicio: new Date().toISOString().split('T')[0],
        fecha_fin: new Date(new Date().setDate(new Date().getDate() + 60)).toISOString().split('T')[0],
        estado: 'en_proceso',
        estandar_id: estandarId,
        responsable_id: userId,
        creado_por: userId,
      });
    }
    await Autoevaluacion.bulkCreate(autoevals, { ignoreDuplicates: true }).catch(e => console.error('Error en autoeval:', e));

    console.log('✅ Seeder completado exitosamente.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error en el seeder:', error);
    process.exit(1);
  }
}

runSeeder();
