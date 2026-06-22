-- seed_sineace.sql
-- Inserción del Modelo de Acreditación SINEACE (Educación Superior Universitaria)

DO $$ 
DECLARE
    v_estandar_id UUID := gen_random_uuid();
    v_factor1_id UUID := gen_random_uuid();
    v_factor2_id UUID := gen_random_uuid();
    v_factor3_id UUID := gen_random_uuid();
    v_factor4_id UUID := gen_random_uuid();
BEGIN

    -- 1. Insertar el Estándar Principal
    INSERT INTO sgc.estandares_acreditacion (id, codigo, nombre, descripcion, tipo, activo)
    VALUES (
        v_estandar_id, 
        'SINEACE-2023', 
        'Modelo de Acreditación SINEACE', 
        'Modelo de Acreditación para Programas de Estudios de Educación Superior Universitaria', 
        'SINEACE', 
        true
    );

    -- 2. Insertar Dimensión 1: Gestión Estratégica (Nivel 1)
    INSERT INTO sgc.factores_criterio (id, estandar_id, codigo, nombre, descripcion, peso_porcentual, nivel, padre_id)
    VALUES (
        v_factor1_id, v_estandar_id, 'DIM-1', 'Gestión Estratégica', 
        'Evalúa la pertinencia del programa, su planificación y la conducción institucional.', 
        25.00, 1, NULL
    );

    -- Factores de la Dimensión 1 (Nivel 2)
    INSERT INTO sgc.factores_criterio (id, estandar_id, codigo, nombre, descripcion, peso_porcentual, nivel, padre_id)
    VALUES 
        (gen_random_uuid(), v_estandar_id, 'F1', 'Planificación del Programa de Estudios', 'Planificación y propósitos del programa', 10.00, 2, v_factor1_id),
        (gen_random_uuid(), v_estandar_id, 'F2', 'Gestión del Perfil de Egreso', 'Mecanismos para evaluar y actualizar el perfil de egreso', 10.00, 2, v_factor1_id),
        (gen_random_uuid(), v_estandar_id, 'F3', 'Aseguramiento de la Calidad', 'Sistema de gestión de la calidad interno', 5.00, 2, v_factor1_id);

    -- 3. Insertar Dimensión 2: Formación Integral (Nivel 1)
    INSERT INTO sgc.factores_criterio (id, estandar_id, codigo, nombre, descripcion, peso_porcentual, nivel, padre_id)
    VALUES (
        v_factor2_id, v_estandar_id, 'DIM-2', 'Formación Integral', 
        'Proceso de enseñanza-aprendizaje, investigación y responsabilidad social.', 
        40.00, 1, NULL
    );

    -- Factores de la Dimensión 2 (Nivel 2)
    INSERT INTO sgc.factores_criterio (id, estandar_id, codigo, nombre, descripcion, peso_porcentual, nivel, padre_id)
    VALUES 
        (gen_random_uuid(), v_estandar_id, 'F4', 'Proceso de Enseñanza-Aprendizaje', 'Currículo, estrategias y evaluación', 15.00, 2, v_factor2_id),
        (gen_random_uuid(), v_estandar_id, 'F5', 'Gestión de los Docentes', 'Plana docente, selección, evaluación y capacitación', 10.00, 2, v_factor2_id),
        (gen_random_uuid(), v_estandar_id, 'F6', 'Seguimiento a Estudiantes', 'Tutoría, apoyo pedagógico y movilidad', 5.00, 2, v_factor2_id),
        (gen_random_uuid(), v_estandar_id, 'F7', 'Investigación y Responsabilidad Social', 'Producción intelectual e impacto social', 10.00, 2, v_factor2_id);

    -- 4. Insertar Dimensión 3: Soporte Institucional (Nivel 1)
    INSERT INTO sgc.factores_criterio (id, estandar_id, codigo, nombre, descripcion, peso_porcentual, nivel, padre_id)
    VALUES (
        v_factor3_id, v_estandar_id, 'DIM-3', 'Soporte Institucional', 
        'Recursos, infraestructura y bienestar institucional.', 
        20.00, 1, NULL
    );

    -- Factores de la Dimensión 3 (Nivel 2)
    INSERT INTO sgc.factores_criterio (id, estandar_id, codigo, nombre, descripcion, peso_porcentual, nivel, padre_id)
    VALUES 
        (gen_random_uuid(), v_estandar_id, 'F8', 'Servicios de Bienestar', 'Servicios de salud, recreación y cultura', 5.00, 2, v_factor3_id),
        (gen_random_uuid(), v_estandar_id, 'F9', 'Infraestructura y Soporte', 'Aulas, laboratorios, bibliotecas y plataformas de TI', 10.00, 2, v_factor3_id),
        (gen_random_uuid(), v_estandar_id, 'F10', 'Recursos Humanos Administrativos', 'Personal no docente y su desarrollo', 5.00, 2, v_factor3_id);

    -- 5. Insertar Dimensión 4: Resultados (Nivel 1)
    INSERT INTO sgc.factores_criterio (id, estandar_id, codigo, nombre, descripcion, peso_porcentual, nivel, padre_id)
    VALUES (
        v_factor4_id, v_estandar_id, 'DIM-4', 'Resultados', 
        'Verificación del logro del perfil de egreso y objetivos.', 
        15.00, 1, NULL
    );

    -- Factores de la Dimensión 4 (Nivel 2)
    INSERT INTO sgc.factores_criterio (id, estandar_id, codigo, nombre, descripcion, peso_porcentual, nivel, padre_id)
    VALUES 
        (gen_random_uuid(), v_estandar_id, 'F11', 'Logro del Perfil de Egreso', 'Medición del cumplimiento del perfil', 10.00, 2, v_factor4_id),
        (gen_random_uuid(), v_estandar_id, 'F12', 'Seguimiento a Egresados y Objetivos', 'Inserción laboral y logro de objetivos educacionales', 5.00, 2, v_factor4_id);

END $$;
