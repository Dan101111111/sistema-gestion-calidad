# Plan de Implementación: Fase 3 — Evaluación y Mejora Continua (Flujo de Calidad)

Este plan detalla la implementación y verificación de las interconexiones, validaciones de negocio, seguridad y visuales para los módulos de **Auditorías (Planes y Hallazgos)** y **Acciones Correctivas y Preventivas (CAPA)**.

---

## User Review Required

> [!IMPORTANT]
> **Cambios en los Estados y Tipos de la Base de Datos:**
> Actualizaremos las restricciones de tipo `CHECK` en PostgreSQL para soportar los nuevos estados (`ejecutado`, `cerrado`, `en_tratamiento`) y tipos (`especial`) requeridos por el flujo de negocio, preservando a la vez compatibilidad con los registros existentes.
>
> **Adición de Columna de Justificación en Hallazgos:**
> Agregaremos la columna `justificacion` a la tabla `sgc.hallazgos` para permitir cerrar un hallazgo sin una CAPA asociada cuando esté justificado.

---

## Open Questions

Actualmente no hay preguntas abiertas. La especificación cubre con detalle las reglas de negocio necesarias para cerrar el ciclo de mejora continua de calidad.

---

## Proposed Changes

### 1. Base de Datos (Migración SQL)

#### [NEW] [migration_fase3_calidad.sql](file:///c:/Users/Anthony%20Garcia/GestionCalidad2unidad/sistema-gestion-calidad/database/migration_fase3_calidad.sql)
Crear un archivo de migración SQL para:
- Alterar las restricciones `chk_planes_estado` y `chk_planes_tipo` en `sgc.planes_auditoria`.
- Alterar las restricciones `chk_hallazgos_estado` y `chk_hallazgos_gravedad` en `sgc.hallazgos`.
- Alterar la restricción `chk_capas_efectividad` en `sgc.capas`.
- Añadir la columna `justificacion` (TEXT) en la tabla `sgc.hallazgos`.

---

### 2. Backend (Modelos, Validadores, Controladores y Rutas)

#### [MODIFY] [models/index.js](file:///c:/Users/Anthony%20Garcia/GestionCalidad2unidad/sistema-gestion-calidad/backend/src/models/index.js)
- En `PlanAuditoria`, actualizar las validaciones de `tipo` (añadir `'especial'`) y `estado` (añadir `'ejecutado'` y `'cerrado'`).
- En `Hallazgo`, añadir la columna `justificacion` de tipo `DataTypes.TEXT` y actualizar las validaciones de `estado` (añadir `'en_tratamiento'`) y `gravedad` (añadir `'baja'`, `'media'`, `'alta'`, `'critica'`).
- En `Capa`, actualizar las validaciones de `efectividad` (permitir `'parcial'`, `'pendiente'`).

#### [MODIFY] [validators/index.js](file:///c:/Users/Anthony%20Garcia/GestionCalidad2unidad/sistema-gestion-calidad/backend/src/validators/index.js)
- En `auditoriaSchemas.plan`, permitir el tipo `'especial'` en Joi validation.
- En `auditoriaSchemas.hallazgo`, permitir gravedades `'baja'`, `'media'`, `'alta'`, `'critica'` e incluir `justificacion: Joi.string().max(2000).optional().allow('')` y hacer `plan_id` opcional.
- En `capaSchemas.cambiarEstado`, permitir efectividades `'parcial'`, `'pendiente'` y hacer `comentario` obligatorio condicional en el backend si el estado es `'rechazada'`.

#### [MODIFY] [mainController.js](file:///c:/Users/Anthony%20Garcia/GestionCalidad2unidad/sistema-gestion-calidad/backend/src/controllers/mainController.js)
- **`crearPlan` / `actualizarPlan`**: Validar que la fecha programada y la fecha de ejecución sean coherentes (la fecha de ejecución/fin `fecha_fin` no puede ser anterior a la fecha programada/inicio `fecha_inicio`).
- **`actualizarPlan`**: Validar que si el plan pasa a estado `'cerrado'`, todos sus hallazgos asociados estén en estado `'cerrado'`. Si hay hallazgos abiertos o en tratamiento, impedir la transición.
- **`eliminarPlan` [NEW]**: Eliminar un plan de auditoría. Bloquear si tiene hallazgos asociados. Si el usuario es un auditor, validar que sea el creador o líder del plan.
- **`actualizarHallazgo`**: Validar que si el hallazgo se cambia a estado `'cerrado'`, este tenga una CAPA asociada (`capa_id` no nulo) o que se haya especificado una justificación no vacía en `req.body.justificacion`.
- **`eliminarHallazgo` [NEW]**: Eliminar un hallazgo. Si el usuario es auditor, verificar que sea el creador del hallazgo o el líder del plan correspondiente.
- **`listarPlanes`**: Actualizar la query Sequelize para calcular de forma dinámica el número de hallazgos asociados (`hallazgos_count`) y retornarlo en el JSON del plan.

#### [MODIFY] [capasController.js](file:///c:/Users/Anthony%20Garcia/GestionCalidad2unidad/sistema-gestion-calidad/backend/src/controllers/capasController.js)
- **`crear`**: Cambiar el estado del hallazgo asociado a `'en_tratamiento'` (en lugar del legacy `'en_proceso'`) cuando se cree una CAPA desde un hallazgo.
- **`cambiarEstado`**:
  - Validar que si `nuevo_estado` es `'rechazada'`, el `comentario` sea obligatorio.
  - Asegurar la compatibilidad con el cerrado de hallazgos cuando la CAPA se cierra como efectiva.
