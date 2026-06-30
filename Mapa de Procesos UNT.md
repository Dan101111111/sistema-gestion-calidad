Como Analista de Procesos y Desarrollador Full-Stack, he revisado a fondo la documentación oficial de la Universidad Nacional de Trujillo ( **Resolución Rectoral N°1851-2023/UNT** ). Este documento formaliza el rediseño del sistema, pasando del antiguo enfoque integrado ( **SIGCUNT** ) al nuevo Sistema de Gestión de la Calidad ( **SGC-UNT** ) enfocado estrictamente en la norma **ISO 9001:2015** .

A continuación, te presento el análisis estructural, el script de base de datos listo para producción en PostgreSQL y las recomendaciones arquitectónicas para tu aplicación en Next.js.

## **1. Análisis y Mapeo de Procesos (UNT a Modelo Relacional)**

La realidad organizativa de la UNT plasmada en los PDFs expone una jerarquía multidimensional de hasta 4 o 5 niveles (Nivel 0, Nivel 1, Nivel 2, Nivel 3, etc.). Para adaptarla sin perder integridad a tu base de datos actual de **3 niveles estrictos** , se ha aplicado una estrategia de **aplanamiento funcional** :

- **Macroprocesos:** Se toman los bloques principales del _Nivel 1_ (ej. Gobierno de la Universidad, Formación Integral) y se clasifican según los tipos estrictos de tu regla de negocio (estrategico, misional, apoyo).

- **Procesos:** Se mapean los elementos de _Nivel 2_ de la universidad, heredando la relación directa con su macroproceso padre.

- **Actividades:** Se descienden los elementos terminales y operativos ( _Nivel 3_ o subprocesos procedimentales), asignándoles una secuencia secuencial e inyectando las entradas, salidas e indicadores de satisfacción descritos en los documentos de calidad.

## **2. Script SQL de Población (PostgreSQL)**

Este script contiene comandos limpios, estructurados jerárquicamente utilizando variables de sesión o bloques ordenados para asegurar la resolución de llaves foráneas (FOREIGN KEY) sin conflictos.

SQL

--

============================================================

- =================

- -- SCRIPT DE POBLACIÓN: SISTEMA DE GESTIÓN DE LA CALIDAD (SGCUNT)

--

============================================================

> =================

## BEGIN;

- -- 1. POBLAR TABLA: MACROPROCESOS

- -- Tipos permitidos: 'estrategico', 'misional', 'apoyo', 'evaluacion'

INSERT INTO macroprocesos (codigo, nombre, tipo) VALUES

- ('MP-E01', 'Gobierno de la Universidad', 'estrategico'),

- ('MP-E02', 'Gestión de la Mejora Continua', 'estrategico'),

- ('MP-M01', 'Formación Integral (Pregrado y Posgrado)', 'misional'),

- ('MP-A02', 'Gestión de Talento Humano', 'apoyo'),

('MP-A06', 'Tecnología de la Información', 'apoyo')

ON CONFLICT (codigo) DO UPDATE SET nombre = EXCLUDED.nombre, tipo = EXCLUDED.tipo;

## -- 2. POBLAR TABLA: PROCESOS

- -- Relacionados dinámicamente mediante subconsultas por código de

Macroproceso

- -- Estados permitidos: 'activo', 'inactivo', 'en_mejora'

INSERT INTO procesos (macroproceso_id, codigo, nombre, objetivo, alcance, estado) VALUES

(

(SELECT id FROM macroprocesos WHERE codigo = 'MP-E01'),

'PR-E01.01',

'Gestión de Políticas Académicas',

- 'Establecer los lineamientos político-académicos de excelencia institucional.',

'Sede central y filiales a nivel pregrado y posgrado.',

'activo'

),

- (

(SELECT id FROM macroprocesos WHERE codigo = 'MP-E02'),

'PR-E02.01',

'Aseguramiento de la Calidad Universitaria',

'Garantizar la autoevaluación, licenciamiento institucional y la acreditación de programas.',

'Todas las facultades, escuelas de pregrado y escuela de posgrado.',

'activo'

),

(

(SELECT id FROM macroprocesos WHERE codigo = 'MP-M01'),

'PR-M01.01',

'Gestión de la Formación en Pregrado',

'Transformar la vida de los estudiantes mediante procesos educativos innovadores y aprendizaje divergente.',

'Abarca desde el ingreso académico hasta el seguimiento al egresado.',

'activo'

),

