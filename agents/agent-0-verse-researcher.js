#!/usr/bin/env node

/**
 * 🔬 AGENT 0: INVESTIGADOR DE VERSÍCULOS
 * Cerebro del sistema - Decide TODO primero
 *
 * RESPONSABILIDADES:
 * 1. Consultar analytics (próximamente con Agent 9)
 * 2. Seleccionar versículo óptimo basado en patrones ganadores
 * 3. Generar metadata PERSONALIZADA con IA (no genérica)
 * 4. Guardar decisión en output/agent-0-decision.json
 *
 * VERSIÓN: MVP 1.0
 * - Base de datos: 8 versículos temporales (luego será SQLite con 31k+)
 * - Analytics: Simulados (luego será Agent 9)
 * - Metadata: Generada con Claude Sonnet 4.5
 *
 * NEXT STEPS:
 * - [ ] Integrar database SQLite con 31,102 versículos
 * - [ ] Conectar con Agent 9 para analytics reales
 * - [ ] Implementar modos: exploration vs optimization
 */

// WebSocket polyfill para Node.js 18
if (typeof WebSocket === 'undefined') {
  global.WebSocket = require('ws');
}

const fs = require('fs');
const path = require('path');
// Usamos OpenRouter en lugar de Anthropic SDK directo
const { createClient } = require('@supabase/supabase-js');
const { saveAgentDecision } = require('../lib/supabase-client');

