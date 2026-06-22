# Documentación de Avances - Lunes 22 de Junio

## 1. Backend (Controladores y Validadores)
- **Corrección de Error 422 al Rechazar CAPAs:** Se actualizó el esquema de validación `Joi` en `cambiarEstado` para permitir que el campo `efectividad` se envíe como un string vacío (`allow('')`). Esto soluciona los errores internos cuando el frontend mandaba payloads vacíos para estados terminales.
- **Lógica de Eliminación de CAPAs:** Se reescribió `capasController.eliminar`. 
  - **CAPAs Rechazadas/Cerradas:** Ahora pueden ser eliminadas aunque tengan seguimientos (se borran en cascada automáticamente junto con la CAPA).
  - **CAPAs Activas:** Siguen bloqueadas para su eliminación si tienen seguimientos manuales ya registrados, con un mensaje de error más claro.
- **Fix de Ordenamiento en PostgreSQL (Sequelize):** Se añadió `separate: true` a las consultas `include` de `seguimientos` en los métodos `listar` y `obtener`. Esto fuerza a Sequelize a realizar el `ORDER BY creado_en DESC` correctamente, asegurando que el backend siempre envíe el seguimiento más reciente como el primer elemento (`seguimientos[0]`), solucionando el bug donde el progreso se quedaba "atascado" en el primer dato ingresado.

## 2. Frontend (UI y Experiencia de Usuario)
- **Seguimiento en Tiempo Real:** 
  - Se modificó la mutación `seguimientoMut` en React Query para que al crear un nuevo seguimiento se invaliden tanto las keys `['capa-detalle']` como `['capas']`. Esto permite que la lista completa de CAPAs reaccione al instante sin necesidad de recargar la página manualmente.
- **Nodos de Avance Dinámicos (1 al 5):** 
  - El componente `EstadoStepper` en la tabla principal fue reemplazado por `AvanceStepper`. Los nodos circulares ahora reaccionan dinámicamente al `avance_porcentaje` (0%, 25%, 50%, 75% y 100%), marcándose con un check (✓) progresivamente.
  - Se eliminó la mini barra de progreso redundante de la tabla.
- **Modal de Seguimiento Mejorado:**
  - Se retiró el `input type="number"` nativo que causaba bugs visuales (el "0" atascado) por un input de texto numérico controlado con manejo seguro. 
  - Ahora se puede borrar todo el contenido libremente y escribir el porcentaje exacto (se clampea a un máximo de 100).
- **Eliminación Segura:**
  - Se reemplazó el obsoleto `confirm()` nativo del navegador por un **Modal Estilizado de Confirmación**. Este modal también es inteligente y advierte al usuario si la CAPA activa puede fallar al intentar eliminarse debido a seguimientos existentes, y adapta el texto si la CAPA está rechazada.

## 3. General
- Todos los componentes fueron reconstruidos y empaquetados exitosamente a través de `docker compose --build` para asegurar un despliegue sin fallas.
