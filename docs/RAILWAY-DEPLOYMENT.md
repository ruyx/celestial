# 🚂 Railway Deployment - Rey Celestial

Guía paso a paso para deployar el proyecto en Railway con deployment automático y cron jobs.

---

## 🎯 Por Qué Railway

✅ **Detección automática de Dockerfile** - Sin configuración manual
✅ **Deploy automático** - Cada push a `main` despliega automáticamente
✅ **Variables de entorno seguras** - UI intuitiva para secrets
✅ **Logs en tiempo real** - Debugging simple
✅ **Free tier generoso** - $5 de crédito gratis/mes
✅ **Postgres integrado** - Si se necesita DB adicional
✅ **CLI poderoso** - Deploy desde terminal

---

## 📋 Prerequisitos

1. Cuenta de Railway: https://railway.app
2. Repositorio GitHub con el proyecto
3. Credenciales listas:
   - Supabase URL + Service Key
   - YouTube Client ID + Secret
   - YouTube OAuth Token (youtube-token.json)
   - OpenRouter API Key (opcional)
   - Magnific API Key (opcional)

---

## 🚀 Opción 1: Deploy desde GitHub (Recomendado)

### Paso 1: Preparar Repositorio

```bash
# Asegurarse de que todo está commiteado
git status

# Si hay cambios, hacer commit
git add .
git commit -m "Add Docker setup for Railway deployment"

# Push a GitHub
git push origin main
```

⚠️ **IMPORTANTE**: Verificar que `.env` está en `.gitignore` (NUNCA commitear secrets)

```bash
# Verificar .gitignore
cat .gitignore | grep .env

# Si no está, agregarlo
echo ".env" >> .gitignore
git add .gitignore
git commit -m "Ensure .env is ignored"
git push
```

---

### Paso 2: Conectar Railway con GitHub

1. Ir a https://railway.app/dashboard
2. Click **"New Project"**
3. Seleccionar **"Deploy from GitHub repo"**
4. Autorizar Railway a acceder a GitHub (primera vez)
5. Seleccionar repositorio `rey-celestial` o el nombre de tu repo
6. Railway detecta automáticamente el `Dockerfile`
7. Click **"Deploy Now"**

⏳ Railway inicia el build automáticamente (2-3 minutos).

---

### Paso 3: Configurar Variables de Entorno

Una vez deployado:

1. Ir a **Settings** → **Variables**
2. Click **"New Variable"**
3. Agregar las siguientes variables:

```bash
# Node Environment
NODE_ENV=production

# Supabase
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# YouTube API
YOUTUBE_CLIENT_ID=123456789-abcdefg.apps.googleusercontent.com
YOUTUBE_CLIENT_SECRET=GOCSPX-abcdefg123456
YOUTUBE_API_KEY=AIzaSyAbCdEfG123456789

# OpenRouter (opcional - solo para metadata generation)
OPENROUTER_API_KEY=sk-or-v1-abcdefg123456

# Magnific AI (opcional - solo para video generation)
MAGNIFIC_API_KEY=mag_abcdefg123456
```

4. Click **"Add"** para cada variable
5. Railway redeploya automáticamente después de agregar variables

---

### Paso 4: Subir youtube-token.json

Railway no soporta archivos de credenciales directamente via UI, hay 2 opciones:

#### Opción A: Convertir a Variable de Entorno (Recomendado)

```bash
# En local, convertir youtube-token.json a base64
cat youtube-token.json | base64 > youtube-token.b64

# Copiar el contenido del archivo
cat youtube-token.b64

# Agregar como variable en Railway:
# Variable name: YOUTUBE_TOKEN_BASE64
# Value: (pegar el contenido base64)
```

Luego, modificar los scripts para decodificar al arrancar:

```javascript
// Al inicio de youtube-manager.js o donde se use
const fs = require('fs');

// Decodificar token desde env si existe
if (process.env.YOUTUBE_TOKEN_BASE64 && !fs.existsSync('youtube-token.json')) {
  const tokenData = Buffer.from(process.env.YOUTUBE_TOKEN_BASE64, 'base64').toString('utf8');
  fs.writeFileSync('youtube-token.json', tokenData);
  console.log('✅ youtube-token.json creado desde variable de entorno');
}
```

#### Opción B: Railway Volumes (Persistent Storage)

```bash
# Usar Railway CLI para subir archivo
railway volumes create youtube-credentials
railway volumes upload youtube-credentials youtube-token.json
```

---

### Paso 5: Verificar Deployment

