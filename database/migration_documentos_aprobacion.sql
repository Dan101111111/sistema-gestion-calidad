-- ============================================================
-- MIGRACIÓN: Agregar requiere_aprobacion a tipos_documento
-- ============================================================

ALTER TABLE sgc.tipos_documento ADD COLUMN IF NOT EXISTS requiere_aprobacion BOOLEAN DEFAULT TRUE;
