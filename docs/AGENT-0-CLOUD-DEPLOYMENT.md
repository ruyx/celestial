# ☁️ AGENT 0: CLOUD DEPLOYMENT - 100% PORTABLE

## 🎯 OBJETIVO

Hacer que el sistema de generación de videos funcione **100% desatendido** sin depender de un ordenador específico, deployable en cualquier plataforma cloud.

---

## 🚨 REQUISITO CRÍTICO

> "funciona desatendido debe tener esto el sin dependeer de este ordenador"

**Implicaciones:**
- ❌ NO depender de git clones locales
- ❌ NO depender de rutas locales hardcodeadas
- ✅ SÍ usar almacenamiento cloud (S3, GCS, Supabase Storage)
- ✅ SÍ usar Docker/containers para portabilidad total
- ✅ SÍ usar environment variables para toda configuración
- ✅ SÍ deployable en AWS, GCP, Azure, Railway, DigitalOcean, etc.

---

## 📊 ARQUITECTURA CLOUD-PORTABLE

### Opción 1: SQLite Pre-procesado + Cloud Storage (RECOMENDADO)

```
┌─────────────────────────────────────────────────────┐
│  FASE 1: PREPARACIÓN (Una sola vez, local/cloud)   │
├─────────────────────────────────────────────────────┤
│  1. Clonar CodexObsidiana                           │
│  2. Extraer 31,102 versículos                       │
│  3. Generar metadata con IA (Claude/GPT)            │
│  4. Crear verses-master.db (SQLite)                 │
│  5. Subir a cloud storage (S3/GCS/Supabase)         │
└─────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────┐
│  FASE 2: PRODUCCIÓN (Desatendido, cualquier server)│
├─────────────────────────────────────────────────────┤
│  1. Container descarga verses-master.db             │
│  2. Agent 1 consulta base de datos local (cache)    │
│  3. Genera videos sin depender de CodexObsidiana    │
│  4. Sube resultados a YouTube                       │
└─────────────────────────────────────────────────────┘
```

**Ventajas:**
- ✅ Database pequeña (~50MB comprimida)
- ✅ Acceso ultra-rápido (SQLite local en container)
- ✅ Sin dependencias de repos externos en runtime
- ✅ Portable a cualquier plataforma

**Costo:**
- S3: $0.023/GB/mes = **$1.15/año** para 50MB
- GCS: Similar a S3
- Supabase Storage: **GRATIS** hasta 1GB

---

## 🔧 IMPLEMENTACIÓN: OPCIÓN 1 (Pre-procesado + Cloud)

### Fase 1: Script de Preparación (Ejecutar una vez)

**Archivo:** `scripts/prepare-cloud-database.js`