(

(SELECT id FROM macroprocesos WHERE codigo = 'MP-A02'),

'PR-A02.01',

'Gestión de Personal Académico',

'Administrar el ciclo de vida laboral, escalafón y capacitación del cuerpo docente.',

'Áreas administrativas de la Dirección General de Administración y Recursos Humanos.',

'activo'

),

(

(SELECT id FROM macroprocesos WHERE codigo = 'MP-A06'),

'PR-A06.02',

'Gestión de los Sistemas de Información',

'Garantizar la disponibilidad, soporte y actualización de los sistemas de información institucionales.',

'Oficina de Tecnologías de la Información a nivel corporativo.',

'activo'

);

-- 3. POBLAR TABLA: ACTIVIDADES

-- Mapeo operationalizado de los niveles terminales de la UNT

INSERT INTO actividades (proceso_id, secuencia, codigo, nombre, entradas, salidas, indicadores) VALUES

-- Actividades para PR-E01.01 (Gestión de Políticas Académicas)

(

(SELECT id FROM procesos WHERE codigo = 'PR-E01.01'),

1, 'ACT-E01.01-01', 'Formulación de Lineamientos Académicos',

'Políticas nacionales (SUNEDU/MINEDU), plan estratégico institucional', 'Propuesta de política aprobada por Vicerrectorado',

'Porcentaje de políticas aprobadas anualmente'

),

-- Actividades para PR-E02.01 (Aseguramiento de la Calidad)

(

(SELECT id FROM procesos WHERE codigo = 'PR-E02.01'),

1, 'ACT-E02.01-01', 'Gestión de la Autoevaluación y Licenciamiento',

'Modelos de acreditación vigentes, condiciones básicas de calidad', 'Informes de autoevaluación y resoluciones de acreditación',

'Porcentaje de programas acreditados y cumplimiento de condiciones de permanencia'

),

-- Actividades para PR-M01.01 (Formación en Pregrado)

(

(SELECT id FROM procesos WHERE codigo = 'PR-M01.01'),

1, 'ACT-M01.01-01', 'Planificación Curricular y Admisión',

'Planes de estudio, postulantes registrados', 'Estudiantes admitidos e ingresantes matriculados',

'Porcentaje de vacantes cubiertas por proceso de admisión'

),

(

(SELECT id FROM procesos WHERE codigo = 'PR-M01.01'),

2, 'ACT-M01.01-02', 'Desarrollo de la Enseñanza-Aprendizaje',

'Estudiantes matriculados, sílabos de asignaturas, infraestructura física/virtual', 'Estudiantes evaluados y aprobados con competencias logradas',

'Grado de satisfacción de los estudiantes con los servicios brindados (Métrica OC.01)'

),

(

(SELECT id FROM procesos WHERE codigo = 'PR-M01.01'),

3, 'ACT-M01.01-03', 'Resultados de la Formación y Titulación',

'Egresados de las promociones académicas', 'Grados académicos, certificaciones y títulos emitidos',

'Porcentaje de egresados laborando según su perfil profesional'

),

-- Actividades para PR-A02.01 (Gestión de Personal Académico)

(

(SELECT id FROM procesos WHERE codigo = 'PR-A02.01'),

1, 'ACT-A02.01-01', 'Control de Escalafón y Capacitación Docente',

'Legajos de personal, requerimientos de formación pedagógica', 'Plan de capacitación ejecutado e historial de méritos actualizado',

'Porcentaje de docentes capacitados en TICs y metodologías activas'

## ),

-- Actividades para PR-A06.02 (Sistemas de Información)

## (

(SELECT id FROM procesos WHERE codigo = 'PR-A06.02'),

1, 'ACT-A06.02-01', 'Desarrollo y Mantenimiento de Software Institucional',

'Requerimientos de usuarios (académicos/administrativos), fallos reportados', 'Módulos del SGC y sistemas internos desplegados en producción',

'Tiempo promedio de resolución de incidencias críticas'

);

## COMMIT;

## **3. Desajuste de Conceptos y Recomendaciones para tu Frontend (Next.js)**

## **El Problema Detectado: La Rigidez de los 3 Niveles**

En el documento real de la UNT, procesos complejos como **E02.04 (Gestión de la Calidad)** se subdividen en subprocesos intermedios antes de llegar a las acciones operativas terminales:

Macroproceso (E02) → Proceso (E02.04) → Subproceso (E02.04.01) → Actividad Terminal (E02.04.01.01)

Forzar esta realidad a un esquema rígido de tres componentes (Macroproceso -> Proceso -> Actividad) truncará los datos de la institución o los forzará a un aplanamiento artificial que perderá la semántica original del mapa de procesos de la universidad.

## **Solución Full-Stack Recomendada**

