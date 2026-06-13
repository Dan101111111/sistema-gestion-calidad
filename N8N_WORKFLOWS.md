# Guía y Plan de Trabajo para N8N - SGC-UNT v2.0

El sistema de Gestión de Calidad incluye automatización de procesos mediante N8N. N8N es crucial para automatizar notificaciones, alertas de vencimientos y flujos críticos sin sobrecargar el backend principal.

## **Estado Actual**
El sistema base ya ha generado 7 workflows en formato JSON, listos para importarse. Estos se encuentran en el directorio `n8n-workflows`:
1. `01-nuevo-documento.json`
2. `02-riesgo-critico.json`
3. `03-capa-vencida.json`
4. `04-capa-por-vencer.json`
5. `05-documento-por-vencer.json`
6. `06-indicador-bajo-meta.json`
7. `07-encuesta-publicada.json`

---

## **Estrategia de Trabajo (Asignación)**

Dado el límite de tiempo (3 días), trabajar N8N de forma grupal es contraproducente por temas de concurrencia y curva de aprendizaje. 

**Recomendación:** N8N debe ser asignado a **un solo integrante** especializado. 
Se recomienda a **Anthony** (Tech Lead) por su contexto en el backend y la base de datos, o a **Daniel** como QA para verificar que las alertas disparen correctamente a las áreas correspondientes.

---

## **Hoja de Ruta para N8N**

### **Día 1: Levantamiento e Importación**
- **Acceso:** Iniciar sesión en el servicio local de N8N (levantado vía Docker, comúnmente en `localhost:5678`).
- **Credenciales:** Configurar las credenciales compartidas:
  - Base de Datos PostgreSQL.
  - SMTP para envío de correos.
  - Interfaz del SGC-UNT.
- **Importación:** Cargar los 7 archivos JSON mencionados arriba.
- **Activación Inicial:** Reemplazar variables de entorno temporales o de prueba por las variables locales reales (`http://backend:3000`).

### **Día 2: Pruebas de Webhooks (Reactivo)**
Estos workflows se activan cuando ocurre un evento en el sistema.
- `01-nuevo-documento.json`, `02-riesgo-critico.json`, `06-indicador-bajo-meta.json`, `07-encuesta-publicada.json`.
- **Prueba:** Pedir a **Franco**, **JeanMarko** o **Daniel** que realicen la acción en el Frontend local (ej. Crear un riesgo crítico) y verificar en N8N que el Webhook se activa y el correo/alerta llega a su destino.

### **Día 3: Pruebas de Cronjobs (Proactivo)**
Estos workflows se ejecutan por tiempo (ej. revisar todos los días a las 8 AM).
- `03-capa-vencida.json`, `04-capa-por-vencer.json`, `05-documento-por-vencer.json`.
- **Prueba:** 
  1. Modificar temporalmente el cron trigger en N8N para que corra "cada 1 minuto".
  2. Modificar la fecha de vencimiento de un CAPA en la Base de Datos para que califique como "por vencer".
  3. Esperar a que el workflow corra y verificar que los involucrados sean notificados.
  4. Devolver la expresión Cron a su estado productivo (ej. todos los días a medianoche).