```javascript
#!/usr/bin/env node

/**
 * PREPARACIÓN DE BASE DE DATOS PARA CLOUD DEPLOYMENT
 *
 * Ejecutar UNA SOLA VEZ para crear la base de datos procesada
 * Luego subir a S3/GCS/Supabase Storage
 */

const fs = require('fs');
const path = require('path');
const { Anthropic } = require('@anthropic-ai/sdk');
const Database = require('better-sqlite3');
const https = require('https');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

// Configuración desde ENV
const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY || '';
const TEMP_DIR = process.env.TEMP_DIR || '/tmp/codex-processing';
const OUTPUT_DB = process.env.OUTPUT_DB || './verses-master.db';

class CloudDatabaseBuilder {
  constructor() {
    this.anthropic = new Anthropic({ apiKey: CLAUDE_API_KEY });
    this.db = null;
  }

  // Paso 1: Descargar CodexObsidiana (temporal)
  async downloadCodexObsidiana() {
    console.log('📥 Descargando CodexObsidiana...');

    // Crear directorio temporal
    await execAsync(`mkdir -p ${TEMP_DIR}`);

    // Clonar repositorio
    const cloneCmd = `cd ${TEMP_DIR} && git clone https://github.com/BryanGuevara/CodexObsidiana.git codex`;
    await execAsync(cloneCmd);

    console.log(`✅ CodexObsidiana descargado en ${TEMP_DIR}/codex`);
    return path.join(TEMP_DIR, 'codex');
  }

  // Paso 2: Extraer todos los versículos
  extractAllVerses(codexPath) {
    console.log('📖 Extrayendo versículos...');
    const verses = [];

    const books = fs.readdirSync(codexPath)
      .filter(dir => dir.match(/^\(\d+\)/))
      .sort();

    for (const book of books) {
      const bookPath = path.join(codexPath, book);
      const chapters = fs.readdirSync(bookPath)
        .filter(file => file.endsWith('.md'))
        .sort((a, b) => {
          const numA = parseInt(a.match(/\d+/)?.[0] || '0');
          const numB = parseInt(b.match(/\d+/)?.[0] || '0');
          return numA - numB;
        });

      for (const chapter of chapters) {
        const content = fs.readFileSync(
          path.join(bookPath, chapter),
          'utf-8'
        );

        const chapterVerses = this.parseChapter(content, book, chapter);
        verses.push(...chapterVerses);
      }
    }

    console.log(`✅ Extraídos ${verses.length} versículos`);
    return verses;
  }

  parseChapter(content, book, chapter) {
    // Formato: "1. Jehová es mi pastor; nada me faltará."
    const verseRegex = /^(\d+)\.\s+(.+)$/gm;
    const verses = [];
    let match;

    while ((match = verseRegex.exec(content)) !== null) {
      const verseNumber = match[1];
      const text = match[2].trim();

      verses.push({
        reference: `${this.getBookName(book)} ${this.getChapterNumber(chapter)}:${verseNumber}`,
        text,
        book: this.getBookName(book),
        chapter: this.getChapterNumber(chapter),
        verse: parseInt(verseNumber)
      });
    }

    return verses;
  }

  getBookName(folderName) {
    // "(01) Génesis" → "Génesis"
    return folderName.replace(/^\(\d+\)\s+/, '');
  }

  getChapterNumber(filename) {
    // "Capítulo 1.md" → 1
    const match = filename.match(/\d+/);
    return match ? parseInt(match[0]) : 1;
  }

  // Paso 3: Generar metadata con IA (batch processing)
  async generateMetadataBatch(verses, batchSize = 10) {
    console.log(`🤖 Generando metadata con IA (${verses.length} versículos)...`);

    const results = [];
    const total = Math.ceil(verses.length / batchSize);

    for (let i = 0; i < verses.length; i += batchSize) {
      const batch = verses.slice(i, i + batchSize);
      const batchNum = Math.floor(i / batchSize) + 1;

      console.log(`📊 Procesando batch ${batchNum}/${total} (${batch.length} versículos)`);

      const processed = await Promise.all(
        batch.map(verse => this.generateMetadata(verse))
      );

      results.push(...processed);

      // Rate limiting
      if (i + batchSize < verses.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Guardar progreso cada 100 versículos
      if (results.length % 100 === 0) {
        console.log(`💾 Progreso: ${results.length}/${verses.length} completados`);
      }
    }

    return results;
  }

  async generateMetadata(verse) {
    const prompt = `
Analiza este versículo bíblico y genera metadata en formato JSON:

Versículo: ${verse.reference}
Texto: "${verse.text}"

Genera:
1. category: Una de [consuelo, salvación, fortaleza, propósito, guía, paz, esperanza, amor, fe, obediencia, sabiduría, gratitud]
2. keywords: Array de 5-10 palabras clave SEO relevantes (español)
3. historicalContext: 2-3 frases sobre contexto histórico del pasaje
4. emotionalBenefit: Una frase sobre el beneficio emocional/espiritual
5. targetAudience: Array de 2-4 grupos demográficos
6. viralPotential: Score 1-10
7. searchVolume: [very_high, high, medium, low]
8. competitionLevel: [very_high, high, medium, low]
9. bestHookType: [direct, controversy, negative]

Responde SOLO con JSON válido, sin markdown.
`;

    try {
      const message = await this.anthropic.messages.create({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }]
      });

      const metadata = JSON.parse(message.content[0].text);

      return {
        ...verse,
        ...metadata,
        generatedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error(`❌ Error procesando ${verse.reference}:`, error.message);

      // Fallback con valores por defecto
      return {
        ...verse,
        category: 'paz',
        keywords: ['biblia', 'versículo', 'palabra de dios'],
        historicalContext: 'Versículo bíblico de la Reina Valera 1960.',
        emotionalBenefit: 'Esperanza y guía espiritual',
        targetAudience: ['cristianos', 'buscadores espirituales'],
        viralPotential: 5,
        searchVolume: 'medium',
        competitionLevel: 'medium',
        bestHookType: 'direct',
        generatedAt: new Date().toISOString()
      };
    }
  }

  // Paso 4: Crear base de datos SQLite
  createDatabase() {
    console.log('💾 Creando base de datos SQLite...');

    this.db = new Database(OUTPUT_DB);

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS verses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        reference TEXT UNIQUE NOT NULL,
        text TEXT NOT NULL,
        book TEXT NOT NULL,
        chapter INTEGER NOT NULL,
        verse INTEGER NOT NULL,
        category TEXT NOT NULL,
        keywords TEXT NOT NULL,
        historical_context TEXT NOT NULL,
        emotional_benefit TEXT NOT NULL,
        target_audience TEXT NOT NULL,
        viral_potential INTEGER NOT NULL,
        search_volume TEXT NOT NULL,
        competition_level TEXT NOT NULL,
        best_hook_type TEXT NOT NULL,
        generated_at TEXT NOT NULL,
        used_count INTEGER DEFAULT 0,
        last_used TEXT,
        analytics_ctr REAL,
        analytics_avg_view_duration REAL
      );

      CREATE INDEX IF NOT EXISTS idx_category ON verses(category);
      CREATE INDEX IF NOT EXISTS idx_viral_potential ON verses(viral_potential DESC);
      CREATE INDEX IF NOT EXISTS idx_used_count ON verses(used_count ASC);
      CREATE INDEX IF NOT EXISTS idx_book_chapter ON verses(book, chapter);

      CREATE VIRTUAL TABLE IF NOT EXISTS verses_fts USING fts5(
        reference,
        text,
        keywords,
        content='verses',
        content_rowid='id'
      );
    `);

    console.log('✅ Estructura de base de datos creada');
  }

  // Paso 5: Insertar versículos en la base de datos
  insertVerses(verses) {
    console.log(`📝 Insertando ${verses.length} versículos en la base de datos...`);

    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO verses (
        reference, text, book, chapter, verse,
        category, keywords, historical_context,
        emotional_benefit, target_audience,
        viral_potential, search_volume,
        competition_level, best_hook_type, generated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertMany = this.db.transaction((verses) => {
      for (const verse of verses) {
        stmt.run(
          verse.reference,
          verse.text,
          verse.book,
          verse.chapter,
          verse.verse,
          verse.category,
          JSON.stringify(verse.keywords),
          verse.historicalContext,
          verse.emotionalBenefit,
          JSON.stringify(verse.targetAudience),
          verse.viralPotential,
          verse.searchVolume,
          verse.competitionLevel,
          verse.bestHookType,
          verse.generatedAt
        );
      }
    });

    insertMany(verses);
    console.log('✅ Versículos insertados');
  }

  // Paso 6: Limpiar directorio temporal
  async cleanup() {
    console.log('🧹 Limpiando archivos temporales...');
    await execAsync(`rm -rf ${TEMP_DIR}`);
    console.log('✅ Limpieza completada');
  }

  // Proceso completo
  async build() {
    console.log('🚀 CLOUD DATABASE BUILDER');
    console.log('=========================\n');

    try {
      // 1. Descargar CodexObsidiana
      const codexPath = await this.downloadCodexObsidiana();

      // 2. Extraer versículos
      const verses = this.extractAllVerses(codexPath);

      // 3. Generar metadata con IA
      const versesWithMetadata = await this.generateMetadataBatch(verses);

      // 4. Crear base de datos
      this.createDatabase();

      // 5. Insertar versículos
      this.insertVerses(versesWithMetadata);

      // 6. Limpiar
      await this.cleanup();

      console.log('\n✅ ¡BASE DE DATOS COMPLETADA!');
      console.log(`📁 Archivo: ${OUTPUT_DB}`);
      console.log(`📊 Versículos: ${verses.length}`);
      console.log(`💾 Tamaño: ${(fs.statSync(OUTPUT_DB).size / 1024 / 1024).toFixed(2)} MB`);
      console.log('\n📤 Próximo paso: Subir a cloud storage (S3/GCS/Supabase)');

      return OUTPUT_DB;

    } catch (error) {
      console.error('❌ Error fatal:', error.message);
      console.error(error.stack);
      process.exit(1);
    }
  }
}

// EJECUCIÓN
if (require.main === module) {
  const builder = new CloudDatabaseBuilder();
  builder.build()
    .then((dbPath) => {
      console.log(`\n🎉 Database lista para deploy: ${dbPath}`);
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Build falló:', error.message);
      process.exit(1);
    });
}

module.exports = CloudDatabaseBuilder;
```

