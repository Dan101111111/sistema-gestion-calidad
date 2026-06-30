-- ============================================================
-- SCRIPT DE POBLACIÓN: MAPA DE PROCESOS UNT (SGCUNT)
-- Adaptación a 3 niveles (Aplanamiento Funcional)
-- ============================================================

BEGIN;

-- 1. Limpiar datos existentes (Opcional, pero recomendado si es un entorno local)
-- Eliminar esto si no quieres perder datos de prueba previos.
-- CUIDADO: Esto eliminará en cascada todo.
-- TRUNCATE TABLE sgc.macroprocesos CASCADE;

-- 2. POBLAR TABLA: MACROPROCESOS
INSERT INTO sgc.macroprocesos (codigo, nombre, tipo) VALUES
('MP-E01', 'Gobierno de la Universidad', 'estrategico'),
('MP-E02', 'Gestión de la Mejora Continua', 'estrategico'),
('MP-M01', 'Formación Integral (Pregrado y Posgrado)', 'misional'),
('MP-A02', 'Gestión de Talento Humano', 'apoyo'),
('MP-A06', 'Tecnología de la Información', 'apoyo')
ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre, tipo = EXCLUDED.tipo;

-- 3. POBLAR TABLA: PROCESOS
INSERT INTO sgc.procesos (macroproceso_id, codigo, nombre, objetivo, alcance, estado) VALUES
(
  (SELECT id FROM sgc.macroprocesos WHERE codigo = 'MP-E01'),
  'PR-E01.01',
  'Gestión de Políticas Académicas',
  'Establecer los lineamientos político-académicos de excelencia institucional.',
  'Sede central y filiales a nivel pregrado y posgrado.',
  'activo'
),
(
  (SELECT id FROM sgc.macroprocesos WHERE codigo = 'MP-E02'),
  'PR-E02.01',
  'Aseguramiento de la Calidad Universitaria',
  'Garantizar la autoevaluación, licenciamiento institucional y la acreditación de programas.',
  'Todas las facultades, escuelas de pregrado y escuela de posgrado.',
  'activo'
),
(
  (SELECT id FROM sgc.macroprocesos WHERE codigo = 'MP-M01'),
  'PR-M01.01',
  'Gestión de la Formación en Pregrado',
  'Transformar la vida de los estudiantes mediante procesos educativos innovadores y aprendizaje divergente.',
  'Abarca desde el ingreso académico hasta el seguimiento al egresado.',
  'activo'
),
(
  (SELECT id FROM sgc.macroprocesos WHERE codigo = 'MP-A02'),
  'PR-A02.01',
  'Gestión de Personal Académico',
  'Administrar el ciclo de vida laboral, escalafón y capacitación del cuerpo docente.',
  'Áreas administrativas de la Dirección General de Administración y Recursos Humanos.',
  'activo'
),
(
  (SELECT id FROM sgc.macroprocesos WHERE codigo = 'MP-A06'),
  'PR-A06.02',
  'Gestión de los Sistemas de Información',
  'Garantizar la disponibilidad, soporte y actualización de los sistemas de información institucionales.',
  'Oficina de Tecnologías de la Información a nivel corporativo.',
  'activo'
)
ON CONFLICT (codigo) DO NOTHING;

-- 4. POBLAR TABLA: ACTIVIDADES (Adaptadas funcionalmente)
INSERT INTO sgc.actividades_proceso (proceso_id, secuencia, codigo, nombre, entradas, salidas, indicadores) VALUES
-- Actividades para PR-E01.01 (Gestión de Políticas Académicas)
(
  (SELECT id FROM sgc.procesos WHERE codigo = 'PR-E01.01'),
  1, 'ACT-E01.01-01', 'Formulación de Lineamientos Académicos',
  'Políticas nacionales (SUNEDU/MINEDU), plan estratégico institucional', 'Propuesta de política aprobada por Vicerrectorado',
  'Porcentaje de políticas aprobadas anualmente'
),
-- Actividades para PR-E02.01 (Aseguramiento de la Calidad)
(
  (SELECT id FROM sgc.procesos WHERE codigo = 'PR-E02.01'),
  1, 'ACT-E02.01-01', 'Gestión de la Autoevaluación y Licenciamiento',
  'Modelos de acreditación vigentes, condiciones básicas de calidad', 'Informes de autoevaluación y resoluciones de acreditación',
  'Porcentaje de programas acreditados y cumplimiento de condiciones de permanencia'
),
-- Actividades para PR-M01.01 (Formación en Pregrado)
(
  (SELECT id FROM sgc.procesos WHERE codigo = 'PR-M01.01'),
  1, 'ACT-M01.01-01', '[Subproceso: Admisión] Planificación Curricular y Admisión',
  'Planes de estudio, postulantes registrados', 'Estudiantes admitidos e ingresantes matriculados',
  'Porcentaje de vacantes cubiertas por proceso de admisión'
),
(
  (SELECT id FROM sgc.procesos WHERE codigo = 'PR-M01.01'),
  2, 'ACT-M01.01-02', '[Subproceso: Enseñanza] Desarrollo de la Enseñanza-Aprendizaje',
  'Estudiantes matriculados, sílabos de asignaturas, infraestructura física/virtual', 'Estudiantes evaluados y aprobados con competencias logradas',
  'Grado de satisfacción de los estudiantes con los servicios brindados (Métrica OC.01)'
),
(
  (SELECT id FROM sgc.procesos WHERE codigo = 'PR-M01.01'),
  3, 'ACT-M01.01-03', '[Subproceso: Titulación] Resultados de la Formación y Titulación',
  'Egresados de las promociones académicas', 'Grados académicos, certificaciones y títulos emitidos',
  'Porcentaje de egresados laborando según su perfil profesional'
),
-- Actividades para PR-A02.01 (Gestión de Personal Académico)
(
  (SELECT id FROM sgc.procesos WHERE codigo = 'PR-A02.01'),
  1, 'ACT-A02.01-01', 'Control de Escalafón y Capacitación Docente',
  'Legajos de personal, requerimientos de formación pedagógica', 'Plan de capacitación ejecutado e historial de méritos actualizado',
  'Porcentaje de docentes capacitados en TICs y metodologías activas'
),
-- Actividades para PR-A06.02 (Sistemas de Información)
(
  (SELECT id FROM sgc.procesos WHERE codigo = 'PR-A06.02'),
  1, 'ACT-A06.02-01', 'Desarrollo y Mantenimiento de Software Institucional',
  'Requerimientos de usuarios (académicos/administrativos), fallos reportados', 'Módulos del SGC y sistemas internos desplegados en producción',
  'Tiempo promedio de resolución de incidencias críticas'
)
ON CONFLICT (codigo) DO NOTHING;

COMMIT;
