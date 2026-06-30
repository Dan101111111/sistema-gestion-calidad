Como Analista de Procesos Institucionales especialista en la norma ISO 9001:2015, he estructurado el desglose técnico de los 13 macroprocesos faltantes para la Universidad Nacional de Trujillo (UNT). Esta segmentación de Nivel 2 (Procesos) y Nivel 3 (Actividades) combina fielmente la estructura aprobada mediante la **Resolución Rectoral N°1851-2023/UNT** junto con las caracterizaciones operativas estandarizadas de la gestión de la calidad universitaria.

A continuación se presenta el script SQL unificado para PostgreSQL, listo para su ejecución.

---

```sql
-- =============================================================================
-- SCRIPT DE DESGLOSE COMPLEMENTARIO DEL MAPA DE PROCESOS (SGC-UNT)
-- EXCLUSIVAMENTE PARA LOS 13 MACROPROCESOS RESTANTES
-- =============================================================================

BEGIN;

-- =============================================================================
-- 1. MACROPROCESO: E03 - SUPERVISIÓN Y CONTROL
-- =============================================================================

-- Procesos para E03
INSERT INTO sgc.procesos (macroproceso_id, codigo, nombre, objetivo, alcance, estado) VALUES 
((SELECT id FROM sgc.macroprocesos WHERE codigo = 'MP-E03'), 'PR-E03.01', 'Gestión de Control Gubernamental', 'Garantizar el cumplimiento legal y el correcto uso de los recursos de la universidad a través de acciones de auditoría interna y externa.', 'Desde la planificación anual de control institucional hasta la emisión de informes definitivos.', 'activo'),
((SELECT id FROM sgc.macroprocesos WHERE codigo = 'MP-E03'), 'PR-E03.02', 'Gestión de Procesos Disciplinarios', 'Conducir las investigaciones administrativas y disciplinarias del personal docente y administrativo según las normativas vigentes.', 'Desde la recepción de la denuncia o informe técnico hasta la resolución final sancionadora o absolutoria.', 'activo');

-- Actividades para PR-E03.01
INSERT INTO sgc.actividades (proceso_id, secuencia, codigo, nombre, entradas, salidas, indicadores) VALUES 
((SELECT id FROM sgc.procesos WHERE codigo = 'PR-E03.01'), 1, 'ACT-E03.01-01', 'Ejecución del Plan de Control Interno', 'Plan Anual de Control, denuncias ciudadanas, requerimientos rectorales', 'Informes de auditoría interna con recomendaciones estructurales', 'Porcentaje de recomendaciones del Órgano de Control Institucional (OCI) implementadas'),
((SELECT id FROM sgc.procesos WHERE codigo = 'PR-E03.01'), 2, 'ACT-E03.01-02', 'Atención de Auditorías Externas', 'Notificación de pliegos de control externo por parte de la Contraloría General', 'Respuestas sustentadas y levantamiento de observaciones técnico-legales', 'Porcentaje de observaciones externas absueltas dentro de los plazos de ley');

-- Actividades para PR-E03.02
INSERT INTO sgc.actividades (proceso_id, secuencia, codigo, nombre, entradas, salidas, indicadores) VALUES 
((SELECT id FROM sgc.procesos WHERE codigo = 'PR-E03.02'), 1, 'ACT-E03.02-01', 'Instrucción e Investigación del Proceso Disciplinario', 'Expediente derivado con indicios de falta administrativa, declaraciones de partes', 'Informe del órgano instructor con propuesta de sanción o archivamiento', 'Tiempo promedio de resolución de expedientes en fase de instrucción'),
((SELECT id FROM sgc.procesos WHERE codigo = 'PR-E03.02'), 2, 'ACT-E03.02-02', 'Emisión y Notificación de la Resolución Sancionadora', 'Informe final de instrucción, descargos definitivos del procesado', 'Resolución Rectoral o del Tribunal de Honor debidamente notificada', 'Porcentaje de resoluciones firmes sin apelación en la vía administrativa');


-- =============================================================================
-- 2. MACROPROCESO: E04 - GESTIÓN DE INFORMACIÓN Y COMUNICACIÓN
-- =============================================================================

-- Procesos para E04
INSERT INTO sgc.procesos (macroproceso_id, codigo, nombre, objetivo, alcance, estado) VALUES 
((SELECT id FROM sgc.macroprocesos WHERE codigo = 'MP-E04'), 'PR-E04.01', 'Gestión de Comunicación Interna', 'Garantizar el flujo oportuno y transparente de la información oficial, directivas y normativas entre las dependencias universitarias.', 'Abarca a todas las áreas administrativas y académicas de la sede central y filiales.', 'activo'),
((SELECT id FROM sgc.macroprocesos WHERE codigo = 'MP-E04'), 'PR-E04.02', 'Gestión de Comunicación Externa', 'Posicionar la imagen institucional y difundir el quehacer académico, científico y cultural de la UNT hacia la sociedad y medios masivos.', 'Desde el diseño de notas de prensa oficiales hasta la administración del portal web institucional.', 'activo');

-- Actividades para PR-E04.01
INSERT INTO sgc.actividades (proceso_id, secuencia, codigo, nombre, entradas, salidas, indicadores) VALUES 
((SELECT id FROM sgc.procesos WHERE codigo = 'PR-E04.01'), 1, 'ACT-E04.01-01', 'Difusión de Resoluciones y Actas de Órganos de Gobierno', 'Resoluciones Rectorales, acuerdos de Consejo Universitario y Asamblea Universitaria', 'Notificaciones electrónicas masivas distribuidas a la comunidad universitaria', 'Tiempo de respuesta en la publicación interna de documentos de gobierno oficial'),
((SELECT id FROM sgc.procesos WHERE codigo = 'PR-E04.01'), 2, 'ACT-E04.01-02', 'Administración y Soporte de Canales Digitales Internos', 'Requerimientos de comunicación de las facultades, eventos oficiales internos', 'Contenido estructurado para correo institucional, boletines y pantallas informativas', 'Grado de efectividad de las campañas internas medido por engagement');

-- Actividades para PR-E04.02
INSERT INTO sgc.actividades (proceso_id, secuencia, codigo, nombre, entradas, salidas, indicadores) VALUES 
((SELECT id FROM sgc.procesos WHERE codigo = 'PR-E04.02'), 1, 'ACT-E04.02-01', 'Elaboración de Notas de Prensa y Monitoreo de Medios', 'Logros de investigación, convenios, sucesos institucionales de relevancia', 'Notas de prensa enviadas a medios de comunicación nacionales y locales', 'Número de menciones positivas de la universidad en medios informativos'),
((SELECT id FROM sgc.procesos WHERE codigo = 'PR-E04.02'), 2, 'ACT-E04.02-02', 'Actualización de Canales Oficiales Externos', 'Información académica, procesos de admisión, cronogramas de matrícula', 'Portal web institucional y redes sociales corporativas actualizadas al día', 'Tasa de satisfacción de usuarios digitales externos con la claridad de la información');


-- =============================================================================
-- 3. MACROPROCESO: E05 - RELACIONES INTERINSTITUCIONALES
-- =============================================================================

-- Procesos para E05
INSERT INTO sgc.procesos (macroproceso_id, codigo, nombre, objetivo, alcance, estado) VALUES 
((SELECT id FROM sgc.macroprocesos WHERE codigo = 'MP-E05'), 'PR-E05.01', 'Gestión de Convenios Nacionales e Internacionales', 'Establecer alianzas estratégicas con entidades públicas, privadas y universidades del exterior para el desarrollo académico y la movilidad.', 'Desde la evaluación inicial de viabilidad técnica hasta el seguimiento y renovación del convenio.', 'activo'),
((SELECT id FROM sgc.macroprocesos WHERE codigo = 'MP-E05'), 'PR-E05.02', 'Gestión de la Movilidad y Becas', 'Promover el intercambio académico internacional y nacional de estudiantes, docentes e investigadores de la UNT.', 'Abarca los niveles de pregrado y posgrado en la sede central y filiales.', 'activo');

-- Actividades para PR-E05.01
INSERT INTO sgc.actividades (proceso_id, secuencia, codigo, nombre, entradas, salidas, indicadores) VALUES 
((SELECT id FROM sgc.procesos WHERE codigo = 'PR-E05.01'), 1, 'ACT-E05.01-01', 'Evaluación Técnica y Legal de Alianzas', 'Propuestas de convenios multilaterales, planes de trabajo conjuntos', 'Informes de viabilidad emitidos por la Oficina de Asesoría Jurídica y Relaciones Interinstitucionales', 'Porcentaje de convenios aprobados sobre el total de propuestas evaluadas'),
((SELECT id FROM sgc.procesos WHERE codigo = 'PR-E05.01'), 2, 'ACT-E05.01-02', 'Suscripción, Registro y Seguimiento de Convenios', 'Minuta de convenio visada, firmas de los representantes legales', 'Resolución Rectoral de oficialización del convenio e incorporación al padrón institucional', 'Índice de convenios activos con actividades ejecutadas anualmente');

-- Actividades para PR-E05.02
INSERT INTO sgc.actividades (proceso_id, secuencia, codigo, nombre, entradas, salidas, indicadores) VALUES 
((SELECT id FROM sgc.procesos WHERE codigo = 'PR-E05.02'), 1, 'ACT-E05.02-01', 'Gestión de Convocatorias de Intercambio Académico', 'Plazas ofertadas por redes universitarias internacionales y convenios específicos', 'Estudiantes y docentes seleccionados con cartas de aceptación oficiales', 'Número total de alumnos beneficiados con programas de movilidad por ciclo'),
((SELECT id FROM sgc.procesos WHERE codigo = 'PR-E05.02'), 2, 'ACT-E05.02-02', 'Monitoreo de Beneficiarios y Validación de Créditos', 'Certificados de notas emitidos por la universidad de destino, informes de pasantía', 'Resoluciones de convalidación académica en las respectivas facultades', 'Porcentaje de créditos académicos convalidados exitosamente sin retrasos');


-- =============================================================================
-- 4. MACROPROCESO: E06 - DIRECCIÓN ESTRATÉGICA
-- =============================================================================

-- Procesos para E06
INSERT INTO sgc.procesos (macroproceso_id, codigo, nombre, objetivo, alcance, estado) VALUES 
((SELECT id FROM sgc.macroprocesos WHERE codigo = 'MP-E06'), 'PR-E06.01', 'Gestión de la Planificación Institucional', 'Formular, realizar seguimiento y evaluar los planes estratégicos y operativos para orientar el desarrollo institucional y académico.', 'Plan Estratégico Institucional (PEI) y Plan Operativo Institucional (POI) a nivel general.', 'activo'),
((SELECT id FROM sgc.macroprocesos WHERE codigo = 'MP-E06'), 'PR-E06.02', 'Gestión del Presupuesto Institucional', 'Conducir la programación, formulación, modificación y evaluación de la ejecución del presupuesto financiero de la universidad.', 'Abarca todas las fuentes de financiamiento asignadas a la institución.', 'activo');

-- Actividades para PR-E06.01
INSERT INTO sgc.actividades (proceso_id, secuencia, codigo, nombre, entradas, salidas, indicadores) VALUES 
((SELECT id FROM sgc.procesos WHERE codigo = 'PR-E06.01'), 1, 'ACT-E06.01-01', 'Evaluación Semestral del Plan Estratégico Institucional', 'Reportes de cumplimiento de las unidades orgánicas, indicadores de gestión de calidad', 'Informe consolidado de evaluación del PEI 2023-2026 visado por Planeamiento', 'Eficacia del PEI en relación al cumplimiento de los objetivos estratégicos institucionales (Métrica OEI.04)'),
((SELECT id FROM sgc.procesos WHERE codigo = 'PR-E06.01'), 2, 'ACT-E06.01-02', 'Consolidación del Plan Operativo Institucional (POI)', 'Planes operativos y metas físicas propuestas por cada facultad y dirección administrativa', 'Plan Operativo Institucional anual aprobado por el pliego presupuestal', 'Porcentaje de metas físicas alcanzadas por las áreas académicas al cierre de ejercicio');

-- Actividades para PR-E06.02
INSERT INTO sgc.actividades (proceso_id, secuencia, codigo, nombre, entradas, salidas, indicadores) VALUES 
((SELECT id FROM sgc.procesos WHERE codigo = 'PR-E06.02'), 1, 'ACT-E06.02-01', 'Programación y Formulación Presupuestal Anual', 'Techo presupuestal asignado por el MEF, demandas proyectadas de gastos institucionales', 'Anteproyecto de Presupuesto Institucional de Apertura (PIA) aprobado por el Consejo Universitario', 'Desviación porcentual entre el presupuesto solicitado y el presupuesto aprobado'),
((SELECT id FROM sgc.procesos WHERE codigo = 'PR-E06.02'), 2, 'ACT-E06.02-02', 'Evaluación Financiera Trimestral del Presupuesto', 'Ejecución del gasto por genérica, modificaciones presupuestales tramitadas', 'Estados presupuestarios consolidados cargados en los sistemas del Ministerio de Economía', 'Porcentaje de ejecución del presupuesto Institucional Modificado - PIM (Métrica OEI.04)');


-- =============================================================================
-- 5. MACROPROCESO: M02 - INVESTIGACIÓN, DESARROLLO E INNOVACIÓN
-- =============================================================================

-- Procesos para M02
INSERT INTO sgc.procesos (macroproceso_id, codigo, nombre, objetivo, alcance, estado) VALUES 
((SELECT id FROM sgc.macroprocesos WHERE codigo = 'MP-M02'), 'PR-M02.01', 'Gestión de la Investigación Científica', 'Fomentar, evaluar y financiar proyectos de investigación básica y aplicada orientados a resolver problemáticas regionales y nacionales.', 'Líneas de investigación institucionales de pregrado, posgrado y centros de investigación.', 'activo'),
((SELECT id FROM sgc.macroprocesos WHERE codigo = 'MP-M02'), 'PR-M02.02', 'Gestión de Publicaciones, Propiedad Intelectual e Innovación', 'Gestionar los procesos de indexación de artículos científicos, registro de patentes y transferencia tecnológica en beneficio de la sociedad.', 'Comunidad docente, estudiantes e investigadores vinculados al sector productivo.', 'activo');

-- Actividades para PR-M02.01
INSERT INTO sgc.actividades (proceso_id, secuencia, codigo, nombre, entradas, salidas, indicadores) VALUES 
((SELECT id FROM sgc.procesos WHERE codigo = 'PR-M02.01'), 1, 'ACT-M02.01-01', 'Convocatoria y Evaluación de Proyectos con Fondos Concursables', 'Propuestas de proyectos presentadas por docentes calificados, líneas de investigación institucionales', 'Proyectos aprobados con asignación de presupuesto Canon o fondos propios', 'Porcentaje de proyectos de investigación científica adjudicados e implementados en el año'),
((SELECT id FROM sgc.procesos WHERE codigo = 'PR-M02.01'), 2, 'ACT-M02.01-02', 'Monitoreo de Hitos de Investigación y Entrega de Informes', 'Informes de avance técnico, rendiciones financieras de los investigadores principales', 'Certificados de culminación satisfactoria e insumos validados para publicación', 'Índice de cumplimiento de metas y entrega de productos de investigación a término');

-- Actividades para PR-M02.02
INSERT INTO sgc.actividades (proceso_id, secuencia, codigo, nombre, entradas, salidas, indicadores) VALUES 
((SELECT id FROM sgc.procesos WHERE codigo = 'PR-M02.02'), 1, 'ACT-M02.02-01', 'Edición e Indexación en Revistas Científicas de Alto Impacto', 'Manuscritos originales e inéditos generados en la universidad, revisiones por pares', 'Artículos publicados e indexados en bases de datos como Scopus o Web of Science', 'Porcentaje de publicaciones académicas en revistas de alto impacto (Métrica OEI.02)'),
((SELECT id FROM sgc.procesos WHERE codigo = 'PR-M02.02'), 2, 'ACT-M02.02-02', 'Trámite, Registro y Protección de Patentes', 'Modelos de utilidad, invenciones tecnológicas validadas en laboratorio', 'Títulos de patentes inscritos formalmente ante el INDECOPI a nombre de la UNT', 'Porcentaje de patentes registradas sobre las propuestas técnicas planteadas (Métrica OEI.02)');


-- =============================================================================
-- 6. MACROPROCESO: M03 - RESPONSABILIDAD SOCIAL UNIVERSITARIA
-- =============================================================================

-- Procesos para M03
INSERT INTO sgc.procesos (macroproceso_id, codigo, nombre, objetivo, alcance, estado) VALUES 
((SELECT id FROM sgc.macroprocesos WHERE codigo = 'MP-M03'), 'PR-M03.01', 'Identificación de Necesidades y Planificación de Impacto Social', 'Diagnosticar las demandas y expectativas del entorno para planificar intervenciones, programas de extensión y responsabilidad ecológica.', 'Sede central, filiales y comunidades priorizadas en la región de influencia de la UNT.', 'activo'),
((SELECT id FROM sgc.macroprocesos WHERE codigo = 'MP-M03'), 'PR-M03.02', 'Ejecución, Monitoreo y Cierre de Proyectos de RSU', 'Monitorear el desarrollo de las intervenciones comunitarias, asegurando el ejercicio de buenas prácticas y la medición de su impacto.', 'Proyectos de proyección social y sustentabilidad de todas las facultades.', 'activo');

-- Actividades para PR-M03.01
INSERT INTO sgc.actividades (proceso_id, secuencia, codigo, nombre, entradas, salidas, indicadores) VALUES 
((SELECT id FROM sgc.procesos WHERE codigo = 'PR-M03.01'), 1, 'ACT-M03.01-01', 'Diagnóstico de Problemáticas de la Comunidad y del Entorno', 'Mesas de diálogo con actores sociales, planes de desarrollo regional concertados', 'Informe técnico de brechas críticas sociales y ecológicas priorizadas por la UNT', 'Número de comunidades vulnerables diagnosticadas e integradas al plan de RSU'),
((SELECT id FROM sgc.procesos WHERE codigo = 'PR-M03.01'), 2, 'ACT-M03.01-02', 'Diseño y Programación del Portafolio de Proyectos de Extensión', 'Propuestas de intervención metodológica de docentes y estudiantes de pregrado', 'Portafolio de proyectos viables aprobados con resolución de la Dirección de RSU', 'Porcentaje de iniciativas alineadas estrictamente a los objetivos de la Agenda 2030');

-- Actividades para PR-M03.02
INSERT INTO sgc.actividades (proceso_id, secuencia, codigo, nombre, entradas, salidas, indicadores) VALUES 
((SELECT id FROM sgc.procesos WHERE codigo = 'PR-M03.02'), 1, 'ACT-M03.02-01', 'Supervisión de Intervenciones y Monitoreo de Metas', 'Fichas de campo, listas de beneficiarios atendidos, evidencias fotográficas', 'Informes semestrales de avance físico y ejecución de presupuestos asignados a RSU', 'Porcentaje de proyectos de extensión cultural y proyección ejecutados con éxito (Métrica OEI.03)'),
((SELECT id FROM sgc.procesos WHERE codigo = 'PR-M03.02'), 2, 'ACT-M03.02-02', 'Evaluación de Impacto Social y Cierre de Programas', 'Encuestas de satisfacción de la comunidad, informes finales de los dueños de proceso', 'Actas de cierre técnico e informe consolidado de valor público generado por la universidad', 'Porcentaje de proyectos de proyección social evaluados positivamente por el entorno (Métrica OEI.03)');


-- =============================================================================
-- 7. MACROPROCESO: A01 - GESTIÓN DE INFRAESTRUCTURA
-- =============================================================================

-- Procesos para A01
INSERT INTO sgc.procesos (macroproceso_id, codigo, nombre, objetivo, alcance, estado) VALUES 
((SELECT id FROM sgc.macroprocesos WHERE codigo = 'MP-A01'), 'PR-A01.01', 'Elaboración de Estudios y Expedientes Técnicos', 'Diseñar los estudios de preinversión y los expedientes técnicos de infraestructura universitaria bajo criterios de sostenibilidad.', 'Unidad Ejecutora de Inversiones y Oficina de Infraestructura.', 'activo'),
((SELECT id FROM sgc.macroprocesos WHERE codigo = 'MP-A01'), 'PR-A01.02', 'Ejecución, Supervisión y Liquidación de Obras', 'Garantizar la construcción, supervisión técnica y posterior cierre contable de las obras edilicias universitarias dentro de los plazos.', 'Todas las construcciones físicas ejecutadas en la sede central y filiales.', 'activo');

-- Actividades para PR-A01.01
INSERT INTO sgc.actividades (proceso_id, secuencia, codigo, nombre, entradas, salidas, indicadores) VALUES 
((SELECT id FROM sgc.procesos WHERE codigo = 'PR-A01.01'), 1, 'ACT-A01.01-01', 'Elaboración de Estudios de Preinversión', 'Requerimientos institucionales de ampliación de laboratorios o aulas académicas', 'Fichas técnicas de inversión cargadas y aprobadas en el marco de Invierte.pe', 'Tiempo de formulación técnica de proyectos de inversión pública'),
((SELECT id FROM sgc.procesos WHERE codigo = 'PR-A01.01'), 2, 'ACT-A01.01-02', 'Diseño y Aprobación de Expedientes Técnicos de Ingeniería', 'Levantamientos topográficos, estudios de suelos, especificaciones funcionales', 'Expediente Técnico de Obra definitivo visado y aprobado mediante Resolución Gerencial', 'Porcentaje de expedientes aprobados sin requerimientos de reestructuración radical');

-- Actividades para PR-A01.02
INSERT INTO sgc.actividades (proceso_id, secuencia, codigo, nombre, entradas, salidas, indicadores) VALUES 
((SELECT id FROM sgc.procesos WHERE codigo = 'PR-A01.02'), 1, 'ACT-A01.02-01', 'Inspección de Obra y Control de Valorizaciones', 'Cuaderno de obra digital, informes de avance mensual presentados por el contratista', 'Valorizaciones de obra aprobadas para su correspondiente desembolso financiero', 'Desviación temporal en la ejecución física frente al cronograma original de obra'),
((SELECT id FROM sgc.procesos WHERE codigo = 'PR-A01.02'), 2, 'ACT-A01.02-02', 'Recepción de Obra y Liquidación Financiera', 'Acta de constatación física de culminación de trabajos, balances contables', 'Resolución de liquidación técnica y financiera de obra e incorporación al patrimonio', 'Porcentaje de obras públicas cerradas y liquidadas oportunamente en el periodo');


-- =============================================================================
-- 8. MACROPROCESO: A03 - GESTIÓN DEL BIENESTAR UNIVERSITARIO
-- =============================================================================

-- Procesos para A03
INSERT INTO sgc.procesos (macroproceso_id, codigo, nombre, objetivo, alcance, estado) VALUES 
((SELECT id FROM sgc.macroprocesos WHERE codigo = 'MP-A03'), 'PR-A03.01', 'Gestión de los Servicios de Salud y Psicología', 'Brindar servicios de atención primaria en salud, medicina ocupacional y soporte psicopedagógico integral a la comunidad universitaria.', 'Estudiantes de pregrado, posgrado, docentes y personal administrativo.', 'activo'),
((SELECT id FROM sgc.macroprocesos WHERE codigo = 'MP-A03'), 'PR-A03.02', 'Gestión de Apoyo Alimentario y Asistencia Social', 'Administrar el comedor universitario y realizar evaluaciones socioeconómicas para el otorgamiento de incentivos y subvenciones.', 'Estudiantes matriculados en condiciones de vulnerabilidad socioeconómica.', 'activo');

-- Actividades para PR-A03.01
INSERT INTO sgc.actividades (proceso_id, secuencia, codigo, nombre, entradas, salidas, indicadores) VALUES 
((SELECT id FROM sgc.procesos WHERE codigo = 'PR-A03.01'), 1, 'ACT-A03.01-01', 'Atención Médica Preventiva y Ocupacional', 'Fichas médicas de ingresantes, solicitudes de citas por accidentes o síntomas', 'Historias clínicas actualizadas y tratamientos médicos primarios proporcionados', 'Número de campañas de salud preventiva implementadas por ciclo académico'),
((SELECT id FROM sgc.procesos WHERE codigo = 'PR-A03.01'), 2, 'ACT-A03.01-02', 'Evaluación y Soporte Psicológico al Estudiante', 'Fichas de derivación de las facultades, solicitudes espontáneas de soporte', 'Informes psicopedagógicos e intervenciones terapéuticas individuales realizadas', 'Índice de permanencia y baja deserción estudiantil por causales emocionales');

-- Actividades para PR-A03.02
INSERT INTO sgc.actividades (proceso_id, secuencia, codigo, nombre, entradas, salidas, indicadores) VALUES 
((SELECT id FROM sgc.procesos WHERE codigo = 'PR-A03.02'), 1, 'ACT-A03.02-01', 'Evaluación Socioeconómica para Comedor y Becas', 'Solicitudes de subvención estudiantil, declaraciones juradas de ingresos, legajo familiar', 'Padrón de beneficiarios seleccionados con criterios estrictos de equidad', 'Tiempo promedio empleado en la evaluación y publicación oficial del padrón'),
((SELECT id FROM sgc.procesos WHERE codigo = 'PR-A03.02'), 2, 'ACT-A03.02-02', 'Suministro Nutricional en la Unidad Alimentaria', 'Insumos alimenticios verificados, menús balanceados aprobados por nutricionista', 'Raciones alimentarias servidas cumpliendo estándares estrictos de inocuidad', 'Grado de satisfacción estudiantil con la calidad del servicio del comedor universitario');


-- =============================================================================
-- 9. MACROPROCESO: A04 - GESTIÓN LOGÍSTICA Y CONTROL PATRIMONIAL
-- =============================================================================

-- Procesos para A04
INSERT INTO sgc.procesos (macroproceso_id, codigo, nombre, objetivo, alcance, estado) VALUES 
((SELECT id FROM sgc.macroprocesos WHERE codigo = 'MP-A04'), 'PR-A04.01', 'Gestión de Adquisiciones y Contrataciones', 'Garantizar el abastecimiento oportuno de bienes, servicios y consultorías requeridas por la universidad bajo principios de transparencia.', 'Desde la formulación del plan anual de contrataciones hasta la suscripción contractual.', 'activo'),
((SELECT id FROM sgc.macroprocesos WHERE codigo = 'MP-A04'), 'PR-A04.02', 'Gestión de Almacén y Bienes Patrimoniales', 'Controlar el ingreso, almacenamiento, distribución y control del inventario físico y activos fijos de la universidad.', 'Abarca el patrimonio de todas las unidades orgánicas de la institución.', 'activo');

-- Actividades para PR-A04.01
INSERT INTO sgc.actividades (proceso_id, secuencia, codigo, nombre, entradas, salidas, indicadores) VALUES 
((SELECT id FROM sgc.procesos WHERE codigo = 'PR-A04.01'), 1, 'ACT-A04.01-01', 'Formulación y Modificación del PAC', 'Cuadros de necesidades consolidados de las facultades, presupuesto institucional autorizado', 'Plan Anual de Contrataciones (PAC) publicado formalmente en la plataforma SEACE', 'Porcentaje de ejecución de los procesos programados originalmente en el PAC'),
((SELECT id FROM sgc.procesos WHERE codigo = 'PR-A04.01'), 2, 'ACT-A04.01-02', 'Conducción de Procesos de Selección de Proveedores', 'Expedientes de contratación visados, bases técnicas elaboradas por los comités', 'Contratos de adquisición de bienes o prestación de servicios suscritos formalmente', 'Porcentaje de procesos de selección declarados desiertos en el periodo');

-- Actividades para PR-A04.02
INSERT INTO sgc.actividades (proceso_id, secuencia, codigo, nombre, entradas, salidas, indicadores) VALUES 
((SELECT id FROM sgc.procesos WHERE codigo = 'PR-A04.02'), 1, 'ACT-A04.02-01', 'Recepción, Custodia y Despacho en Almacén', 'Guías de remisión de proveedores, órdenes de compra debidamente devengadas', 'Pecosas de distribución emitidas y bienes entregados a las áreas usuarias', 'Índice de exactitud del inventario físico en auditorías de almacén sorpresa'),
((SELECT id FROM sgc.procesos WHERE codigo = 'PR-A04.02'), 2, 'ACT-A04.02-02', 'Inventariado, Etiquetado y Conciliación Patrimonial', 'Bienes de capital adquiridos o donados, solicitudes de alta o baja de activos', 'Padrón general de activos fijos actualizado y debidamente conciliado con Contabilidad', 'Porcentaje de bienes institucionales inventariados y etiquetados con tecnología de barras');


-- =============================================================================
-- 10. MACROPROCESO: A05 - GESTIÓN DE MANTENIMIENTO Y TRANSPORTE
-- =============================================================================

-- Procesos para A05
INSERT INTO sgc.procesos (macroproceso_id, codigo, nombre, objetivo, alcance, estado) VALUES 
((SELECT id FROM sgc.macroprocesos WHERE codigo = 'MP-A05'), 'PR-A05.01', 'Gestión de Mantenimiento de Infraestructura y Equipos', 'Planificar y ejecutar el mantenimiento preventivo y correctivo de locales, redes eléctricas y equipamiento de laboratorios científicos.', 'Sede central y filiales, abarcando todas las instalaciones de la UNT.', 'activo'),
((SELECT id FROM sgc.macroprocesos WHERE codigo = 'MP-A05'), 'PR-A05.02', 'Gestión de Servicios de Transporte y Movilidad Física', 'Administrar de forma eficiente la flota de vehículos institucionales de la universidad para el traslado de la comunidad universitaria.', 'Servicios de transporte académico, de investigación y gestiones oficiales.', 'activo');

-- Actividades para PR-A05.01
INSERT INTO sgc.actividades (proceso_id, secuencia, codigo, nombre, entradas, salidas, indicadores) VALUES 
((SELECT id FROM sgc.procesos WHERE codigo = 'PR-A05.01'), 1, 'ACT-A05.01-01', 'Ejecución del Plan Preventivo de Obras Civiles y Electricidad', 'Plan anual de mantenimiento, reportes técnicos de desgaste en instalaciones académicas', 'Ambientes educativos y sistemas eléctricos funcionando con normalidad técnica', 'Porcentaje de órdenes de mantenimiento preventivo ejecutadas según el plan'),
((SELECT id FROM sgc.procesos WHERE codigo = 'PR-A05.01'), 2, 'ACT-A05.01-02', 'Calibración y Reparación de Equipos de Laboratorio', 'Solicitudes de reparación urgente de facultades, manuales técnicos del fabricante', 'Equipos operativos validados con informes técnicos de calibración aptos', 'Tiempo medio de respuesta ante fallas críticas de infraestructura o equipos');

-- Actividades para PR-A05.02
INSERT INTO sgc.actividades (proceso_id, secuencia, codigo, nombre, entradas, salidas, indicadores) VALUES 
((SELECT id FROM sgc.procesos WHERE codigo = 'PR-A05.02'), 1, 'ACT-A05.02-01', 'Programación de Rutas de Transporte e Itinerarios Académicos', 'Solicitudes de salida de campo de las escuelas, horarios establecidos de rutas internas', 'Hojas de ruta aprobadas y asignación de choferes con órdenes de comisión oficiales', 'Porcentaje de solicitudes de transporte académico atendidas favorablemente'),
((SELECT id FROM sgc.procesos WHERE codigo = 'PR-A05.02'), 2, 'ACT-A05.02-02', 'Control de Combustible y Mantenimiento de Unidades Móviles', 'Kilometrajes registrados, bitácoras de uso vehicular diario, facturas de combustible', 'Flota de vehículos institucionales con revisiones al día y óptima disponibilidad operativa', 'Gasto real en mantenimiento de flota frente a la estimación presupuestada');


-- =============================================================================
-- 11. MACROPROCESO: A07 - GESTIÓN DE ASUNTOS JURÍDICOS Y LEGALES
-- =============================================================================

-- Procesos para A07
INSERT INTO sgc.procesos (macroproceso_id, codigo, nombre, objetivo, alcance, estado) VALUES 
((SELECT id FROM sgc.macroprocesos WHERE codigo = 'MP-A07'), 'PR-A07.01', 'Gestión de Asesoría Legal y Administrativa', 'Absolver consultas jurídicas y dictaminar la legalidad de los proyectos de normativas y convenios emitidos por el despacho Rectoral.', 'Asuntos de índole administrativa generados por las dependencias orgánicas.', 'activo'),
((SELECT id FROM sgc.procesos WHERE codigo = 'MP-A07'), 'PR-A07.02', 'Gestión de la Defensa Judicial de la Institución', 'Representar y defender judicialmente los derechos e intereses de la universidad ante los órganos jurisdiccionales del Estado.', 'Procesos en materia laboral, civil, penal, constitucional y contencioso-administrativa.', 'activo');

-- Actividades para PR-A07.01
INSERT INTO sgc.actividades (proceso_id, secuencia, codigo, nombre, entradas, salidas, indicadores) VALUES 
((SELECT id FROM sgc.procesos WHERE codigo = 'PR-A07.01'), 1, 'ACT-A07.01-01', 'Emisión de Dictámenes e Informes Legales', 'Expedientes administrativos en consulta, solicitudes de interpretación de estatutos', 'Informes jurídicos fundamentados legalmente con recomendaciones vinculantes', 'Tiempo promedio de respuesta en la emisión de dictámenes legales de control'),
((SELECT id FROM sgc.procesos WHERE codigo = 'PR-A07.01'), 2, 'ACT-A07.01-02', 'Visación y Revisión de Proyectos de Resoluciones y Convenios', 'Borradores de convenios marco o específicos, proyectos de reglamentos institucionales', 'Documentos visados con visto bueno técnico-legal listos para firma rectoral', 'Porcentaje de convenios o resoluciones observadas externamente por vicios de forma');

-- Actividades para PR-A07.02
INSERT INTO sgc.actividades (proceso_id, secuencia, codigo, nombre, entradas, salidas, indicadores) VALUES 
((SELECT id FROM sgc.procesos WHERE codigo = 'PR-A07.02'), 1, 'ACT-A07.02-01', 'Formulación de Demandas, Contestaciones y Apelaciones', 'Notificaciones de demandas judiciales recibidas, requerimientos de procuraduría', 'Escritos legales de contestación judicial presentados formalmente ante juzgados', 'Porcentaje de plazos de ley cumplidos sin incurrir en rebeldía procesal'),
((SELECT id FROM sgc.procesos WHERE codigo = 'PR-A07.02'), 2, 'ACT-A07.02-02', 'Participación en Audiencias y Diligencias Judiciales', 'Citaciones judiciales de comparecencia, programaciones de salas judiciales', 'Actas de audiencias y defensas orales sustentadas por el equipo de letrados', 'Tasa de sentencias resueltas a favor de los intereses patrimoniales de la UNT');


-- =============================================================================
-- 12. MACROPROCESO: A08 - GESTIÓN DE CENTROS DE INFORMACIÓN Y REFERENCIAS
-- =============================================================================

-- Procesos para A08
INSERT INTO sgc.procesos (macroproceso_id, codigo, nombre, objetivo, alcance, estado) VALUES 
((SELECT id FROM sgc.macroprocesos WHERE codigo = 'MP-A08'), 'PR-A08.01', 'Gestión de Procesamiento Técnico de Recursos de Información', 'Catalogar, clasificar e indexar los recursos bibliográficos físicos y digitales de la universidad para garantizar su fácil acceso.', 'Biblioteca central, bibliotecas especializadas de facultades y repositorio digital.', 'activo'),
((SELECT id FROM sgc.macroprocesos WHERE codigo = 'MP-A08'), 'PR-A08.02', 'Gestión de Servicios de Atención al Usuario e Intercambio', 'Administrar las salas de lectura, préstamos a domicilio, biblioteca virtual y capacitación en base de datos científicas.', 'Comunidad de estudiantes, egresados, docentes y usuarios externos autorizados.', 'activo');

-- Actividades para PR-A08.01
INSERT INTO sgc.actividades (proceso_id, secuencia, codigo, nombre, entradas, salidas, indicadores) VALUES 
((SELECT id FROM sgc.procesos WHERE codigo = 'PR-A08.01'), 1, 'ACT-A08.01-01', 'Catalogación y Clasificación de Material Bibliográfico', 'Nuevos libros adquiridos, donaciones recibidas, tesis impresas entregadas', 'Registros bibliográficos cargados e indexados bajo el sistema integrado de biblioteca', 'Número de nuevos volúmenes procesados técnicamente e incorporados por mes'),
((SELECT id FROM sgc.procesos WHERE codigo = 'PR-A08.01'), 2, 'ACT-A08.01-02', 'Carga y Validación de Trabajos de Investigación en el Repositorio', 'Tesis aprobadas en formato digital, actas de sustentación, declaraciones de autoría', 'Metadatos validados y documentos publicados con identificadores URI en el repositorio', 'Porcentaje de tesis publicadas en el repositorio sin errores de indexación formal');

-- Actividades para PR-A08.02
INSERT INTO sgc.actividades (proceso_id, secuencia, codigo, nombre, entradas, salidas, indicadores) VALUES 
((SELECT id FROM sgc.procesos WHERE codigo = 'PR-A08.02'), 1, 'ACT-A08.02-01', 'Control de Préstamos y Devolución de Libros', 'Carné de biblioteca universitario vigente, solicitudes de reserva en sala o domicilio', 'Libros entregados físicamente y registros de transacciones cerrados en el sistema', 'Tiempo promedio empleado en la atención presencial del servicio de préstamo'),
((SELECT id FROM sgc.procesos WHERE codigo = 'PR-A08.02'), 2, 'ACT-A08.02-02', 'Capacitación al Usuario en el Uso de Bases de Datos Científicas', 'Plan de alfabetización informacional, solicitudes de talleres por parte de facultades', 'Estudiantes y docentes entrenados en la búsqueda avanzada en Scopus o ScienceDirect', 'Grado de incremento en el uso de los recursos de la biblioteca virtual institucional');


-- =============================================================================
-- 13. MACROPROCESO: A09 - GESTIÓN FINANCIERA
-- =============================================================================

-- Procesos para A09
INSERT INTO sgc.procesos (macroproceso_id, codigo, nombre, objetivo, alcance, estado) VALUES 
((SELECT id FROM sgc.macroprocesos WHERE codigo = 'MP-A09'), 'PR-A09.01', 'Gestión Contable y Rendición de Cuentas', 'Efectuar el registro sistemático de las operaciones financieras, de costos y control patrimonial para la elaboración de estados financieros.', 'Unidad de Contabilidad a nivel pliego presupuestal.', 'activo'),
((SELECT id FROM sgc.macroprocesos WHERE codigo = 'MP-A09'), 'PR-A09.02', 'Gestión de Tesorería, Pagos y Recaudación', 'Garantizar la adecuada custodia de fondos públicos, programación de giros de planillas y la recaudación técnica de ingresos propios.', 'Manejo de cuentas bancarias y caja centralizada de la universidad.', 'activo');

-- Actividades para PR-A09.01
INSERT INTO sgc.actividades (proceso_id, secuencia, codigo, nombre, entradas, salidas, indicadores) VALUES 
((SELECT id FROM sgc.procesos WHERE codigo = 'PR-A09.01'), 1, 'ACT-A09.01-01', 'Registro de Operaciones Financieras y Devengados', 'Expedientes SIAF autorizados, facturas comerciales validadas por logística, valorizaciones', 'Asientos contables e integración de información financiera en el sistema SIAF-SP', 'Porcentaje de transacciones financieras registradas y devengadas sin retraso diario'),
((SELECT id FROM sgc.procesos WHERE codigo = 'PR-A09.01'), 2, 'ACT-A09.01-02', 'Elaboración y Conciliación de Estados Financieros', 'Balances mensuales de las subcuentas, conciliaciones bancarias revisadas', 'Estados Financieros y de Presupuesto consolidados listos para remisión a la DNCP', 'Porcentaje de informes contables aprobados por la Dirección Nacional de Contabilidad');

-- Actividades para PR-A09.02
INSERT INTO sgc.actividades (proceso_id, secuencia, codigo, nombre, entradas, salidas, indicadores) VALUES 
((SELECT id FROM sgc.procesos WHERE codigo = 'PR-A09.02'), 1, 'ACT-A09.02-01', 'Programación y Ejecución de Pagos y Giros Financieros', 'Expedientes contables devengados, calendarios mensuales de pago autorizados', 'Transferencias bancarias a cuentas de proveedores, remuneraciones abonadas en planilla', 'Tiempo de respuesta en la emisión y efectividad de giros financieros autorizados'),
((SELECT id FROM sgc.procesos WHERE codigo = 'PR-A09.02'), 2, 'ACT-A09.02-02', 'Recaudación de Recursos Directamente Recaudados', 'Pagos de tasas por matrículas, derechos de examen de admisión, servicios externos', 'Fondos públicos centralizados e incorporados a las subcuentas bancarias del tesoro', 'Desviación porcentual entre los ingresos recaudados reales y la meta programada');

COMMIT;

```

---

### Análisis y Alineación de Atributos bajo la Norma ISO 9001:2015

Al poblar y complementar estas tablas dinámicas mediante este script automatizado, tu backend mantendrá una coherencia rigurosa de control de datos:

* 
**Trazabilidad del Flujo de Procesos (`entradas` / `salidas`):** Los campos reflejan de manera clara y directa el principio ISO de "Enfoque basado en Procesos". Cada actividad cuenta con entradas auditables y genera salidas operativas tangibles o documentarias, eliminando ambigüedades lógicas en el sistema.


* 
**Enfoque de Mejora Continua (`indicadores`):** Las métricas incluidas en las actividades terminales de los macroprocesos de Dirección Estratégica (`E06`) y de Investigación (`M02`) están directamente vinculadas a los indicadores reales aprobados en la Resolución de la universidad (`OEI.02`, `OEI.04`), asegurando que tu visualizador dinámico en Next.js pinte datos de valor en auditorías de certificación externas.