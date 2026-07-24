# 🏗️ ARQUITECTURA MAESTRA - SISTEMA DE VIDEOS BÍBLICOS VIRALES

## 🎯 VISIÓN GENERAL

Sistema 100% automatizado, cloud-portable y self-learning que genera videos virales de versículos bíblicos usando IA.

**Características principales:**
- ✅ **31,000+ versículos** disponibles (CodexObsidiana)
- ✅ **ZERO hardcoding** - Todo dinámico
- ✅ **Agent 0 decide primero** - Cerebro del sistema
- ✅ **Texto REAL de CodexObsidiana** - NO inventa contenido
- ✅ **Analytics retroalimentan** - Sistema aprende
- ✅ **100% cloud-portable** - Deploy en cualquier plataforma
- ✅ **Triggers automáticos** - Ejecución desatendida

---

## 🔄 FLUJO COMPLETO DEL SISTEMA

```
┌───────────────────────────────────────────────────────────────┐
│  AGENT 0: INVESTIGADOR (CEREBRO)                              │
│  - Consulta analytics de videos previos                       │
│  - Identifica patrones ganadores (categorías/hooks)           │
│  - Selecciona versículo óptimo de database (31k+)             │
│  - Genera metadata PERSONALIZADA con IA:                      │
│    * visualDescriptions (5 escenas únicas)                    │
│    * customHook (viral personalizado)                         │
│    * historicalInsight (curiosidad real)                      │
│  - Output: agent-0-decision.json                              │
│  - Marca versículo como usado en database                     │
└───────────────────────────────────────────────────────────────┘
                            ↓
┌───────────────────────────────────────────────────────────────┐
│  AGENT 1: REDACTOR (MAESTRO)                                  │
│  - Lee agent-0-decision.json                                  │
│  - Toma texto LITERAL del versículo                           │
│  - Construye estructura de enseñanza:                         │
│    1. Hook (5s): customHook de Agent 0                        │
│    2. Intro (25s): texto literal + historicalInsight          │
│    3. Body (45s): desglose palabra por palabra                │
│    4. Application (25s): aplicación práctica                  │
│    5. CTA (20s): llamado a acción                             │
│  - Output: script.json (120 segundos total)                   │
└───────────────────────────────────────────────────────────────┘
                            ↓
┌───────────────────────────────────────────────────────────────┐
│  AGENT 2: VISUAL DESIGNER (PRO)                               │
│  - Lee script.json                                            │
│  - Usa visualDescriptions de Agent 0                          │
│  - Adapta a técnicas de diseño pro                            │
│  - Output: visual-specs.json (5 escenas)                      │
└───────────────────────────────────────────────────────────────┘
                            ↓
┌───────────────────────────────────────────────────────────────┐
│  AGENT 3: BATCH CREATOR                                       │
│  - Lee visual-specs.json                                      │
│  - Crea prompts optimizados para Magnific                     │
│  - Output: batch.json (5 prompts)                             │
└───────────────────────────────────────────────────────────────┘
                            ↓
┌───────────────────────────────────────────────────────────────┐
│  AGENT 4: IMAGE GENERATOR (Magnific MCP)                      │
│  - Lee batch.json                                             │
│  - Genera 5 imágenes 9:16 con Magnific API                    │
│  - Output: images-metadata.json (URLs)                        │
│  - Tiempo: ~5 min                                             │
└───────────────────────────────────────────────────────────────┘
                            ↓
┌───────────────────────────────────────────────────────────────┐
│  AGENT 5: VIDEO ANIMATOR (Magnific MCP)                       │
│  - Lee images-metadata.json                                   │
│  - Anima cada imagen con movimiento de cámara                 │
│  - Output: video-clips-metadata.json (URLs)                   │
│  - Tiempo: ~8-12 min                                          │
└───────────────────────────────────────────────────────────────┘
                            ↓
┌───────────────────────────────────────────────────────────────┐
│  AGENT 6: AUDIO TTS                                           │
│  - Lee script.json                                            │
│  - Genera voiceover con ElevenLabs                            │
│  - Output: audio.mp3 (120 segundos)                           │
│  - Tiempo: ~1-2 min                                           │
└───────────────────────────────────────────────────────────────┘
                            ↓
┌───────────────────────────────────────────────────────────────┐
│  AGENT 7: VIDEO EDITOR                                        │
│  - Lee script.json + video-clips + audio                      │
│  - Ensambla video con FFmpeg                                  │
│  - Agrega subtítulos sincronizados                            │
│  - Output: final-video.mp4 (120 segundos, 9:16)               │
│  - Tiempo: ~2-3 min                                           │
└───────────────────────────────────────────────────────────────┘
                            ↓
┌───────────────────────────────────────────────────────────────┐
│  AGENT 8: YOUTUBE UPLOADER                                    │
│  - Lee script.json + final-video.mp4                          │
│  - Genera thumbnail automático                                │
│  - Sube a YouTube con metadata optimizada                     │
│  - Output: youtube-video-id                                   │
│  - Guarda ID en database para analytics                       │
└───────────────────────────────────────────────────────────────┘
                            ↓
┌───────────────────────────────────────────────────────────────┐
│  CRON TRIGGER (cada 7 días)                                   │
│  - Ejecuta Agent 9 automáticamente                            │
└───────────────────────────────────────────────────────────────┘
                            ↓
┌───────────────────────────────────────────────────────────────┐
│  AGENT 9: ANALYTICS COLLECTOR                                 │
│  - Descarga stats de YouTube API                              │
│  - Calcula CTR, AVD, engagement                               │
│  - Actualiza database:                                        │
│    UPDATE verses SET                                          │
│      analytics_ctr = X,                                       │
│      analytics_avg_view_duration = Y                          │
│    WHERE reference = versículo                                │
│  - Output: analytics.json                                     │
└───────────────────────────────────────────────────────────────┘
                            ↓
                 ┌──────────────────────┐
                 │  FEEDBACK LOOP       │
                 │  Agent 0 aprende:    │
                 │  - Categorías top    │
                 │  - Hooks efectivos   │
                 │  - Ajusta selección  │
                 └──────────────────────┘
```

