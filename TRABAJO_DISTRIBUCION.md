# Plan de Trabajo Acelerado (3 Días) - SGC-UNT v2.0

Dado que la base del sistema (backend, frontend y n8n) ya ha sido generada mediante IA, el objetivo para los próximos 3 días es **corregir, integrar, testear y desplegar** el sistema completo.

---

## **Visión general de roles**

| Integrante | Rol principal | Foco |
| ----- | ----- | ----- |
| **Anthony** | Tech Lead + Backend | Corrección de endpoints, Integración de PDFs y MinIO, Soporte N8N y Despliegue. |
| **JeanMarko** | Frontend Core | Layout, Auth, Dashboard, Módulos de Documentos y Procesos. |
| **Franco** | Frontend Calidad | Módulos de Acreditación, Auditorías, CAPA, Riesgos. |
| **Daniel** | Frontend Analytics + QA | Indicadores, Encuestas, Notificaciones, Admin, Pruebas y QA Global. |

---

## **Plan de Acción (3 Días Restantes)**

### **Día 1: Revisión, Conexión y Corrección de Bugs (Trabajo en Paralelo)**

El sistema ya está generado, por lo que este día se enfoca en que cada responsable valide que su parte funciona y se conecta bien.

- **Anthony (Backend):**
  - Verificar que `docker-compose up` levante todos los servicios (Postgres, Redis, MinIO, N8N, Backend, Frontend).
  - Testear los endpoints críticos generados (rutas protegidas, middleware de roles) con Postman.
  - Revisar logs de errores en los controladores generados (`mainController.js` y otros).
- **JeanMarko (Frontend Core):**
  - Conectar el Frontend al Backend local. Validar el flujo de Login y refresco de tokens.
  - Revisar que el Layout, Sidebar y Dashboard rendericen sin errores de hidratación.
  - Corregir errores visuales y lógicos en los componentes de **Documentos** y **Procesos**.
- **Franco (Frontend Calidad):**
  - Validar las vistas complejas de **Acreditación** y **Auditorías**.
  - Corregir formularios de **CAPA** y **Riesgos**, asegurando que el estado (React Hook Form/State) se envíe correctamente al backend.
- **Daniel (Frontend Analytics + Admin):**
  - Revisar que los gráficos de **Indicadores** carguen datos correctamente.
  - Validar panel de **Administración** (gestión de usuarios) y el centro de **Notificaciones**.

### **Día 2: Integración Cruzada y Servicios Externos (Trabajo Secuencial y Paralelo)**

Se integran los flujos completos que dependen de varios módulos y servicios de terceros.

- **Anthony (Backend):**
  - Habilitar y probar la generación de reportes en **PDF** (Puppeteer) requeridos por todos los módulos.
  - Validar la subida, firmado de URL y descarga de archivos con **MinIO**.
  - Importar y habilitar workflows en N8N (ver `N8N_WORKFLOWS.md`). *(Secuencial: N8N es requerido para probar notificaciones automáticas).*
- **JeanMarko (Frontend Core):**
  - Implementar la subida de archivos adjuntos en Documentos. *(Secuencial: Depende de que Anthony valide MinIO).*
  - Validar el historial de versiones y diff visual de documentos.
- **Franco (Frontend Calidad):**
  - Validar que un Hallazgo Crítico en Auditorías genere automáticamente un requerimiento de CAPA.
  - Probar funcionalidad de la matriz de calor en Riesgos y vinculación de planes de mitigación.
- **Daniel (Frontend Analytics + QA):**
  - Validar lógica condicional en el generador de **Encuestas**.
  - Coordinar pruebas cruzadas: Daniel prueba los módulos de Franco, Franco los de JeanMarko, etc.

### **Día 3: QA Final, Responsividad y Despliegue (Trabajo en Paralelo)**

Pulido final para entregar el sistema funcional y con diseño premium.

- **Anthony (Backend):**
  - Limpiar base de datos de registros basura o de pruebas fallidas.
  - Configurar variables de entorno y secretos para producción (`docker-compose.prod.yml`).
  - Hacer el despliegue final y comprobar accesibilidad externa.
- **JeanMarko, Franco, Daniel (Frontend):**
  - Revisar **responsividad** en pantallas pequeñas/medianas para sus respectivos módulos.
  - Corregir estados vacíos ("empty states"), loaders, y notificaciones de error (toasts).
  - Asegurar un diseño moderno (vibrante, sombras suaves, micro-animaciones) eliminando cualquier texto hardcodeado o "lorem ipsum".

---

## **Estrategia de Optimización de Tiempo**

1. **Trabajo Paralelo:** La corrección de UI, maquetación, responsividad y validación de formularios internos no dependen del backend. Esto debe avanzarse al máximo.
2. **Trabajo Secuencial (Bloqueos):** La subida de archivos (MinIO) y descarga de PDFs dependen 100% de que el backend funcione. Anthony debe priorizar estos servicios temprano en el Día 2 para desbloquear a los demás.
3. **Control de Versiones:** Usar Git con ramas separadas (`feat/frontend-core`, `feat/frontend-calidad`, `feat/frontend-analytics`, `fix/backend`). Hacer merge frecuentemente para evitar conflictos masivos el Día 3.