## **A. Refactorización de la Base de Datos (Adjacency List Model)**

En lugar de mantener tres tablas separadas, la práctica recomendada para la gestión de mapas de procesos corporativos es unificar la jerarquía en una sola tabla recursiva utilizando una relación de **auto-referencia (** parent_id **)** :

## SQL

CREATE TABLE nodos_proceso (

id SERIAL PRIMARY KEY,

parent_id INTEGER REFERENCES nodos_proceso(id) ON DELETE CASCADE,

codigo VARCHAR(50) NOT NULL UNIQUE,

nombre VARCHAR(255) NOT NULL,

tipo VARCHAR(50) CHECK (tipo IN ('estrategico', 'misional', 'apoyo', 'evaluacion', 'proceso_general', 'subproceso', 'actividad')),

objetivo TEXT,

alcance TEXT,

estado VARCHAR(50) DEFAULT 'activo',

secuencia INTEGER,

entradas TEXT,

salidas TEXT,

indicadores TEXT

);

## **B. Implementación en Next.js / React (Componente Recursivo)**

Al migrar a este diseño recursivo en tu base de datos, tu API en Node.js puede devolver una estructura de árbol limpia, y tu interfaz frontend puede pintarse a sí misma de manera dinámica sin importar si un proceso tiene 3, 4 o 10 niveles de profundidad.

## 1. **Consulta con CTE Recursivo en el Backend (Node.js/PostgreSQL):**

JavaScript

// Endpoint que retorna el árbol completo estructurado

const query = `

WITH RECURSIVE proceso_tree AS (

SELECT id, parent_id, codigo, nombre, tipo, 1 as nivel

FROM nodos_proceso WHERE parent_id IS NULL

UNION ALL

SELECT n.id, n.parent_id, n.codigo, n.nombre, n.tipo, pt.nivel + 1

FROM nodos_proceso n

INNER JOIN proceso_tree pt ON n.parent_id = pt.id

)

SELECT \* FROM proceso_tree ORDER BY codigo;

`;

## 2. **Componente de UI Flexible e Infinitamente Anidado en el Frontend (React/Next.js):**

## TypeScript

interface ProcessNode {

id: number;

codigo: string;

nombre: string;

tipo: string;

children?: ProcessNode[];

}

## // Componente Atómico Recursivo

const ProcessNodeComponent = ({ node }: { node: ProcessNode }) => {

const hasChildren = node.children && node.children.length > 0;

return (

<div className="pl-6 border-l-2 border-slate-200 dark:border-slate-700 my-2 transition-all hover:border-blue-500">

<div className="flex items-center gap-2 p-2 rounded bg-white dark:bgslate-800 shadow-sm">

<span className="px-2 py-0.5 text-xs font-mono font-bold uppercase rounded bg-slate-100 text-slate-700">

{node.codigo}

</span>

<span className="text-sm font-medium text-slate-900 dark:text-slate100">

{node.nombre}

</span>

<span className="ml-auto text-xs italic text-slate-400">

{node.tipo}

</span>

</div>

{/_ RECURSIÓN AUTOMÁTICA _/}

{hasChildren && (

<div className="mt-1 space-y-1">

{node.children!.map((child) => (

<ProcessNodeComponent key={child.id} node={child} /> ))} </div>

)}

</div>

);

};

// Vista Principal del Mapa de Procesos

export default function MapaProcesosPage({ processTree }: { processTree: ProcessNode[] }) {

return (

<div className="p-6 max-w-5xl mx-auto">

<h1 className="text-2xl font-bold mb-6 text-slate-800 dark:text-white"> Mapa de Procesos Dinámico SGC-UNT

</h1>

<div className="space-y-4">

{processTree.map((macro) => (

<div key={macro.id} className="mb-4 p-4 rounded-lg bg-slate-50 dark:bg-slate-900">

<h2 className="text-lg font-bold text-blue-600 mb-

2">{macro.nombre}</h2>

{macro.children?.map((child) => (

<ProcessNodeComponent key={child.id} node={child} />

))}

</div>

))}

</div>

</div>

);

}

## **Beneficios Inmediatos de este Cambio en tu Código:**

- **Mantenimiento Cero en Frontend:** Si la Oficina de Gestión de la Calidad de la UNT decide añadir un "Nivel 5" a un subproceso de auditoría interna, la UI se adaptará automáticamente sin que tengas que modificar una sola línea de código React.

- **Filtros Avanzados:** Podrás filtrar la visualización del mapa de procesos simplemente enviando una propiedad por URL en Next.js (ej.
  - ?tipo=misional) y condicionando el nodo raíz de la consulta SQL.