1. Ir a **"Deployments"** tab
2. Ver el último deployment (debe estar en estado "Success")
3. Click en el deployment para ver logs
4. Verificar que no hay errores

```
✅ Build completed
✅ Container started
✅ Healthcheck passing
```

---

### Paso 6: Obtener URL Pública (Opcional)

Si necesitas endpoint HTTP público:

1. Ir a **Settings** → **Networking**
2. Click **"Generate Domain"**
3. Railway asigna URL: `rey-celestial-production.up.railway.app`
4. Usar para webhooks, APIs, cron triggers externos

---

## ⏰ Configurar Cron Jobs en Railway

Railway **NO tiene cron nativo**. Usar GitHub Actions para ejecutar tareas programadas.

### Opción 1: GitHub Actions (Recomendado)

Crear `.github/workflows/analytics-weekly.yml`:

```yaml
name: Weekly Analytics Collection

on:
  schedule:
    # Domingos a las 3:00 AM UTC (4:00 AM Spain en invierno, 5:00 AM en verano)
    - cron: '0 3 * * 0'

  # Permitir ejecución manual desde GitHub Actions UI
  workflow_dispatch:

jobs:
  collect-analytics:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Run Analytics Collector
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_SERVICE_KEY: ${{ secrets.SUPABASE_SERVICE_KEY }}
          YOUTUBE_CLIENT_ID: ${{ secrets.YOUTUBE_CLIENT_ID }}
          YOUTUBE_CLIENT_SECRET: ${{ secrets.YOUTUBE_CLIENT_SECRET }}
          YOUTUBE_TOKEN_BASE64: ${{ secrets.YOUTUBE_TOKEN_BASE64}}
        run: |
          # Decodificar token de YouTube
          echo "$YOUTUBE_TOKEN_BASE64" | base64 -d > youtube-token.json

          # Ejecutar Agent 9
          node agents/agent-9-analytics-collector.js --min-days=1
```

**Configurar Secrets en GitHub**:

1. Ir a repositorio → **Settings** → **Secrets and variables** → **Actions**
2. Click **"New repository secret"**
3. Agregar las mismas variables que en Railway:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_KEY`
   - `YOUTUBE_CLIENT_ID`
   - `YOUTUBE_CLIENT_SECRET`
   - `YOUTUBE_TOKEN_BASE64`

**Probar manualmente**:

1. Ir a **Actions** tab en GitHub
2. Seleccionar **"Weekly Analytics Collection"**
3. Click **"Run workflow"** → **"Run workflow"**
4. Ver logs en tiempo real

---

### Opción 2: Render.com Cron Jobs

Si prefieres cron nativo, migrar solo los cron jobs a Render:

```yaml
# render.yaml
services:
  - type: cron
    name: analytics-collector
    env: docker
    dockerfilePath: ./Dockerfile
    dockerCommand: node agents/agent-9-analytics-collector.js --min-days=1
    schedule: "0 3 * * 0"  # Domingos 3:00 AM UTC
    envVars:
      - key: SUPABASE_URL
        sync: false
      - key: SUPABASE_SERVICE_KEY
        sync: false
```

Deploy a Render:

```bash
# Conectar repo con Render
# Dashboard → New → Cron Job
# Seleccionar repositorio
# Render detecta render.yaml automáticamente
```

---

## 🔧 Railway CLI (Opcional)

Para deploy desde terminal:

### Instalación

```bash
# Instalar CLI
npm install -g @railway/cli

# O con Homebrew (macOS)
brew install railway

# Login
railway login
```

### Uso

```bash
# Inicializar proyecto
railway init

# Link con proyecto existente
railway link

# Ver variables de entorno
railway variables

# Agregar variable
railway variables set SUPABASE_URL=https://...

# Ver logs en tiempo real
railway logs

# Deploy manual
railway up

# Abrir dashboard en navegador
railway open
```

---

## 📊 Monitoreo y Logs

### Ver Logs en Tiempo Real

**Desde Dashboard**:
1. Ir a proyecto en Railway
2. Click en deployment activo
3. Ver logs en tiempo real
4. Filtrar por nivel: `error`, `warn`, `info`

**Desde CLI**:
```bash
railway logs -f
```

### Configurar Alertas (Opcional)

Railway no tiene alertas nativas, integrar con:

**Sentry** (para errores):
```bash
npm install @sentry/node

# En código
const Sentry = require('@sentry/node');
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV
});
```

**Betterstack** (para logs):
```bash
# Agregar variable en Railway
BETTERSTACK_SOURCE_TOKEN=...

