# 🐳 Docker Setup - Rey Celestial

Guía completa para dockerizar y deployar el proyecto en cualquier plataforma cloud.

---

## 📋 Tabla de Contenidos

1. [Beneficios de Docker](#beneficios-de-docker)
2. [Prerequisitos](#prerequisitos)
3. [Build de la Imagen](#build-de-la-imagen)
4. [Ejecutar con Docker Compose](#ejecutar-con-docker-compose)
5. [Configuración de Secrets](#configuración-de-secrets)
6. [Deployar en Railway](#deployar-en-railway)
7. [Deployar en AWS/GCP](#deployar-en-awsgcp)
8. [Comandos Útiles](#comandos-útiles)
9. [Troubleshooting](#troubleshooting)

---

## 🎯 Beneficios de Docker

✅ **100% Portable**: Funciona igual en local, Railway, AWS, GCP, Azure
✅ **Reproducible**: Mismo entorno en desarrollo y producción
✅ **Escalable**: Fácil replicar servicios
✅ **Aislado**: No contamina el sistema host
✅ **CI/CD Ready**: Integración continua automática

---

## 📦 Prerequisitos

### 1. Instalar Docker

**Ubuntu/Debian/WSL**:
```bash
# Actualizar repositorios
sudo apt update

# Instalar Docker
sudo apt install docker.io docker-compose -y

# Iniciar servicio
sudo systemctl start docker
sudo systemctl enable docker

# Agregar usuario al grupo docker (evitar sudo)
sudo usermod -aG docker $USER

# Recargar grupos (o hacer logout/login)
newgrp docker

# Verificar instalación
docker --version
docker-compose --version
```

**macOS**:
```bash
# Instalar Docker Desktop desde:
https://docs.docker.com/desktop/install/mac-install/

# Verificar
docker --version
docker-compose --version
```

**Windows**:
```bash
# Instalar Docker Desktop desde:
https://docs.docker.com/desktop/install/windows-install/

# Habilitar WSL 2 backend
```

---

## 🔨 Build de la Imagen

### Opción A: Build Simple

```bash
# Desde el root del proyecto
docker build -t rey-celestial:latest .

# Verificar imagen creada
docker images | grep rey-celestial
```

### Opción B: Build con Docker Compose (Recomendado)

```bash
# Build todas las imágenes definidas en docker-compose.yml
docker-compose build

# Build con cache limpio (si hay problemas)
docker-compose build --no-cache
```

---

## 🚀 Ejecutar con Docker Compose

### 1. Configurar Variables de Entorno

Asegurarse de que `.env` existe con todas las credenciales:

```bash
# Verificar que existe
ls -la .env

# Contenido mínimo requerido
cat .env
```

Debe incluir:
```bash
# YouTube API
YOUTUBE_CLIENT_ID=...
YOUTUBE_CLIENT_SECRET=...

# Supabase
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_SERVICE_KEY=...

# OpenRouter (opcional para metadata)
OPENROUTER_API_KEY=...

# Magnific AI (opcional para video generation)
MAGNIFIC_API_KEY=...
```

### 2. Preparar Archivos de Credenciales

Asegurarse de que existen:
```bash
ls -la youtube-token.json
ls -la youtube-credentials.json
```

Si no existen, ejecutar primero la autenticación de YouTube:
```bash
node youtube-auth.js
```

### 3. Crear Directorios de Datos

```bash
mkdir -p data logs output/final-videos output/video-metadata
```

### 4. Levantar Servicios

```bash
# Iniciar todos los servicios
docker-compose up -d

# Ver logs
docker-compose logs -f

# Ver logs de un servicio específico
docker-compose logs -f app
```

### 5. Verificar Estado

```bash
# Ver contenedores corriendo
docker-compose ps

# Healthcheck
docker inspect rey-celestial-app | grep -A 10 Health
```

---

## 🔐 Configuración de Secrets

### Para Desarrollo Local

Los secrets se cargan desde `.env` automáticamente.

### Para Production (Railway/AWS/GCP)

**NUNCA** commitear `.env` al repositorio. Usar secrets management:

#### Railway:
```bash
# Variables se configuran en el dashboard
# Settings → Environment Variables

YOUTUBE_CLIENT_ID=...
YOUTUBE_CLIENT_SECRET=...
SUPABASE_URL=...
SUPABASE_SERVICE_KEY=...
```

#### AWS (Secrets Manager):
```bash
# Crear secret
aws secretsmanager create-secret \
  --name rey-celestial/prod \
  --secret-string file://.env

# Actualizar Dockerfile para leer desde AWS Secrets Manager
```

#### GCP (Secret Manager):
```bash
# Crear secret
gcloud secrets create rey-celestial-env \
  --data-file=.env

# Actualizar docker-compose para leer desde GCP Secret Manager
```

---

## 🚂 Deployar en Railway

Railway ofrece deployment super simple con detección automática de Dockerfile.

### Paso 1: Crear Cuenta en Railway

```bash
# Ir a https://railway.app
# Registrarse (gratis con GitHub)
```

### Paso 2: Instalar Railway CLI (Opcional)

```bash
npm install -g @railway/cli

# Login
railway login
```

### Paso 3: Deploy desde Dashboard

1. Ir a https://railway.app/dashboard
2. Click "New Project" → "Deploy from GitHub repo"
3. Seleccionar `rey-celestial` repository
4. Railway detecta automáticamente el `Dockerfile`
5. Configurar variables de entorno en Settings → Variables
6. Deploy automático en cada push a `main`

### Paso 4: Deploy desde CLI

```bash
# Inicializar proyecto
railway init

# Link con proyecto existente (si ya existe)
railway link

# Agregar variables de entorno
railway variables set SUPABASE_URL=https://...
railway variables set SUPABASE_SERVICE_KEY=...

# Deploy
railway up

# Ver logs
railway logs
```

### Paso 5: Configurar Cron en Railway

Railway no tiene cron nativo, usar uno de estos métodos:

#### Opción A: GitHub Actions (Recomendado)

Crear `.github/workflows/analytics.yml`:

```yaml
name: Weekly Analytics

on:
  schedule:
    - cron: '0 3 * * 0'  # Domingos a las 3:00 AM UTC

jobs:
  analytics:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Run Analytics Collector
        run: |
          curl -X POST https://your-railway-app.up.railway.app/trigger-analytics \
            -H "Authorization: Bearer ${{ secrets.TRIGGER_TOKEN }}"
```

#### Opción B: Render Cron Jobs

Migrar cron jobs a Render.com (tiene cron nativo):

```yaml
# render.yaml
services:
  - type: cron
    name: analytics-collector
    env: docker
    schedule: "0 3 * * 0"
    dockerfilePath: ./Dockerfile
    dockerCommand: node agents/agent-9-analytics-collector.js
```

---

## ☁️ Deployar en AWS/GCP

### AWS ECS (Elastic Container Service)

#### 1. Crear ECR Repository

```bash
# Crear repositorio
aws ecr create-repository --repository-name rey-celestial

# Login a ECR
aws ecr get-login-password --region eu-west-1 | \
  docker login --username AWS --password-stdin \
  123456789.dkr.ecr.eu-west-1.amazonaws.com
```

#### 2. Push de Imagen

```bash
# Tag imagen
docker tag rey-celestial:latest \
  123456789.dkr.ecr.eu-west-1.amazonaws.com/rey-celestial:latest

# Push
docker push 123456789.dkr.ecr.eu-west-1.amazonaws.com/rey-celestial:latest
```

#### 3. Crear Task Definition

```json
{
  "family": "rey-celestial",
  "containerDefinitions": [
    {
      "name": "app",
      "image": "123456789.dkr.ecr.eu-west-1.amazonaws.com/rey-celestial:latest",
      "memory": 2048,
      "cpu": 1024,
      "essential": true,
      "environment": [
        { "name": "NODE_ENV", "value": "production" }
      ],
      "secrets": [
        {
          "name": "SUPABASE_URL",
          "valueFrom": "arn:aws:secretsmanager:region:account:secret:rey-celestial/prod:SUPABASE_URL::"
        }
      ]
    }
  ]
}
```

#### 4. Crear Service con Auto-Scaling

```bash
# Crear ECS service
aws ecs create-service \
  --cluster rey-celestial-cluster \
  --service-name rey-celestial-app \
  --task-definition rey-celestial:1 \
  --desired-count 1 \
  --launch-type FARGATE
```

#### 5. EventBridge para Cron

```bash
# Crear regla para analytics (domingos 3AM)
aws events put-rule \
  --name rey-celestial-analytics-weekly \
  --schedule-expression "cron(0 3 ? * SUN *)"

# Crear target (ECS task)
aws events put-targets \
  --rule rey-celestial-analytics-weekly \
  --targets "Id"="1","Arn"="arn:aws:ecs:region:account:cluster/rey-celestial","RoleArn"="...",\
  "EcsParameters"="TaskDefinitionArn=arn:aws:ecs:region:account:task-definition/analytics"
```

---

### GCP Cloud Run

#### 1. Habilitar APIs

```bash
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com
```

#### 2. Build y Push

```bash
# Configurar proyecto
gcloud config set project rey-celestial-project

# Build en Cloud Build
gcloud builds submit --tag gcr.io/rey-celestial-project/rey-celestial

# O build local y push
docker tag rey-celestial:latest gcr.io/rey-celestial-project/rey-celestial
docker push gcr.io/rey-celestial-project/rey-celestial
```

#### 3. Deploy a Cloud Run

```bash
# Deploy servicio
gcloud run deploy rey-celestial \
  --image gcr.io/rey-celestial-project/rey-celestial \
  --platform managed \
  --region europe-west1 \
  --allow-unauthenticated \
  --set-env-vars NODE_ENV=production \
  --set-secrets SUPABASE_URL=rey-celestial-supabase-url:latest,\
SUPABASE_SERVICE_KEY=rey-celestial-supabase-key:latest
```

#### 4. Cloud Scheduler para Cron

```bash
# Crear job para analytics (domingos 3AM)
gcloud scheduler jobs create http analytics-weekly \
  --schedule="0 3 * * 0" \
  --uri="https://rey-celestial-xyz.run.app/trigger-analytics" \
  --http-method=POST \
  --oidc-service-account-email=scheduler@rey-celestial.iam.gserviceaccount.com
```

---

## 🛠️ Comandos Útiles

### Docker Compose

```bash
# Iniciar servicios
docker-compose up -d

# Parar servicios
docker-compose down

# Reiniciar un servicio
docker-compose restart app

# Ver logs en tiempo real
docker-compose logs -f

# Ejecutar comando en contenedor
docker-compose exec app bash

# Limpiar todo (contenedores, volúmenes, redes)
docker-compose down -v --remove-orphans
```

### Docker Directo

```bash
# Ejecutar Agent 9 manualmente
docker run --rm \
  -v $(pwd)/data:/app/data \
  -v $(pwd)/logs:/app/logs \
  --env-file .env \
  rey-celestial:latest \
  node agents/agent-9-analytics-collector.js

# Ejecutar script de preparación de DB
docker run --rm \
  -v $(pwd)/data:/app/data \
  --env-file .env \
  rey-celestial:latest \
  node scripts/prepare-cloud-database-openrouter.js --mode=upload

# Shell interactivo dentro del contenedor
docker run --rm -it \
  --env-file .env \
  rey-celestial:latest \
  bash
```

### Limpieza

```bash
# Eliminar imágenes no usadas
docker image prune -a

# Eliminar contenedores parados
docker container prune

# Eliminar volúmenes no usados
docker volume prune

# Limpiar TODO (¡cuidado!)
docker system prune -a --volumes
```

---

## 🐛 Troubleshooting

### Error: "Cannot find module '@supabase/supabase-js'"

**Causa**: `node_modules` no se copió correctamente.

**Solución**:
```bash
# Rebuild con cache limpio
docker-compose build --no-cache
```

---

### Error: "SUPABASE_URL must be set"

**Causa**: `.env` no se cargó.

**Solución**:
```bash
# Verificar que .env existe
ls -la .env

# Verificar que docker-compose.yml tiene env_file
grep env_file docker-compose.yml

# Reiniciar servicios
docker-compose down && docker-compose up -d
```

---

### Error: "youtube-token.json not found"

**Causa**: Token de YouTube no está montado como volume.

**Solución**:
```bash
# Verificar que el archivo existe
ls -la youtube-token.json

# Verificar mount en docker-compose.yml
grep youtube-token docker-compose.yml

# Re-autenticar si es necesario
node youtube-auth.js
docker-compose restart app
```

---

### Error: FFmpeg no funciona

**Causa**: FFmpeg no está instalado en la imagen.

**Solución**: Ya está incluido en el Dockerfile:
```dockerfile
RUN apk add --no-cache ffmpeg
```

Si persiste:
```bash
# Verificar dentro del contenedor
docker-compose exec app which ffmpeg
docker-compose exec app ffmpeg -version
```

---

### Contenedor se reinicia constantemente

**Causa**: Healthcheck falla o comando por defecto termina.

**Solución**:
```bash
# Ver logs del contenedor
docker-compose logs app

# Inspeccionar healthcheck
docker inspect rey-celestial-app | grep -A 10 Health

# Ejecutar sin healthcheck temporalmente
docker run --rm -it rey-celestial:latest bash
```

---

### Volúmenes no persisten datos

**Causa**: Permisos incorrectos o bind mount mal configurado.

**Solución**:
```bash
# Verificar permisos del directorio host
ls -la data/ logs/ output/

# Dar permisos si es necesario
chmod -R 777 data/ logs/ output/

# Verificar usuario dentro del contenedor
docker-compose exec app id
```

---

## 📚 Siguientes Pasos

Una vez el Docker setup esté funcionando:

1. ✅ **Probar localmente** con `docker-compose up`
2. ✅ **Deployar a Railway** para tener URL pública
3. ✅ **Configurar cron automático** (GitHub Actions o Render)
4. ✅ **Monitorear logs** en producción
5. ✅ **Configurar alertas** (opcional con Sentry/CloudWatch)

---

## 🎯 Comandos de Verificación Completos

```bash
# 1. Build
docker-compose build

# 2. Verificar imagen
docker images | grep rey-celestial

# 3. Iniciar servicios
docker-compose up -d

# 4. Verificar contenedores
docker-compose ps

# 5. Ver logs
docker-compose logs -f app

# 6. Ejecutar Agent 9 manualmente
docker-compose exec app node agents/agent-9-analytics-collector.js --insights

# 7. Healthcheck
docker inspect rey-celestial-app | grep -A 5 Health

# 8. Parar servicios
docker-compose down
```

---

## 📅 Calendario de Deployment

| Fase | Tarea | Duración |
|------|-------|----------|
| **Fase 1** | Build local + testing | 30 minutos |
| **Fase 2** | Deploy a Railway | 15 minutos |
| **Fase 3** | Configurar cron automático | 30 minutos |
| **Fase 4** | Monitoreo y ajustes | Continuo |

---

**Total Setup**: ~1.5 horas para deployment completo 100% portable.
