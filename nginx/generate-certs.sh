#!/bin/sh
# Script para generar certificados SSL auto-firmados para desarrollo
# Se ejecuta automáticamente al iniciar el contenedor de Nginx

CERT_DIR="/etc/nginx/certs"
CERT_FILE="$CERT_DIR/sgc-unt.crt"
KEY_FILE="$CERT_DIR/sgc-unt.key"

mkdir -p "$CERT_DIR"

if ! command -v openssl >/dev/null 2>&1; then
    echo "[nginx-init] Instalando openssl..."
    apk add --no-cache openssl
fi

if [ ! -f "$CERT_FILE" ] || [ ! -f "$KEY_FILE" ]; then
    echo "[nginx-init] Generando certificados SSL auto-firmados..."
    openssl req -x509 -nodes -days 3650 -newkey rsa:2048 \
        -keyout "$KEY_FILE" \
        -out "$CERT_FILE" \
        -subj "/C=PE/ST=La Libertad/L=Trujillo/O=Universidad Nacional de Trujillo/OU=SGC/CN=sgc-unt.local" \
        -addext "subjectAltName=DNS:localhost,DNS:sgc-unt.local,IP:127.0.0.1"
    echo "[nginx-init] Certificados generados en $CERT_DIR"
else
    echo "[nginx-init] Certificados SSL ya existen, omitiendo generación."
fi

chmod 600 "$KEY_FILE"
chmod 644 "$CERT_FILE"
