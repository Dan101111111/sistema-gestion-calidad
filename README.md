# SGC-UNT v2.0 — Sistema de Gestión de la Calidad
## Universidad Nacional de Trujillo

![SGC-UNT](https://img.shields.io/badge/SGC--UNT-v2.0-003366?style=for-the-badge&logo=university)
![Node](https://img.shields.io/badge/Node.js-20-green?style=flat-square&logo=node.js)
![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue?style=flat-square&logo=postgresql)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat-square&logo=docker)

> ⚠️ **¡ATENCIÓN USUARIOS LOCALES (WINDOWS/DOCKER)!** ⚠️
> Este repositorio ha sido parcheado para resolver conflictos de red, problemas de SSL y errores de base de datos. Por favor, lee obligatoriamente las **[Notas de Instalación y Parches](./PATCH_NOTES_WINDOWS.md)** antes de continuar.

---

## 📋 Descripción

El **SGC-UNT v2.0** es una plataforma web integral para la gestión de la calidad institucional de la Universidad Nacional de Trujillo, alineada con **ISO 21001:2018** y los requisitos de **SUNEDU**. Centraliza la gestión de documentos, procesos, acreditación, auditorías, CAPAs, riesgos, indicadores y encuestas de satisfacción.

---

## 🏗️ Arquitectura

```
Internet
    │
    ▼
┌─────────────┐
│   Nginx     │  → SSL termination, reverse proxy
│  :80/:443   │
└──────┬──────┘
       │
   ┌───┴───────────────┐
   ▼                   ▼
┌──────────┐     ┌──────────────┐
│ Frontend │     │   Backend    │
│ Next.js  │     │ Node+Express │
│  :3000   │     │    :3001     │
└──────────┘     └──┬───────────┘
                    │
        ┌───────────┼──────────────┐
        ▼           ▼              ▼
  ┌──────────┐ ┌────────┐  ┌──────────────┐
  │PostgreSQL│ │ Redis  │  │    MinIO     │
  │   :5432  │ │  :6379 │  │  :9000/9001  │
  └──────────┘ └────────┘  └──────────────┘
                    │
                    ▼
              ┌──────────┐
              │   n8n    │
              │  :5678   │
              └──────────┘
```

---

## 🚀 Instalación rápida con Docker Compose

### Requisitos previos

| Herramienta | Versión mínima | Verificar con |
|-------------|---------------|---------------|
| Docker      | 24.x          | `docker --version` |
| Docker Compose | 2.x        | `docker compose version` |
| Git         | 2.x           | `git --version` |
| RAM libre   | 4 GB          | — |
| Disco libre | 10 GB         | — |

---

### ⚠️ Nota sobre el ZIP descargado

La carpeta `reset-password/_token_/page.tsx` debe renombrarse a `reset-password/[token]/page.tsx` (con corchetes) para que Next.js reconozca el parámetro dinámico de ruta:

```bash
# En Linux/Mac:
mv frontend/src/app/reset-password/_token_ "frontend/src/app/reset-password/[token]"

# En Windows (PowerShell):
Rename-Item "frontend\src\app\reset-password\_token_" "[token]"
```

### Paso 1 — Clonar el repositorio

```bash
git clone https://github.com/tu-org/sgc-unt.git
cd sgc-unt
```

---

### Paso 2 — Configurar variables de entorno

```bash
# Copiar el archivo de ejemplo
cp .env.example .env

# Editar con tus valores reales
nano .env   # o code .env, vim .env
```

**Variables críticas que DEBES cambiar para producción:**

```bash
# Generar secrets seguros (64 caracteres aleatorios)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Asignar a:
JWT_SECRET=<resultado del comando>
REFRESH_TOKEN_SECRET=<resultado del comando>
HMAC_SECRET=<resultado del comando>
N8N_ENCRYPTION_KEY=<resultado del comando>

# Credenciales de base de datos
POSTGRES_PASSWORD=tu_password_seguro_aqui
REDIS_PASSWORD=tu_redis_password_aqui

# MinIO
MINIO_ROOT_PASSWORD=tu_minio_password_aqui

# SMTP real (para envío de correos)
SMTP_HOST=smtp.tu-dominio.edu.pe
SMTP_USER=sgc@unitru.edu.pe
SMTP_PASS=tu_app_password

# URL del frontend (sin trailing slash)
FRONTEND_URL=https://sgc.unitru.edu.pe
CORS_ORIGINS=https://sgc.unitru.edu.pe
```

---

### Paso 3 — Construir e iniciar los servicios

```bash
# Primera vez: construir imágenes e iniciar
docker compose up --build -d

# Ver progreso de los logs
docker compose logs -f

# Verificar que todos los servicios están corriendo
docker compose ps
```

**Salida esperada de `docker compose ps`:**
```
NAME            STATUS
sgc-postgres    Up (healthy)
sgc-redis       Up (healthy)
sgc-minio       Up (healthy)
sgc-minio-init  Exited (0)       ← Normal: solo inicializa buckets
sgc-backend     Up (healthy)
sgc-frontend    Up (healthy)
sgc-n8n         Up
sgc-nginx       Up
```

---

### Paso 4 — Verificar la instalación

```bash
# Health check de la API
curl http://localhost:8080/api/v1/health

# Respuesta esperada:
# {"status":"ok","timestamp":"...","version":"2.0.0","services":{"database":"ok","redis":"ok"}}
```

---

### Paso 5 — Primer acceso

Abrir en el navegador: **http://localhost:8080**

> 💡 **Nota de Desarrollo:** El acceso principal para desarrollo se ha migrado al puerto HTTP 8080 para evitar las alertas molestas de certificados SSL. Para ver los parches y correcciones aplicados al entorno local en Windows, consulta las [Notas de Instalación](./PATCH_NOTES_WINDOWS.md).

**Credenciales iniciales del administrador:**
```
Email:      admin@unitru.edu.pe
Contraseña: Admin2024!
```

> 🔒 **Cambie la contraseña inmediatamente** tras el primer inicio de sesión desde **Perfil → Cambiar contraseña**.

---

## ⚙️ Configuración de n8n (automatización)

### Paso 1 — Acceder a n8n

Abrir: **http://localhost:5678**

Credenciales:
```
Usuario:    sgc_n8n
Contraseña: n8n_secure_2024  (o el valor de N8N_PASSWORD en tu .env)
```

### Paso 2 — Configurar credenciales en n8n

1. Ir a **Settings → Credentials → New Credential**
2. Crear credencial **HTTP Header Auth**:
   - Name: `SGC-API-Key`
   - Header Name: `Authorization`
   - Header Value: `Bearer <access-token-admin>`

3. Crear credencial **SMTP**:
   - Name: `SGC-SMTP`
   - Host, Port, User, Password según tu `.env`

### Paso 3 — Configurar variables de entorno de n8n

En la interfaz de n8n, ir a **Settings → Variables** y crear:

| Variable | Valor |
|----------|-------|
| `SGC_API_URL` | `http://backend:3001` |
| `FRONTEND_URL` | `https://localhost` (o tu dominio) |
| `SMTP_FROM` | `"SGC-UNT" <sgc@unitru.edu.pe>` |

### Paso 4 — Importar workflows

1. Ir a **Workflows → Import from file**
2. Importar cada archivo de `n8n-workflows/`:
   - `01-nuevo-documento.json`
   - `02-riesgo-critico.json`
   - `03-capa-vencida.json`
   - `04-capa-por-vencer.json`
   - `05-documento-por-vencer.json`
   - `06-indicador-bajo-meta.json`
   - `07-encuesta-publicada.json`
3. En cada workflow, actualizar las credenciales con las creadas en el paso anterior
4. **Activar** cada workflow con el toggle de la esquina superior derecha

---

## 🛠️ Comandos de administración

### Ver logs

```bash
# Todos los servicios
docker compose logs -f

# Solo backend
docker compose logs -f backend

# Solo frontend
docker compose logs -f frontend

# Últimas 100 líneas del backend
docker compose logs --tail=100 backend
```

### Reiniciar servicios

```bash
# Reiniciar servicio específico
docker compose restart backend

# Reiniciar todos
docker compose restart

# Reconstruir y reiniciar backend tras cambios de código
docker compose up -d --build backend
```

### Acceder a los contenedores

```bash
# Shell del backend
docker exec -it sgc-backend sh

# Shell de PostgreSQL
docker exec -it sgc-postgres psql -U sgc_user -d sgcunt

# Shell de Redis
docker exec -it sgc-redis redis-cli -a tu_redis_password
```

---

## 🗄️ Base de datos

### Backup

```bash
# Backup completo con fecha
docker exec sgc-postgres pg_dump \
  -U sgc_user -d sgcunt \
  --schema=sgc \
  --format=custom \
  --file=/tmp/sgc-backup-$(date +%Y%m%d-%H%M).dump

# Copiar backup al host
docker cp sgc-postgres:/tmp/sgc-backup-*.dump ./backups/
```

### Restaurar backup

```bash
# Copiar backup al contenedor
docker cp ./backups/mi-backup.dump sgc-postgres:/tmp/

# Restaurar (¡cuidado: sobreescribe datos!)
docker exec sgc-postgres pg_restore \
  -U sgc_user -d sgcunt \
  --schema=sgc \
  --clean --if-exists \
  /tmp/mi-backup.dump
```

### Consultas útiles de mantenimiento

```sql
-- Ver usuarios activos
SELECT id, nombre, apellido, email, rol, ultimo_acceso
FROM sgc.usuarios
WHERE activo = true
ORDER BY ultimo_acceso DESC;

-- Ver CAPAs vencidas
SELECT * FROM sgc.v_capas_vencidas;

-- Ver documentos por vencer
SELECT * FROM sgc.v_documentos_por_vencer;

-- Dashboard KPIs rápido
SELECT * FROM sgc.v_dashboard_kpis;

-- Ver logs de auditoría recientes
SELECT tabla, accion, ip, creado_en
FROM sgc.auditoria_log
ORDER BY creado_en DESC
LIMIT 50;

-- Resetear contraseña de admin manualmente (bcrypt de "Admin2024!")
UPDATE sgc.usuarios
SET password_hash = '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMaJqzQNjXb5dD4JFd1YGtY.mG',
    intentos_fallidos = 0,
    bloqueado_hasta = NULL
WHERE email = 'admin@unitru.edu.pe';
```

---

## 🌐 URLs y Puertos

| Servicio | URL / Puerto | Descripción |
|----------|-------------|-------------|
| **Frontend** | https://localhost | Aplicación web principal |
| **API** | https://localhost/api/v1 | API REST del backend |
| **n8n** | http://localhost:5678 | Motor de automatización |
| **MinIO Console** | http://localhost:9001 | Gestión de archivos |
| **PostgreSQL** | localhost:5432 | Base de datos (solo interno) |
| **Redis** | localhost:6379 | Caché (solo interno) |

---

## 🔧 Solución de problemas comunes

### El backend no arranca — error de conexión a PostgreSQL

```bash
# Verificar que PostgreSQL está healthy
docker compose ps postgres

# Ver logs de Postgres
docker compose logs postgres

# Solución: esperar a que Postgres esté listo y reiniciar backend
docker compose restart backend
```

### Error de CORS en el frontend

Verificar en `.env` que `CORS_ORIGINS` y `FRONTEND_URL` coincidan con la URL desde la que accede el navegador:

```bash
FRONTEND_URL=https://mi-servidor.edu.pe
CORS_ORIGINS=https://mi-servidor.edu.pe
```

Luego reiniciar el backend: `docker compose restart backend`

### MinIO no crea los buckets

```bash
# Forzar re-ejecución del init
docker compose run --rm minio-init
```

### Puppeteer (PDF) falla en el backend

Asegurarse de que el contenedor tiene acceso al ejecutable de Chromium:

```bash
docker exec sgc-backend ls /usr/bin/chromium-browser
# Debe mostrar: /usr/bin/chromium-browser

# Si no existe, reconstruir la imagen
docker compose build --no-cache backend
```

### Error 413 — Archivo demasiado grande

Ajustar en `nginx/nginx.conf`:
```nginx
client_max_body_size 100m;  # aumentar según necesidad
```
Y en `.env`: `MAX_TAMANO_ARCHIVO_MB=100`

### Cuenta de usuario bloqueada

```bash
# En la consola de Redis
docker exec -it sgc-redis redis-cli -a tu_password
> DEL login:lock:usuario@unitru.edu.pe
> DEL login:attempts:usuario@unitru.edu.pe
```

O desde la base de datos:
```sql
UPDATE sgc.usuarios
SET intentos_fallidos = 0, bloqueado_hasta = NULL
WHERE email = 'usuario@unitru.edu.pe';
```

### Puerto 80/443 ya está en uso

Cambiar los puertos en `docker-compose.yml`:
```yaml
nginx:
  ports:
    - "8080:80"
    - "8443:443"
```

---

## 🏭 Despliegue en Producción

### Checklist previo al despliegue

- [ ] Cambiar todos los secrets en `.env` (no usar valores por defecto)
- [ ] Configurar un dominio real y DNS
- [ ] Reemplazar certificados SSL auto-firmados por certificados válidos (Let's Encrypt, etc.)
- [ ] Configurar SMTP de producción institucional
- [ ] Configurar backups automáticos de PostgreSQL y MinIO
- [ ] Revisar y ajustar los `limit_req` de Nginx para el tráfico esperado
- [ ] Configurar firewall (solo exponer puertos 80 y 443)
- [ ] Cambiar contraseña del administrador inicial

### Configurar Let's Encrypt (Certbot)

```bash
# Instalar certbot en el host (fuera de Docker)
apt-get install certbot

# Obtener certificado
certbot certonly --standalone \
  -d sgc.unitru.edu.pe \
  --email sgc@unitru.edu.pe \
  --agree-tos --non-interactive

# Copiar certificados al directorio de nginx
cp /etc/letsencrypt/live/sgc.unitru.edu.pe/fullchain.pem ./nginx/certs/sgc-unt.crt
cp /etc/letsencrypt/live/sgc.unitru.edu.pe/privkey.pem   ./nginx/certs/sgc-unt.key

# Recargar nginx
docker compose exec nginx nginx -s reload
```

### Variables adicionales para producción

```bash
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://sgc.unitru.edu.pe/api/v1
FRONTEND_URL=https://sgc.unitru.edu.pe
CORS_ORIGINS=https://sgc.unitru.edu.pe
```

---

## 📁 Estructura del proyecto

```
sgc-unt/
├── database/
│   └── init.sql                 # Script completo de BD PostgreSQL
├── backend/
│   ├── src/
│   │   ├── config/              # DB, Redis, MinIO, Mail, Logger
│   │   ├── controllers/         # Controladores por módulo
│   │   ├── middleware/          # Auth, roles, rate-limit, upload, errors
│   │   ├── models/              # Modelos Sequelize
│   │   ├── routes/              # Enrutador principal
│   │   ├── services/            # PDF, Notificaciones, n8n, Archivos
│   │   └── index.js             # Punto de entrada
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── app/                 # Páginas Next.js (App Router)
│   │   ├── components/          # Layout y UI reutilizables
│   │   ├── context/             # AuthContext, QueryProvider
│   │   ├── lib/                 # API client (Axios), utils
│   │   └── types/               # Interfaces TypeScript
│   ├── Dockerfile
│   └── package.json
├── nginx/
│   ├── nginx.conf               # Configuración Nginx
│   └── generate-certs.sh        # Generador de certificados dev
├── n8n-workflows/               # 7 workflows de automatización
├── diagrams/                    # Diagramas de arquitectura y ER
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## 🔑 Roles y permisos

| Rol | Documentos | Procesos | Acreditación | Auditorías | CAPAs | Riesgos | Indicadores | Encuestas | Admin |
|-----|-----------|---------|-------------|-----------|-------|---------|------------|----------|-------|
| **admin** | ✅ CRUD | ✅ CRUD | ✅ CRUD | ✅ CRUD | ✅ CRUD | ✅ CRUD | ✅ CRUD | ✅ CRUD | ✅ |
| **gestor_calidad** | ✅ CRUD+Aprobar | ✅ CRUD | ✅ CRUD | ✅ CRUD | ✅ CRUD | ✅ CRUD | ✅ CRUD | ✅ CRUD | ❌ |
| **auditor** | 👁️ Leer | 👁️ Leer | ❌ | ✅ CRUD | 👁️ Leer | 👁️ Leer | ❌ | ❌ | ❌ |
| **docente** | 👁️ Leer | 👁️ Leer | ❌ | ❌ | ❌ | ❌ | 👁️ Leer | 📝 Responder | ❌ |
| **estudiante** | 👁️ Leer | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | 📝 Responder | ❌ |
| **egresado** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | 📝 Responder | ❌ |

---

## 📊 Módulos del sistema

| Módulo | Descripción | Ruta |
|--------|-------------|------|
| **Dashboard** | KPIs, gráficas y alertas | `/dashboard` |
| **Documentos** | Gestión documental con versiones y aprobaciones | `/documentos` |
| **Procesos** | Mapa de procesos BPMN jerárquico | `/procesos` |
| **Acreditación** | Estándares ISO 21001 y SUNEDU | `/acreditacion` |
| **Auditorías** | Planes, equipos y hallazgos | `/auditorias` |
| **CAPA** | Ciclo completo correctivo/preventivo | `/capas` |
| **Riesgos** | Matriz de calor y planes de mitigación | `/riesgos` |
| **Indicadores** | Medición y análisis de tendencias | `/indicadores` |
| **Encuestas** | Diseño, publicación y resultados | `/encuestas` |
| **Notificaciones** | Centro de alertas interno | `/notificaciones` |
| **Administración** | Usuarios, auditoría y configuración | `/admin` |

---

## 🔗 API Reference

Base URL: `https://tu-dominio/api/v1`

Autenticación: `Authorization: Bearer <access_token>`

### Endpoints principales

```
# Auth
POST   /auth/login
POST   /auth/refresh
POST   /auth/logout
GET    /auth/me
POST   /auth/recuperar
POST   /auth/reset-password
POST   /auth/cambiar-password

# Dashboard
GET    /dashboard/kpis
GET    /dashboard/graficos

# Documentos
GET    /documentos
POST   /documentos
GET    /documentos/:id
PUT    /documentos/:id
DELETE /documentos/:id
PATCH  /documentos/:id/estado
GET    /documentos/reporte/pdf

# Procesos
GET    /macroprocesos
POST   /macroprocesos
GET    /procesos
POST   /procesos
GET    /procesos/:id

# CAPAs
GET    /capas
POST   /capas
PATCH  /capas/:id/estado
POST   /capas/:id/seguimientos
GET    /capas/reporte/pdf

# Riesgos
GET    /riesgos
POST   /riesgos
GET    /riesgos/matriz-calor
GET    /riesgos/ranking

# Indicadores
GET    /indicadores
POST   /indicadores/:id/mediciones
GET    /indicadores/:id/tendencias

# Encuestas
GET    /encuestas
POST   /encuestas
POST   /encuestas/:id/responder
GET    /encuestas/:id/resultados

# Búsqueda global
GET    /buscar?q=texto&tipo=documento|proceso|riesgo|capa

# Auditoría
GET    /auditoria
GET    /auditoria/:tabla/:id
```

---

## 👨‍💻 Desarrollo local (sin Docker)

```bash
# PostgreSQL y Redis con Docker solo para la BD
docker compose up -d postgres redis minio

# Backend
cd backend
npm install
cp ../.env.example .env   # ajustar DB_HOST=localhost
npm run dev               # inicia en http://localhost:3001

# Frontend (en otra terminal)
cd frontend
npm install
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1 npm run dev
# inicia en http://localhost:3000
```

---

## 📝 Licencia

Uso exclusivo interno — Universidad Nacional de Trujillo.  
© 2024 Dirección de Gestión de la Calidad — UNT.

---

## 📞 Soporte

- **Dirección de Calidad UNT**: calidad@unitru.edu.pe
- **Soporte técnico TI**: tic@unitru.edu.pe
- **Documentación**: https://sgc.unitru.edu.pe/docs

---

*SGC-UNT v2.0 — Construido con ❤️ para la calidad educativa universitaria*
