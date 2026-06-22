# Tareas: Fase 3 — Evaluación y Mejora Continua (Flujo de Calidad)

- `[x]` Base de Datos: Crear y ejecutar migración SQL `database/migration_fase3_calidad.sql`
- `[x]` Backend: Modificar el modelo `index.js` en `backend/src/models`
- `[x]` Backend: Actualizar `backend/src/validators/index.js` con las nuevas gravedades, tipos y justificación
- `[x]` Backend: Actualizar `mainController.js` (validación de fechas, cierre de planes, cierre de hallazgos con justificación/CAPA, conteo de hallazgos y `DELETE` endpoints)
- `[x]` Backend: Actualizar `capasController.js` (comentario obligatorio al rechazar, transición de hallazgo a `en_tratamiento`, y endpoint `DELETE`)
- `[x]` Backend: Registrar nuevas rutas DELETE en `backend/src/routes/index.js`
- `[x]` Frontend: Actualizar `frontend/src/lib/api.ts` con los nuevos métodos DELETE
- `[x]` Frontend: Modificar `frontend/src/components/ui/index.tsx` con colores de nuevos estados en `ESTADO_BADGE`
- `[x]` Frontend: Modificar `frontend/src/app/auditorias/page.tsx` (conteo, panel detallado de hallazgos, transiciones de plan, eliminación, colores de tipos de hallazgo, justificación en cierre de hallazgo)
- `[x]` Frontend: Modificar `frontend/src/app/capas/page.tsx` (comentario obligatorio al rechazar, botón de eliminar, iconos/colores)
- `[x]` Verificación: Crear y ejecutar script de prueba automatizado `scratch/test_fase3_calidad.js`