# Logs se envían automáticamente
```

---

## 💰 Costos de Railway

### Free Tier

- **$5 de crédito gratis/mes**
- **500 horas de ejecución** (suficiente para 1 contenedor 24/7)
- **1GB RAM por servicio**
- **1GB storage**
- **100GB bandwidth**

### Pricing Plan

Si se excede el free tier:

- **Hobby Plan**: $5/mes base + uso
- **Compute**: $0.000231/GB-RAM/minuto
- **Bandwidth**: $0.10/GB

**Estimación para este proyecto**:
- 1 contenedor 24/7: ~$3/mes
- Analytics cron (1h/semana via GitHub Actions): $0
- **Total**: ~$3/mes (dentro del free tier con los $5 de crédito)

---

## 🔄 Deploy Automático (CI/CD)

Railway despliega automáticamente en cada push a `main`:

```bash
# Hacer cambios en código
git add .
git commit -m "Update Agent 9 analytics"
git push origin main

# Railway detecta el push y despliega automáticamente
# Ver progreso en dashboard o CLI:
railway logs -f
```

**Configurar rama de deploy**:
1. Settings → **Deployments**
2. **Branch**: `main` (o cambiar a `production`)
3. **Auto-deploy**: ✅ Enabled

---

## 🐛 Troubleshooting

### Error: Build failed - "Cannot find module"

**Causa**: `node_modules` no se instaló correctamente.

**Solución**:
```bash
# Verificar que package.json existe
git ls-files | grep package.json

# Verificar Dockerfile tiene npm ci
grep "npm ci" Dockerfile

# Forzar rebuild
railway logs  # Ver error específico
```

---

### Error: Container keeps restarting

**Causa**: Healthcheck falla o CMD termina inmediatamente.

**Solución**: Modificar Dockerfile CMD para servicio long-running:

```dockerfile
# En lugar de:
CMD ["node", "--version"]

# Usar un servicio que no termine:
CMD ["node", "-e", "console.log('Ready'); setInterval(() => {}, 1000)"]

# O mejor aún, implementar un endpoint HTTP simple
CMD ["node", "server.js"]
```

Crear `server.js`:

```javascript
const http = require('http');
const port = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200);
    res.end('OK');
  } else {
    res.writeHead(200);
    res.end('Rey Celestial Running');
  }
});

server.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
```

---

### Error: YouTube token expired

**Causa**: `youtube-token.json` no se actualizó.

**Solución**:
```bash
# Regenerar token localmente
node youtube-auth.js

# Convertir a base64
cat youtube-token.json | base64 > youtube-token.b64

# Actualizar variable en Railway
# Settings → Variables → YOUTUBE_TOKEN_BASE64
# (pegar nuevo contenido)
```

---

### Deploy muy lento

**Causa**: Build de imagen Docker tarda mucho.

**Solución**: Optimizar Dockerfile con cache de layers:

```dockerfile
# Copiar solo package files primero (cacheable)
COPY package*.json ./
RUN npm ci

# Copiar código después (cambia más frecuentemente)
COPY . .
```

---

## ✅ Checklist de Deployment

Antes de considerar el deployment completo:

- [ ] Repositorio en GitHub sin `.env` commiteado
- [ ] Proyecto creado en Railway
- [ ] Variables de entorno configuradas
- [ ] YouTube token convertido a base64
- [ ] Primer deployment exitoso (logs sin errores)
- [ ] GitHub Actions configurado para cron jobs
- [ ] Secrets configurados en GitHub
- [ ] Probado cron job manualmente desde Actions UI
- [ ] Logs monitoreados durante 24h sin errores

---

## 📚 Siguientes Pasos

Una vez deployado en Railway:

1. ✅ **Monitorear primer analytics run** (ejecutar manualmente primero)
2. ✅ **Configurar alertas** en Sentry para errores críticos
3. ✅ **Documentar URLs** del proyecto para el equipo
4. ✅ **Configurar backup** de Supabase (ya incluido en Supabase gratis)
5. ✅ **Testing E2E** del pipeline completo

---

## 🎯 Resumen de URLs

Después del deployment:

```bash
# Railway Dashboard
https://railway.app/project/[PROJECT_ID]

# Railway App URL (si se genera dominio)
https://rey-celestial-production.up.railway.app

# GitHub Actions
https://github.com/[USERNAME]/[REPO]/actions

# Supabase Dashboard
https://app.supabase.com/project/[PROJECT_REF]
```

---

**Deployment Total Time**: ~30 minutos para setup completo en Railway + GitHub Actions.
