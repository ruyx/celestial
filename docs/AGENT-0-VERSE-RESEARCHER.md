# 🔬 AGENT 0: INVESTIGADOR DE VERSÍCULOS
## Desbloqueando MILES de videos únicos usando CodexObsidiana + IA

---

## 🎯 OBJETIVO

Transformar **CodexObsidiana** (1,189 capítulos sin metadata) en una **base de datos inteligente de versículos** con metadata completa generada por IA, permitiendo generar miles de videos virales únicos automáticamente.

---

## 📊 PROBLEMA ACTUAL

Agent 1 está limitado a **8 versículos hardcodeados** con metadata manual:

```javascript
const MASTER_VERSES = [
  {
    reference: "Salmos 23:1",
    text: "Jehová es mi pastor; nada me faltará.",
    category: "consuelo",           // ← Manual
    keywords: ["paz", "confianza"], // ← Manual
    historicalContext: "...",        // ← Manual
    emotionalBenefit: "...",         // ← Manual
  }
  // ... solo 8 versículos
];
```

**Problema:**
- Trabajo manual extenso para agregar cada versículo
- Solo 8 versículos = contenido repetitivo
- Imposible escalar a miles de videos

---

## 💡 SOLUCIÓN: Agent 0 + IA Automática

### Arquitectura de 3 capas:

```
┌─────────────────────────────────────────────────┐
│  CAPA 1: EXTRACTOR (CodexObsidiana Reader)      │
│  Lee 1,189 capítulos de CodexObsidiana          │
│  Output: Texto bíblico raw                      │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│  CAPA 2: ANALIZADOR IA (Metadata Generator)    │
│  Claude/GPT analiza cada versículo              │
│  Output: Metadata completa automática           │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│  CAPA 3: INDEXADOR (Master Verse Database)     │
│  Crea base de datos SQLite con búsqueda         │
│  Output: Versículos listos para Agent 1         │
└─────────────────────────────────────────────────┘
```

---

## 🔧 IMPLEMENTACIÓN TÉCNICA

### Fase 1: Extractor de CodexObsidiana

**Archivo:** `agents/agent-0-verse-researcher.js`

```javascript
const fs = require('fs');
const path = require('path');

class CodexObsidianaExtractor {
  constructor(codexPath) {
    this.codexPath = codexPath; // Ruta a repo clonado
    this.verses = [];
  }

  // Leer todos los capítulos de CodexObsidiana
  async extractAllChapters() {
    const books = fs.readdirSync(this.codexPath)
      .filter(dir => dir.match(/^\(\d+\)/)); // (01) Génesis, etc.

    for (const book of books) {
      const bookPath = path.join(this.codexPath, book);
      const chapters = fs.readdirSync(bookPath)
        .filter(file => file.endsWith('.md'));

      for (const chapter of chapters) {
        const content = fs.readFileSync(
          path.join(bookPath, chapter),
          'utf-8'
        );

        const verses = this.parseChapter(content, book, chapter);
        this.verses.push(...verses);
      }
    }

    console.log(`✅ Extraídos ${this.verses.length} versículos`);
    return this.verses;
  }

  // Parser de Markdown a versículos individuales
  parseChapter(content, book, chapter) {
    // Ejemplo: "1. Jehová es mi pastor; nada me faltará."
    const verseRegex = /^(\d+)\.\s+(.+)$/gm;
    const verses = [];
    let match;

    while ((match = verseRegex.exec(content)) !== null) {
      const verseNumber = match[1];
      const text = match[2].trim();

      verses.push({
        reference: `${this.getBookName(book)} ${chapter}:${verseNumber}`,
        text,
        book: this.getBookName(book),
        chapter: parseInt(chapter.match(/\d+/)[0]),
        verse: parseInt(verseNumber),
        raw: content // Contexto completo del capítulo
      });
    }

    return verses;
  }

  getBookName(folderName) {
    // "(01) Génesis" → "Génesis"
    return folderName.replace(/^\(\d+\)\s+/, '');
  }
}
```

---

### Fase 2: Analizador IA (Metadata Generator)

**Archivo:** `agents/agent-0-metadata-generator.js`

```javascript
const { Anthropic } = require('@anthropic-ai/sdk');

class MetadataGenerator {
  constructor(apiKey) {
    this.anthropic = new Anthropic({ apiKey });
  }

  // Generar metadata completa para un versículo usando Claude
  async generateMetadata(verse) {
    const prompt = `
Analiza este versículo bíblico y genera metadata en formato JSON:

Versículo: ${verse.reference}
Texto: "${verse.text}"

