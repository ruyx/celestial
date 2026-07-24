# ============================================================================
# DOCKERFILE: Rey Celestial - YouTube Bible Automation
# ============================================================================
# Multi-stage build para optimizar tamaño de imagen
# ============================================================================

# ============================================================================
# STAGE 1: Builder
# ============================================================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar package files
COPY package*.json ./

# Instalar dependencias (incluye dev para builds si es necesario)
RUN npm ci

# Copiar código fuente
COPY . .

# ============================================================================
# STAGE 2: Production
# ============================================================================
FROM node:20-alpine AS production

# Metadata
LABEL maintainer="Rey Celestial Project"
LABEL description="YouTube Bible Automation with AI-powered content generation"

# Variables de entorno por defecto
ENV NODE_ENV=production
ENV TZ=Europe/Madrid

# Instalar dependencias del sistema
RUN apk add --no-cache \
    ffmpeg \
    curl \
    bash \
    tzdata \
    && rm -rf /var/cache/apk/*

# Crear usuario no-root
RUN addgroup -g 1001 -S nodejs \
    && adduser -S nodejs -u 1001

WORKDIR /app

# Copiar node_modules desde builder
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules

# Copiar código fuente
COPY --chown=nodejs:nodejs . .

# Crear directorios necesarios con permisos correctos
RUN mkdir -p \
    /app/data \
    /app/logs \
    /app/output/final-videos \
    /app/output/video-metadata \
    && chown -R nodejs:nodejs /app

# Cambiar a usuario no-root
USER nodejs

# Exponer puerto (si se necesita API en el futuro)
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node -e "console.log('healthy')" || exit 1

# Comando por defecto (puede ser sobrescrito en docker-compose)
CMD ["node", "--version"]
