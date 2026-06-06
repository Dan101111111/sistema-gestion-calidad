# ============================================================
# SGC-UNT Backend — Dockerfile multi-stage
# ============================================================

# Stage 1: Dependencies
FROM node:20-alpine AS deps
WORKDIR /app

# Instalar dependencias de sistema para bcrypt y puppeteer
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    libc6-compat

COPY package*.json ./
RUN npm install --only=production && npm cache clean --force

# Stage 2: Build (para TypeScript si se usa)
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

# Stage 3: Production
FROM node:20-alpine AS production
WORKDIR /app

# Instalar Chromium para Puppeteer
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    font-noto \
    curl

# Variable para Puppeteer use Chromium instalado
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
ENV NODE_ENV=production

# Usuario no-root para seguridad
RUN addgroup -g 1001 -S nodejs && adduser -S nodeuser -u 1001 -G nodejs

COPY --from=deps /app/node_modules ./node_modules
COPY --chown=nodeuser:nodejs . .

# Crear directorio de logs
RUN mkdir -p /app/logs && chown nodeuser:nodejs /app/logs

USER nodeuser

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:3001/api/v1/health || exit 1

CMD ["node", "src/index.js"]
