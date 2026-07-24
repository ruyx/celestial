#!/usr/bin/env node

/**
 * 📚 PREPARE CLOUD DATABASE - OPENROUTER VERSION
 *
 * Procesa todos los versículos de CodexObsidiana (31,000+) y los sube a Supabase
 * con metadata generada por modelos de OpenRouter (Mistral, Qwen, etc.)
 *
 * Características:
 * - Extracción de CodexObsidiana (1,189 capítulos)
 * - Generación de metadata con IA (OpenRouter)
 * - Inserción en batches a Supabase
 * - Rate limiting y manejo de errores
 * - Resumable (guarda progreso)
 * - Soporte para múltiples modelos
 *
 * Uso:
 *   node scripts/prepare-cloud-database-openrouter.js --mode=extract
 *   node scripts/prepare-cloud-database-openrouter.js --mode=generate --model=mistralai/mistral-nemo
 *   node scripts/prepare-cloud-database-openrouter.js --mode=generate --model=qwen/qwen3.5-flash-02-23
 *   node scripts/prepare-cloud-database-openrouter.js --mode=upload
 *   node scripts/prepare-cloud-database-openrouter.js --mode=full --model=mistralai/mistral-nemo
 *
 * Modelos recomendados (ver docs/OPENROUTER-RECOMMENDATIONS.md):
 *   - mistralai/mistral-nemo                 ($0.57 total)  ⭐ RECOMENDADO
 *   - mistralai/mistral-small-24b-instruct-2501  ($1.52 total)
 *   - qwen/qwen-2.5-7b-instruct              ($1.55 total)
 *   - qwen/qwen3.5-flash-02-23               ($3.42 total)
 *   - qwen/qwen3-coder-30b-a3b-instruct      ($3.59 total)
 *
 * Estimación de tiempo/costo:
 *   - Extracción: ~5 minutos (local, gratis)
 *   - Metadata con Mistral Nemo: ~5 horas ($0.57) ⭐
 *   - Metadata con Qwen3.5-Flash: ~6 horas ($3.42)
 *   - Upload a Supabase: ~30 minutos (gratis)
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// ============================================================================
// CONFIGURACIÓN
// ============================================================================

const CONFIG = {
  // Rutas
  codexPath: path.join(__dirname, '../data/codex/RVR1960'),
  extractedVersesPath: path.join(__dirname, '../data/extracted-verses.json'),
  processedVersesPath: path.join(__dirname, '../data/processed-verses.json'),
  checkpointPath: path.join(__dirname, '../data/checkpoint.json'),

  // API Keys (desde .env)
  openrouterApiKey: process.env.OPENROUTER_API_KEY,
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseKey: process.env.SUPABASE_SERVICE_KEY,

  // Rate limits
  batchSize: 10,           // 10 requests en paralelo
  rateLimitDelay: 1000,     // 1s entre batches
  supabaseBatchSize: 100,   // 100 versículos por insert

  // Modelo IA (se puede override por CLI)
  aiModel: 'mistralai/mistral-nemo',  // Default: el más barato
  maxTokens: 1024,

  // OpenRouter API
  openrouterBaseUrl: 'https://openrouter.ai/api/v1'
};

// ============================================================================
// CLASE PRINCIPAL
// ============================================================================

class CloudDatabasePreparer {
  constructor(options = {}) {
    this.supabase = null;
    this.checkpoint = this.loadCheckpoint();
    this.aiModel = options.model || CONFIG.aiModel;

    console.log(`\n🤖 Modelo IA: ${this.aiModel}\n`);
  }

  // Lazy init Supabase (solo cuando se usa)
  getSupabaseClient() {
    if (!this.supabase) {
      this.supabase = createClient(CONFIG.supabaseUrl, CONFIG.supabaseKey);
    }
    return this.supabase;
  }

  /**
   * Cliente HTTP para OpenRouter (usando fetch nativo de Node.js 18+)
   */
  async callOpenRouter(messages, model = this.aiModel) {
    const response = await fetch(`${CONFIG.openrouterBaseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CONFIG.openrouterApiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://github.com/your-repo',  // Opcional pero recomendado
        'X-Title': 'YouTube VIRAL Bible Verses'            // Opcional
      },
      body: JSON.stringify({
        model: model,
        messages: messages,
        max_tokens: CONFIG.maxTokens,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenRouter API error: ${response.status} ${error}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
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
  // FASE 2: GENERACIÓN DE METADATA CON IA (OPENROUTER)
  // ==========================================================================

  /**
   * Genera metadata para todos los versículos usando OpenRouter
   */
  async generateMetadataForAll(verses) {
    console.log('\n🤖 FASE 2: GENERACIÓN DE METADATA CON IA (OPENROUTER)\n');

    const startIndex = this.checkpoint.lastProcessedIndex || 0;
    const remaining = verses.length - startIndex;

    console.log(`Total versículos: ${verses.length}`);
    console.log(`Ya procesados: ${startIndex}`);
    console.log(`Restantes: ${remaining}\n`);

    // Estimar costo basado en el modelo seleccionado
    const estimatedMinutes = Math.ceil(remaining * 3 / 60);  // ~3 segundos por versículo
    const estimatedHours = Math.floor(estimatedMinutes / 60);
    console.log(`⏱️  Tiempo estimado: ${estimatedHours}h ${estimatedMinutes % 60}m`);
    console.log(`💰 Modelo: ${this.aiModel}`);
    console.log(`💡 Ver costos en: docs/OPENROUTER-RECOMMENDATIONS.md\n`);

    const processedVerses = [];

    // Cargar versículos ya procesados si existen
    if (fs.existsSync(CONFIG.processedVersesPath)) {
      const existing = JSON.parse(fs.readFileSync(CONFIG.processedVersesPath, 'utf-8'));
      processedVerses.push(...existing);
      console.log(`📥 Cargados ${existing.length} versículos previamente procesados\n`);
    }

    // Procesar en batches
    for (let i = startIndex; i < verses.length; i += CONFIG.batchSize) {
      const batch = verses.slice(i, i + CONFIG.batchSize);
      const batchNum = Math.floor(i / CONFIG.batchSize) + 1;
      const totalBatches = Math.ceil(verses.length / CONFIG.batchSize);

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
        if (i + CONFIG.batchSize < verses.length) {
          await new Promise(resolve => setTimeout(resolve, CONFIG.rateLimitDelay));
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
   * Genera metadata para un versículo individual usando OpenRouter
   */
  async generateMetadata(verse) {
    const userPrompt = `Analiza este versículo bíblico y genera metadata en formato JSON:

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

    // Retry logic: hasta 3 intentos
    const maxRetries = 3;
    let lastError = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const responseText = await this.callOpenRouter([
          { role: 'user', content: userPrompt }
        ], this.aiModel);

        // Limpiar respuesta - múltiples estrategias
        let cleanText = responseText.trim();

        // 1. Remover markdown code blocks
        if (cleanText.startsWith('```json')) {
          cleanText = cleanText.replace(/^```json\n/, '').replace(/\n```$/, '');
        } else if (cleanText.startsWith('```')) {
          cleanText = cleanText.replace(/^```\n/, '').replace(/\n```$/, '');
        }

        // 2. Reparar strings mal formados (agregar comillas faltantes)
        cleanText = this.repairJSONString(cleanText);

        const metadata = JSON.parse(cleanText);

        // Validar estructura mínima
        if (!metadata.category || !metadata.keywords || !metadata.visualDescriptions) {
          throw new Error('Metadata incompleta - faltan campos requeridos');
        }

        return {
          ...verse,
          ...metadata,
          generatedAt: new Date().toISOString(),
          version: '1.0-openrouter',
          aiModel: this.aiModel
        };
      } catch (error) {
        lastError = error;
        console.error(`❌ Intento ${attempt}/${maxRetries} falló para ${verse.reference}:`, error.message);

        if (attempt < maxRetries) {
          console.log(`   ⏳ Reintentando en 2 segundos...`);
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    }

    // Si todos los intentos fallaron, devolver metadata básica en lugar de fallar
    console.error(`⚠️  ADVERTENCIA: Usando metadata básica para ${verse.reference} tras ${maxRetries} intentos fallidos`);
    return {
      ...verse,
      category: 'general',
      keywords: [verse.book, 'Biblia', 'versículo'],
      historicalContext: ['Contexto no disponible'],
      historicalInsight: 'Insight no disponible',
      customHook: '¿Qué dice la Biblia sobre esto?',
      emotionalBenefit: 'Reflexión espiritual',
      targetAudience: ['Cristianos', 'Estudiosos de la Biblia'],
      viralPotential: 5,
      searchVolume: 'medium',
      competitionLevel: 'medium',
      bestHookType: 'direct',
      visualDescriptions: {
        hook: 'Imagen relevante del tema',
        intro: 'Introducción al versículo',
        body: 'Desarrollo del mensaje',
        application: 'Aplicación práctica',
        cta: 'Llamado a la acción'
      },
      generatedAt: new Date().toISOString(),
      version: '1.0-openrouter-fallback',
      aiModel: this.aiModel,
      error: lastError.message
    };
  }

  /**
   * Intenta reparar strings JSON mal formados
   */
  repairJSONString(jsonString) {
    try {
      // Intentar parsear directamente primero
      JSON.parse(jsonString);
      return jsonString;
    } catch (e) {
      // Si falla, intentar reparaciones comunes
      let repaired = jsonString;

      // 1. Cerrar strings sin terminar al final de línea
      repaired = repaired.replace(/("([^"\\]|\\.)*?)$/gm, '$1"');

      // 2. Escapar comillas simples dentro de strings
      repaired = repaired.replace(/\\'/g, "'");

      // 3. Asegurar que arrays estén cerrados
      const openBrackets = (repaired.match(/\[/g) || []).length;
      const closeBrackets = (repaired.match(/\]/g) || []).length;
      if (openBrackets > closeBrackets) {
        repaired += ']'.repeat(openBrackets - closeBrackets);
      }

      // 4. Asegurar que objetos estén cerrados
      const openBraces = (repaired.match(/\{/g) || []).length;
      const closeBraces = (repaired.match(/\}/g) || []).length;
      if (openBraces > closeBraces) {
        repaired += '}'.repeat(openBraces - closeBraces);
      }

      return repaired;
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
          keywords: v.keywords,
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
          ai_model: v.aiModel,
          error: v.error || null
        }));

        const { data, error } = await supabase
          .from('bible_verses')
          .upsert(dbRecords, { onConflict: 'reference' });

        if (error) throw error;

        uploadedCount += batch.length;
        console.log(`✅ Subidos ${uploadedCount}/${verses.length} versículos`);

      } catch (error) {
        errorCount += batch.length;
        console.error(`❌ Error en batch ${batchNum}:`, error.message);
      }
    }

    console.log(`\n✅ Upload completado:`);
    console.log(`   Exitosos: ${uploadedCount}`);
    console.log(`   Errores: ${errorCount}`);
  }

  // ==========================================================================
  // UTILIDADES: CHECKPOINTS Y PROGRESO
  // ==========================================================================

  loadCheckpoint() {
    if (fs.existsSync(CONFIG.checkpointPath)) {
      return JSON.parse(fs.readFileSync(CONFIG.checkpointPath, 'utf-8'));
    }
    return { lastProcessedIndex: 0 };
  }

  saveProgress(processedVerses, lastIndex) {
    // Guardar versículos procesados
    fs.writeFileSync(
      CONFIG.processedVersesPath,
      JSON.stringify(processedVerses, null, 2)
    );

    // Guardar checkpoint
    fs.writeFileSync(
      CONFIG.checkpointPath,
      JSON.stringify({ lastProcessedIndex: lastIndex }, null, 2)
    );
  }

  // ==========================================================================
  // ORQUESTADOR PRINCIPAL
  // ==========================================================================

  async run(mode = 'full') {
    console.log('\n' + '='.repeat(70));
    console.log('📚 PREPARE CLOUD DATABASE - OPENROUTER');
    console.log('='.repeat(70));

    try {
      let verses = [];

      // FASE 1: Extracción
      if (mode === 'extract' || mode === 'full') {
        verses = await this.extractAllVerses();
      }

      // FASE 2: Generación de metadata
      if (mode === 'generate' || mode === 'full') {
        if (verses.length === 0) {
          console.log('\n📥 Cargando versículos extraídos...');
          verses = JSON.parse(fs.readFileSync(CONFIG.extractedVersesPath, 'utf-8'));
        }
        verses = await this.generateMetadataForAll(verses);
      }

      // FASE 3: Upload a Supabase
      if (mode === 'upload' || mode === 'full') {
        if (verses.length === 0) {
          console.log('\n📥 Cargando versículos procesados...');
          verses = JSON.parse(fs.readFileSync(CONFIG.processedVersesPath, 'utf-8'));
        }
        await this.uploadToSupabase(verses);
      }

      console.log('\n' + '='.repeat(70));
      console.log('✅ PROCESO COMPLETADO EXITOSAMENTE');
      console.log('='.repeat(70) + '\n');

    } catch (error) {
      console.error('\n❌ ERROR FATAL:', error);
      process.exit(1);
    }
  }
}

// ============================================================================
// CLI
// ============================================================================

const args = process.argv.slice(2);
const getArg = (name, defaultValue) => {
  const arg = args.find(a => a.startsWith(`--${name}=`));
  return arg ? arg.split('=')[1] : defaultValue;
};

const mode = getArg('mode', 'full');  // extract | generate | upload | full
const model = getArg('model', CONFIG.aiModel);

if (!['extract', 'generate', 'upload', 'full'].includes(mode)) {
  console.error('❌ Modo inválido. Usar: extract | generate | upload | full');
  process.exit(1);
}

// Validar API key de OpenRouter si es necesario
if ((mode === 'generate' || mode === 'full') && !CONFIG.openrouterApiKey) {
  console.error('❌ OPENROUTER_API_KEY no configurada en .env');
  console.log('\n💡 Agregar a .env:');
  console.log('   OPENROUTER_API_KEY=sk-or-v1-...\n');
  process.exit(1);
}

// Ejecutar
const preparer = new CloudDatabasePreparer({ model });
preparer.run(mode);