- **`eliminar` [NEW]**: Eliminar una CAPA. Bloquear si tiene seguimientos registrados (`SeguimientoCapa.count() > 0`).

#### [MODIFY] [routes/index.js](file:///c:/Users/Anthony%20Garcia/GestionCalidad2unidad/sistema-gestion-calidad/backend/src/routes/index.js)
- Registrar las rutas DELETE:
  - `DELETE /planes-auditoria/:id` con control de acceso para admin, gestor y auditor.
  - `DELETE /hallazgos/:id` con control de acceso para admin, gestor y auditor.
  - `DELETE /capas/:id` con control de acceso para admin y gestor de calidad.

---

### 3. Frontend (Vistas, APIs, Formularios y Modales)

#### [MODIFY] [frontend/src/lib/api.ts](file:///c:/Users/Anthony%20Garcia/GestionCalidad2unidad/sistema-gestion-calidad/frontend/src/lib/api.ts)
- Agregar métodos:
  - `auditoriasApi.eliminarPlan(id: string)`
  - `auditoriasApi.eliminarHallazgo(id: string)`
  - `capasApi.eliminar(id: string)`

#### [MODIFY] [frontend/src/components/ui/index.tsx](file:///c:/Users/Anthony%20Garcia/GestionCalidad2unidad/sistema-gestion-calidad/frontend/src/components/ui/index.tsx)
- Actualizar `ESTADO_BADGE` para dar colores distintivos a los nuevos estados:
  - `planificado`: Gris (`default`)
  - `en_ejecucion`: Azul/Celeste (`info`)
  - `ejecutado`: Verde (`success`)
  - `cerrado`: Violeta (`purple`)
  - `en_tratamiento`: Celeste/Azul (`info`)

#### [MODIFY] [frontend/src/app/auditorias/page.tsx](file:///c:/Users/Anthony%20Garcia/GestionCalidad2unidad/sistema-gestion-calidad/frontend/src/app/auditorias/page.tsx)
- **Visualización de Planes**:
  - Mostrar la cantidad de hallazgos asociados en una columna del listado principal.
  - Soportar el tipo `'especial'` y los estados `'ejecutado'` y `'cerrado'` en los combos de filtro y formularios.
  - Mapear las etiquetas visualmente a "Fecha Programada" y "Fecha Ejecución" para los campos de fecha en creación y edición.
- **Detalle de Plan (Sidebar)**:
  - Mostrar el listado de hallazgos del plan seleccionado.
  - Habilitar un botón "+ Hallazgo" para registrar un nuevo hallazgo asociado directamente a este plan de manera fluida.
  - Mostrar los botones de acción para las transiciones: "Iniciar Auditoría" (a `en_ejecucion`), "Finalizar Auditoría" (a `ejecutado`), y "Cerrar Auditoría" (a `cerrado`).
  - Habilitar botón de eliminar para planes y hallazgos con modales de confirmación, respetando los permisos de rol.
- **Detalle de Hallazgos**:
  - En la vista de Hallazgos, usar colores distintivos para los tipos: Rojo (`danger`) para no conformidad, Amarillo (`warning`) para observación y Verde (`success`) para oportunidad de mejora.
  - Al cerrar un hallazgo sin CAPA asociada, pedir en un modal/campo de entrada una justificación obligatoria.

#### [MODIFY] [frontend/src/app/capas/page.tsx](file:///c:/Users/Anthony%20Garcia/GestionCalidad2unidad/sistema-gestion-calidad/frontend/src/app/capas/page.tsx)
- **Modal de Estado**:
  - Validar que al seleccionar `'rechazada'` como nuevo estado, el campo `comentario` no esté vacío y bloquear el botón "Confirmar" hasta que se llene.
- **Eliminación**:
  - Habilitar botón para eliminar CAPA (solo para roles admin/gestor y si no tiene seguimientos).
- **Lista y Detalle**:
  - Mostrar estado y efectividad con colores/iconos distintivos.

---

## Verification Plan

### Automated Tests
Crearemos un script de integración `scratch/test_fase3_calidad.js` que se ejecutará vía Node.js en el backend para verificar:
1. Validación de fechas incoherentes en planes de auditoría (retorno 400/422).
2. Bloqueo al cerrar un plan de auditoría si tiene hallazgos abiertos/en tratamiento.
3. Bloqueo al cerrar un hallazgo si no tiene CAPA ni justificación.
4. Correcta transición del hallazgo a `'en_tratamiento'` cuando se le crea una CAPA.
5. Obligatoriedad del comentario al rechazar una CAPA.
6. Bloqueo de eliminación de planes con hallazgos y de CAPAs con seguimientos.

### Manual Verification
1. Entrar con rol `auditor` y verificar que puede crear un plan y ejecutarlo.
2. Comprobar que no puede modificar planes de otros auditores.
3. Verificar que al intentar cerrar una auditoría con hallazgos abiertos en el frontend, se muestra un banner/notificación con el error.
4. Probar el flujo de cerrar un hallazgo con justificación.
5. Probar el flujo de rechazar una CAPA validando que exige comentario.
