-- ============================================================
-- MIGRACIÓN: Mejoras en Mapa de Procesos (SGC)
-- ============================================================

-- 1. Modificar tipos de macroproceso para permitir 'evaluacion'
ALTER TABLE sgc.macroprocesos DROP CONSTRAINT IF EXISTS chk_macroprocesos_tipo;
ALTER TABLE sgc.macroprocesos ADD CONSTRAINT chk_macroprocesos_tipo 
  CHECK (tipo IN ('estrategico', 'misional', 'apoyo', 'evaluacion'));

-- 2. Modificar tabla de procesos para agregar estado
ALTER TABLE sgc.procesos ADD COLUMN IF NOT EXISTS estado VARCHAR(30) NOT NULL DEFAULT 'activo'
  CONSTRAINT chk_procesos_estado CHECK (estado IN ('activo', 'inactivo', 'en_mejora'));

-- 3. Crear trigger para sincronizar la columna activa anterior con la columna de estado
CREATE OR REPLACE FUNCTION sgc.fn_sincronizar_proceso_activo()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.estado = 'inactivo' THEN
        NEW.activo = FALSE;
    ELSE
        NEW.activo = TRUE;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_procesos_activo_sync ON sgc.procesos;
CREATE TRIGGER trg_procesos_activo_sync
    BEFORE INSERT OR UPDATE ON sgc.procesos
    FOR EACH ROW EXECUTE FUNCTION sgc.fn_sincronizar_proceso_activo();

-- 4. Modificar la tabla de actividades_proceso
ALTER TABLE sgc.actividades_proceso ADD COLUMN IF NOT EXISTS codigo VARCHAR(50);
ALTER TABLE sgc.actividades_proceso ADD COLUMN IF NOT EXISTS indicadores TEXT;

-- Habilitar restricción de no nulo y único sobre el código de actividades (dado que hay 0 registros)
ALTER TABLE sgc.actividades_proceso ALTER COLUMN codigo SET NOT NULL;
ALTER TABLE sgc.actividades_proceso DROP CONSTRAINT IF EXISTS uq_actividades_proceso_codigo;
ALTER TABLE sgc.actividades_proceso ADD CONSTRAINT uq_actividades_proceso_codigo UNIQUE (codigo);
