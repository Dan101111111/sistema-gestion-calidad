# Walkthrough: Fase 3 — Evaluación y Mejora Continua (Flujo de Calidad)

Hemos completado e integrado con éxito los módulos de **Auditorías (Planes y Hallazgos)** y **Acciones Correctivas y Preventivas (CAPA)**. A continuación se detallan los cambios implementados, las pruebas de integración realizadas y la verificación visual.

---

## Cambios Realizados

### 1. Base de Datos
- Modificamos y actualizamos las restricciones `CHECK` en las tablas:
  - `sgc.planes_auditoria`: Añadimos el tipo `'especial'` y los estados `'ejecutado'` y `'cerrado'`.
  - `sgc.hallazgos`: Añadimos el estado `'en_tratamiento'` y los niveles de gravedad `'baja'`, `'media'`, `'alta'`, `'critica'`.
  - `sgc.capas`: Añadimos efectividad `'parcial'` y `'pendiente'`.
- Agregamos la columna `justificacion` (TEXT) a la tabla `sgc.hallazgos` para registrar justificaciones de cierres sin CAPA.

### 2. Backend
- **Modelos y Validadores:** Actualizamos el mapeo de Sequelize y los validadores de Joi (`auditoriaSchemas` y `capaSchemas`) para reflejar los nuevos tipos, gravedades, estados y el campo de justificación.
- **Validaciones en Controladores:**
  - **Coherencia de fechas:** En creación y edición de planes de auditoría, se valida que la fecha de ejecución (`fecha_fin`) no sea anterior a la programada (`fecha_inicio`).
  - **Cierre de Auditorías:** Bloqueo de cambio a estado `'cerrado'` si el plan tiene hallazgos abiertos o en tratamiento.
  - **Cierre de Hallazgos:** Bloqueo de cambio a estado `'cerrado'` si el hallazgo no tiene CAPA asociada, excepto si se provee una justificación no vacía.
  - **Rechazo de CAPA:** Comentario obligatorio para rechazar una CAPA.
  - **Eliminación Lógica:** Restricción de eliminación de planes con hallazgos y de CAPAs con seguimientos.
- **Nuevas Rutas:** Agregamos y registramos las rutas `DELETE` para planes de auditoría, hallazgos y CAPAs con control de permisos por roles.

### 3. Frontend
- **Auditorías (`auditorias/page.tsx`):**
  - Mostramos de forma dinámica la cantidad de hallazgos asociados a cada plan.
  - El panel detallado lateral ahora muestra el listado de hallazgos del plan seleccionado y permite crear hallazgos pre-seleccionando la auditoría actual de forma fluida.
  - Agregamos botones para la progresión completa del estado (`planificado` -> `en_ejecucion` -> `ejecutado` -> `cerrado`) y el botón para eliminar planes y hallazgos con confirmaciones explícitas.
  - Badges con colores de tipo de hallazgo (rojo para no conformidad, amarillo para observación, verde para oportunidad de mejora) y gravedad.
  - Modal integrado para solicitar una justificación de cierre obligatoria cuando se cierra un hallazgo sin CAPA.
- **CAPAs (`capas/page.tsx`):**
  - Actualizamos el modal de transición de estado para exigir obligatoriamente un comentario si el estado es `'rechazada'`.
  - Habilitamos el botón para eliminar CAPA (bloqueado si tiene seguimientos).
  - Mostramos de forma clara la efectividad y el avance en el listado y el detalle.
- **Badges de UI (`components/ui/index.tsx`):** Añadimos soporte de color para los nuevos estados de badge (`ejecutado`, `cerrado`, `en_tratamiento`).

---

## Verificación Realizada

Creamos y ejecutamos con éxito el script de prueba de integración automatizado `scratch/test_fase3_calidad.js` el cual validó satisfactoriamente los siguientes escenarios contra la API real:

1. **Restricción de Fechas Erróneas:** Comprobamos que el backend rechaza con código `400` si la fecha de fin es menor al inicio.
2. **Creación de Planes Especiales:** Comprobamos el correcto guardado de auditorías con el tipo `especial`.
3. **Bloqueo de Cierre con Hallazgos Abiertos:** Intentamos cerrar un plan con un hallazgo activo y verificamos el bloqueo `400`.
4. **Cierre de Hallazgo sin CAPA:** Confirmamos que requiere obligatoriamente una justificación y guarda la información correctamente.
5. **Transición a en_tratamiento:** Verificamos que al crear una CAPA desde un hallazgo, el estado del hallazgo cambia automáticamente a `en_tratamiento`.
6. **Comentario en Rechazo de CAPA:** Comprobamos que no se puede rechazar una CAPA si el comentario está vacío (retorno `400`).
7. **Restricción de Eliminación Relacional:** Validamos que no se pueden eliminar planes que tengan hallazgos ni CAPAs con seguimientos.

### Resultados de la Consola del Test de Integración:
```bash
--- STARTING PHASE 3 EVALUATION AND IMPROVEMENT TESTS ---
1. Logging in as admin...
Login successful!

2. Testing plan date coherence validation (start > end)...
Success: Invalid dates blocked with status 400.

3. Creating a valid plan...
Plan created successfully with type "especial". ID: ac6ac149-544a-4477-8bb2-0a7dc715dc2c

4. Registering a finding under the plan...
Finding registered successfully. ID: 670468f0-14e0-449f-bba3-04bf6ed06684 Gravedad: critica

5. Attempting to close plan with open findings...
Success: Closing plan with open findings blocked with status 400.

6. Attempting to close finding without CAPA or justification...
Success: Closing finding without CAPA/justification blocked with status 400.

7. Closing finding with justification...
Success: Finding closed with justification.

8. Closing plan now that all findings are closed...
Success: Plan closed successfully.

9. Creating new plan and finding to test CAPA integration...

10. Creating CAPA linked to finding...
CAPA created successfully. ID: 61c6b9a4-2e8b-45bc-8568-440d0cb58826

11. Verifying finding transitioned to "en_tratamiento"...
Success: Finding state is "en_tratamiento".

12. Testing CAPA rejection without comment (should fail)...
Success: Rejection without comment blocked with status 400.

13. Rejecting CAPA with comment...
Success: CAPA rejected with comment successfully.

14. Attempting to delete plan with findings...
Success: Deleting plan with findings blocked with status 400.

15. Testing CAPA deletion with follow-ups...
Reset to registrada status: 200
Move to en_implementacion status: 200
Success: Deleting CAPA with follow-ups blocked with status 400.

--- ALL PHASE 3 INTEGRATION TESTS PASSED SUCCESSFULLY ---
```

---

## Compilación del Frontend
La aplicación de Next.js compiló de manera exitosa y optimizada:
- **Estado:** 100% compila sin advertencias ni fallos.
- **Ruta `/auditorias`:** Generada estáticamente.
- **Ruta `/capas`:** Generada estáticamente.
