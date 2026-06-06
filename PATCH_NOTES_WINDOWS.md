# Notas de Instalación y Parches (Resolución de Problemas)

Este documento detalla todas las modificaciones que se han aplicado al proyecto original para solucionar problemas de compatibilidad y asegurar que el sistema inicie correctamente, especialmente en entornos locales sobre Windows y Docker.

## 1. Conflictos de Red (Puertos Nginx en Windows)
- **Problema:** En Windows, el puerto `80` es frecuentemente utilizado por servicios del sistema operativo (IIS, Skype, etc.), lo cual causaba el error de Docker `Intento de acceso a un socket no permitido de una manera oculta`.
- **Solución:** En el archivo `docker-compose.yml`, se modificaron los puertos expuestos por Nginx de `80:80` y `443:443` hacia los puertos `8080:80` y `8443:443`. Esto permite correr el proyecto localmente sin escalar privilegios ni conflictos de red.

## 2. Bloqueos de Conexión en Redis
- **Problema:** El backend se colgaba indefinidamente o mostraba errores `Socket already opened` al arrancar. La librería `ioredis` enviaba pings y comandos antes de que la conexión estuviera 100% establecida.
- **Solución:** En `backend/src/config/redis.js`, se ajustaron los parámetros de inicialización activando `enableOfflineQueue: true` e inhabilitando `lazyConnect`. Así, las peticiones que ocurren mientras el socket carga son encoladas sin crashear el servidor.

## 3. Problemas con los Certificados SSL (Nginx)
- **Problema:** El contenedor de `nginx` quedaba atrapado en un bucle infinito de reinicios sin emitir alertas claras en la consola. Al inspeccionar, se descubrió que el script de inicialización (`generate-certs.sh`) intentaba usar el binario `openssl` para generar certificados auto-firmados de desarrollo, pero la imagen ligera de Nginx-Alpine no incluía esta herramienta.
- **Solución:** Se añadió la instrucción `apk add --no-cache openssl` dentro de `nginx/generate-certs.sh` para instalar dependencias al vuelo. Adicionalmente, en `nginx.conf`, se corrigió la sintaxis de la directiva HTTP/2 (de la obsoleta `listen 443 ssl http2;` a `listen 443 ssl; http2 on;`).

## 4. Healthcheck del Frontend (Next.js)
- **Problema:** En el comando `docker compose ps`, el contenedor frontend siempre figuraba como `unhealthy`. El `docker-compose.yml` utilizaba el comando `curl` para el test de salud, pero la imagen generada de Next.js (`node:20-alpine`) era una versión minimalista "standalone" que carece de la herramienta `curl`.
- **Solución:** Se reemplazó el comando del healthcheck por `wget -qO- http://localhost:3000 || exit 1` en el archivo `docker-compose.yml`.

## 5. Accesibilidad en Modo de Desarrollo (CORS y HTTP)
- **Problema:** Nginx forzaba a redirigir todo el tráfico a HTTPS, lo que sumado a los certificados auto-firmados entorpecía el flujo de trabajo local (alertas de seguridad del navegador). Además, el backend bloqueaba las conexiones por políticas de CORS estrictas.
- **Solución:** 
  - En `nginx/nginx.conf`, se eliminó el servidor que redirigía forzosamente el tráfico de HTTP a HTTPS. Ahora Nginx permite tráfico normal directamente en el puerto 80 (mapeado a 8080).
  - En el archivo raíz `.env`, se actualizó la lista `CORS_ORIGINS` y `FRONTEND_URL` para añadir explícitamente a `http://localhost:8080`, autorizando las comunicaciones.

## 6. Hash Incorrecto de la Contraseña de Administrador
- **Problema:** Tras todas las correcciones, iniciar sesión con las credenciales dadas en el README resultaba en un error de "Credenciales Inválidas". La semilla inicial de la base de datos (`init.sql`) tenía escrita en crudo una encriptación bcrypt defectuosa que jamás validaba a "true" frente a la cadena "Admin2024!".
- **Solución:** Se generó el hash correcto directamente a través de Node.js `bcryptjs` en el contenedor de backend (`$2a$12$x7DgW50QdJWKe6hMPA/Inu8IN9bDDwWp0iQB3pt0cfm5Lovwcft72`) y se aplicó un `UPDATE` en la base de datos y se rectificó permanentemente en `database/init.sql`.

> **Nota Adicional:** Durante las pruebas, el sistema express-rate-limit bloqueó la cuenta por límite de intentos fallidos. Esto se resolvió purgando la caché ejecutando `redis-cli flushall` con la clave correspondiente en el contenedor de Redis.
