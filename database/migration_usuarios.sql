-- ============================================================
-- MIGRACIÓN: Agregar columna codigo a la tabla usuarios
-- ============================================================

ALTER TABLE sgc.usuarios ADD COLUMN IF NOT EXISTS codigo VARCHAR(50);
ALTER TABLE sgc.usuarios DROP CONSTRAINT IF EXISTS uq_usuarios_codigo;
ALTER TABLE sgc.usuarios ADD CONSTRAINT uq_usuarios_codigo UNIQUE (codigo);
