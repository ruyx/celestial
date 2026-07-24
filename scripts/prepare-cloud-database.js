#!/usr/bin/env node

/**
 * 📚 PREPARE CLOUD DATABASE
 *
 * Procesa todos los versículos de CodexObsidiana (31,000+) y los sube a Supabase
 * con metadata generada por Claude Sonnet 4.5
 *
 * Características:
 * - Extracción de CodexObsidiana (1,189 capítulos)
 * - Generación de metadata con IA (Claude)
 * - Inserción en batches a Supabase
 * - Rate limiting y manejo de errores
 * - Resumable (guarda progreso)
 *
 * Uso:
 *   node scripts/prepare-cloud-database.js --mode=extract     # Solo extrae versículos
 *   node scripts/prepare-cloud-database.js --mode=generate    # Genera metadata con IA
 *   node scripts/prepare-cloud-database.js --mode=upload      # Sube a Supabase
 *   node scripts/prepare-cloud-database.js --mode=full        # Todo el proceso
 *   node scripts/prepare-cloud-database.js --resume          # Continúa desde último checkpoint
 *
 * Estimación de tiempo/costo:
 *   - Extracción: ~5 minutos (local, gratis)
 *   - Metadata con Claude: ~51 horas (31k × 6s, $477 con Sonnet 4.5)
 *   - Upload a Supabase: ~30 minutos (31k versículos en batches de 100)
 */

const fs = require('fs');
const path = require('path');
const { Anthropic } = require('@anthropic-ai/sdk');
const { createClient } = require('@supabase/supabase-js');

// ============================================================================
// CONFIGURACIÓN
// ============================================================================

const CONFIG = {
  // Rutas
  codexPath: path.join(__dirname, '../data/codex/RVR1960'),  // Fix: libros están en RVR1960 subdirectory
  extractedVersesPath: path.join(__dirname, '../data/extracted-verses.json'),
  processedVersesPath: path.join(__dirname, '../data/processed-verses.json'),
  checkpointPath: path.join(__dirname, '../data/checkpoint.json'),

  // API Keys (desde .env)
  anthropicApiKey: process.env.ANTHROPIC_API_KEY,
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseKey: process.env.SUPABASE_SERVICE_KEY,

  // Rate limits
  anthropicBatchSize: 10,    // 10 requests en paralelo
  anthropicDelay: 1000,       // 1s entre batches
  supabaseBatchSize: 100,     // 100 versículos por insert

  // Modelo IA
  aiModel: 'claude-sonnet-4-5-20250929',
  maxTokens: 1024
};

// ============================================================================
// CLASE PRINCIPAL
// ============================================================================

class CloudDatabasePreparer {
  constructor() {
    this.anthropic = null;
    this.supabase = null;
    this.checkpoint = this.loadCheckpoint();
  }

  // Lazy init Anthropic (solo cuando se usa)
  getAnthropicClient() {
    if (!this.anthropic) {
      this.anthropic = new Anthropic({ apiKey: CONFIG.anthropicApiKey });
    }
    return this.anthropic;
  }

  // Lazy init Supabase (solo cuando se usa)
  getSupabaseClient() {
    if (!this.supabase) {
      this.supabase = createClient(CONFIG.supabaseUrl, CONFIG.supabaseKey);
    }
    return this.supabase;
  }

  // ==========================================================================
  // FASE 1: EXTRACCIÓN DE CODEXOBSIDIANA
  // ==========================================================================