---

## 🗄️ BASE DE DATOS (SQLite)

**Archivo:** `data/verses-master.db` (~50MB)

### Tabla: verses

```sql
CREATE TABLE verses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reference TEXT UNIQUE NOT NULL,          -- "Salmos 23:1"
  text TEXT NOT NULL,                      -- Texto LITERAL de CodexObsidiana
  book TEXT NOT NULL,                      -- "Salmos"
  chapter INTEGER NOT NULL,                -- 23
  verse INTEGER NOT NULL,                  -- 1

  -- Metadata base
  category TEXT NOT NULL,                  -- "consuelo", "salvación", etc.
  keywords TEXT NOT NULL,                  -- JSON: ["paz", "confianza"]
  historical_context TEXT NOT NULL,        -- Contexto histórico
  emotional_benefit TEXT NOT NULL,         -- Beneficio emocional
  target_audience TEXT NOT NULL,           -- JSON: ["cristianos", "buscadores"]
  viral_potential INTEGER NOT NULL,        -- 1-10
  search_volume TEXT NOT NULL,             -- "very_high", "high", "medium", "low"
  competition_level TEXT NOT NULL,         -- "very_high", "high", "medium", "low"
  best_hook_type TEXT NOT NULL,            -- "direct", "controversy", "negative"

  -- Tracking
  generated_at TEXT NOT NULL,              -- Timestamp de generación metadata
  used_count INTEGER DEFAULT 0,            -- Cuántas veces usado
  last_used TEXT,                          -- Última vez usado

  -- Analytics (actualizadas por Agent 9)
  analytics_ctr REAL,                      -- Click-Through Rate %
  analytics_avg_view_duration REAL,        -- Average View Duration (segundos)
  analytics_updated_at TEXT,               -- Última actualización analytics

  -- YouTube
  youtube_video_id TEXT,                   -- ID del video en YouTube
  published_at TEXT                        -- Fecha de publicación
);

-- Índices para performance
CREATE INDEX idx_category ON verses(category);
CREATE INDEX idx_viral_potential ON verses(viral_potential DESC);
CREATE INDEX idx_used_count ON verses(used_count ASC);
CREATE INDEX idx_book_chapter ON verses(book, chapter);

-- Full-text search
CREATE VIRTUAL TABLE verses_fts USING fts5(
  reference,
  text,
  keywords,
  content='verses',
  content_rowid='id'
);
```

### Ejemplo de Row:

```json
{
  "id": 1,
  "reference": "Salmos 23:1",
  "text": "Jehová es mi pastor; nada me faltará.",
  "book": "Salmos",
  "chapter": 23,
  "verse": 1,
  "category": "consuelo",
  "keywords": "[\"paz\", \"confianza\", \"protección\", \"cuidado\", \"pastor\"]",
  "historical_context": "David escribió este salmo después de años de ser pastor...",
  "emotional_benefit": "Paz y seguridad en el cuidado de Dios",
  "target_audience": "[\"cristianos\", \"buscadores espirituales\", \"personas en crisis\"]",
  "viral_potential": 9,
  "search_volume": "very_high",
  "competition_level": "very_high",
  "best_hook_type": "direct",
  "generated_at": "2026-07-23T00:00:00Z",
  "used_count": 1,
  "last_used": "2026-07-23T12:00:00Z",
  "analytics_ctr": 12.5,
  "analytics_avg_view_duration": 95.3,
  "analytics_updated_at": "2026-07-30T00:00:00Z",
  "youtube_video_id": "abc123xyz",
  "published_at": "2026-07-23T14:00:00Z"
}
```

