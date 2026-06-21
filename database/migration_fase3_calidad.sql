-- Migración Fase 3: Evaluación y Mejora Continua (Flujo de Calidad)

-- 1. Actualizar check constraint de planes_auditoria
ALTER TABLE sgc.planes_auditoria DROP CONSTRAINT IF EXISTS chk_planes_estado;
ALTER TABLE sgc.planes_auditoria ADD CONSTRAINT chk_planes_estado CHECK (estado IN ('planificado', 'en_ejecucion', 'ejecutado', 'cerrado', 'cancelado'));

ALTER TABLE sgc.planes_auditoria DROP CONSTRAINT IF EXISTS chk_planes_tipo;
ALTER TABLE sgc.planes_auditoria ADD CONSTRAINT chk_planes_tipo CHECK (tipo IN ('interna', 'externa', 'especial', 'seguimiento', 'certificacion'));

-- 2. Actualizar check constraint y agregar columna justificacion en hallazgos
ALTER TABLE sgc.hallazgos DROP CONSTRAINT IF EXISTS chk_hallazgos_estado;
ALTER TABLE sgc.hallazgos ADD CONSTRAINT chk_hallazgos_estado CHECK (estado IN ('abierto', 'en_proceso', 'en_tratamiento', 'cerrado'));

ALTER TABLE sgc.hallazgos DROP CONSTRAINT IF EXISTS chk_hallazgos_gravedad;
ALTER TABLE sgc.hallazgos ADD CONSTRAINT chk_hallazgos_gravedad CHECK (gravedad IN ('baja', 'media', 'alta', 'critica', 'mayor', 'menor', 'observacion'));

ALTER TABLE sgc.hallazgos ADD COLUMN IF NOT EXISTS justificacion TEXT;

-- 3. Actualizar check constraint de capas
ALTER TABLE sgc.capas DROP CONSTRAINT IF EXISTS chk_capas_efectividad;
ALTER TABLE sgc.capas ADD CONSTRAINT chk_capas_efectividad CHECK (efectividad IS NULL OR efectividad IN ('efectiva', 'parcial', 'parcialmente_efectiva', 'no_efectiva', 'pendiente'));