  /**
   * Extrae todos los versículos de CodexObsidiana
   * @returns {Array} Array de versículos con {reference, text, book, chapter, verse}
   */
  async extractAllVerses() {
    console.log('\n📖 FASE 1: EXTRACCIÓN DE CODEXOBSIDIANA\n');
    console.log('Leyendo 1,189 capítulos...\n');

    const verses = [];

    // CodexObsidiana estructura: RVR1960/Antiguo Testamento/ y RVR1960/Nuevo Testamento/
    const testaments = ['Antiguo Testamento', 'Nuevo Testamento'];
    let totalBooks = 0;

    for (const testament of testaments) {
      const testamentPath = path.join(CONFIG.codexPath, testament);

      if (!fs.existsSync(testamentPath)) {
        console.log(`⚠️ No se encontró: ${testament}`);
        continue;
      }

      // Leer todos los directorios de libros dentro del testamento
      const books = fs.readdirSync(testamentPath)
        .filter(dir => {
          const fullPath = path.join(testamentPath, dir);
          return fs.statSync(fullPath).isDirectory() && dir.match(/^\(\d+\)/);
        })
        .sort();

      totalBooks += books.length;
      console.log(`📖 ${testament}: ${books.length} libros\n`);

      for (const bookFolder of books) {
        const bookName = this.getBookName(bookFolder);
        const bookPath = path.join(testamentPath, bookFolder);

        // Leer todos los capítulos del libro
        const chapters = fs.readdirSync(bookPath)
          .filter(file => file.endsWith('.md'))
          .sort((a, b) => {
            const numA = parseInt(a.match(/\d+/)?.[0] || 0);
            const numB = parseInt(b.match(/\d+/)?.[0] || 0);
            return numA - numB;
          });

        for (const chapterFile of chapters) {
          const chapterPath = path.join(bookPath, chapterFile);
          const content = fs.readFileSync(chapterPath, 'utf-8');
          const chapterNumber = parseInt(chapterFile.match(/\d+/)?.[0] || 1);

          const chapterVerses = this.parseChapter(content, bookName, chapterNumber);
          verses.push(...chapterVerses);

          console.log(`✅ ${bookName} ${chapterNumber}: ${chapterVerses.length} versículos`);
        }
      }
    }

    console.log(`\n📚 Total libros procesados: ${totalBooks}`);
    console.log(`✅ Total versículos extraídos: ${verses.length}\n`);

    // Guardar versículos extraídos
    fs.writeFileSync(
      CONFIG.extractedVersesPath,
      JSON.stringify(verses, null, 2)
    );
    console.log(`💾 Guardado en: ${CONFIG.extractedVersesPath}\n`);

    return verses;
  }

  /**
   * Parsea un capítulo de markdown a versículos individuales
   */
  parseChapter(content, book, chapter) {
    const verses = [];

    // Regex para versículos: "1. Texto del versículo"
    const verseRegex = /^(\d+)\.\s+(.+)$/gm;
    let match;

    while ((match = verseRegex.exec(content)) !== null) {
      const verseNumber = parseInt(match[1]);
      const text = match[2].trim();

      verses.push({
        reference: `${book} ${chapter}:${verseNumber}`,
        text,
        book,
        chapter,
        verse: verseNumber
      });
    }

    return verses;
  }

  /**
   * Extrae el nombre del libro del folder
   * "(01) Génesis" → "Génesis"
   */
  getBookName(folderName) {
    return folderName.replace(/^\(\d+\)\s+/, '');
  }

  // ==========================================================================
  // FASE 2: GENERACIÓN DE METADATA CON IA
  // ==========================================================================

  /**
   * Genera metadata para todos los versículos usando Claude
   */
  async generateMetadataForAll(verses) {
    console.log('\n🤖 FASE 2: GENERACIÓN DE METADATA CON IA\n');

    const startIndex = this.checkpoint.lastProcessedIndex || 0;
    const remaining = verses.length - startIndex;

    console.log(`Total versículos: ${verses.length}`);
    console.log(`Ya procesados: ${startIndex}`);
    console.log(`Restantes: ${remaining}\n`);

    const estimatedMinutes = Math.ceil(remaining * 6 / 60);
    const estimatedHours = Math.floor(estimatedMinutes / 60);
    console.log(`⏱️  Tiempo estimado: ${estimatedHours}h ${estimatedMinutes % 60}m`);
    console.log(`💰 Costo estimado (Sonnet 4.5): $${(remaining * 1024 * 0.015 / 1000).toFixed(2)}\n`);

    const processedVerses = [];

    // Cargar versículos ya procesados si existen
    if (fs.existsSync(CONFIG.processedVersesPath)) {
      const existing = JSON.parse(fs.readFileSync(CONFIG.processedVersesPath, 'utf-8'));
      processedVerses.push(...existing);
      console.log(`📥 Cargados ${existing.length} versículos previamente procesados\n`);
    }

    // Procesar en batches
    for (let i = startIndex; i < verses.length; i += CONFIG.anthropicBatchSize) {
      const batch = verses.slice(i, i + CONFIG.anthropicBatchSize);
      const batchNum = Math.floor(i / CONFIG.anthropicBatchSize) + 1;
      const totalBatches = Math.ceil(verses.length / CONFIG.anthropicBatchSize);

      console.log(`\n📊 Batch ${batchNum}/${totalBatches} (${i + 1}-${Math.min(i + batch.length, verses.length)} de ${verses.length})`);

      try {
        const batchResults = await Promise.all(
          batch.map(verse => this.generateMetadata(verse))
        );

        processedVerses.push(...batchResults);

        // Guardar progreso
        this.saveProgress(processedVerses, i + batch.length);

        console.log(`✅ Batch completado. Total procesados: ${processedVerses.length}/${verses.length}`);

        // Rate limiting
        if (i + CONFIG.anthropicBatchSize < verses.length) {
          await new Promise(resolve => setTimeout(resolve, CONFIG.anthropicDelay));
        }
      } catch (error) {
        console.error(`❌ Error en batch ${batchNum}:`, error.message);
        console.log(`💾 Progreso guardado hasta versículo ${i}`);
        throw error;
      }
    }

    console.log(`\n✅ Metadata generada para ${processedVerses.length} versículos`);
    return processedVerses;
  }

