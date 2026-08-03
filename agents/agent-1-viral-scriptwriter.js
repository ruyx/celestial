#!/usr/bin/env node

/**
 * AGENTE 1: GUIONISTA MAESTRO VIRAL
 *
 * Cuádruple Expertise:
 * 1. SEO YouTube Expert (10+ años)
 * 2. Teólogo Reformado (PhD)
 * 3. Copywriter Maestro (100M+ views)
 * 4. YouTube Scriptwriter Viral (Millones de views)
 *
 * Técnicas implementadas:
 * - 3 tipos de hooks (Direct, Controversy, Negative)
 * - Framework Hook-Shock-Validate-Tease
 * - Open loops e information gaps
 * - Storytelling natural (no listado)
 * - CTA ultra corto
 * - Tono conversacional extremo
 */

const fs = require('fs');
const path = require('path');
const {
  getLatestAgentDecision,
  getLatestAnalyticsFeedback,
  saveGeneratedScript
} = require('../lib/supabase-client');

// ✅ MIGRACIÓN A SUPABASE: Agent 1 ahora lee/escribe desde Supabase Database
// ❌ ELIMINADO: Dependencias de filesystem para datos (solo para directorios)
// ✅ NUEVO: Usa Supabase para decisiones, feedback y scripts generados

class ViralScriptwriterAgent {
  constructor() {
    this.outputDir = path.join(__dirname, '..', 'output', 'scripts');
    this.ensureOutputDir();
  }