// Configuración Supabase para deduplicación
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://qhlqrflccdgpslozzfyh.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// 🗄️ BASE DE DATOS TEMPORAL (MVP)
// En producción, esto será reemplazado por SQLite con 31,102 versículos
const TEMP_VERSE_DATABASE = [
  {
    id: 1,
    reference: "Salmos 23:1",
    text: "Jehová es mi pastor; nada me faltará.",
    category: "consuelo",
    targetAudience: ["adultos mayores", "personas con ansiedad", "buscadores de paz"],
    keywords: ["paz", "confianza", "provisión", "pastor", "protección"],
    historicalContext: "Escrito por el rey David, pastor convertido en rey, basado en su experiencia cuidando ovejas en los campos de Belén.",
    emotionalBenefit: "Paz profunda en medio de la incertidumbre",
    searchVolume: "high",
    competitionLevel: "medium",
    bestHookType: "direct",
    viralPotential: 8,
    usedCount: 0
  },
  {
    id: 2,
    reference: "Juan 3:16",
    text: "Porque de tal manera amó Dios al mundo, que ha dado a su Hijo unigénito, para que todo aquel que en él cree, no se pierda, mas tenga vida eterna.",
    category: "salvación",
    targetAudience: ["buscadores espirituales", "nuevos creyentes", "personas con dudas"],
    keywords: ["amor", "salvación", "vida eterna", "fe", "esperanza"],
    historicalContext: "Escrito por el apóstol Juan, quien caminó con Jesús durante 3 años. Lo escribió décadas después, recordando las palabras exactas de Cristo en una noche estrellada en Jerusalén.",
    emotionalBenefit: "Seguridad del amor incondicional de Dios",
    searchVolume: "very high",
    competitionLevel: "high",
    bestHookType: "controversy",
    viralPotential: 9,
    usedCount: 0
  },
  {
    id: 3,
    reference: "Filipenses 4:13",
    text: "Todo lo puedo en Cristo que me fortalece.",
    category: "fortaleza",
    targetAudience: ["líderes", "emprendedores", "personas desafiadas", "estudiantes"],
    keywords: ["fuerza", "poder", "victoria", "superación", "capacidad"],
    historicalContext: "Escrito por Pablo desde prisión en Roma. Encadenado, golpeado, pero con un gozo inquebrantable. Estas palabras nacieron en las peores circunstancias imaginables.",
    emotionalBenefit: "Fuerza sobrenatural para enfrentar cualquier desafío",
    searchVolume: "very high",
    competitionLevel: "high",
    bestHookType: "negative",
    viralPotential: 9,
    usedCount: 0
  },
  {
    id: 4,
    reference: "Jeremías 29:11",
    text: "Porque yo sé los pensamientos que tengo acerca de vosotros, dice Jehová, pensamientos de paz, y no de mal, para daros el fin que esperáis.",
    category: "propósito",
    targetAudience: ["jóvenes", "personas perdidas", "buscadores de dirección"],
    keywords: ["propósito", "futuro", "planes", "esperanza", "destino"],
    historicalContext: "Escrito a un pueblo en cautiverio, en Babilonia, sin esperanza aparente. Dios les recuerda que Él tiene el control, incluso en el exilio.",
    emotionalBenefit: "Claridad sobre el propósito de vida",
    searchVolume: "high",
    competitionLevel: "medium",
    bestHookType: "direct",
    viralPotential: 8,
    usedCount: 0
  },
  {
    id: 5,
    reference: "Proverbios 3:5-6",
    text: "Fíate de Jehová de todo tu corazón, y no te apoyes en tu propia prudencia. Reconócelo en todos tus caminos, y él enderezará tus veredas.",
    category: "guía",
    targetAudience: ["tomadores de decisiones", "personas en encrucijadas", "líderes"],
    keywords: ["confianza", "guía", "dirección", "sabiduría", "decisiones"],
    historicalContext: "Escrito por Salomón, el hombre más sabio que jamás existió. Ironía: él mismo olvidó su propio consejo al final de su vida.",
    emotionalBenefit: "Dirección clara en momentos de confusión",
    searchVolume: "high",
    competitionLevel: "medium",
    bestHookType: "controversy",
    viralPotential: 7,
    usedCount: 0
  },
  {
    id: 6,
    reference: "Isaías 41:10",
    text: "No temas, porque yo estoy contigo; no desmayes, porque yo soy tu Dios que te esfuerzo; siempre te ayudaré, siempre te sustentaré con la diestra de mi justicia.",
    category: "fortaleza",
    targetAudience: ["personas con temor", "ansiosos", "enfrentando crisis"],
    keywords: ["valentía", "fortaleza", "protección", "ayuda", "sostén"],
    historicalContext: "Escrito durante el exilio de Israel. El pueblo estaba aterrorizado, rodeado de enemigos. Dios les da 4 promesas en un solo versículo.",
    emotionalBenefit: "Valentía sobrenatural en medio del miedo",
    searchVolume: "medium",
    competitionLevel: "low",
    bestHookType: "negative",
    viralPotential: 8,
    usedCount: 0
  },
  {
    id: 7,
    reference: "Romanos 8:28",
    text: "Y sabemos que a los que aman a Dios, todas las cosas les ayudan a bien, esto es, a los que conforme a su propósito son llamados.",
    category: "esperanza",
    targetAudience: ["personas sufriendo", "afligidos", "en duelo"],
    keywords: ["esperanza", "propósito", "transformación", "bien", "plan"],
    historicalContext: "Escrito por Pablo, quien había sufrido naufragios, golpizas, rechazo. Él VIVIÓ esta verdad antes de escribirla.",
    emotionalBenefit: "Esperanza de que el dolor tiene propósito",
    searchVolume: "high",
    competitionLevel: "medium",
    bestHookType: "controversy",
    viralPotential: 7,
    usedCount: 0
  },
  {
    id: 8,
    reference: "Mateo 11:28",
    text: "Venid a mí todos los que estáis trabajados y cargados, y yo os haré descansar.",
    category: "descanso",
    targetAudience: ["agotados", "estresados", "sobrecargados", "burn-out"],
    keywords: ["descanso", "paz", "alivio", "carga", "tranquilidad"],
    historicalContext: "Jesús lo dijo en medio de multitudes agotadas por las demandas religiosas. Una invitación radical en una cultura de obras.",
    emotionalBenefit: "Descanso verdadero para el alma agotada",
    searchVolume: "medium",
    competitionLevel: "low",
    bestHookType: "direct",
    viralPotential: 8,
    usedCount: 0
  }
];

class VerseResearcher {
  constructor() {
    this.outputDir = path.join(__dirname, '..', 'output');
    this.decisionFile = path.join(this.outputDir, 'agent-0-decision.json');
    this.usageTrackingFile = path.join(this.outputDir, 'verse-usage-tracking.json');

    // Usar OpenRouter en lugar de Anthropic SDK directo
    this.openrouterApiKey = process.env.OPENROUTER_API_KEY;
    this.openrouterUrl = 'https://openrouter.ai/api/v1/chat/completions';

    // Inicializar Supabase client para deduplicación
    if (SUPABASE_SERVICE_KEY) {
      this.supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
      console.log('✅ Supabase client inicializado para deduplicación');
    } else {
      console.log('⚠️  SUPABASE_SERVICE_ROLE_KEY no configurada - deduplicación deshabilitada');
      this.supabase = null;
    }

    // Crear directorio de salida si no existe
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }

    // Cargar tracking de uso
    this.usageTracking = this.loadUsageTracking();
  }

  /**
   * 📊 CARGAR TRACKING DE USO DE VERSÍCULOS
   * Mantiene registro de cuántas veces se ha usado cada versículo
   */
  loadUsageTracking() {
    if (fs.existsSync(this.usageTrackingFile)) {
      const data = JSON.parse(fs.readFileSync(this.usageTrackingFile, 'utf-8'));
      return data;
    }

    // Inicializar tracking vacío
    const initialTracking = {};
    TEMP_VERSE_DATABASE.forEach(verse => {
      initialTracking[verse.reference] = {
        usedCount: 0,
        lastUsed: null,
        totalViews: 0,
        avgCTR: 0,
        avgViewDuration: 0
      };
    });

    return initialTracking;
  }

  /**
   * 💾 GUARDAR TRACKING DE USO
   */
  saveUsageTracking() {
    fs.writeFileSync(
      this.usageTrackingFile,
      JSON.stringify(this.usageTracking, null, 2)
    );
  }

  /**
   * 🚫 CONSULTAR VERSÍCULOS PUBLICADOS EN SUPABASE
   * Retorna un Set de referencias de versículos ya publicados
   */
  async getPublishedVerses() {
    // Si no hay cliente Supabase, retornar set vacío (deduplicación deshabilitada)
    if (!this.supabase) {
      console.log('⚠️  Deduplicación deshabilitada - SUPABASE_SERVICE_ROLE_KEY no configurada');
      return new Set();
    }

    try {
      console.log('🔍 Consultando versículos publicados en Supabase...');

      const { data, error } = await this.supabase
        .from('published_videos')
        .select('verse')
        .eq('status', 'published');

      if (error) {
        // PGRST116 = tabla no existe aún (migración no aplicada)
        if (error.code === 'PGRST116' || error.code === '42P01') {
          console.log('⚠️  Tabla published_videos no existe aún - deduplicación deshabilitada temporalmente');
          console.log('   (Ejecuta la migración SQL para habilitar deduplicación)');
          return new Set();
        }
        throw error;
      }

      const publishedSet = new Set(data.map(row => row.verse));
      console.log(`✅ Encontrados ${publishedSet.size} versículos publicados`);

      if (publishedSet.size > 0) {
        console.log(`   Publicados: ${Array.from(publishedSet).join(', ')}`);
      }

      return publishedSet;

    } catch (error) {
      console.error(`❌ Error consultando published_videos:`, error.message);
      console.log('⚠️  Continuando sin deduplicación por error de BD (fail-open)');
      // Fail-open: Si falla la consulta, permitir continuar sin filtro
      return new Set();
    }
  }

  /**
   * 🔍 BUSCAR VERSÍCULO POR REFERENCIA
   * Usado para testing determinista con versículo específico
   */
  findVerseByReference(reference) {
    const verse = TEMP_VERSE_DATABASE.find(v => v.reference === reference);

    if (!verse) {
      throw new Error(`❌ Versículo "${reference}" no encontrado en la base de datos`);
    }

    console.log(`✅ Versículo encontrado para testing: ${verse.reference}`);
    return verse;
  }

  /**
   * 🎯 SELECCIÓN INTELIGENTE DE VERSÍCULO
   *
   * Algoritmo MVP:
   * 1. Excluir versículos PUBLICADOS en YouTube (deduplicación crítica)
   * 2. Excluir versículos usados recientemente (menos de 2 días)
   * 3. Priorizar versículos con:
   *    - Alto viral potential
   *    - Bajo used count
   *    - Factor de aleatoriedad
   *
   * En producción:
   * - Modo EXPLORATION (20%): Probar versículos nuevos
   * - Modo OPTIMIZATION (80%): Usar patrones ganadores de analytics
   */
  async selectOptimalVerse() {
    console.log('🔍 Seleccionando versículo óptimo...');

    // 1. DEDUPLICACIÓN CRÍTICA: Consultar versículos ya publicados
    const publishedVerses = await this.getPublishedVerses();

    // Filtrar versículos disponibles
    const now = new Date();
    const availableVerses = TEMP_VERSE_DATABASE.filter(verse => {
      // ✅ FILTRO #1: Excluir versículos PUBLICADOS (evitar desperdiciar créditos)
      if (publishedVerses.has(verse.reference)) {
        console.log(`   🚫 "${verse.reference}" ya publicado - EXCLUIDO`);
        return false;
      }

      const tracking = this.usageTracking[verse.reference];

      // Si nunca se ha usado, está disponible
      if (!tracking.lastUsed) return true;

      // ✅ FILTRO #2: Verificar si han pasado al menos 2 días desde el último uso
      const lastUsedDate = new Date(tracking.lastUsed);
      const daysSinceLastUse = (now - lastUsedDate) / (1000 * 60 * 60 * 24);

      return daysSinceLastUse >= 2;
    });

    if (availableVerses.length === 0) {
      console.log('⚠️  Todos los versículos fueron usados recientemente. Usando el menos reciente...');
      // Si todos fueron usados, tomar el que se usó hace más tiempo
      const sortedByLastUsed = TEMP_VERSE_DATABASE.sort((a, b) => {
        const aLastUsed = new Date(this.usageTracking[a.reference].lastUsed || 0);
        const bLastUsed = new Date(this.usageTracking[b.reference].lastUsed || 0);
        return aLastUsed - bLastUsed;
      });
      return sortedByLastUsed[0];
    }

    // Calcular score para cada versículo
    const versesWithScores = availableVerses.map(verse => {
      const tracking = this.usageTracking[verse.reference];

      // Score basado en:
      // - Viral potential (40%)
      // - Bajo uso (30%)
      // - Aleatoriedad (30%)
      const viralScore = verse.viralPotential * 0.4;
      const usageScore = (10 - tracking.usedCount) * 0.3;
      const randomScore = Math.random() * 3;

      const totalScore = viralScore + usageScore + randomScore;

      return {
        verse,
        score: totalScore
      };
    });

    // Ordenar por score descendente
    versesWithScores.sort((a, b) => b.score - a.score);

    const selectedVerse = versesWithScores[0].verse;
    console.log(`✅ Versículo seleccionado: ${selectedVerse.reference}`);
    console.log(`   - Score: ${versesWithScores[0].score.toFixed(2)}`);
    console.log(`   - Viral Potential: ${selectedVerse.viralPotential}/10`);
    console.log(`   - Veces usado: ${this.usageTracking[selectedVerse.reference].usedCount}`);

    return selectedVerse;
  }

  /**
   * 🎨 GENERAR METADATA PERSONALIZADA CON IA
   *
   * Genera metadata ÚNICA para cada versículo específico:
   * - customHook: Gancho viral personalizado
   * - visualDescriptions: 5 descripciones visuales únicas (hook, intro, body, application, cta)
   * - historicalInsight: Insight histórico fascinante
   *
   * IMPORTANTE: NO usa templates genéricos, cada metadata es PERSONALIZADA
   */
  async generatePersonalizedMetadata(verse) {
    console.log(`🤖 Generando metadata personalizada con IA para ${verse.reference}...`);

    const prompt = `Eres un experto en contenido bíblico viral para YouTube Shorts/TikTok.

Genera metadata PERSONALIZADA (no genérica) para este versículo específico:

**Versículo:** ${verse.reference}
**Texto:** "${verse.text}"
**Categoría:** ${verse.category}
**Contexto histórico:** ${verse.historicalContext}
**Audiencia objetivo:** ${verse.targetAudience.join(', ')}
**Mejor tipo de hook:** ${verse.bestHookType}

Genera un objeto JSON con:

1. **customHook** (string): Hook viral PERSONALIZADO basado en ${verse.bestHookType}:
   - Si bestHookType = "direct": Cita directa impactante del versículo
   - Si bestHookType = "controversy": Plantea pregunta controversial que el versículo responde
   - Si bestHookType = "negative": Problema/dolor que el versículo resuelve

2. **visualDescriptions** (objeto con 5 strings): Descripciones visuales CINEMATOGRÁFICAS ÚNICAS con PERSONAJES, ESCENARIOS y ACCIONES concretas (NO genéricas como "cielo", "nubes", "luz"):

   **FORMATO REQUERIDO PARA CADA DESCRIPCIÓN:**
   - PERSONAJE: ¿Quién está en la escena? (pastor, pescador, madre orando, anciano leyendo, niño, mujer, soldado, etc.)
   - ESCENARIO: ¿Dónde sucede? (templo antiguo, casa humilde, mercado, barca en mar, jardín, desierto, cueva, etc.)
   - ACCIÓN: ¿Qué está haciendo? (orando con manos levantadas, abrazando a niño, caminando con báculo, leyendo pergamino, etc.)
   - OBJETO SIMBÓLICO: ¿Qué objeto representa el mensaje? (cruz de madera, manos juntas, biblia abierta, lámpara de aceite, pan, agua, etc.)

   **Ejemplo CORRECTO:** "Anciano pastor hebreo en túnica beige caminando por valle rocoso al amanecer, sosteniendo báculo de madera, rodeado de ovejas blancas, expresión de paz profunda"
   **Ejemplo INCORRECTO:** "Cielo dramático con nubes y luz dorada" (demasiado genérico)

   Genera estas 5 descripciones específicas:
   - hook: Visual que capte atención relacionado al hook (5s) - DEBE incluir personaje + acción
   - intro: Contexto histórico visual específico de este versículo (25s) - DEBE incluir escenario + personaje de la época
   - body: Visualización del mensaje central del versículo (45s) - DEBE incluir personaje + objeto simbólico + acción
   - application: Aplicación personal visual práctica (25s) - DEBE incluir persona moderna + acción concreta
   - cta: Cierre inspirador visual relacionado al mensaje (20s) - DEBE incluir personaje + gesto final

3. **historicalInsight** (string): Un insight histórico FASCINANTE sobre este versículo específico que la mayoría no conoce (2-3 frases). Debe ser sorprendente y memorable.

**IMPORTANTE:**
- Cada campo debe ser ÚNICO y PERSONALIZADO para "${verse.text}"
- NO uses plantillas genéricas
- Las visuales deben evocar el mensaje ESPECÍFICO de este versículo
- El historicalInsight debe ser algo que haga decir "wow, no sabía eso"

Responde SOLO con JSON válido, sin markdown, sin explicaciones adicionales.`;

    try {
      // Llamar a OpenRouter en lugar de Anthropic SDK directo
      const response = await fetch(this.openrouterUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.openrouterApiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://retea.vercel.app',
          'X-Title': 'Retea Video Generator - Agent 0'
        },
        body: JSON.stringify({
          model: 'nvidia/nemotron-3-ultra-550b-a55b:free',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 2048
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      const responseText = data.choices[0].message.content;

      // Limpiar posibles backticks de markdown
      const cleanedResponse = responseText
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

      const aiMetadata = JSON.parse(cleanedResponse);

      console.log('✅ Metadata personalizada generada exitosamente');
      console.log(`   - Custom Hook: "${aiMetadata.customHook.substring(0, 50)}..."`);
      console.log(`   - Historical Insight: "${aiMetadata.historicalInsight.substring(0, 50)}..."`);

      return aiMetadata;

    } catch (error) {
      console.error('❌ Error generando metadata con IA:', error.message);

      // Fallback: Metadata básica (solo para MVP, en producción esto debe fallar)
      console.log('⚠️  Usando metadata básica de fallback...');
      return {
        customHook: `¿Sabías que ${verse.reference} puede cambiar tu vida?`,
        visualDescriptions: {
          hook: "Imagen dramática relacionada al tema del versículo",
          intro: `Contexto histórico de ${verse.reference}`,
          body: `Visualización del mensaje de ${verse.reference}`,
          application: "Aplicación práctica del mensaje bíblico",
          cta: "Llamado a acción inspirador"
        },
        historicalInsight: verse.historicalContext
      };
    }
  }

  /**
   * 🚀 EJECUTAR INVESTIGACIÓN COMPLETA
   *
   * Flujo completo:
   * 1. Seleccionar versículo óptimo (o usar targetVerse para testing)
   * 2. Generar metadata personalizada con IA
   * 3. Guardar decisión en JSON
   * 4. Actualizar tracking de uso
   *
   * @param {string} targetVerse - Opcional: versículo específico para testing determinista
   */
  async run(targetVerse = null) {
    console.log('\n🔬 ============================================');
    console.log('   AGENT 0: INVESTIGADOR DE VERSÍCULOS');
    console.log('   Cerebro del sistema - Decide TODO primero');
    console.log('============================================\n');

    try {
      // 1. Seleccionar versículo
      // Testing mode: usa versículo específico
      // Production mode: selección algorítmica autónoma
      const selectedVerse = targetVerse
        ? this.findVerseByReference(targetVerse)
        : await this.selectOptimalVerse();

      if (targetVerse) {
        console.log(`🧪 MODO TESTING: Usando versículo especificado "${targetVerse}"`);
      } else {
        console.log(`🚀 MODO PRODUCCIÓN: Selección algorítmica autónoma`);
      }

      // 2. Generar metadata personalizada con IA
      const aiMetadata = await this.generatePersonalizedMetadata(selectedVerse);

      // 3. Construir decisión completa
      const decision = {
        // Metadata del versículo
        id: selectedVerse.id,
        reference: selectedVerse.reference,
        text: selectedVerse.text, // TEXTO LITERAL - NUNCA MODIFICAR
        category: selectedVerse.category,

        // Metadata enriquecida por IA
        customHook: aiMetadata.customHook,
        historicalInsight: aiMetadata.historicalInsight,
        visualDescriptions: aiMetadata.visualDescriptions,

        // Metadata original
        targetAudience: selectedVerse.targetAudience,
        keywords: selectedVerse.keywords,
        historicalContext: selectedVerse.historicalContext,
        emotionalBenefit: selectedVerse.emotionalBenefit,
        bestHookType: selectedVerse.bestHookType,

        // Metadata técnica
        searchVolume: selectedVerse.searchVolume,
        competitionLevel: selectedVerse.competitionLevel,
        viralPotential: selectedVerse.viralPotential,

        // Metadata de decisión
        selectedAt: new Date().toISOString(),
        selectedBy: 'agent-0-verse-researcher',
        version: '1.0-mvp'
      };

      // 4. Guardar decisión
      fs.writeFileSync(
        this.decisionFile,
        JSON.stringify(decision, null, 2)
      );

      console.log(`\n💾 Decisión guardada en: ${this.decisionFile}`);

      // 4b. Guardar también en Supabase Database
      try {
        const savedDecision = await saveAgentDecision(decision);
        console.log(`✅ Decisión también guardada en Supabase (ID: ${savedDecision.id})`);
      } catch (error) {
        console.error('⚠️  Error guardando en Supabase:', error.message);
        console.log('   (Continuando con decisión en filesystem)');
      }

      // 5. Actualizar tracking de uso
      this.usageTracking[selectedVerse.reference].usedCount++;
      this.usageTracking[selectedVerse.reference].lastUsed = new Date().toISOString();
      this.saveUsageTracking();

      console.log('✅ Tracking de uso actualizado');

      console.log('\n✨ DECISIÓN FINAL:');
      console.log(`   Versículo: ${decision.reference}`);
      console.log(`   Texto: "${decision.text}"`);
      console.log(`   Categoría: ${decision.category}`);
      console.log(`   Hook: "${decision.customHook}"`);
      console.log(`   Viral Potential: ${decision.viralPotential}/10`);

      console.log('\n🎯 Agent 0 completado. Agent 1 puede proceder.\n');

      return decision;

    } catch (error) {
      console.error('\n❌ Error en Agent 0:', error.message);
      console.error(error.stack);
      process.exit(1);
    }
  }
}

// 🏃 EJECUCIÓN
if (require.main === module) {
  // Leer versículo opcional de argumentos (para testing)
  // Producción: node agent-0-verse-researcher.js
  // Testing: node agent-0-verse-researcher.js "Romanos 8:28"
  const targetVerse = process.argv[2];

  const researcher = new VerseResearcher();
  researcher.run(targetVerse);
}

module.exports = VerseResearcher;