  /**
   * Genera metadata para un versículo individual usando Claude
   */
  async generateMetadata(verse) {
    const prompt = `Analiza este versículo bíblico y genera metadata en formato JSON:

Versículo: ${verse.reference}
Texto: "${verse.text}"

Genera:
1. category: Una de [consuelo, salvación, fortaleza, propósito, guía, paz, esperanza, amor, fe, obediencia, sabiduría, gratitud, protección, justicia, perdón]
2. keywords: Array de 5-10 palabras clave SEO relevantes (español)
3. historicalContext: 2-3 frases sobre contexto histórico del pasaje (quien escribió, cuándo, por qué)
4. historicalInsight: 1-2 frases que revelan un dato específico e impactante sobre el contexto histórico
5. customHook: Un gancho viral de 1 frase (10-15 palabras) que atrape atención inmediata
6. emotionalBenefit: Una frase sobre el beneficio emocional/espiritual que ofrece
7. targetAudience: Array de 2-4 grupos demográficos que resonarían con este versículo
8. viralPotential: Score 1-10 basado en resonancia emocional, claridad del mensaje, y relevancia universal
9. searchVolume: Estimado [very high, high, medium, low] basado en popularidad del versículo
10. competitionLevel: Estimado [very high, high, medium, low] basado en contenido existente
11. bestHookType: Uno de [direct, controversy, negative] - el más efectivo para este versículo
12. visualDescriptions: Objeto con 5 keys (hook, intro, body, application, cta), cada una con una descripción visual cinematográfica para video (2-3 frases específicas)

Responde SOLO con JSON válido, sin explicaciones adicionales.`;

    try {
      const client = this.getAnthropicClient();
      const message = await client.messages.create({
        model: CONFIG.aiModel,
        max_tokens: CONFIG.maxTokens,
        messages: [{
          role: 'user',
          content: prompt
        }]
      });

      const metadata = JSON.parse(message.content[0].text);

      return {
        ...verse,
        ...metadata,
        generatedAt: new Date().toISOString(),
        version: '1.0-cloud'
      };
    } catch (error) {
      console.error(`❌ Error generando metadata para ${verse.reference}:`, error.message);
      throw error;
    }
  }

  // ==========================================================================
  // FASE 3: UPLOAD A SUPABASE
  // ==========================================================================

  /**
   * Sube todos los versículos procesados a Supabase
   */
  async uploadToSupabase(verses) {
    console.log('\n☁️  FASE 3: UPLOAD A SUPABASE\n');
    console.log(`Total versículos a subir: ${verses.length}\n`);

    const supabase = this.getSupabaseClient();
    let uploadedCount = 0;
    let errorCount = 0;

    // Subir en batches
    for (let i = 0; i < verses.length; i += CONFIG.supabaseBatchSize) {
      const batch = verses.slice(i, i + CONFIG.supabaseBatchSize);
      const batchNum = Math.floor(i / CONFIG.supabaseBatchSize) + 1;
      const totalBatches = Math.ceil(verses.length / CONFIG.supabaseBatchSize);

      console.log(`\n📤 Batch ${batchNum}/${totalBatches} (${batch.length} versículos)`);

      try {
        // Transformar al formato de Supabase
        const dbRecords = batch.map(v => ({
          reference: v.reference,
          text: v.text,
          book: v.book,
          chapter: v.chapter,
          verse: v.verse,
          category: v.category,
          keywords: v.keywords, // Supabase soporta JSON directo
          historical_context: v.historicalContext,
          historical_insight: v.historicalInsight,
          custom_hook: v.customHook,
          emotional_benefit: v.emotionalBenefit,
          target_audience: v.targetAudience,
          viral_potential: v.viralPotential,
          search_volume: v.searchVolume,
          competition_level: v.competitionLevel,
          best_hook_type: v.bestHookType,
          visual_descriptions: v.visualDescriptions,
          generated_at: v.generatedAt,
          version: v.version,
          used_count: 0,
          last_used: null
        }));

        const { data, error } = await supabase
          .from('verses')
          .upsert(dbRecords, { onConflict: 'reference' });

        if (error) {
          console.error(`❌ Error en batch ${batchNum}:`, error.message);
          errorCount += batch.length;
        } else {
          uploadedCount += batch.length;
          console.log(`✅ Batch ${batchNum} subido correctamente`);
        }
      } catch (error) {
        console.error(`❌ Error inesperado en batch ${batchNum}:`, error.message);
        errorCount += batch.length;
      }
    }

    console.log(`\n✅ Upload completado:`);
    console.log(`   Subidos exitosamente: ${uploadedCount}`);
    console.log(`   Errores: ${errorCount}`);
  }