---

### Fase 2: Docker Container con Database Sync

**Archivo:** `Dockerfile`

```dockerfile
FROM node:20-alpine

# Instalar dependencias del sistema
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    sqlite \
    curl

# Crear directorio de trabajo
WORKDIR /app

# Copiar package files
COPY package*.json ./

# Instalar dependencias
RUN npm ci --only=production

# Copiar código de la aplicación
COPY . .

# Crear directorio para database cache
RUN mkdir -p /app/data

# Script de inicio que descarga database
COPY scripts/docker-entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["/entrypoint.sh"]
CMD ["npm", "start"]
```

**Archivo:** `scripts/docker-entrypoint.sh`

```bash
#!/bin/sh

echo "🚀 Starting Video Generation Pipeline"

# Variables de entorno requeridas
: ${CLOUD_STORAGE_TYPE:?Variable CLOUD_STORAGE_TYPE es requerida (s3|gcs|supabase)}
: ${DATABASE_URL:?Variable DATABASE_URL es requerida}

DB_PATH="/app/data/verses-master.db"

# Función para descargar de S3
download_from_s3() {
    echo "📥 Descargando database desde S3..."
    curl -o "$DB_PATH" "$DATABASE_URL"
}

# Función para descargar de GCS
download_from_gcs() {
    echo "📥 Descargando database desde Google Cloud Storage..."
    curl -o "$DB_PATH" "$DATABASE_URL"
}

# Función para descargar de Supabase
download_from_supabase() {
    echo "📥 Descargando database desde Supabase Storage..."
    curl -o "$DB_PATH" "$DATABASE_URL"
}

# Verificar si database ya existe (cache)
if [ -f "$DB_PATH" ]; then
    echo "✅ Database encontrada en cache local"
else
    echo "🔄 Database no encontrada, descargando desde $CLOUD_STORAGE_TYPE..."

    case "$CLOUD_STORAGE_TYPE" in
        s3)
            download_from_s3
            ;;
        gcs)
            download_from_gcs
            ;;
        supabase)
            download_from_supabase
            ;;
        *)
            echo "❌ CLOUD_STORAGE_TYPE inválido: $CLOUD_STORAGE_TYPE"
            exit 1
            ;;
    esac

    if [ $? -eq 0 ]; then
        echo "✅ Database descargada exitosamente"
    else
        echo "❌ Error descargando database"
        exit 1
    fi
fi

# Verificar integridad de database
sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM verses;" > /dev/null 2>&1

if [ $? -eq 0 ]; then
    VERSE_COUNT=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM verses;")
    echo "✅ Database válida con $VERSE_COUNT versículos"
else
    echo "❌ Database corrupta"
    exit 1
fi

# Ejecutar comando principal
exec "$@"
```

