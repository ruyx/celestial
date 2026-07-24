# 🚀 Quick Deployment Guide - Rey Celestial

Guía rápida para deployar en Railway en 20 minutos.

---

## 📋 Checklist Pre-Deployment

Antes de empezar, asegúrate de tener:

- [ ] Cuenta de Railway: https://railway.app (gratis con GitHub)
- [ ] Cuenta de Supabase: https://supabase.com (proyecto creado)
- [ ] YouTube credentials configurados (youtube-token.json generado)
- [ ] Repositorio en GitHub (código pusheado)

---

## ⚡ Deployment en 5 Pasos

### 1️⃣ Preparar Credenciales (5 min)

```bash
# Convertir YouTube token a base64
cat youtube-token.json | base64 > youtube-token.b64

# Copiar el contenido
cat youtube-token.b64

# Guardar este valor para Railway
```

---

### 2️⃣ Push a GitHub (2 min)

```bash
# Verificar que .env NO está commiteado
git status | grep .env  # No debe aparecer

# Commit y push
git add .
git commit -m "Add Railway deployment configuration"
git push origin main
```

---

### 3️⃣ Deploy en Railway (5 min)

1. Ir a https://railway.app/dashboard
2. Click **"New Project"** → **"Deploy from GitHub repo"**
3. Seleccionar tu repositorio
4. Railway detecta `Dockerfile` automáticamente
5. Click **"Deploy Now"**

⏳ Esperar 2-3 minutos mientras Railway hace el build...

---

### 4️⃣ Configurar Variables de Entorno (5 min)

En el dashboard de Railway:

1. Ir a **Settings** → **Variables**
2. Click **"New Variable"** para cada una:

```bash
NODE_ENV=production
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
YOUTUBE_CLIENT_ID=123456789-abc.apps.googleusercontent.com
YOUTUBE_CLIENT_SECRET=GOCSPX-abc123
YOUTUBE_TOKEN_BASE64=(pegar contenido de youtube-token.b64)
```

⚠️ Railway redespliega automáticamente al agregar variables.

---

### 5️⃣ Configurar GitHub Actions Cron (3 min)

En GitHub:

1. Ir a **Settings** → **Secrets and variables** → **Actions**
2. Click **"New repository secret"**
3. Agregar las mismas variables que en Railway:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_KEY`
   - `YOUTUBE_CLIENT_ID`
   - `YOUTUBE_CLIENT_SECRET`
   - `YOUTUBE_TOKEN_BASE64`

✅ Ya creamos el workflow en `.github/workflows/analytics-weekly.yml`

---

## ✅ Verificar Deployment

### Railway Dashboard

```bash
# Ver logs en tiempo real
1. Ir a proyecto en Railway
2. Click en deployment activo
3. Ver logs → Buscar "✅ Build completed"
```

### GitHub Actions

```bash
# Probar cron manualmente
1. Ir a Actions tab en GitHub
2. Seleccionar "Weekly Analytics Collection"
3. Click "Run workflow" → "Run workflow"
4. Ver logs en tiempo real
```

---

## 🎯 Próximos Pasos

Después del primer deployment:

1. **Esperar a que termine la metadata generation** (~25 horas)
2. **Subir metadata a Supabase**:
   ```bash
   node scripts/prepare-cloud-database-openrouter.js --mode=upload
   ```
3. **Probar Agent 9 manualmente**:
   ```bash
   # Localmente
   node agents/agent-9-analytics-collector.js --insights

   # O desde GitHub Actions (workflow manual)
   ```
4. **Monitorear primera ejecución automática** (próximo domingo 3:00 AM)

---

## 📚 Documentación Completa

- **Railway Deployment**: `docs/RAILWAY-DEPLOYMENT.md` (300+ líneas)
- **Docker Setup**: `docs/DOCKER-SETUP.md` (400+ líneas)
- **Supabase Setup**: `docs/SUPABASE-SETUP.md`
- **Agent 9 Analytics**: `docs/AGENT-9-ANALYTICS.md`
- **Cron Setup**: `docs/CRON-SETUP.md`

---

## 🐛 Troubleshooting Rápido

### Error: Build failed

```bash
# Ver logs específicos en Railway
railway logs

# Verificar Dockerfile
docker build -t test .
```

### Error: Variables not found

```bash
# Verificar que todas las variables están en Railway
# Settings → Variables → Ver lista completa

# Verificar .env está en .gitignore
cat .gitignore | grep .env
```

### Error: YouTube token expired

```bash
# Regenerar token
node youtube-auth.js

# Convertir a base64
cat youtube-token.json | base64 > youtube-token.b64

# Actualizar en Railway
# Settings → Variables → YOUTUBE_TOKEN_BASE64
```

---

## 💰 Costos Estimados

**Railway Free Tier**: $5 crédito/mes
- 1 contenedor 24/7: ~$3/mes
- Dentro del free tier ✅

**GitHub Actions**: Gratis
- 2,000 minutos/mes gratis
- Cron semanal usa ~10 min/mes ✅

**Supabase Free Tier**: Gratis
- 500MB DB + 1GB bandwidth ✅

**Total**: $0-3/mes (todo dentro de free tiers)

---

## ✨ ¡Deployment Completado!

Tu proyecto ahora está:

✅ **100% Portable** (Docker)
✅ **Auto-deployable** (Railway + GitHub)
✅ **Monitoreado** (Logs en Railway)
✅ **Automatizado** (Cron via GitHub Actions)
✅ **Cloud-ready** (Supabase + Railway)

**Tiempo total de setup**: ~20 minutos
**Mantenimiento mensual**: 0 minutos (todo automático)

🎉 **¡Felicidades! El proyecto está production-ready.**