---

## 📂 ESTRUCTURA DE DIRECTORIOS

```
project-yt/
├── agents/
│   ├── agent-0-verse-researcher.js       ← CEREBRO (selecciona versículo)
│   ├── agent-1-viral-scriptwriter.js     ← MAESTRO (estructura enseñanza)
│   ├── agent-2-visual-designer.js
│   ├── agent-3-batch-creator.js
│   ├── agent-4-magnific-api.js
│   ├── agent-5-video-animator.js
│   ├── agent-6-audio-tts.js
│   ├── agent-7-video-editor.js
│   ├── agent-8-youtube-uploader.js
│   ├── agent-9-analytics-collector.js    ← APRENDE (retroalimenta Agent 0)
│
├── scripts/
│   ├── prepare-cloud-database.js         ← Setup inicial (una vez)
│   ├── analytics-trigger.sh              ← Cron trigger cada 7 días
│   ├── docker-entrypoint.sh              ← Download database al iniciar
│
├── data/
│   └── verses-master.db                  ← Database SQLite (50MB)
│
├── output/
│   ├── agent-0-decision.json             ← Output de Agent 0
│   ├── scripts/
│   ├── image-batches/
│   ├── image-metadata/
│   ├── video-metadata/
│   ├── audio/
│   ├── videos/
│   └── final-videos/
│
├── docs/
│   ├── MASTER-ARCHITECTURE.md            ← Este documento
│   ├── AGENT-0-VERSE-RESEARCHER.md
│   ├── AGENT-0-CLOUD-DEPLOYMENT.md
│   ├── AUDIT-ZERO-HARDCODING.md
│   └── AGENT-1-TEACHING-STRUCTURE.md
│
├── Dockerfile
├── docker-compose.yml
├── .env.example
└── package.json
```

---

## ⚙️ VARIABLES DE ENTORNO

**Archivo:** `.env`

```bash
# ============================================
# CLOUD STORAGE
# ============================================
CLOUD_STORAGE_TYPE=supabase               # s3 | gcs | supabase
DATABASE_URL=https://your-project.supabase.co/storage/v1/object/public/databases/verses-master.db

# ============================================
# API KEYS
# ============================================
CLAUDE_API_KEY=sk-ant-...
MAGNIFIC_API_KEY=MSd6...
YOUTUBE_CLIENT_ID=xxx.apps.googleusercontent.com
YOUTUBE_CLIENT_SECRET=xxx
YOUTUBE_REFRESH_TOKEN=xxx

# ============================================
# PIPELINE CONFIG
# ============================================
GENERATE_VIDEOS=true
UPLOAD_TO_YOUTUBE=true
SCHEDULE_CRON=0 0 * * *                   # Diario a medianoche

# ============================================
# PATHS (dentro del container)
# ============================================
DATABASE_PATH=/app/data/verses-master.db
OUTPUT_DIR=/app/output
```

---

## 🐳 DEPLOYMENT (Cloud-Portable)

### Opción 1: Railway (Recomendado)

```bash
# 1. Instalar CLI
npm i -g @railway/cli

# 2. Login
railway login

# 3. Crear proyecto
railway init

# 4. Configurar env vars
railway variables set CLOUD_STORAGE_TYPE=supabase
railway variables set DATABASE_URL=https://...
railway variables set CLAUDE_API_KEY=sk-...
railway variables set MAGNIFIC_API_KEY=MSd6...

# 5. Deploy
railway up
```

**Costo:** $5-20/mes

### Opción 2: AWS EC2 + S3

```bash
# 1. Subir database a S3
aws s3 cp data/verses-master.db s3://bucket/verses-master.db --acl public-read

# 2. Deploy con Docker
ssh ubuntu@ec2-ip
git clone repo
docker-compose up -d
```

**Costo:** $10-50/mes

### Opción 3: Google Cloud Run + GCS

```bash
# 1. Subir database a GCS
gsutil cp data/verses-master.db gs://bucket/verses-master.db

# 2. Build + Deploy
gcloud builds submit --tag gcr.io/PROJECT/biblical-videos
gcloud run deploy biblical-videos --image gcr.io/PROJECT/biblical-videos
```