**Archivo:** `docker-compose.yml`

```yaml
version: '3.8'

services:
  video-pipeline:
    build: .
    container_name: biblical-videos
    restart: unless-stopped

    environment:
      # Cloud Storage Configuration
      CLOUD_STORAGE_TYPE: ${CLOUD_STORAGE_TYPE:-supabase}
      DATABASE_URL: ${DATABASE_URL}

      # API Keys
      CLAUDE_API_KEY: ${CLAUDE_API_KEY}
      MAGNIFIC_API_KEY: ${MAGNIFIC_API_KEY}
      YOUTUBE_CLIENT_ID: ${YOUTUBE_CLIENT_ID}
      YOUTUBE_CLIENT_SECRET: ${YOUTUBE_CLIENT_SECRET}
      YOUTUBE_REFRESH_TOKEN: ${YOUTUBE_REFRESH_TOKEN}

      # Pipeline Configuration
      GENERATE_VIDEOS: ${GENERATE_VIDEOS:-true}
      UPLOAD_TO_YOUTUBE: ${UPLOAD_TO_YOUTUBE:-true}
      SCHEDULE_CRON: ${SCHEDULE_CRON:-0 0 * * *}

      # Paths (dentro del container)
      DATABASE_PATH: /app/data/verses-master.db
      OUTPUT_DIR: /app/output

    volumes:
      # Persistir outputs (opcional)
      - ./output:/app/output

      # Persistir database cache (opcional, para evitar re-downloads)
      - database-cache:/app/data

    healthcheck:
      test: ["CMD", "test", "-f", "/app/data/verses-master.db"]
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  database-cache:
```

---

### Fase 3: Deployment en Diferentes Plataformas

#### A. Railway (RECOMENDADO - Más fácil)

```bash
# 1. Instalar Railway CLI
npm i -g @railway/cli

# 2. Login
railway login

# 3. Crear proyecto
railway init

# 4. Configurar environment variables
railway variables set CLOUD_STORAGE_TYPE=supabase
railway variables set DATABASE_URL=https://your-supabase-project.supabase.co/storage/v1/object/public/databases/verses-master.db
railway variables set CLAUDE_API_KEY=sk-...
railway variables set MAGNIFIC_API_KEY=MSd6...

# 5. Deploy
railway up
```

#### B. AWS EC2 + S3