Genera:
1. category: Una de [consuelo, salvación, fortaleza, propósito, guía, paz, esperanza, amor, fe, obediencia, sabiduría, gratitud]
2. keywords: Array de 5-10 palabras clave SEO relevantes (español)
3. historicalContext: 2-3 frases sobre contexto histórico del pasaje (quien escribió, cuándo, por qué)
4. emotionalBenefit: Una frase sobre el beneficio emocional/espiritual que ofrece
5. targetAudience: Array de 2-4 grupos demográficos que resonarían con este versículo
6. viralPotential: Score 1-10 basado en resonancia emocional, claridad del mensaje, y relevancia universal
7. searchVolume: Estimado [very high, high, medium, low] basado en popularidad del versículo
8. competitionLevel: Estimado [very high, high, medium, low] basado en contenido existente
9. bestHookType: Uno de [direct, controversy, negative] - el más efectivo para este versículo

Responde SOLO con JSON válido, sin explicaciones adicionales.
`;

    const message = await this.anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    const metadata = JSON.parse(message.content[0].text);

    return {
      ...verse,
      ...metadata,
      generatedAt: new Date().toISOString()
    };
  }

  // Procesar batch con rate limiting
  async processBatch(verses, batchSize = 10) {
    const results = [];

    for (let i = 0; i < verses.length; i += batchSize) {
      const batch = verses.slice(i, i + batchSize);

      console.log(`📊 Procesando batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(verses.length/batchSize)}`);

      const processed = await Promise.all(
        batch.map(verse => this.generateMetadata(verse))
      );

      results.push(...processed);

      // Rate limiting: esperar 1s entre batches
      if (i + batchSize < verses.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return results;
  }
}
```

---

### Fase 3: Indexador (Master Verse Database)

**Archivo:** `agents/agent-0-database-builder.js`