  // ==========================================================================
  // HELPERS
  // ==========================================================================

  /**
   * Carga checkpoint de progreso
   */
  loadCheckpoint() {
    if (fs.existsSync(CONFIG.checkpointPath)) {
      return JSON.parse(fs.readFileSync(CONFIG.checkpointPath, 'utf-8'));
    }
    return { lastProcessedIndex: 0, lastSaved: null };
  }

  /**
   * Guarda progreso en checkpoint
   */
  saveProgress(processedVerses, lastIndex) {
    // Guardar versículos procesados
    fs.writeFileSync(
      CONFIG.processedVersesPath,
      JSON.stringify(processedVerses, null, 2)
    );

    // Guardar checkpoint
    const checkpoint = {
      lastProcessedIndex: lastIndex,
      lastSaved: new Date().toISOString(),
      totalProcessed: processedVerses.length
    };
    fs.writeFileSync(
      CONFIG.checkpointPath,
      JSON.stringify(checkpoint, null, 2)
    );
  }

  /**
   * Workflow completo
   */
  async run(mode = 'full') {
    console.log('🚀 PREPARE CLOUD DATABASE');
    console.log('═'.repeat(50));
    console.log(`Modo: ${mode.toUpperCase()}\n`);

    try {
      let verses = [];
      let processedVerses = [];

      // FASE 1: Extracción
      if (mode === 'extract' || mode === 'full') {
        verses = await this.extractAllVerses();
      } else {
        // Cargar versículos ya extraídos
        if (fs.existsSync(CONFIG.extractedVersesPath)) {
          verses = JSON.parse(fs.readFileSync(CONFIG.extractedVersesPath, 'utf-8'));
          console.log(`📥 Cargados ${verses.length} versículos extraídos\n`);
        } else {
          throw new Error('No hay versículos extraídos. Ejecuta primero con --mode=extract');
        }
      }

      // FASE 2: Generación de metadata
      if (mode === 'generate' || mode === 'full') {
        processedVerses = await this.generateMetadataForAll(verses);
      } else if (mode === 'upload') {
        // Cargar versículos ya procesados
        if (fs.existsSync(CONFIG.processedVersesPath)) {
          processedVerses = JSON.parse(fs.readFileSync(CONFIG.processedVersesPath, 'utf-8'));
          console.log(`📥 Cargados ${processedVerses.length} versículos procesados\n`);
        } else {
          throw new Error('No hay versículos procesados. Ejecuta primero con --mode=generate');
        }
      }

      // FASE 3: Upload a Supabase
      if (mode === 'upload' || mode === 'full') {
        await this.uploadToSupabase(processedVerses);
      }

      console.log('\n✨ PROCESO COMPLETADO ✨\n');

    } catch (error) {
      console.error('\n❌ ERROR FATAL:', error.message);
      console.log('\n💾 El progreso se ha guardado. Ejecuta con --resume para continuar.\n');
      process.exit(1);
    }
  }
}

// ============================================================================
// CLI
// ============================================================================

async function main() {
  const args = process.argv.slice(2);
  const modeArg = args.find(arg => arg.startsWith('--mode='));
  const mode = modeArg ? modeArg.split('=')[1] : 'full';

  if (!['extract', 'generate', 'upload', 'full'].includes(mode)) {
    console.error('❌ Modo inválido. Usa: extract | generate | upload | full');
    process.exit(1);
  }

  // Verificar API keys
  if ((mode === 'generate' || mode === 'full') && !CONFIG.anthropicApiKey) {
    console.error('❌ ANTHROPIC_API_KEY no configurada en .env');
    process.exit(1);
  }

  if ((mode === 'upload' || mode === 'full') && (!CONFIG.supabaseUrl || !CONFIG.supabaseKey)) {
    console.error('❌ SUPABASE_URL o SUPABASE_SERVICE_KEY no configuradas en .env');
    process.exit(1);
  }

  const preparer = new CloudDatabasePreparer();
  await preparer.run(mode);
}

// Ejecutar
main();