```bash
# 1. Subir database a S3
aws s3 cp verses-master.db s3://your-bucket/verses-master.db --acl public-read

# 2. Crear EC2 instance (Ubuntu)
# (Via AWS Console o CLI)

# 3. SSH al servidor
ssh ubuntu@your-ec2-ip

# 4. Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 5. Clonar repo
git clone https://github.com/your-username/project-yt.git
cd project-yt

# 6. Crear .env
cat > .env << EOF
CLOUD_STORAGE_TYPE=s3
DATABASE_URL=https://your-bucket.s3.amazonaws.com/verses-master.db
CLAUDE_API_KEY=sk-...
MAGNIFIC_API_KEY=MSd6...
EOF

# 7. Deploy
docker-compose up -d
```

#### C. Google Cloud Run + GCS

```bash
# 1. Subir database a GCS
gsutil cp verses-master.db gs://your-bucket/verses-master.db
gsutil acl ch -u AllUsers:R gs://your-bucket/verses-master.db

# 2. Build container
gcloud builds submit --tag gcr.io/PROJECT_ID/biblical-videos

# 3. Deploy
gcloud run deploy biblical-videos \
  --image gcr.io/PROJECT_ID/biblical-videos \
  --set-env-vars CLOUD_STORAGE_TYPE=gcs,DATABASE_URL=https://storage.googleapis.com/your-bucket/verses-master.db \
  --set-env-vars CLAUDE_API_KEY=sk-...,MAGNIFIC_API_KEY=MSd6...
```

#### D. DigitalOcean Droplet

```bash
# Similar a AWS EC2, usar Docker + docker-compose
```

---

## 📊 COMPARACIÓN DE PLATAFORMAS

| Plataforma | Costo/mes | Facilidad | Escalabilidad | Recomendación |
|------------|-----------|-----------|---------------|---------------|
| **Railway** | $5-20 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ✅ **MEJOR para empezar** |
| AWS EC2 + S3 | $10-50 | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Para producción grande |
| GCP Cloud Run | $0-30 | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Buena opción serverless |
| DigitalOcean | $6-40 | ⭐⭐⭐⭐ | ⭐⭐⭐ | Buena relación precio/facilidad |

---

## 🎯 PLAN DE IMPLEMENTACIÓN

### Semana 1: Preparación de Database
- [ ] Ejecutar `prepare-cloud-database.js` (50 horas procesamiento)
- [ ] Validar database con 31,000+ versículos
- [ ] Comprimir database (gzip: ~50MB → ~15MB)

### Semana 2: Cloud Setup
- [ ] Crear cuenta Supabase (gratis)
- [ ] Subir `verses-master.db.gz` a Supabase Storage
- [ ] Generar URL pública
- [ ] Probar descarga desde diferentes ubicaciones

### Semana 3: Dockerización
- [ ] Crear Dockerfile
- [ ] Crear docker-entrypoint.sh
- [ ] Crear docker-compose.yml
- [ ] Probar localmente con Docker

### Semana 4: Deployment
- [ ] Crear cuenta Railway
- [ ] Configurar variables de entorno
- [ ] Deploy inicial
- [ ] Probar generación de video end-to-end
- [ ] Configurar cron para ejecución diaria

---

## ✅ CHECKLIST DE PORTABILIDAD

Un sistema es 100% portable si cumple:

- [ ] ✅ Dockerfile funciona sin cambios en cualquier máquina
- [ ] ✅ Toda configuración via environment variables (no hardcoded)
- [ ] ✅ Database descargable desde URL pública
- [ ] ✅ Sin dependencias de archivos locales específicos
- [ ] ✅ Healthchecks para verificar estado
- [ ] ✅ Logs claros para debugging remoto
- [ ] ✅ Deployable en al menos 3 plataformas diferentes

---

## 💰 COSTOS ESTIMADOS

### Setup Inicial (Una vez):
- Procesamiento IA metadata: **$4.77 USD** (GPT-4o-mini) o **$477.87** (Claude Sonnet)

### Mensual:
- Supabase Storage (1GB): **$0/mes** (gratis)
- Railway Hobby: **$5/mes** (suficiente para empezar)
- O AWS EC2 t3.micro: **~$10/mes**
- O DigitalOcean Droplet básico: **$6/mes**

**Total mensual:** Entre $0-10/mes dependiendo de plataforma elegida

---

## 🎉 RESULTADO FINAL

**Sistema 100% desatendido y portable que:**

✅ Se deploya en **cualquier cloud** con un comando
✅ **No depende** de ningún ordenador específico
✅ Accede a **31,000+ versículos** desde cloud storage
✅ Genera videos **automáticamente** con cron
✅ Se puede **mover** entre plataformas sin cambios
✅ **Escala** fácilmente agregando más workers

**Próximo paso:** Ejecutar `prepare-cloud-database.js` para crear la database procesada.