**Costo:** $0-30/mes (serverless)

---

## 📊 MÉTRICAS Y ANALYTICS

### Agent 0: Algoritmo de Selección

```sql
-- Selección ponderada basada en analytics
SELECT * FROM verses
WHERE viral_potential >= 7
  AND (used_count = 0 OR julianday('now') - julianday(last_used) > 30)
ORDER BY
  (10 - used_count) * 0.3 +              -- Priorizar no usados
  viral_potential * 0.4 +                 -- Priorizar alto potencial
  CASE
    WHEN search_volume = 'very_high' THEN 10
    WHEN search_volume = 'high' THEN 7
    ELSE 5
  END * 0.2 +
  RANDOM() * 0.1                          -- Elemento aleatorio
DESC
LIMIT 1;
```

### Agent 9: Analytics Actualizadas

**Cada 7 días:**
1. Descarga stats de YouTube API
2. Calcula CTR = (likes / views) * 100
3. Obtiene AVD (Average View Duration)
4. Actualiza database
5. Agent 0 usa estos datos en próxima selección

**Feedback loop:**
- Versículos con CTR > 10% → Categoría marcada como "ganadora"
- Agent 0 prioriza categorías ganadoras (70% del tiempo)
- Mantiene 30% de exploración (nuevas categorías)

---

## 🔒 SEGURIDAD Y COMPLIANCE

### Texto Bíblico
- ✅ Reina Valera 1960 (dominio público)
- ✅ Texto LITERAL de CodexObsidiana
- ✅ NO se modifica contenido bíblico

### API Keys
- ✅ Variables de entorno (NO hardcoded)
- ✅ Secrets en Railway/AWS/GCP
- ✅ NO commits de .env

### Content Moderation
- ✅ Pre-sanitización de términos religiosos (Seedance)
- ✅ Reemplazo: "prayer" → "contemplation"
- ✅ Reemplazo: "celestial beam" → "warm golden light"

---

## 📈 ESCALABILIDAD

### Contenido
- 31,102 versículos disponibles
- 1 video diario = **85 años** de contenido
- Evita reusos por 30 días mínimo

### Infraestructura
- Docker container portable
- Database SQLite (50MB, rápida)
- Stateless (puede escalar horizontalmente)
- Queue-based (agregar workers para paralelismo)

### Costos por Video

| Componente | Costo | Tiempo |
|------------|-------|--------|
| Agent 0 (Claude) | $0.05 | 10s |
| Agent 1 (Script) | $0 | 5s |
| Agent 4 (Imágenes) | ~$2.50 | 5 min |
| Agent 5 (Videos) | ~$5.00 | 10 min |
| Agent 6 (Audio) | ~$0.30 | 2 min |
| Agent 7 (Edición) | $0 | 3 min |
| Agent 8 (YouTube) | $0 | 1 min |
| **TOTAL** | **~$7.85** | **~20 min** |

---

## 🎯 ROADMAP

### ✅ Fase 1: Diseño (Completado)
- [x] Arquitectura completa
- [x] Documentación detallada
- [x] Flujos definidos

### ⏳ Fase 2: Implementación (Actual)
- [ ] Implementar Agent 0
- [ ] Refactor Agent 1
- [ ] Implementar Agent 9
- [ ] Crear prepare-cloud-database.js

### 🚀 Fase 3: Setup Inicial
- [ ] Ejecutar prepare-cloud-database.js (31k versículos)
- [ ] Subir database a Supabase Storage
- [ ] Dockerizar aplicación
- [ ] Deploy a Railway

### 📊 Fase 4: Producción
- [ ] Configurar cron trigger
- [ ] Monitorear primeros 10 videos
- [ ] Validar feedback loop
- [ ] Ajustar algoritmo de selección

### 🔮 Fase 5: Mejoras Futuras
- [ ] Multi-idioma (inglés, portugués)
- [ ] Categorías personalizadas por audiencia
- [ ] A/B testing de hooks
- [ ] ML para predecir viralidad

---

## 🎉 CONCLUSIÓN

**Sistema 100% automatizado, inteligente y escalable:**

✅ **Agent 0 es el cerebro** - Decide qué contenido crear
✅ **Agent 1 es el maestro** - Enseña con texto REAL
✅ **Agent 9 aprende** - Mejora con cada video
✅ **31,000+ versículos** - Contenido para décadas
✅ **Cloud-portable** - Deploy en cualquier plataforma
✅ **Self-learning** - Optimiza automáticamente
✅ **Desatendido** - Genera videos sin intervención

**Próximo paso:** Implementar Agent 0 y comenzar setup inicial.