  ensureOutputDir() {
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  // ✅ MIGRACIÓN A SUPABASE: Cargar decisión de Agent 0 desde base de datos
  async loadAgent0Decision() {
    console.log('📥 Cargando decisión de Agent 0 desde Supabase...');

    const decision = await getLatestAgentDecision();

    if (!decision) {
      throw new Error(`
❌ Agent 0 no ha ejecutado todavía.

Por favor ejecuta primero:
  node agents/agent-0-verse-researcher.js

Esto guardará la decisión en Supabase Database (tabla agent_decisions).
      `);
    }

    // Convertir nombres de columnas snake_case a camelCase
    const normalizedDecision = {
      id: decision.id, // ✅ FIX: Usar el ID de Supabase, no verse_id
      reference: decision.reference,
      text: decision.text,
      category: decision.category,
      customHook: decision.custom_hook,
      historicalInsight: decision.historical_insight,
      visualDescriptions: decision.visual_descriptions,
      targetAudience: decision.target_audience,
      keywords: decision.keywords,
      historicalContext: decision.historical_context,
      emotionalBenefit: decision.emotional_benefit,
      bestHookType: decision.best_hook_type,
      searchVolume: decision.search_volume,
      competitionLevel: decision.competition_level,
      viralPotential: decision.viral_potential
    };

    console.log(`✅ Versículo cargado: ${normalizedDecision.reference}`);
    console.log(`   Categoría: ${normalizedDecision.category}`);
    console.log(`   Potencial viral: ${normalizedDecision.viralPotential}/10`);

    return normalizedDecision;
  }

  // ✅ REFACTORIZACIÓN: GENERAR HOOK VIRAL
  // Prioriza customHook de Agent 0, fallback a generación dinámica
  generateViralHook(verse) {
    // ✅ NUEVO: Si Agent 0 generó un customHook personalizado, úsalo
    if (verse.customHook) {
      console.log('   ✅ Usando customHook personalizado de Agent 0');
      return {
        type: verse.bestHookType || 'direct',
        text: verse.customHook
      };
    }

    // ⚠️ FALLBACK: Si no hay customHook, genera dinámicamente
    console.log('   ⚠️  No hay customHook, generando hook dinámico...');
    const hookType = verse.bestHookType || 'direct';

    const hooks = {
      // HOOK DIRECTO: Identificar problema específico
      direct: [
        `¿Sientes ${verse.keywords[0]} cada vez que abres los ojos por la mañana?`,
        `¿Eres de los que busca ${verse.keywords[1]} pero nunca la encuentra?`,
        `Si te falta ${verse.keywords[0]} en tu vida, esto es para ti.`,
        `¿Te has preguntado cómo encontrar ${verse.keywords[0]} verdadera?`
      ],

      // HOOK CONTROVERSIA: Lo que NO te dicen
      controversy: [
        `Esto es lo que NADIE te dice sobre ${verse.keywords[0]}.`,
        `Hay un secreto en este versículo que cambió millones de vidas.`,
        `Lo que las iglesias no mencionan sobre ${verse.keywords[0]}.`,
        `Este versículo tiene algo que te van a sorprender.`
      ],

      // HOOK NEGATIVO: Urgencia y consecuencia
      negative: [
        `NUNCA ignores este versículo si necesitas ${verse.keywords[0]}.`,
        `PARA. Si sientes ${verse.keywords[1]}, este mensaje es para ti.`,
        `No cometas este error cuando busques ${verse.keywords[0]}.`,
        `Si te falta ${verse.keywords[0]}, DETENTE y escucha esto.`
      ]
    };

    const selectedHooks = hooks[hookType];
    const hook = selectedHooks[Math.floor(Math.random() * selectedHooks.length)];

    return {
      type: hookType,
      text: hook
    };
  }

  // GENERAR INTRO con Framework: Hook > Shock > Validate > Tease
  generateIntroWithFramework(verse) {
    const intro = `${verse.reference} dice: "${verse.text}"

${this.generateShock(verse)}

${this.generateValidate(verse)}

${this.generateTease(verse)}`;

    return intro;
  }

  // ✅ REFACTORIZACIÓN: Prioriza historicalInsight de Agent 0
  generateShock(verse) {
    // ✅ NUEVO: Si Agent 0 generó un historicalInsight personalizado, úsalo
    if (verse.historicalInsight) {
      return verse.historicalInsight;
    }

    // ⚠️ FALLBACK: Usar insights hardcoded si no hay historicalInsight de Agent 0
    const shocks = {
      "Salmos 23:1": "David escribió esto mientras huía de su propio hijo que quería matarlo. Imagínate el nivel de dolor.",
      "Juan 3:16": "Juan escribió esto décadas después de ver morir a Jesús. Cada palabra está marcada por ese recuerdo.",
      "Filipenses 4:13": "Pablo escribió esto desde una cárcel romana, encadenado a un soldado. No desde un púlpito cómodo.",
      "Jeremías 29:11": "Esto fue escrito a un pueblo en cautiverio, lejos de casa, sin esperanza. No a gente con todo resuelto.",
      "Proverbios 3:5-6": "Salomón, el hombre más sabio del mundo, olvidó su propio consejo al final de su vida. Irónico, ¿verdad?",
      "Isaías 41:10": "Dios da 4 promesas en un solo versículo. Cuatro. Como si una no fuera suficiente.",
      "Romanos 8:28": "Pablo había sufrido naufragios, golpizas, rechazos. Él vivió esta verdad antes de escribirla.",
      "Mateo 11:28": "Jesús dijo esto rodeado de multitudes agotadas por reglas religiosas. Una invitación radical."
    };

    return shocks[verse.reference] || `Este versículo fue escrito en un momento crítico. ${verse.historicalContext || ''}`;
  }

  generateValidate(verse) {
    const validations = {
      "consuelo": "Tal vez tú también sientes que todo se está derrumbando. Que no hay salida.",
      "salvación": "Quizás te preguntas si Dios realmente te ama. Si eres suficiente.",
      "fortaleza": "Puede que sientas que no tienes fuerzas para seguir adelante.",
      "propósito": "Tal vez te sientes perdido, sin dirección clara en la vida.",
      "guía": "Probablemente estás en una encrucijada y no sabes qué camino tomar.",
      "esperanza": "Quizás estás pasando por algo que no tiene sentido.",
      "descanso": "Tal vez estás exhausto, agotado, y no encuentras paz."
    };

    return validations[verse.category];
  }

  generateTease(verse) {
    return `Pero hay algo en estas palabras que puede cambiarlo todo. Y en los próximos 2 minutos, lo vas a descubrir.`;
  }

  // GENERAR BODY con STORYTELLING (no listado)
  generateBodyWithStorytelling(verse) {
    // Storytelling natural, transiciones fluidas, open loops
    const stories = {
      "Salmos 23:1": `Mira, cuando David dice "Jehová es mi pastor", no está hablando en teoría. Él FUE pastor. Pasó años en los campos cuidando ovejas. Y sabía algo...

Las ovejas no sobreviven solas. Necesitan alguien que las proteja, que las guíe, que las cuide.

Y eso es exactamente lo que Dios hace contigo EN ESTE MOMENTO. No mañana. No cuando seas mejor persona. AHORA.

Es como un padre que nunca suelta la mano de su hijo, incluso cuando el hijo no lo ve. Incluso cuando el hijo duda.

Pero hay algo más profundo aquí...

David también dice "nada me faltará". Espera. ¿Nada? ¿En serio? David perdió todo: su reino, su familia, su seguridad.

Entonces, ¿qué significa esto? Significa que Dios no promete que no perderás cosas. Promete que ÉL es suficiente. Que con Él, tienes TODO lo que realmente necesitas.

Puede que hayas perdido tu trabajo, tu relación, tu salud. Pero si tienes a Dios, tienes el tesoro más grande del universo.

Y ahora viene lo más poderoso...

Este versículo no es solo consuelo. Es IDENTIDAD. "Jehová es MI pastor." No "un" pastor. "MI" pastor.

Imagina tener al CEO de la empresa más grande del mundo como tu mentor personal. Suena increíble, ¿verdad? Pues esto es infinitamente mayor.

Dios, el creador del universo, te conoce por nombre. Te ve. Te escucha. Y tiene un plan específico para TU vida que nadie más puede cumplir.`,

      "Juan 3:16": `Cuando Juan escribió "de tal manera amó Dios", usó una palabra griega que significa "así de intenso, así de loco". No es un amor tibio.

Es el tipo de amor de un padre que corre hacia su hijo rebelde. El tipo de amor que da TODO sin esperar nada a cambio.

Pero aquí viene algo que mucha gente no entiende...

Este versículo no dice "Dios amó al mundo cuando el mundo era bueno". Dice "amó al mundo" punto. Mientras estábamos perdidos. Mientras lo ignorábamos. Mientras le dábamos la espalda.

Es como si alguien te salvara la vida cuando tú intentabas empujarlo.

Y hay algo más que cambia todo...

Dice "para que TODO AQUEL que en él cree". No "los perfectos". No "los que nunca fallaron". TODO AQUEL.

Eso te incluye a ti. Con tu pasado. Con tus errores. Con tus dudas.

Dios no está esperando que te arregles primero. Está esperando que VENGAS tal como estás.`,

      "Filipenses 4:13": `Pablo escribió esto encadenado a un soldado romano. Podía oír los gritos de otros prisioneros. Olía la humedad de la celda.

Y en ese momento, en esas cadenas, escribe: "TODO lo puedo".

No "algo". No "unas cosas". TODO.

Pero espera, hay un detalle que lo cambia todo...

Dice "en Cristo que me fortalece". No "en mi propia fuerza". No "porque soy Superman". En CRISTO.

Es como enchufar tu teléfono. Tú solo no tienes batería infinita. Pero conectado a la fuente correcta, puedes funcionar todo el día.

La fuerza no viene de ti. Viene A TRAVÉS de ti.

Y aquí está lo increíble...

Esto significa que las cosas que crees que son imposibles, las situaciones que te parecen demasiado grandes, los desafíos que te quitan el sueño...

No dependen de cuán fuerte ERES. Dependen de a quién estás CONECTADO.

Y si estás conectado a Cristo, tienes acceso a poder ilimitado.`,
    };

    return stories[verse.reference] || this.generateGenericStory(verse);
  }

  generateGenericStory(verse) {
    return `Este versículo no es solo teoría. Es vida real.

${verse.historicalContext}

Y eso cambia todo. Porque estas palabras no nacieron en un escritorio cómodo. Nacieron en el dolor, en la lucha, en la duda.

Lo que significa que son REALES. Son para TI.

Tal vez estás pasando por algo similar. Tal vez sientes que no hay salida.

Pero hay algo que necesitas saber...

Este versículo es una promesa. No un consejo. No un deseo. Una PROMESA.

Y Dios no rompe sus promesas.`;
  }

  // GENERAR APLICACIÓN PRÁCTICA
  generatePracticalApplication(verse) {
    return `Entonces, ¿qué haces con esto AHORA MISMO?

Cierra tus ojos por un segundo. Solo un segundo. Respira profundo.

Y di esto en tu mente, o en voz alta si estás solo: "Dios, estoy aquí. Te necesito. ${this.generatePersonalPrayer(verse)}"

Eso es todo. Así de simple. No necesitas palabras perfectas. No necesitas estar en una iglesia. Solo necesitas ser honesto.

Hoy puede ser el día en que todo cambia. No lo dejes pasar.`;
  }

  generatePersonalPrayer(verse) {
    const prayers = {
      "consuelo": "Sé mi paz.",
      "salvación": "Ayúdame a creer en tu amor.",
      "fortaleza": "Dame tu fuerza.",
      "propósito": "Muéstrame mi camino.",
      "guía": "Guíame en tus caminos.",
      "esperanza": "Dame esperanza.",
      "descanso": "Déjame descansar en ti."
    };

    return prayers[verse.category];
  }

  // GENERAR CTA ULTRA CORTO (máximo 4 líneas)
  generateUltraShortCTA(verse) {
    return `Si esto tocó tu corazón, déjame un AMÉN en los comentarios.

Suscríbete para más versículos que cambian vidas 🔔.

Comparte esto con alguien que lo necesite hoy.

Dios te bendiga.`;
  }

  // GENERAR DESCRIPCIÓN ESPECÍFICA PARA THUMBNAIL
  // Agent 9 usará esta descripción como base y la enriquecerá con su framework
  generateThumbnailDescription(verse, hook) {
    // Generar descripción que capture la esencia visual del mensaje
    const thumbnailDescriptions = {
      'consuelo': `Persona encontrando paz y consuelo divino, expresión de alivio y esperanza, atmosfera cálida y acogedora relacionada con: ${hook.text}`,
      'fortaleza': `Persona victoriosa sobre desafío, postura de determinación y poder divino, atmósfera triunfante relacionada con: ${hook.text}`,
      'salvación': `Persona recibiendo luz divina, brazos abiertos en gratitud, atmósfera de redención y nueva vida relacionada con: ${hook.text}`,
      'propósito': `Persona descubriendo su camino, mirada hacia adelante con claridad, atmósfera de descubrimiento relacionada con: ${hook.text}`,
      'esperanza': `Persona emergiendo de oscuridad hacia luz, expresión de renovación, atmósfera de transformación relacionada con: ${hook.text}`,
      'guía': `Persona recibiendo dirección divina, postura contemplativa y receptiva, atmósfera de sabiduría relacionada con: ${hook.text}`,
      'descanso': `Persona en paz y descanso completo, expresión serena, atmósfera tranquila relacionada con: ${hook.text}`
    };

    const baseDescription = thumbnailDescriptions[verse.category] ||
      `Persona experimentando ${verse.emotionalBenefit}, expresión emocional auténtica relacionada con: ${hook.text}`;

    return {
      subject: baseDescription,
      emotion: verse.emotionalBenefit,
      context: `Versículo ${verse.reference} - ${verse.text.substring(0, 100)}...`,
      hookText: hook.text,
      category: verse.category
    };
  }

  // GENERAR METADATA DE YOUTUBE
  generateYouTubeMetadata(verse) {
    const title = `${verse.reference} - ${verse.emotionalBenefit} | ${verse.category}`;

    const description = `🙏 ${verse.reference} - ${verse.text}

✨ Descubre cómo este poderoso versículo puede transformar tu vida HOY. ${verse.emotionalBenefit} está a tu alcance.

📖 Versículo completo: ${verse.text}
🎯 Categoría: ${verse.category}
💡 Palabras clave: ${verse.keywords.join(', ')}

🔔 SUSCRÍBETE para versículos diarios que cambian vidas
👍 LIKE si este mensaje tocó tu corazón
💬 COMENTA "Amén" y comparte cómo Dios está obrando en tu vida
📤 COMPARTE con alguien que necesite esperanza hoy

#VersículoDelDía #${verse.reference.replace(/[:\s]/g, '')} #PalabraDeDios #BibliaDiaria #${verse.category.charAt(0).toUpperCase() + verse.category.slice(1)} #DevocionalDiario #ReinaValera1960 #VersículosDiarios #FeCristiana #PromesasDeDios`;

    const tags = [
      verse.reference,
      verse.reference.replace(/[:\s]/g, ''),
      "versículo del día",
      "biblia diaria",
      "palabra de dios",
      "reina valera 1960",
      "devocional diario",
      "versículos diarios",
      verse.category,
      ...verse.keywords,
      "versículos poderosos",
      "promesas de dios",
      "fe cristiana",
      "transformación espiritual"
    ];

    return {
      title: title.length > 60 ? title.substring(0, 57) + '...' : title,
      description,
      tags,
      category: "22" // People & Blogs
    };
  }

  // ❌ ELIMINADO: generateDynamicVisuals()
  // ✅ REFACTORIZACIÓN: Ahora usa visualDescriptions de Agent 0

  // ✅ MIGRACIÓN A SUPABASE: GENERAR GUIÓN COMPLETO (ahora async)
  async generateMasterScript() {
    // ✅ SUPABASE: Cargar decisión de Agent 0 desde base de datos
    const verse = await this.loadAgent0Decision();

    console.log('\n🎬 Generando guión a partir de decisión de Agent 0 (Supabase)...');

    const hook = this.generateViralHook(verse);
    const intro = this.generateIntroWithFramework(verse);
    const body = this.generateBodyWithStorytelling(verse);
    const application = this.generatePracticalApplication(verse);
    const cta = this.generateUltraShortCTA(verse);

    // ✅ REFACTORIZACIÓN: Usar visualDescriptions de Agent 0
    const visuals = verse.visualDescriptions || {
      hook: "Visual description not available",
      intro: "Visual description not available",
      body: "Visual description not available",
      application: "Visual description not available",
      cta: "Visual description not available"
    };

    const script = {
      metadata: {
        verse: verse.reference,
        agentDecisionId: verse.id, // ✅ SUPABASE: Guardar el ID de la decisión de Agent 0
        category: verse.category,
        hookType: hook.type,
        targetAudience: verse.targetAudience,
        keywords: verse.keywords,
        duration: 120,
        emotionalBenefit: verse.emotionalBenefit,
        thumbnailDescription: this.generateThumbnailDescription(verse, hook), // ✅ NUEVO: Descripción específica para thumbnail
        generatedAt: new Date().toISOString()
      },
      scenes: [
        {
          id: 1,
          timing: "0:00-0:05",
          duration: 5,
          type: "hook",
          aspectRatio: "16:9", // YouTube normal (horizontal)
          hookType: hook.type,
          text: hook.text,
          visualDescription: visuals.hook, // ✅ DINÁMICO
          visualStyle: "cinematográfico, impactante, viral",
          cameraMovement: "slow zoom in",
          mood: "expectativa, curiosidad, urgencia"
        },
        {
          id: 2,
          timing: "0:05-0:30",
          duration: 25,
          type: "intro",
          aspectRatio: "16:9", // YouTube normal (horizontal)
          framework: "hook-shock-validate-tease",
          text: intro,
          visualDescription: visuals.intro, // ✅ DINÁMICO
          visualStyle: "reverente, acogedor, íntimo, histórico",
          cameraMovement: "gentle pan",
          mood: "reverencia, conexión, revelación"
        },
        {
          id: 3,
          timing: "0:30-1:15",
          duration: 45,
          type: "body",
          aspectRatio: "16:9", // YouTube normal (horizontal)
          storytellingTechnique: "metaphors-anecdotes-openloops",
          text: body,
          visualDescription: visuals.body, // ✅ DINÁMICO
          visualStyle: "esperanzador, majestuoso, natural, poderoso",
          cameraMovement: "slow aerial rise con transiciones fluidas",
          mood: "inspiración, revelación, transformación"
        },
        {
          id: 4,
          timing: "1:15-1:40",
          duration: 25,
          type: "application",
          aspectRatio: "16:9", // YouTube normal (horizontal)
          text: application,
          visualDescription: visuals.application, // ✅ DINÁMICO
          visualStyle: "personal, transformador, íntimo, emocional",
          cameraMovement: "static close-up",
          mood: "conexión personal, acción, esperanza"
        },
        {
          id: 5,
          timing: "1:40-2:00",
          duration: 20,
          type: "cta",
          aspectRatio: "16:9", // YouTube normal (horizontal)
          text: cta,
          visualDescription: visuals.cta, // ✅ DINÁMICO
          visualStyle: "triunfante, esperanzador, glorioso, cierre épico",
          cameraMovement: "dramatic zoom out",
          mood: "victoria, comunidad, bendición final"
        }
      ],
      fullText: `${hook.text}\n\n${intro}\n\n${body}\n\n${application}\n\n${cta}`,
      youtubeMetadata: this.generateYouTubeMetadata(verse)
    };

    return script;
  }

  // ✅ MIGRACIÓN A SUPABASE: Guardar guión en base de datos
  async saveScript(script, agentDecisionId) {
    // Guardar en Supabase
    const savedScript = await saveGeneratedScript(script, agentDecisionId);

    // También guardar en filesystem como backup (opcional)
    const timestamp = Date.now();
    const verseFileName = script.metadata.verse.replace(/[:\s]/g, '-');
    const filename = `script-${verseFileName}-${timestamp}.json`;
    const filepath = path.join(this.outputDir, filename);

    try {
      fs.writeFileSync(filepath, JSON.stringify(script, null, 2));
      console.log(`📁 Backup guardado en filesystem: ${filename}`);
    } catch (error) {
      console.log(`⚠️  No se pudo guardar backup en filesystem: ${error.message}`);
    }

    return {
      id: savedScript.id,
      filename,
      filepath,
      verse: script.metadata.verse,
      supabaseId: savedScript.id
    };
  }

  // ✅ MIGRACIÓN A SUPABASE: Leer feedback de analytics desde base de datos
  async loadAnalyticsFeedback() {
    const feedback = await getLatestAnalyticsFeedback();

    if (!feedback) {
      console.log('ℹ️  No hay feedback de analytics todavía (primera ejecución)');
      return null;
    }

    try {
      // Convertir a formato esperado (snake_case a camelCase)
      const feedbackData = {
        lastUpdate: feedback.last_update,
        totalVideosAnalyzed: feedback.total_videos_analyzed,
        agentInstructions: feedback.agent_instructions,
        learningInsights: feedback.learning_insights
      };

      console.log('📊 FEEDBACK DE ANALYTICS CARGADO DESDE SUPABASE:');
      console.log(`   Última actualización: ${new Date(feedbackData.lastUpdate).toLocaleString()}`);
      console.log(`   Videos analizados: ${feedbackData.totalVideosAnalyzed || 0}`);

      // Mostrar instrucciones CRÍTICAS
      const criticalInstructions = [];
      for (const [agent, instructions] of Object.entries(feedbackData.agentInstructions || {})) {
        const critical = instructions.filter(i => i.priority === 'CRITICAL');
        if (critical.length > 0 && agent.includes('Scriptwriter')) {
          criticalInstructions.push(...critical);
        }
      }

      if (criticalInstructions.length > 0) {
        console.log('\n   🔴 INSTRUCCIONES CRÍTICAS ACTIVAS:');
        criticalInstructions.forEach(i => {
          console.log(`      - ${i.action}: ${i.detail}`);
        });
      }

      // Mostrar mejores patrones
      if (feedbackData.learningInsights) {
        console.log(`\n   📈 Mejores patrones detectados:`);
        console.log(`      Hook types exitosos: ${feedbackData.learningInsights.topPerformingHookTypes?.join(', ') || 'N/A'}`);
        console.log(`      Categorías exitosas: ${feedbackData.learningInsights.bestCategories?.join(', ') || 'N/A'}`);
      }

      console.log('');
      return feedbackData;
    } catch (error) {
      console.log(`⚠️  Error leyendo feedback: ${error.message}`);
      return null;
    }
  }

  // APLICAR FEEDBACK AL GENERAR GUIÓN
  applyFeedback(selectedVerse, feedback) {
    if (!feedback) return selectedVerse;

    // Si hay feedback, aplicar aprendizajes
    const insights = feedback.learningInsights;
    if (!insights) return selectedVerse;

    // Si hay hook types que funcionan mejor, priorizar esos
    if (insights.topPerformingHookTypes && insights.topPerformingHookTypes.length > 0) {
      const bestHook = insights.topPerformingHookTypes[0];
      console.log(`🎯 Aplicando aprendizaje: Usando hook type '${bestHook}' (mejor performance)`);
      selectedVerse.bestHookType = bestHook;
    }

    return selectedVerse;
  }

  // ✅ MIGRACIÓN A SUPABASE: EJECUTAR AGENTE (ahora async)
  async run() {
    console.log('\n🎬 AGENTE 1: GUIONISTA MAESTRO VIRAL');
    console.log('🔥 Generando guión con técnicas VIRALES de YouTube (Supabase)...\n');

    // PASO 1: Cargar feedback de analytics (APRENDIZAJE) - ahora async
    const feedback = await this.loadAnalyticsFeedback();

    // PASO 2: Generar guión (aplicando aprendizajes si existen) - ahora async
    const script = await this.generateMasterScript();

    // Obtener el ID de la decisión de Agent 0 para asociar el script
    const agentDecisionId = script.metadata.agentDecisionId;

    // PASO 3: Aplicar feedback al versículo seleccionado
    // ✅ REFACTORIZACIÓN: Ya no usa MASTER_VERSES
    // Agent 0 se encargará de aplicar feedback al seleccionar el versículo
    if (feedback && feedback.learningInsights?.topPerformingHookTypes) {
      console.log('📊 Aplicando insights de analytics...');
      const bestHookType = feedback.learningInsights.topPerformingHookTypes[0];

      // Crear una versión modificada del verse con el mejor hookType
      const verseWithFeedback = {
        ...script.metadata,
        bestHookType: bestHookType
      };

      // Regenerar el hook con el mejor tipo aprendido
      const newHook = this.generateViralHook(verseWithFeedback);
      script.scenes[0].text = newHook.text;
      script.scenes[0].hookType = newHook.type;
      script.metadata.hookType = newHook.type;

      console.log(`   Aplicado hook type '${bestHookType}' (mejor performance)`);
    }

    // PASO 4: Guardar script en Supabase - ahora async y pasa agentDecisionId
    const saved = await this.saveScript(script, agentDecisionId);

    console.log(`✅ Guión viral generado: ${saved.verse}`);
    console.log(`📁 Archivo: ${saved.filename}`);
    console.log(`💾 Supabase ID: ${saved.supabaseId}`);
    console.log(`🎯 Hook Type: ${script.metadata.hookType}`);
    console.log(`🎯 Objetivo: ${script.metadata.emotionalBenefit}`);
    console.log(`📊 Keywords SEO: ${script.metadata.keywords.join(', ')}`);
    console.log('\n✨ GUIÓN VIRAL LISTO PARA MILLONES DE VIEWS ✨\n');

    return saved;
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  const agent = new ViralScriptwriterAgent();
  agent.run();
}

module.exports = ViralScriptwriterAgent;
