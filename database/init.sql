-- ============================================================
-- SGC-UNT v2.0 — Script de inicialización de base de datos
-- PostgreSQL 16 | Esquema: sgc
-- ============================================================

-- Extensiones
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Crear esquema
CREATE SCHEMA IF NOT EXISTS sgc;
SET search_path TO sgc, public;

-- ============================================================
-- FUNCIÓN GENÉRICA: actualizar modificado_en
-- ============================================================
CREATE OR REPLACE FUNCTION sgc.fn_actualizar_modificado_en()
RETURNS TRIGGER AS $$
BEGIN
    NEW.modificado_en = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- TABLA: roles_permisos
-- ============================================================
CREATE TABLE sgc.roles_permisos (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rol              VARCHAR(50) NOT NULL UNIQUE,
    permisos         JSONB NOT NULL DEFAULT '{}',
    descripcion      TEXT,
    activo           BOOLEAN NOT NULL DEFAULT TRUE,
    creado_en        TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    modificado_en    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_roles_permisos_rol ON sgc.roles_permisos(rol);
CREATE TRIGGER trg_roles_permisos_modificado
    BEFORE UPDATE ON sgc.roles_permisos
    FOR EACH ROW EXECUTE FUNCTION sgc.fn_actualizar_modificado_en();

-- ============================================================
-- TABLA: usuarios
-- ============================================================
CREATE TABLE sgc.usuarios (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre              VARCHAR(100) NOT NULL,
    apellido            VARCHAR(100) NOT NULL,
    codigo              VARCHAR(50) UNIQUE,
    email               VARCHAR(255) NOT NULL UNIQUE,
    password_hash       TEXT NOT NULL,
    rol                 VARCHAR(50) NOT NULL DEFAULT 'invitado',
    facultad            VARCHAR(150),
    escuela             VARCHAR(150),
    telefono            VARCHAR(20),
    activo              BOOLEAN NOT NULL DEFAULT TRUE,
    intentos_fallidos   INTEGER NOT NULL DEFAULT 0,
    bloqueado_hasta     TIMESTAMP WITH TIME ZONE,
    ultimo_acceso       TIMESTAMP WITH TIME ZONE,
    token_recuperacion  TEXT,
    token_exp_recuperacion TIMESTAMP WITH TIME ZONE,
    creado_en           TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    modificado_en       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    creado_por          UUID REFERENCES sgc.usuarios(id) ON DELETE SET NULL,
    modificado_por      UUID REFERENCES sgc.usuarios(id) ON DELETE SET NULL,
    CONSTRAINT chk_usuarios_rol CHECK (rol IN ('admin','gestor_calidad','auditor','docente','estudiante','egresado','invitado'))
);
CREATE INDEX idx_usuarios_email ON sgc.usuarios(email);
CREATE INDEX idx_usuarios_rol ON sgc.usuarios(rol);
CREATE INDEX idx_usuarios_activo ON sgc.usuarios(activo);
CREATE INDEX idx_usuarios_facultad ON sgc.usuarios(facultad);
CREATE TRIGGER trg_usuarios_modificado
    BEFORE UPDATE ON sgc.usuarios
    FOR EACH ROW EXECUTE FUNCTION sgc.fn_actualizar_modificado_en();

-- ============================================================
-- TABLA: sesiones
-- ============================================================
CREATE TABLE sgc.sesiones (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id      UUID NOT NULL REFERENCES sgc.usuarios(id) ON DELETE CASCADE,
    refresh_token   TEXT NOT NULL UNIQUE,
    ip              VARCHAR(45),
    user_agent      TEXT,
    expira_en       TIMESTAMP WITH TIME ZONE NOT NULL,
    activo          BOOLEAN NOT NULL DEFAULT TRUE,
    creado_en       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_sesiones_usuario_id ON sgc.sesiones(usuario_id);
CREATE INDEX idx_sesiones_refresh_token ON sgc.sesiones(refresh_token);
CREATE INDEX idx_sesiones_activo ON sgc.sesiones(activo);

-- ============================================================
-- TABLA: parametros_sistema
-- ============================================================
CREATE TABLE sgc.parametros_sistema (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clave           VARCHAR(100) NOT NULL UNIQUE,
    valor           TEXT NOT NULL,
    tipo            VARCHAR(50) NOT NULL DEFAULT 'string',
    descripcion     TEXT,
    modificado_por  UUID REFERENCES sgc.usuarios(id) ON DELETE SET NULL,
    modificado_en   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_parametros_tipo CHECK (tipo IN ('string','number','boolean','json','color','url'))
);
CREATE INDEX idx_parametros_clave ON sgc.parametros_sistema(clave);

-- ============================================================
-- TABLA: tipos_documento
-- ============================================================
CREATE TABLE sgc.tipos_documento (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre      VARCHAR(100) NOT NULL UNIQUE,
    codigo      VARCHAR(10) NOT NULL UNIQUE,
    descripcion TEXT,
    activo      BOOLEAN NOT NULL DEFAULT TRUE,
    creado_en   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLA: macroprocesos
-- ============================================================
CREATE TABLE sgc.macroprocesos (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo          VARCHAR(20) NOT NULL UNIQUE,
    nombre          VARCHAR(200) NOT NULL,
    descripcion     TEXT,
    tipo            VARCHAR(50) NOT NULL DEFAULT 'estrategico',
    orden           INTEGER NOT NULL DEFAULT 0,
    responsable_id  UUID REFERENCES sgc.usuarios(id) ON DELETE SET NULL,
    activo          BOOLEAN NOT NULL DEFAULT TRUE,
    creado_en       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    modificado_en   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    creado_por      UUID REFERENCES sgc.usuarios(id) ON DELETE SET NULL,
    modificado_por  UUID REFERENCES sgc.usuarios(id) ON DELETE SET NULL,
    CONSTRAINT chk_macroprocesos_tipo CHECK (tipo IN ('estrategico','misional','apoyo'))
);
CREATE INDEX idx_macroprocesos_codigo ON sgc.macroprocesos(codigo);
CREATE INDEX idx_macroprocesos_tipo ON sgc.macroprocesos(tipo);
CREATE TRIGGER trg_macroprocesos_modificado
    BEFORE UPDATE ON sgc.macroprocesos
    FOR EACH ROW EXECUTE FUNCTION sgc.fn_actualizar_modificado_en();

-- ============================================================
-- TABLA: procesos
-- ============================================================
CREATE TABLE sgc.procesos (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo              VARCHAR(20) NOT NULL UNIQUE,
    nombre              VARCHAR(200) NOT NULL,
    objetivo            TEXT,
    alcance             TEXT,
    macroproceso_id     UUID REFERENCES sgc.macroprocesos(id) ON DELETE RESTRICT,
    responsable_id      UUID REFERENCES sgc.usuarios(id) ON DELETE SET NULL,
    orden               INTEGER NOT NULL DEFAULT 0,
    activo              BOOLEAN NOT NULL DEFAULT TRUE,
    busqueda_fts        TSVECTOR,
    creado_en           TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    modificado_en       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    creado_por          UUID REFERENCES sgc.usuarios(id) ON DELETE SET NULL,
    modificado_por      UUID REFERENCES sgc.usuarios(id) ON DELETE SET NULL
);
CREATE INDEX idx_procesos_codigo ON sgc.procesos(codigo);
CREATE INDEX idx_procesos_macroproceso ON sgc.procesos(macroproceso_id);
CREATE INDEX idx_procesos_fts ON sgc.procesos USING GIN(busqueda_fts);
CREATE INDEX idx_procesos_nombre_trgm ON sgc.procesos USING GIN(nombre gin_trgm_ops);
CREATE TRIGGER trg_procesos_modificado
    BEFORE UPDATE ON sgc.procesos
    FOR EACH ROW EXECUTE FUNCTION sgc.fn_actualizar_modificado_en();

-- Trigger FTS para procesos
CREATE OR REPLACE FUNCTION sgc.fn_procesos_fts()
RETURNS TRIGGER AS $$
BEGIN
    NEW.busqueda_fts = to_tsvector('spanish',
        COALESCE(NEW.codigo,'') || ' ' ||
        COALESCE(NEW.nombre,'') || ' ' ||
        COALESCE(NEW.objetivo,'') || ' ' ||
        COALESCE(NEW.alcance,'')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER trg_procesos_fts
    BEFORE INSERT OR UPDATE ON sgc.procesos
    FOR EACH ROW EXECUTE FUNCTION sgc.fn_procesos_fts();

-- ============================================================
-- TABLA: actividades_proceso
-- ============================================================
CREATE TABLE sgc.actividades_proceso (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    proceso_id      UUID NOT NULL REFERENCES sgc.procesos(id) ON DELETE CASCADE,
    nombre          VARCHAR(200) NOT NULL,
    descripcion     TEXT,
    entradas        TEXT,
    salidas         TEXT,
    responsable_id  UUID REFERENCES sgc.usuarios(id) ON DELETE SET NULL,
    secuencia       INTEGER NOT NULL DEFAULT 0,
    activo          BOOLEAN NOT NULL DEFAULT TRUE,
    creado_en       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    modificado_en   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_actividades_proceso_id ON sgc.actividades_proceso(proceso_id);
CREATE TRIGGER trg_actividades_modificado
    BEFORE UPDATE ON sgc.actividades_proceso
    FOR EACH ROW EXECUTE FUNCTION sgc.fn_actualizar_modificado_en();

-- ============================================================
-- TABLA: flujos_trabajo
-- ============================================================
CREATE TABLE sgc.flujos_trabajo (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    proceso_id          UUID NOT NULL REFERENCES sgc.procesos(id) ON DELETE CASCADE,
    nombre              VARCHAR(200) NOT NULL,
    definicion_bpmn     JSONB NOT NULL DEFAULT '{}',
    version             VARCHAR(10) NOT NULL DEFAULT '1.0',
    activo              BOOLEAN NOT NULL DEFAULT TRUE,
    creado_en           TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    modificado_en       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    creado_por          UUID REFERENCES sgc.usuarios(id) ON DELETE SET NULL
);
CREATE INDEX idx_flujos_proceso_id ON sgc.flujos_trabajo(proceso_id);
CREATE TRIGGER trg_flujos_modificado
    BEFORE UPDATE ON sgc.flujos_trabajo
    FOR EACH ROW EXECUTE FUNCTION sgc.fn_actualizar_modificado_en();

-- ============================================================
-- TABLA: documentos
-- ============================================================
CREATE TABLE sgc.documentos (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo                  VARCHAR(30) NOT NULL UNIQUE,
    titulo                  VARCHAR(300) NOT NULL,
    tipo_id                 UUID REFERENCES sgc.tipos_documento(id) ON DELETE RESTRICT,
    contenido               TEXT,
    estado                  VARCHAR(30) NOT NULL DEFAULT 'borrador',
    version_actual          INTEGER NOT NULL DEFAULT 1,
    proceso_id              UUID REFERENCES sgc.procesos(id) ON DELETE SET NULL,
    responsable_id          UUID REFERENCES sgc.usuarios(id) ON DELETE SET NULL,
    fecha_vigencia_inicio   DATE,
    fecha_vigencia_fin      DATE,
    archivo_id              UUID,
    busqueda_fts            TSVECTOR,
    creado_en               TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    modificado_en           TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    creado_por              UUID REFERENCES sgc.usuarios(id) ON DELETE SET NULL,
    modificado_por          UUID REFERENCES sgc.usuarios(id) ON DELETE SET NULL,
    CONSTRAINT chk_documentos_estado CHECK (estado IN ('borrador','en_revision','aprobado','rechazado','archivado')),
    CONSTRAINT chk_documentos_vigencia CHECK (fecha_vigencia_fin IS NULL OR fecha_vigencia_fin >= fecha_vigencia_inicio)
);
CREATE INDEX idx_documentos_codigo ON sgc.documentos(codigo);
CREATE INDEX idx_documentos_estado ON sgc.documentos(estado);
CREATE INDEX idx_documentos_tipo_id ON sgc.documentos(tipo_id);
CREATE INDEX idx_documentos_proceso_id ON sgc.documentos(proceso_id);
CREATE INDEX idx_documentos_responsable ON sgc.documentos(responsable_id);
CREATE INDEX idx_documentos_fts ON sgc.documentos USING GIN(busqueda_fts);
CREATE INDEX idx_documentos_titulo_trgm ON sgc.documentos USING GIN(titulo gin_trgm_ops);
CREATE INDEX idx_documentos_vigencia ON sgc.documentos(fecha_vigencia_fin);
CREATE TRIGGER trg_documentos_modificado
    BEFORE UPDATE ON sgc.documentos
    FOR EACH ROW EXECUTE FUNCTION sgc.fn_actualizar_modificado_en();

-- Trigger FTS para documentos
CREATE OR REPLACE FUNCTION sgc.fn_documentos_fts()
RETURNS TRIGGER AS $$
BEGIN
    NEW.busqueda_fts = to_tsvector('spanish',
        COALESCE(NEW.codigo,'') || ' ' ||
        COALESCE(NEW.titulo,'') || ' ' ||
        COALESCE(NEW.contenido,'')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER trg_documentos_fts
    BEFORE INSERT OR UPDATE ON sgc.documentos
    FOR EACH ROW EXECUTE FUNCTION sgc.fn_documentos_fts();

-- ============================================================
-- TABLA: versiones_documento
-- ============================================================
CREATE TABLE sgc.versiones_documento (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    documento_id        UUID NOT NULL REFERENCES sgc.documentos(id) ON DELETE CASCADE,
    numero_version      INTEGER NOT NULL,
    contenido_anterior  TEXT,
    contenido_nuevo     TEXT,
    estado_anterior     VARCHAR(30),
    estado_nuevo        VARCHAR(30),
    modificado_por      UUID REFERENCES sgc.usuarios(id) ON DELETE SET NULL,
    comentario          TEXT,
    creado_en           TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(documento_id, numero_version)
);
CREATE INDEX idx_versiones_documento_id ON sgc.versiones_documento(documento_id);

-- ============================================================
-- TABLA: aprobaciones_documento
-- ============================================================
CREATE TABLE sgc.aprobaciones_documento (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    documento_id        UUID NOT NULL REFERENCES sgc.documentos(id) ON DELETE CASCADE,
    aprobador_id        UUID REFERENCES sgc.usuarios(id) ON DELETE SET NULL,
    accion              VARCHAR(30) NOT NULL,
    comentario          TEXT,
    estado_resultante   VARCHAR(30),
    creado_en           TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_aprobaciones_accion CHECK (accion IN ('enviar_revision','aprobar','rechazar','archivar'))
);
CREATE INDEX idx_aprobaciones_documento_id ON sgc.aprobaciones_documento(documento_id);

-- ============================================================
-- TABLA: estandares_acreditacion
-- ============================================================
CREATE TABLE sgc.estandares_acreditacion (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo          VARCHAR(30) NOT NULL UNIQUE,
    nombre          VARCHAR(200) NOT NULL,
    descripcion     TEXT,
    tipo            VARCHAR(50) NOT NULL DEFAULT 'ISO_21001',
    activo          BOOLEAN NOT NULL DEFAULT TRUE,
    creado_en       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    modificado_en   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    creado_por      UUID REFERENCES sgc.usuarios(id) ON DELETE SET NULL,
    CONSTRAINT chk_estandares_tipo CHECK (tipo IN ('ISO_21001','SUNEDU','SINEACE','ABET','OTRO'))
);
CREATE INDEX idx_estandares_codigo ON sgc.estandares_acreditacion(codigo);
CREATE TRIGGER trg_estandares_modificado
    BEFORE UPDATE ON sgc.estandares_acreditacion
    FOR EACH ROW EXECUTE FUNCTION sgc.fn_actualizar_modificado_en();

-- ============================================================
-- TABLA: factores_criterio
-- ============================================================
CREATE TABLE sgc.factores_criterio (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    estandar_id         UUID NOT NULL REFERENCES sgc.estandares_acreditacion(id) ON DELETE CASCADE,
    codigo              VARCHAR(30) NOT NULL,
    nombre              VARCHAR(200) NOT NULL,
    descripcion         TEXT,
    peso_porcentual     DECIMAL(5,2) NOT NULL DEFAULT 0,
    nivel               INTEGER NOT NULL DEFAULT 1,
    padre_id            UUID REFERENCES sgc.factores_criterio(id) ON DELETE SET NULL,
    creado_en           TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    modificado_en       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_factores_peso CHECK (peso_porcentual >= 0 AND peso_porcentual <= 100),
    CONSTRAINT chk_factores_nivel CHECK (nivel >= 1 AND nivel <= 3)
);
CREATE INDEX idx_factores_estandar_id ON sgc.factores_criterio(estandar_id);
CREATE INDEX idx_factores_padre_id ON sgc.factores_criterio(padre_id);
CREATE TRIGGER trg_factores_modificado
    BEFORE UPDATE ON sgc.factores_criterio
    FOR EACH ROW EXECUTE FUNCTION sgc.fn_actualizar_modificado_en();

-- ============================================================
-- TABLA: autoevaluaciones
-- ============================================================
CREATE TABLE sgc.autoevaluaciones (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo              VARCHAR(30) NOT NULL UNIQUE,
    nombre              VARCHAR(200) NOT NULL,
    estandar_id         UUID REFERENCES sgc.estandares_acreditacion(id) ON DELETE RESTRICT,
    periodo_academico   VARCHAR(20) NOT NULL,
    fecha_inicio        DATE NOT NULL,
    fecha_fin           DATE NOT NULL,
    estado              VARCHAR(30) NOT NULL DEFAULT 'en_proceso',
    puntaje_total       DECIMAL(5,2) DEFAULT 0,
    responsable_id      UUID REFERENCES sgc.usuarios(id) ON DELETE SET NULL,
    creado_en           TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    modificado_en       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    creado_por          UUID REFERENCES sgc.usuarios(id) ON DELETE SET NULL,
    CONSTRAINT chk_autoevaluaciones_estado CHECK (estado IN ('en_proceso','completada','revisada','aprobada')),
    CONSTRAINT chk_autoevaluaciones_puntaje CHECK (puntaje_total >= 0 AND puntaje_total <= 100)
);
CREATE INDEX idx_autoevaluaciones_periodo ON sgc.autoevaluaciones(periodo_academico);
CREATE INDEX idx_autoevaluaciones_estado ON sgc.autoevaluaciones(estado);
CREATE TRIGGER trg_autoevaluaciones_modificado
    BEFORE UPDATE ON sgc.autoevaluaciones
    FOR EACH ROW EXECUTE FUNCTION sgc.fn_actualizar_modificado_en();

-- ============================================================
-- TABLA: evaluaciones_criterio
-- ============================================================
CREATE TABLE sgc.evaluaciones_criterio (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    autoevaluacion_id   UUID NOT NULL REFERENCES sgc.autoevaluaciones(id) ON DELETE CASCADE,
    factor_id           UUID NOT NULL REFERENCES sgc.factores_criterio(id) ON DELETE RESTRICT,
    puntaje             DECIMAL(5,2) NOT NULL DEFAULT 0,
    nivel_cumplimiento  VARCHAR(30) NOT NULL DEFAULT 'no_cumple',
    evidencias          TEXT,
    observaciones       TEXT,
    archivo_id          UUID,
    evaluado_por        UUID REFERENCES sgc.usuarios(id) ON DELETE SET NULL,
    creado_en           TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    modificado_en       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(autoevaluacion_id, factor_id),
    CONSTRAINT chk_eval_cumplimiento CHECK (nivel_cumplimiento IN ('no_cumple','cumple_parcialmente','cumple','supera')),
    CONSTRAINT chk_eval_puntaje CHECK (puntaje >= 0 AND puntaje <= 100)
);
CREATE INDEX idx_eval_criterio_autoevaluacion ON sgc.evaluaciones_criterio(autoevaluacion_id);
CREATE INDEX idx_eval_criterio_factor ON sgc.evaluaciones_criterio(factor_id);
CREATE TRIGGER trg_eval_criterio_modificado
    BEFORE UPDATE ON sgc.evaluaciones_criterio
    FOR EACH ROW EXECUTE FUNCTION sgc.fn_actualizar_modificado_en();

-- ============================================================
-- TABLA: planes_auditoria
-- ============================================================
CREATE TABLE sgc.planes_auditoria (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo          VARCHAR(30) NOT NULL UNIQUE,
    nombre          VARCHAR(200) NOT NULL,
    tipo            VARCHAR(30) NOT NULL DEFAULT 'interna',
    alcance         TEXT,
    fecha_inicio    DATE NOT NULL,
    fecha_fin       DATE NOT NULL,
    estado          VARCHAR(30) NOT NULL DEFAULT 'planificado',
    lider_id        UUID REFERENCES sgc.usuarios(id) ON DELETE SET NULL,
    objetivo        TEXT,
    creado_en       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    modificado_en   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    creado_por      UUID REFERENCES sgc.usuarios(id) ON DELETE SET NULL,
    CONSTRAINT chk_planes_tipo CHECK (tipo IN ('interna','externa','seguimiento','certificacion')),
    CONSTRAINT chk_planes_estado CHECK (estado IN ('planificado','en_ejecucion','completado','cancelado'))
);
CREATE INDEX idx_planes_auditoria_codigo ON sgc.planes_auditoria(codigo);
CREATE INDEX idx_planes_auditoria_estado ON sgc.planes_auditoria(estado);
CREATE INDEX idx_planes_auditoria_fechas ON sgc.planes_auditoria(fecha_inicio, fecha_fin);
CREATE TRIGGER trg_planes_modificado
    BEFORE UPDATE ON sgc.planes_auditoria
    FOR EACH ROW EXECUTE FUNCTION sgc.fn_actualizar_modificado_en();

-- ============================================================
-- TABLA: equipos_auditoria
-- ============================================================
CREATE TABLE sgc.equipos_auditoria (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plan_id         UUID NOT NULL REFERENCES sgc.planes_auditoria(id) ON DELETE CASCADE,
    auditor_id      UUID NOT NULL REFERENCES sgc.usuarios(id) ON DELETE CASCADE,
    rol_en_equipo   VARCHAR(30) NOT NULL DEFAULT 'auditor',
    asignado_en     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(plan_id, auditor_id),
    CONSTRAINT chk_equipos_rol CHECK (rol_en_equipo IN ('lider','auditor','observador','tecnico'))
);
CREATE INDEX idx_equipos_plan_id ON sgc.equipos_auditoria(plan_id);
CREATE INDEX idx_equipos_auditor_id ON sgc.equipos_auditoria(auditor_id);

-- ============================================================
-- TABLA: capas (antes de hallazgos por FK circular)
-- ============================================================
CREATE TABLE sgc.capas (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo                  VARCHAR(30) NOT NULL UNIQUE,
    tipo                    VARCHAR(30) NOT NULL DEFAULT 'correctiva',
    hallazgo_id             UUID,  -- FK se agrega después
    descripcion             TEXT NOT NULL,
    causa_raiz              TEXT,
    accion_propuesta        TEXT NOT NULL,
    responsable_id          UUID REFERENCES sgc.usuarios(id) ON DELETE SET NULL,
    fecha_implementacion    DATE NOT NULL,
    fecha_verificacion      DATE,
    estado                  VARCHAR(30) NOT NULL DEFAULT 'registrada',
    efectividad             VARCHAR(30),
    capa_origen_id          UUID REFERENCES sgc.capas(id) ON DELETE SET NULL,
    busqueda_fts            TSVECTOR,
    creado_en               TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    modificado_en           TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    creado_por              UUID REFERENCES sgc.usuarios(id) ON DELETE SET NULL,
    modificado_por          UUID REFERENCES sgc.usuarios(id) ON DELETE SET NULL,
    CONSTRAINT chk_capas_tipo CHECK (tipo IN ('correctiva','preventiva','mejora')),
    CONSTRAINT chk_capas_estado CHECK (estado IN ('registrada','en_implementacion','implementada','verificada','cerrada','rechazada')),
    CONSTRAINT chk_capas_efectividad CHECK (efectividad IS NULL OR efectividad IN ('efectiva','parcialmente_efectiva','no_efectiva'))
);
CREATE INDEX idx_capas_codigo ON sgc.capas(codigo);
CREATE INDEX idx_capas_estado ON sgc.capas(estado);
CREATE INDEX idx_capas_responsable ON sgc.capas(responsable_id);
CREATE INDEX idx_capas_fecha_impl ON sgc.capas(fecha_implementacion);
CREATE INDEX idx_capas_fts ON sgc.capas USING GIN(busqueda_fts);
CREATE TRIGGER trg_capas_modificado
    BEFORE UPDATE ON sgc.capas
    FOR EACH ROW EXECUTE FUNCTION sgc.fn_actualizar_modificado_en();

-- Trigger FTS para CAPAs
CREATE OR REPLACE FUNCTION sgc.fn_capas_fts()
RETURNS TRIGGER AS $$
BEGIN
    NEW.busqueda_fts = to_tsvector('spanish',
        COALESCE(NEW.codigo,'') || ' ' ||
        COALESCE(NEW.descripcion,'') || ' ' ||
        COALESCE(NEW.causa_raiz,'') || ' ' ||
        COALESCE(NEW.accion_propuesta,'')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER trg_capas_fts
    BEFORE INSERT OR UPDATE ON sgc.capas
    FOR EACH ROW EXECUTE FUNCTION sgc.fn_capas_fts();

-- ============================================================
-- TABLA: hallazgos
-- ============================================================
CREATE TABLE sgc.hallazgos (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo                  VARCHAR(30) NOT NULL UNIQUE,
    plan_id                 UUID REFERENCES sgc.planes_auditoria(id) ON DELETE RESTRICT,
    tipo                    VARCHAR(30) NOT NULL DEFAULT 'no_conformidad',
    gravedad                VARCHAR(20) NOT NULL DEFAULT 'mayor',
    descripcion             TEXT NOT NULL,
    proceso_id              UUID REFERENCES sgc.procesos(id) ON DELETE SET NULL,
    area_responsable_id     UUID REFERENCES sgc.usuarios(id) ON DELETE SET NULL,
    evidencia               TEXT,
    estado                  VARCHAR(30) NOT NULL DEFAULT 'abierto',
    capa_id                 UUID REFERENCES sgc.capas(id) ON DELETE SET NULL,
    archivo_id              UUID,
    busqueda_fts            TSVECTOR,
    creado_en               TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    modificado_en           TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    creado_por              UUID REFERENCES sgc.usuarios(id) ON DELETE SET NULL,
    CONSTRAINT chk_hallazgos_tipo CHECK (tipo IN ('no_conformidad','observacion','oportunidad_mejora','buena_practica')),
    CONSTRAINT chk_hallazgos_gravedad CHECK (gravedad IN ('critica','mayor','menor','observacion')),
    CONSTRAINT chk_hallazgos_estado CHECK (estado IN ('abierto','en_proceso','cerrado'))
);
CREATE INDEX idx_hallazgos_plan_id ON sgc.hallazgos(plan_id);
CREATE INDEX idx_hallazgos_estado ON sgc.hallazgos(estado);
CREATE INDEX idx_hallazgos_tipo ON sgc.hallazgos(tipo);
CREATE INDEX idx_hallazgos_gravedad ON sgc.hallazgos(gravedad);
CREATE INDEX idx_hallazgos_fts ON sgc.hallazgos USING GIN(busqueda_fts);
CREATE TRIGGER trg_hallazgos_modificado
    BEFORE UPDATE ON sgc.hallazgos
    FOR EACH ROW EXECUTE FUNCTION sgc.fn_actualizar_modificado_en();

-- Trigger FTS para hallazgos
CREATE OR REPLACE FUNCTION sgc.fn_hallazgos_fts()
RETURNS TRIGGER AS $$
BEGIN
    NEW.busqueda_fts = to_tsvector('spanish',
        COALESCE(NEW.codigo,'') || ' ' ||
        COALESCE(NEW.descripcion,'') || ' ' ||
        COALESCE(NEW.evidencia,'')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER trg_hallazgos_fts
    BEFORE INSERT OR UPDATE ON sgc.hallazgos
    FOR EACH ROW EXECUTE FUNCTION sgc.fn_hallazgos_fts();

-- Agregar FK de capas -> hallazgos (circular)
ALTER TABLE sgc.capas ADD CONSTRAINT fk_capas_hallazgo
    FOREIGN KEY (hallazgo_id) REFERENCES sgc.hallazgos(id) ON DELETE SET NULL;
CREATE INDEX idx_capas_hallazgo_id ON sgc.capas(hallazgo_id);

-- ============================================================
-- TABLA: archivos_adjuntos
-- ============================================================
CREATE TABLE sgc.archivos_adjuntos (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre_original     VARCHAR(500) NOT NULL,
    nombre_almacenado   VARCHAR(500) NOT NULL,
    mime_type           VARCHAR(100) NOT NULL,
    tamano_bytes        BIGINT NOT NULL,
    checksum_sha256     VARCHAR(64),
    bucket              VARCHAR(100) NOT NULL,
    ruta_minio          TEXT NOT NULL,
    subido_por          UUID REFERENCES sgc.usuarios(id) ON DELETE SET NULL,
    modulo_origen       VARCHAR(50),
    registro_id         UUID,
    creado_en           TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_archivos_subido_por ON sgc.archivos_adjuntos(subido_por);
CREATE INDEX idx_archivos_registro ON sgc.archivos_adjuntos(modulo_origen, registro_id);

-- Agregar FK de documentos -> archivos_adjuntos
ALTER TABLE sgc.documentos ADD CONSTRAINT fk_documentos_archivo
    FOREIGN KEY (archivo_id) REFERENCES sgc.archivos_adjuntos(id) ON DELETE SET NULL;

-- ============================================================
-- TABLA: seguimientos_capa
-- ============================================================
CREATE TABLE sgc.seguimientos_capa (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    capa_id             UUID NOT NULL REFERENCES sgc.capas(id) ON DELETE CASCADE,
    avance_porcentaje   INTEGER NOT NULL DEFAULT 0,
    observaciones       TEXT,
    archivo_id          UUID REFERENCES sgc.archivos_adjuntos(id) ON DELETE SET NULL,
    estado_capa         VARCHAR(30),
    registrado_por      UUID REFERENCES sgc.usuarios(id) ON DELETE SET NULL,
    creado_en           TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_seguimiento_avance CHECK (avance_porcentaje >= 0 AND avance_porcentaje <= 100)
);
CREATE INDEX idx_seguimientos_capa_id ON sgc.seguimientos_capa(capa_id);

-- ============================================================
-- TABLA: riesgos
-- ============================================================
CREATE TABLE sgc.riesgos (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo          VARCHAR(30) NOT NULL UNIQUE,
    nombre          VARCHAR(200) NOT NULL,
    descripcion     TEXT,
    tipo            VARCHAR(30) NOT NULL DEFAULT 'operativo',
    proceso_id      UUID REFERENCES sgc.procesos(id) ON DELETE SET NULL,
    probabilidad    INTEGER NOT NULL DEFAULT 1,
    impacto         INTEGER NOT NULL DEFAULT 1,
    nivel_riesgo    INTEGER GENERATED ALWAYS AS (probabilidad * impacto) STORED,
    estado          VARCHAR(30) NOT NULL DEFAULT 'activo',
    responsable_id  UUID REFERENCES sgc.usuarios(id) ON DELETE SET NULL,
    busqueda_fts    TSVECTOR,
    creado_en       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    modificado_en   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    creado_por      UUID REFERENCES sgc.usuarios(id) ON DELETE SET NULL,
    modificado_por  UUID REFERENCES sgc.usuarios(id) ON DELETE SET NULL,
    CONSTRAINT chk_riesgos_tipo CHECK (tipo IN ('estrategico','operativo','academico','financiero','legal','tecnologico','reputacional')),
    CONSTRAINT chk_riesgos_estado CHECK (estado IN ('activo','mitigado','aceptado','eliminado')),
    CONSTRAINT chk_riesgos_probabilidad CHECK (probabilidad >= 1 AND probabilidad <= 5),
    CONSTRAINT chk_riesgos_impacto CHECK (impacto >= 1 AND impacto <= 5)
);
CREATE INDEX idx_riesgos_codigo ON sgc.riesgos(codigo);
CREATE INDEX idx_riesgos_estado ON sgc.riesgos(estado);
CREATE INDEX idx_riesgos_nivel ON sgc.riesgos(nivel_riesgo DESC);
CREATE INDEX idx_riesgos_proceso ON sgc.riesgos(proceso_id);
CREATE INDEX idx_riesgos_fts ON sgc.riesgos USING GIN(busqueda_fts);
CREATE TRIGGER trg_riesgos_modificado
    BEFORE UPDATE ON sgc.riesgos
    FOR EACH ROW EXECUTE FUNCTION sgc.fn_actualizar_modificado_en();

-- Trigger FTS para riesgos
CREATE OR REPLACE FUNCTION sgc.fn_riesgos_fts()
RETURNS TRIGGER AS $$
BEGIN
    NEW.busqueda_fts = to_tsvector('spanish',
        COALESCE(NEW.codigo,'') || ' ' ||
        COALESCE(NEW.nombre,'') || ' ' ||
        COALESCE(NEW.descripcion,'')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER trg_riesgos_fts
    BEFORE INSERT OR UPDATE ON sgc.riesgos
    FOR EACH ROW EXECUTE FUNCTION sgc.fn_riesgos_fts();

-- ============================================================
-- TABLA: planes_mitigacion
-- ============================================================
CREATE TABLE sgc.planes_mitigacion (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    riesgo_id           UUID NOT NULL REFERENCES sgc.riesgos(id) ON DELETE CASCADE,
    nombre              VARCHAR(200) NOT NULL,
    descripcion         TEXT,
    tipo_respuesta      VARCHAR(30) NOT NULL DEFAULT 'mitigar',
    responsable_id      UUID REFERENCES sgc.usuarios(id) ON DELETE SET NULL,
    fecha_limite        DATE,
    estado              VARCHAR(30) NOT NULL DEFAULT 'pendiente',
    costo_estimado      DECIMAL(12,2),
    creado_en           TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    modificado_en       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    creado_por          UUID REFERENCES sgc.usuarios(id) ON DELETE SET NULL,
    CONSTRAINT chk_mitigacion_tipo CHECK (tipo_respuesta IN ('mitigar','transferir','aceptar','eliminar')),
    CONSTRAINT chk_mitigacion_estado CHECK (estado IN ('pendiente','en_proceso','completado','cancelado'))
);
CREATE INDEX idx_mitigacion_riesgo_id ON sgc.planes_mitigacion(riesgo_id);
CREATE INDEX idx_mitigacion_estado ON sgc.planes_mitigacion(estado);
CREATE TRIGGER trg_mitigacion_modificado
    BEFORE UPDATE ON sgc.planes_mitigacion
    FOR EACH ROW EXECUTE FUNCTION sgc.fn_actualizar_modificado_en();

-- ============================================================
-- TABLA: indicadores
-- ============================================================
CREATE TABLE sgc.indicadores (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo          VARCHAR(30) NOT NULL UNIQUE,
    nombre          VARCHAR(200) NOT NULL,
    tipo            VARCHAR(30) NOT NULL DEFAULT 'eficacia',
    formula         TEXT,
    meta            DECIMAL(10,4) NOT NULL,
    unidad          VARCHAR(50),
    frecuencia      VARCHAR(20) NOT NULL DEFAULT 'mensual',
    proceso_id      UUID REFERENCES sgc.procesos(id) ON DELETE SET NULL,
    estandar_id     UUID REFERENCES sgc.estandares_acreditacion(id) ON DELETE SET NULL,
    activo          BOOLEAN NOT NULL DEFAULT TRUE,
    creado_en       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    modificado_en   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    creado_por      UUID REFERENCES sgc.usuarios(id) ON DELETE SET NULL,
    CONSTRAINT chk_indicadores_tipo CHECK (tipo IN ('eficacia','eficiencia','impacto','satisfaccion','cobertura')),
    CONSTRAINT chk_indicadores_frecuencia CHECK (frecuencia IN ('diario','semanal','mensual','trimestral','semestral','anual'))
);
CREATE INDEX idx_indicadores_codigo ON sgc.indicadores(codigo);
CREATE INDEX idx_indicadores_tipo ON sgc.indicadores(tipo);
CREATE INDEX idx_indicadores_proceso ON sgc.indicadores(proceso_id);
CREATE TRIGGER trg_indicadores_modificado
    BEFORE UPDATE ON sgc.indicadores
    FOR EACH ROW EXECUTE FUNCTION sgc.fn_actualizar_modificado_en();

-- ============================================================
-- TABLA: mediciones_indicador
-- ============================================================
CREATE TABLE sgc.mediciones_indicador (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    indicador_id    UUID NOT NULL REFERENCES sgc.indicadores(id) ON DELETE CASCADE,
    periodo         VARCHAR(20) NOT NULL,
    valor_real      DECIMAL(10,4) NOT NULL,
    valor_esperado  DECIMAL(10,4) NOT NULL,
    cumplimiento    DECIMAL(6,2) GENERATED ALWAYS AS (
        CASE WHEN valor_esperado = 0 THEN 0
             ELSE ROUND((valor_real / valor_esperado * 100)::numeric, 2)
        END
    ) STORED,
    observaciones   TEXT,
    registrado_por  UUID REFERENCES sgc.usuarios(id) ON DELETE SET NULL,
    creado_en       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(indicador_id, periodo)
);
CREATE INDEX idx_mediciones_indicador_id ON sgc.mediciones_indicador(indicador_id);
CREATE INDEX idx_mediciones_periodo ON sgc.mediciones_indicador(periodo);
CREATE INDEX idx_mediciones_cumplimiento ON sgc.mediciones_indicador(cumplimiento);

-- ============================================================
-- TABLA: encuestas
-- ============================================================
CREATE TABLE sgc.encuestas (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo              VARCHAR(30) NOT NULL UNIQUE,
    titulo              VARCHAR(300) NOT NULL,
    descripcion         TEXT,
    grupo_objetivo      VARCHAR(30) NOT NULL DEFAULT 'todos',
    fecha_inicio        DATE NOT NULL,
    fecha_fin           DATE NOT NULL,
    anonima             BOOLEAN NOT NULL DEFAULT FALSE,
    estado              VARCHAR(20) NOT NULL DEFAULT 'borrador',
    creado_por          UUID REFERENCES sgc.usuarios(id) ON DELETE SET NULL,
    creado_en           TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    modificado_en       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_encuestas_grupo CHECK (grupo_objetivo IN ('estudiantes','docentes','egresados','administrativos','todos')),
    CONSTRAINT chk_encuestas_estado CHECK (estado IN ('borrador','publicada','cerrada','archivada'))
);
CREATE INDEX idx_encuestas_estado ON sgc.encuestas(estado);
CREATE INDEX idx_encuestas_grupo ON sgc.encuestas(grupo_objetivo);
CREATE INDEX idx_encuestas_fechas ON sgc.encuestas(fecha_inicio, fecha_fin);
CREATE TRIGGER trg_encuestas_modificado
    BEFORE UPDATE ON sgc.encuestas
    FOR EACH ROW EXECUTE FUNCTION sgc.fn_actualizar_modificado_en();

-- ============================================================
-- TABLA: preguntas_encuesta
-- ============================================================
CREATE TABLE sgc.preguntas_encuesta (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    encuesta_id             UUID NOT NULL REFERENCES sgc.encuestas(id) ON DELETE CASCADE,
    texto                   TEXT NOT NULL,
    tipo                    VARCHAR(30) NOT NULL,
    opciones                JSONB DEFAULT '[]',
    logica_condicional      JSONB DEFAULT '{}',
    obligatoria             BOOLEAN NOT NULL DEFAULT TRUE,
    orden                   INTEGER NOT NULL DEFAULT 0,
    creado_en               TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_preguntas_tipo CHECK (tipo IN ('likert_5','likert_7','si_no','abierta','numerica','multiple_choice'))
);
CREATE INDEX idx_preguntas_encuesta_id ON sgc.preguntas_encuesta(encuesta_id);

-- ============================================================
-- TABLA: respuestas_encuesta
-- ============================================================
CREATE TABLE sgc.respuestas_encuesta (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    encuesta_id     UUID NOT NULL REFERENCES sgc.encuestas(id) ON DELETE CASCADE,
    pregunta_id     UUID NOT NULL REFERENCES sgc.preguntas_encuesta(id) ON DELETE CASCADE,
    usuario_id      UUID REFERENCES sgc.usuarios(id) ON DELETE SET NULL,
    respuesta       JSONB NOT NULL DEFAULT '{}',
    creado_en       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_respuestas_encuesta_id ON sgc.respuestas_encuesta(encuesta_id);
CREATE INDEX idx_respuestas_pregunta_id ON sgc.respuestas_encuesta(pregunta_id);
CREATE INDEX idx_respuestas_usuario_id ON sgc.respuestas_encuesta(usuario_id);

-- ============================================================
-- TABLA: notificaciones
-- ============================================================
CREATE TABLE sgc.notificaciones (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id  UUID NOT NULL REFERENCES sgc.usuarios(id) ON DELETE CASCADE,
    tipo        VARCHAR(30) NOT NULL DEFAULT 'info',
    titulo      VARCHAR(200) NOT NULL,
    mensaje     TEXT NOT NULL,
    modulo      VARCHAR(50),
    registro_id UUID,
    leida       BOOLEAN NOT NULL DEFAULT FALSE,
    leida_en    TIMESTAMP WITH TIME ZONE,
    creado_en   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_notificaciones_tipo CHECK (tipo IN ('alerta','recordatorio','info','aprobacion_pendiente','error'))
);
CREATE INDEX idx_notificaciones_usuario ON sgc.notificaciones(usuario_id);
CREATE INDEX idx_notificaciones_leida ON sgc.notificaciones(leida);
CREATE INDEX idx_notificaciones_tipo ON sgc.notificaciones(tipo);

-- ============================================================
-- TABLA: auditoria_log
-- ============================================================
CREATE TABLE sgc.auditoria_log (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tabla               VARCHAR(100) NOT NULL,
    registro_id         UUID,
    accion              VARCHAR(10) NOT NULL,
    datos_anteriores    JSONB,
    datos_nuevos        JSONB,
    usuario_id          UUID REFERENCES sgc.usuarios(id) ON DELETE SET NULL,
    ip                  VARCHAR(45),
    user_agent          TEXT,
    creado_en           TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_auditoria_accion CHECK (accion IN ('CREATE','UPDATE','DELETE','LOGIN','LOGOUT','EXPORT'))
);
CREATE INDEX idx_auditoria_tabla ON sgc.auditoria_log(tabla);
CREATE INDEX idx_auditoria_registro ON sgc.auditoria_log(registro_id);
CREATE INDEX idx_auditoria_usuario ON sgc.auditoria_log(usuario_id);
CREATE INDEX idx_auditoria_accion ON sgc.auditoria_log(accion);
CREATE INDEX idx_auditoria_creado_en ON sgc.auditoria_log(creado_en DESC);

-- ============================================================
-- TABLA: evaluaciones_criterio - FK archivos
-- ============================================================
ALTER TABLE sgc.evaluaciones_criterio ADD CONSTRAINT fk_eval_archivo
    FOREIGN KEY (archivo_id) REFERENCES sgc.archivos_adjuntos(id) ON DELETE SET NULL;
ALTER TABLE sgc.hallazgos ADD CONSTRAINT fk_hallazgo_archivo
    FOREIGN KEY (archivo_id) REFERENCES sgc.archivos_adjuntos(id) ON DELETE SET NULL;

-- ============================================================
-- DATOS INICIALES (SEED)
-- ============================================================

-- Roles y permisos
INSERT INTO sgc.roles_permisos (rol, descripcion, permisos) VALUES
('admin', 'Administrador del sistema', '{"todos": true}'),
('gestor_calidad', 'Gestor de Calidad', '{"documentos":{"leer":true,"escribir":true,"aprobar":true},"procesos":{"leer":true,"escribir":true},"acreditacion":{"leer":true,"escribir":true},"auditorias":{"leer":true,"escribir":true},"capas":{"leer":true,"escribir":true},"riesgos":{"leer":true,"escribir":true},"indicadores":{"leer":true,"escribir":true},"encuestas":{"leer":true,"escribir":true}}'),
('auditor', 'Auditor interno', '{"auditorias":{"leer":true,"escribir":true},"hallazgos":{"leer":true,"escribir":true},"capas":{"leer":true},"documentos":{"leer":true},"procesos":{"leer":true},"riesgos":{"leer":true}}'),
('docente', 'Docente universitario', '{"documentos":{"leer":true},"procesos":{"leer":true},"indicadores":{"leer":true},"encuestas":{"responder":true}}'),
('estudiante', 'Estudiante universitario', '{"encuestas":{"responder":true},"documentos":{"leer":true}}'),
('egresado', 'Egresado universitario', '{"encuestas":{"responder":true}}'),
('invitado', 'Usuario invitado', '{"documentos":{"leer":true}}');

-- Tipos de documento
INSERT INTO sgc.tipos_documento (nombre, codigo, descripcion) VALUES
('Política', 'POL', 'Documentos de política institucional'),
('Manual', 'MAN', 'Manuales de procedimientos y gestión'),
('Procedimiento', 'PRO', 'Procedimientos operativos estándar'),
('Instructivo', 'INS', 'Instructivos de trabajo'),
('Formato', 'FOR', 'Formatos y plantillas institucionales'),
('Reglamento', 'REG', 'Reglamentos institucionales'),
('Guía', 'GUI', 'Guías y lineamientos');

-- Usuario administrador (contraseña: Admin2024!)
-- Hash bcrypt con salt 12 de "Admin2024!"
INSERT INTO sgc.usuarios (nombre, apellido, email, password_hash, rol, activo) VALUES
('Administrador', 'Sistema', 'admin@unitru.edu.pe',
 '$2a$12$x7DgW50QdJWKe6hMPA/Inu8IN9bDDwWp0iQB3pt0cfm5Lovwcft72',
 'admin', TRUE);

-- Parámetros del sistema
INSERT INTO sgc.parametros_sistema (clave, valor, tipo, descripcion) VALUES
('nombre_institucion', 'Universidad Nacional de Trujillo', 'string', 'Nombre oficial de la institución'),
('siglas_institucion', 'UNT', 'string', 'Siglas de la institución'),
('version_sistema', '2.0.0', 'string', 'Versión del SGC'),
('color_primario', '#003366', 'color', 'Color primario corporativo'),
('color_secundario', '#C8102E', 'color', 'Color secundario corporativo'),
('color_acento', '#F7B731', 'color', 'Color de acento corporativo'),
('logo_url', '/assets/logo-unt.png', 'url', 'URL del logo institucional'),
('dias_alerta_vencimiento_documento', '30', 'number', 'Días de anticipación para alerta de vencimiento de documentos'),
('dias_alerta_vencimiento_capa', '5', 'number', 'Días de anticipación para alerta de vencimiento de CAPA'),
('smtp_host', 'smtp.unitru.edu.pe', 'string', 'Servidor SMTP'),
('smtp_port', '587', 'number', 'Puerto SMTP'),
('smtp_from', 'sgc@unitru.edu.pe', 'string', 'Correo remitente SGC'),
('max_tamano_archivo_mb', '50', 'number', 'Tamaño máximo de archivo adjunto en MB'),
('n8n_webhook_base_url', 'http://n8n:5678/webhook', 'url', 'URL base de webhooks n8n'),
('umbral_cumplimiento_alerta', '80', 'number', 'Porcentaje mínimo de cumplimiento de indicadores'),
('periodos_academicos', '["2024-I","2024-II","2025-I","2025-II","2026-I"]', 'json', 'Periodos académicos disponibles');

-- Macroprocesos iniciales
DO $$
DECLARE
    admin_id UUID;
BEGIN
    SELECT id INTO admin_id FROM sgc.usuarios WHERE email = 'admin@unitru.edu.pe';

    INSERT INTO sgc.macroprocesos (codigo, nombre, descripcion, tipo, orden, creado_por) VALUES
    ('MP-EST-01', 'Dirección Estratégica', 'Procesos de planificación y dirección institucional', 'estrategico', 1, admin_id),
    ('MP-EST-02', 'Gestión de la Calidad', 'Procesos de gestión y mejora continua', 'estrategico', 2, admin_id),
    ('MP-MIS-01', 'Formación Académica', 'Procesos académicos y curriculares', 'misional', 3, admin_id),
    ('MP-MIS-02', 'Investigación y Desarrollo', 'Procesos de investigación científica', 'misional', 4, admin_id),
    ('MP-MIS-03', 'Proyección Social', 'Procesos de extensión y responsabilidad social', 'misional', 5, admin_id),
    ('MP-APO-01', 'Gestión Administrativa', 'Procesos de soporte administrativo', 'apoyo', 6, admin_id),
    ('MP-APO-02', 'Gestión de Recursos Humanos', 'Procesos de gestión del talento', 'apoyo', 7, admin_id),
    ('MP-APO-03', 'Tecnologías de la Información', 'Procesos de gestión TI', 'apoyo', 8, admin_id);

    -- Estándar ISO 21001
    INSERT INTO sgc.estandares_acreditacion (codigo, nombre, descripcion, tipo, creado_por) VALUES
    ('ISO-21001', 'ISO 21001:2018', 'Sistema de Gestión para Organizaciones Educativas', 'ISO_21001', admin_id),
    ('SUNEDU-LM', 'Condiciones Básicas de Calidad SUNEDU', 'Licenciamiento SUNEDU - Condiciones básicas de calidad', 'SUNEDU', admin_id);
END $$;

-- Factores para ISO 21001
DO $$
DECLARE
    iso_id UUID;
BEGIN
    SELECT id INTO iso_id FROM sgc.estandares_acreditacion WHERE codigo = 'ISO-21001';

    INSERT INTO sgc.factores_criterio (estandar_id, codigo, nombre, descripcion, peso_porcentual, nivel) VALUES
    (iso_id, '4', 'Contexto de la Organización', 'Comprensión de la organización y su contexto', 10, 1),
    (iso_id, '5', 'Liderazgo', 'Liderazgo y compromiso', 15, 1),
    (iso_id, '6', 'Planificación', 'Acciones para abordar riesgos y oportunidades', 15, 1),
    (iso_id, '7', 'Apoyo', 'Recursos, competencia, conciencia, comunicación', 15, 1),
    (iso_id, '8', 'Operación', 'Planificación y control operacional', 20, 1),
    (iso_id, '9', 'Evaluación del Desempeño', 'Seguimiento, medición, análisis y evaluación', 15, 1),
    (iso_id, '10', 'Mejora', 'No conformidades, acciones correctivas, mejora continua', 10, 1);
END $$;

-- ============================================================
-- VISTAS ÚTILES
-- ============================================================

-- Vista de riesgos con clasificación de nivel
CREATE OR REPLACE VIEW sgc.v_riesgos_clasificados AS
SELECT r.*,
    CASE
        WHEN r.nivel_riesgo <= 4 THEN 'bajo'
        WHEN r.nivel_riesgo <= 9 THEN 'medio'
        WHEN r.nivel_riesgo <= 16 THEN 'alto'
        ELSE 'critico'
    END AS clasificacion_nivel,
    u.nombre || ' ' || u.apellido AS responsable_nombre
FROM sgc.riesgos r
LEFT JOIN sgc.usuarios u ON r.responsable_id = u.id;

-- Vista de CAPAs vencidas
CREATE OR REPLACE VIEW sgc.v_capas_vencidas AS
SELECT c.*,
    u.nombre || ' ' || u.apellido AS responsable_nombre,
    u.email AS responsable_email,
    (CURRENT_DATE - c.fecha_implementacion) AS dias_vencida
FROM sgc.capas c
LEFT JOIN sgc.usuarios u ON c.responsable_id = u.id
WHERE c.estado NOT IN ('cerrada','rechazada')
  AND c.fecha_implementacion < CURRENT_DATE;

-- Vista de documentos por vencer (próximos 30 días)
CREATE OR REPLACE VIEW sgc.v_documentos_por_vencer AS
SELECT d.*,
    td.nombre AS tipo_nombre,
    u.nombre || ' ' || u.apellido AS responsable_nombre,
    u.email AS responsable_email,
    (d.fecha_vigencia_fin - CURRENT_DATE) AS dias_para_vencer
FROM sgc.documentos d
LEFT JOIN sgc.tipos_documento td ON d.tipo_id = td.id
LEFT JOIN sgc.usuarios u ON d.responsable_id = u.id
WHERE d.estado = 'aprobado'
  AND d.fecha_vigencia_fin IS NOT NULL
  AND d.fecha_vigencia_fin BETWEEN CURRENT_DATE AND (CURRENT_DATE + INTERVAL '30 days');

-- Vista de dashboard KPIs
CREATE OR REPLACE VIEW sgc.v_dashboard_kpis AS
SELECT
    (SELECT COUNT(*) FROM sgc.documentos WHERE estado = 'aprobado') AS documentos_activos,
    (SELECT COUNT(*) FROM sgc.capas WHERE estado NOT IN ('cerrada','rechazada')) AS capas_abiertas,
    (SELECT COUNT(*) FROM sgc.riesgos WHERE estado = 'activo' AND nivel_riesgo >= 17) AS riesgos_criticos,
    (SELECT COUNT(*) FROM sgc.encuestas WHERE estado = 'publicada' AND fecha_fin >= CURRENT_DATE) AS encuestas_vigentes,
    (SELECT COUNT(*) FROM sgc.mediciones_indicador WHERE cumplimiento < 80) AS indicadores_bajo_meta,
    (SELECT COUNT(*) FROM sgc.hallazgos WHERE estado = 'abierto') AS hallazgos_abiertos;

COMMENT ON SCHEMA sgc IS 'Esquema del Sistema de Gestión de Calidad - Universidad Nacional de Trujillo v2.0';
