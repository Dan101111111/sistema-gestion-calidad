# Documentación de Cambios Recientes - SGC UNT

**Autor:** Daniel
**Fecha:** 21 de Junio de 2026

## 1. Módulo de Encuestas (Webhooks y Backend)
- **Corrección de fechas estancadas:** Se detectó un problema donde todas las encuestas nuevas quedaban con vigencia automática "20/06/2026". Se implementó lógica robusta en `encuestaController.js` para asegurar que el sistema formatee e inserte las fechas personalizadas correctamente (`YYYY-MM-DD`).
- **Webhooks N8N con plantillas HTML:** Se mejoró drásticamente la estructura de los correos automáticos. Ahora, al enviar la notificación de una "Encuesta Publicada", n8n distribuye correos en un formato HTML atractivo, responsive y estético. 
- **Inyección dinámica de variables:** Los correos recogen y visualizan dinámicamente las variables correspondientes a la base de datos (Ej: Nombre y Apellido de la persona, título de la encuesta, tipo de anonimato, grupo al que va dirigido).
- **Validaciones de Front y Back:** Se manejaron correctamente los errores `VALIDATION_ERROR` evitando fallas al ingresar títulos cortos (menos de 5 caracteres) y otras reglas de persistencia.

## 2. Seeders (Datos Iniciales de Prueba)
- **Implementación de `demoSeeder.js`:** Se desarrolló un archivo orquestador para inyectar datos falsos pero realistas que permitan previsualizar la plataforma de manera completa.
- **5 Registros por Módulo Core:** Se han llenado las tablas principales asegurando la inserción masiva de Documentos Activos (aprobados), CAPAs Abiertas, Riesgos Críticos, Encuestas Vigentes y registros de Indicadores.
- **2 Autoevaluaciones:** Inserción de registros iniciales para el cumplimiento de estándares.
- **Resolución de Conflictos Relacionales:** Para evitar el "race condition" que truncaba las inserciones o el fallo del modelo (como tratar de añadir la columna `fecha_revision` o `requiere_aprobacion` que no existen en el esquema físico PostgreSQL), se usaron `raw queries` directas, garantizando una carga del 100% libre de errores y con estado final "✅ Seeder completado exitosamente".

## 3. UI/UX: Dashboard Principal
- **Mejora del Gráfico de CAPAs:**
  - El gráfico `PieChart` original cortaba textos largos ("en_implementacion") creando un efecto entrecortado muy molesto.
  - Se incrementó la altura responsiva de los gráficos (de `220px` a `280px`).
  - Se removió el radio interior (transformándolo de Dona a Pastel sólido circular).
  - **Añadido crucial:** Se añadieron los porcentajes internos (`10%`, `40%`) anclados geométricamente a las porciones del pastel. Ahora el gráfico nunca sale de la vista general, y se ayuda al usuario con una leyenda estática elegante debajo.

## 4. Análisis de Requerimientos "KIMI"
- Se corrobora que la plataforma cumple plenamente con los 8 módulos solicitados en el documento original, contando todos con base de datos, backend y componentes en NextJS.

---
_Documento generado automáticamente para respaldar el control de versiones._