```javascript
const Database = require('better-sqlite3');

class VerseDatabase {
  constructor(dbPath = './data/verses-master.db') {
    this.db = new Database(dbPath);
    this.initDatabase();
  }

  initDatabase() {
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

      CREATE VIRTUAL TABLE IF NOT EXISTS verses_fts USING fts5(
        reference,
        text,
        keywords,
        content='verses',
        content_rowid='id'
      );
    `);
  }

  // Insertar versículo con metadata
  insertVerse(verse) {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO verses (
        reference, text, book, chapter, verse,
        category, keywords, historical_context,
        emotional_benefit, target_audience,
        viral_potential, search_volume,
        competition_level, best_hook_type, generated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    return stmt.run(
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

  // Selección inteligente de versículo
  selectNextVerse(options = {}) {
    const {
      category = null,
      minViralPotential = 7,
      excludeRecent = true,
      limit = 10
    } = options;

    let query = `
      SELECT * FROM verses
      WHERE viral_potential >= ?
    `;
    const params = [minViralPotential];

    if (category) {
      query += ` AND category = ?`;
      params.push(category);
    }

    if (excludeRecent) {
      query += ` AND (used_count = 0 OR julianday('now') - julianday(last_used) > 30)`;
    }

    query += ` ORDER BY
      (10 - used_count) * 0.3 +
      viral_potential * 0.4 +
      RANDOM() * 0.3
      DESC
      LIMIT ?
    `;
    params.push(limit);

    return this.db.prepare(query).all(...params);
  }

  // Marcar versículo como usado
  markAsUsed(reference) {
    const stmt = this.db.prepare(`
      UPDATE verses
      SET used_count = used_count + 1,
          last_used = datetime('now')
      WHERE reference = ?
    `);
    return stmt.run(reference);
  }

  // Búsqueda full-text
  searchVerses(query, limit = 20) {
    const stmt = this.db.prepare(`
      SELECT v.* FROM verses v
      JOIN verses_fts fts ON v.id = fts.rowid
      WHERE verses_fts MATCH ?
      ORDER BY rank
      LIMIT ?
    `);
    return stmt.all(query, limit);
  }
}
```

---

## 🚀 WORKFLOW COMPLETO

### Ejecución inicial (una sola vez):

```bash
# 1. Clonar CodexObsidiana
git clone https://github.com/BryanGuevara/CodexObsidiana.git data/codex

# 2. Ejecutar Agent 0 (procesamiento completo)
node agents/agent-0-verse-researcher.js --mode=full

# Output esperado:
# ✅ Extraídos 31,102 versículos
# 📊 Procesando metadata con IA...
# ⏱️  Tiempo estimado: 51 horas (31k versículos × 6s cada uno)
# 💾 Base de datos creada: data/verses-master.db (45MB)
```

**Optimización:** Procesar en paralelo con múltiples API keys o procesar por etapas (100 versículos/día)

---

### Integración con Agent 1:

**Antes (hardcoded):**
```javascript
// Agent 1 antiguo
const MASTER_VERSES = [ /* solo 8 versículos */ ];
selectVerse() {
  return MASTER_VERSES[Math.floor(Math.random() * MASTER_VERSES.length)];
}
```

**Después (dinámico con Agent 0):**
```javascript
const VerseDatabase = require('./agent-0-database-builder.js');

class ViralScriptWriter {
  constructor() {
    this.db = new VerseDatabase();
  }

  selectVerse() {
    // Selección inteligente basada en analytics
    const analytics = this.loadAnalyticsFeedback();

    const options = {
      category: analytics?.bestCategories?.[0] || null,
      minViralPotential: 7,
      excludeRecent: true,
      limit: 1
    };

    const verses = this.db.selectNextVerse(options);

    if (verses.length === 0) {
      throw new Error('No hay versículos disponibles con los criterios especificados');
    }

    const selected = verses[0];

    // Marcar como usado
    this.db.markAsUsed(selected.reference);

    // Transformar a formato compatible
    return {
      id: selected.id,
      reference: selected.reference,
      text: selected.text,
      category: selected.category,
      keywords: JSON.parse(selected.keywords),
      historicalContext: selected.historical_context,
      emotionalBenefit: selected.emotional_benefit,
      targetAudience: JSON.parse(selected.target_audience),
      searchVolume: selected.search_volume,
      competitionLevel: selected.competition_level,
      bestHookType: selected.best_hook_type
    };
  }
}
```

---

## 📈 VENTAJAS DEL SISTEMA

### Escalabilidad:
- **De 8 → 31,000+ versículos únicos**
- Contenido para **85 años de videos diarios**
- Metadata generada automáticamente

### Inteligencia:
- Selección basada en analytics (aprende qué funciona)
- Evita repetición (30 días mínimo entre reusos)
- Prioriza versículos con alto potencial viral

### Mantenimiento:
- Zero trabajo manual para agregar versículos
- Base de datos SQLite (rápida, portable, sin servidor)
- Full-text search para búsquedas específicas

---

## 💰 COSTOS ESTIMADOS

### Procesamiento inicial (una sola vez):

**Opción 1: Claude Sonnet 4.5**
- 31,102 versículos × 1,024 tokens output × $0.015/1K = **$477.87 USD**
- Tiempo: ~51 horas (con rate limits)

**Opción 2: GPT-4o-mini (más económico)**
- 31,102 versículos × 1,024 tokens × $0.00015/1K = **$4.77 USD**
- Tiempo: ~10 horas

**Recomendación:** Usar GPT-4o-mini para la indexación masiva inicial, luego Claude Sonnet para versículos premium individuales.

---

## 🎯 ROADMAP DE IMPLEMENTACIÓN

### ✅ Fase 1: MVP (2-3 días)
- [ ] Clonar CodexObsidiana
- [ ] Implementar extractor básico
- [ ] Implementar generador de metadata con IA
- [ ] Crear base de datos SQLite
- [ ] Procesar 100 versículos de prueba

### ⏳ Fase 2: Indexación completa (1-2 semanas)
- [ ] Procesar todos los 31,102 versículos
- [ ] Validar calidad de metadata
- [ ] Crear índices de búsqueda
- [ ] Optimizar selección inteligente

### 🚀 Fase 3: Integración con Agent 1 (1 día)
- [ ] Modificar Agent 1 para usar base de datos
- [ ] Implementar selección basada en analytics
- [ ] Probar generación con 10 versículos diferentes
- [ ] Verificar unicidad de visuales dinámicos

### 📊 Fase 4: Mejoras futuras
- [ ] Actualizar metadata basado en analytics reales
- [ ] Agregar categorías personalizadas
- [ ] Integrar con otras fuentes (comentarios bíblicos, concordancias)
- [ ] Sistema de recomendación ML

---

## 🧪 TESTING

```bash
# Test extractor
npm run test:agent0:extract

# Test metadata generator (10 versículos)
npm run test:agent0:metadata

# Test database queries
npm run test:agent0:database

# Test integración completa
npm run test:agent0:full
```

---

## 📚 REFERENCIAS

- **CodexObsidiana:** https://github.com/BryanGuevara/CodexObsidiana
- **Claude API Docs:** https://docs.anthropic.com/
- **better-sqlite3:** https://github.com/WiseLibs/better-sqlite3
- **SQLite FTS5:** https://www.sqlite.org/fts5.html

---

## 🎉 CONCLUSIÓN

Agent 0 transforma el proyecto de **8 versículos manuales** a **31,000+ versículos automáticos**, desbloqueando:

✅ **Contenido infinito** (85 años de videos diarios)
✅ **Metadata rica** generada por IA
✅ **Selección inteligente** basada en analytics
✅ **Zero trabajo manual** para agregar contenido
✅ **Escalabilidad real** para canal de YouTube

**Next step:** Implementar MVP y procesar 100 versículos de prueba.
