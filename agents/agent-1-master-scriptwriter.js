#!/usr/bin/env node

/**
 * AGENTE 1 MAESTRO - GUIONISTA EXPERTO
 * Triple expertise: SEO YouTube + Teología + Copywriting
 *
 * Este agente genera guiones de 2 minutos optimizados para:
 * - 10,000+ views en 7 días
 * - 60%+ retention rate
 * - 5%+ CTR
 * - Transformación espiritual
 */

const fs = require('fs');
const path = require('path');

// ============================================================================
// VERSÍCULOS MAESTROS (8 más populares)
// ============================================================================
const MASTER_VERSES = [
  {
    id: 1,
    reference: "Salmos 23:1",
    text: "Jehová es mi pastor; nada me faltará.",
    category: "consuelo",
    targetAudience: ["adultos mayores", "personas con ansiedad", "buscadores de paz"],
    keywords: ["paz", "confianza", "provisión", "pastor", "protección"],
    historicalContext: "Escrito por el rey David, pastor convertido en rey, basado en su experiencia cuidando ovejas en los campos de Belén",
    emotionalBenefit: "Paz profunda en medio de la incertidumbre",
    searchVolume: "high",
    competitionLevel: "medium"
  },
  {
    id: 2,
    reference: "Juan 3:16",
    text: "Porque de tal manera amó Dios al mundo, que ha dado a su Hijo unigénito, para que todo aquel que en él cree, no se pierda, mas tenga vida eterna.",
    category: "salvación",
    targetAudience: ["buscadores espirituales", "nuevos creyentes", "personas en crisis existencial"],
    keywords: ["amor de Dios", "salvación", "vida eterna", "fe", "esperanza"],
    historicalContext: "Palabras de Jesús a Nicodemo, líder religioso que lo visitó de noche buscando respuestas",
    emotionalBenefit: "Certeza de amor incondicional y propósito eterno",
    searchVolume: "very high",
    competitionLevel: "high"
  },
  {
    id: 3,
    reference: "Filipenses 4:13",
    text: "Todo lo puedo en Cristo que me fortalece.",
    category: "fortaleza",
    targetAudience: ["personas enfrentando desafíos", "emprendedores", "estudiantes"],
    keywords: ["fortaleza", "poder", "victoria", "superar obstáculos", "perseverancia"],
    historicalContext: "Pablo escribió esto desde prisión, demostrando que la fortaleza divina trasciende circunstancias",
    emotionalBenefit: "Empoderamiento para enfrentar cualquier situación",
    searchVolume: "high",
    competitionLevel: "high"
  },
  {
    id: 4,
    reference: "Jeremías 29:11",
    text: "Porque yo sé los pensamientos que tengo acerca de vosotros, dice Jehová, pensamientos de paz, y no de mal, para daros el fin que esperáis.",
    category: "propósito",
    targetAudience: ["jóvenes adultos", "personas en transición", "buscadores de propósito"],
    keywords: ["propósito", "planes de Dios", "esperanza", "futuro", "destino"],
    historicalContext: "Mensaje de Dios al pueblo exiliado en Babilonia, prometiendo restauración después de 70 años",
    emotionalBenefit: "Claridad sobre el propósito divino en la vida",
    searchVolume: "very high",
    competitionLevel: "high"
  },
  {
    id: 5,
    reference: "Proverbios 3:5-6",
    text: "Fíate de Jehová de todo tu corazón, y no te apoyes en tu propia prudencia. Reconócelo en todos tus caminos, y él enderezará tus veredas.",
    category: "guía",
    targetAudience: ["personas tomando decisiones", "líderes", "padres"],
    keywords: ["guía divina", "sabiduría", "dirección", "confianza", "decisiones"],
    historicalContext: "Sabiduría del rey Salomón, el hombre más sabio que vivió, enseñando principios de vida",
    emotionalBenefit: "Confianza en la guía divina para decisiones importantes",
    searchVolume: "high",
    competitionLevel: "medium"
  },
  {
    id: 6,
    reference: "Isaías 41:10",
    text: "No temas, porque yo estoy contigo; no desmayes, porque yo soy tu Dios que te esfuerzo; siempre te ayudaré, siempre te sustentaré con la diestra de mi justicia.",
    category: "fortaleza",
    targetAudience: ["personas con miedo", "pacientes enfermos", "personas en duelo"],
    keywords: ["no temas", "fortaleza", "ayuda divina", "valentía", "sostén"],
    historicalContext: "Profecía de Isaías a Israel durante tiempos de amenaza asiria, prometiendo protección divina",
    emotionalBenefit: "Eliminación del miedo y valentía renovada",
    searchVolume: "high",
    competitionLevel: "medium"
  },
  {
    id: 7,
    reference: "Romanos 8:28",
    text: "Y sabemos que a los que aman a Dios, todas las cosas les ayudan a bien, esto es, a los que conforme a su propósito son llamados.",
    category: "esperanza",
    targetAudience: ["personas en crisis", "sobrevivientes de trauma", "personas deprimidas"],
    keywords: ["esperanza", "propósito en el dolor", "redención", "bien en medio del mal"],
    historicalContext: "Pablo explica la soberanía de Dios que transforma hasta las peores situaciones en bendición",
    emotionalBenefit: "Esperanza de que Dios redime todo dolor",
    searchVolume: "high",
    competitionLevel: "medium"
  },
  {
    id: 8,
    reference: "Mateo 11:28",
    text: "Venid a mí todos los que estáis trabajados y cargados, y yo os haré descansar.",
    category: "descanso",
    targetAudience: ["personas agotadas", "trabajadores estresados", "cuidadores"],
    keywords: ["descanso", "paz", "alivio", "carga", "cansancio"],
    historicalContext: "Invitación de Jesús a las multitudes agotadas por las exigencias religiosas y la vida difícil",
    emotionalBenefit: "Descanso profundo del alma y alivio de cargas",
    searchVolume: "high",
    competitionLevel: "low"
  }
];

// ============================================================================
// MASTER SCRIPTWRITER CLASS
// ============================================================================
class MasterScriptwriterAgent {
  constructor() {
    this.outputPath = path.join(__dirname, '../output/scripts');
    this.promptPath = path.join(__dirname, '../prompts/agente-1-scriptwriter-master.md');

    // Crear directorios si no existen
    if (!fs.existsSync(this.outputPath)) {
      fs.mkdirSync(this.outputPath, { recursive: true });
    }
  }

  /**
   * Selecciona el versículo del día
   */
  selectVerse(preference = 'random') {
    if (preference === 'random') {
      const randomIndex = Math.floor(Math.random() * MASTER_VERSES.length);
      return MASTER_VERSES[randomIndex];
    }

    // Si se especifica por referencia
    const verse = MASTER_VERSES.find(v => v.reference === preference);
    return verse || MASTER_VERSES[0];
  }

  /**
   * Genera hook irresistible según la fórmula
   */
  generateHook(verse) {
    const hookPatterns = [
      `Este versículo tiene el PODER de transformar tu día AHORA MISMO. Escúchalo hasta el final.`,
      `Miles de personas cambiaron su vida con ESTA VERDAD bíblica. Descúbrela en 2 minutos.`,
      `Si sientes ${verse.emotionalBenefit.toLowerCase()}, DETENTE. Este mensaje es JUSTO para ti.`,
      `La CLAVE para encontrar ${verse.emotionalBenefit.toLowerCase()} está en ${verse.reference}. No dejes de escuchar.`,
      `Esto es lo que NADIE te dice sobre ${verse.reference}. Puede cambiar TODO.`
    ];

    const randomIndex = Math.floor(Math.random() * hookPatterns.length);
    return hookPatterns[randomIndex];
  }

  /**
   * Genera 3 verdades teológicas profundas
   */
  generateThreeTruths(verse) {
    // Verdades específicas por categoría
    const truthsMap = {
      'consuelo': [
        "NO estás solo en este momento difícil",
        "Tu PASADO no define tu futuro",
        "Dios tiene un PLAN perfecto para ti"
      ],
      'salvación': [
        "El amor de Dios es INCONDICIONAL",
        "La salvación es un REGALO, no se gana",
        "Tu vida tiene PROPÓSITO eterno"
      ],
      'fortaleza': [
        "La fortaleza viene de DIOS, no de ti",
        "Los obstáculos son OPORTUNIDADES disfrazadas",
        "NUNCA estarás solo en la batalla"
      ],
      'propósito': [
        "Fuiste creado con UN PROPÓSITO único",
        "Dios te preparó ANTES de que nacieras",
        "Tu vida IMPACTA la eternidad"
      ],
      'guía': [
        "Dios conoce CADA paso de tu camino",
        "La sabiduría divina SUPERA tu entendimiento",
        "Confiar en Dios es la MEJOR decisión"
      ],
      'descanso': [
        "El descanso es un REGALO de Dios",
        "No necesitas GANARTE el amor divino",
        "Tus cargas son DEMASIADO pesadas para llevarlas solo"
      ],
      'esperanza': [
        "Dios REDIME hasta lo más doloroso",
        "Tu historia NO ha terminado",
        "Lo MEJOR está por venir"
      ]
    };

    return truthsMap[verse.category] || truthsMap['consuelo'];
  }

  /**
   * Genera título optimizado SEO
   */
  generateTitle(verse) {
    const templates = [
      `${verse.reference} - El Versículo que Cambió Millones de Vidas | ${verse.emotionalBenefit}`,
      `${verse.reference} - La Verdad que Necesitas HOY | ${verse.keywords[0]}`,
      `${verse.reference} - Descubre Este Poder Transformador | ${verse.category}`,
      `${verse.reference} - ${verse.emotionalBenefit} Garantizado | Palabra de Dios`
    ];

    const randomIndex = Math.floor(Math.random() * templates.length);
    let title = templates[randomIndex];

    // Asegurar que no exceda 60 caracteres
    if (title.length > 60) {
      title = `${verse.reference} - ${verse.emotionalBenefit} | ${verse.keywords[0]}`;
    }

    return title;
  }

  /**
   * Genera descripción SEO optimizada
   */
  generateDescription(verse) {
    return `🙏 ${verse.reference} - ${verse.text}

✨ Descubre cómo este poderoso versículo puede transformar tu vida HOY. ${verse.emotionalBenefit} está a tu alcance.

📖 Versículo completo: ${verse.text}
🎯 Categoría: ${verse.category}
💡 Palabras clave: ${verse.keywords.join(', ')}

🔔 SUSCRÍBETE para recibir un versículo inspirador cada día
👍 Dale LIKE si este mensaje tocó tu corazón
💬 Comparte en los comentarios cómo Dios está obrando en tu vida
📤 COMPARTE con alguien que necesite ${verse.emotionalBenefit.toLowerCase()} hoy

#VersículoDelDía #${verse.reference.replace(/\s|:/g, '')} #PalabraDeDios #BibliaDiaria #${verse.category} #DevocionalDiario #ReinaValera1960 #VersículosDiarios #FeCristiana #PromesasDeDios

🎬 Nuevo video mañana a las 12:00 PM
📺 Canal: Rey Celestial - Tu refugio diario de paz y esperanza`;
  }

  /**
   * Genera tags SEO
   */
  generateTags(verse) {
    const baseTags = [
      verse.reference,
      verse.reference.replace(/\s|:/g, ''),
      "versículo del día",
      "biblia diaria",
      "palabra de dios",
      "reina valera 1960",
      "devocional diario",
      "versículos diarios"
    ];

    const categoryTags = [verse.category];
    const keywordTags = verse.keywords;
    const generalTags = ["promesas de dios", "fe cristiana"];

    return [...baseTags, ...categoryTags, ...keywordTags, ...generalTags];
  }

  /**
   * Genera el guión completo optimizado
   */
  generate(options = {}) {
    const verse = this.selectVerse(options.versePreference);
    const hook = this.generateHook(verse);
    const truths = this.generateThreeTruths(verse);

    // ESCENA 1: HOOK (5 segundos)
    const scene1 = {
      id: 1,
      timing: "0:00-0:05",
      duration: 5,
      type: "hook",
      text: hook,
      visualDescription: "Rayos de luz dorada atravesando nubes dramáticas, cielo épico con colores vibrantes naranja y púrpura",
      visualStyle: "cinematográfico, impactante, épico",
      cameraMovement: "slow zoom in",
      mood: "expectativa, curiosidad, urgencia"
    };

    // ESCENA 2: VERSÍCULO + CONTEXTO (25 segundos)
    const scene2 = {
      id: 2,
      timing: "0:05-0:30",
      duration: 25,
      type: "verse",
      text: `${verse.reference} dice: "${verse.text}"

Este versículo ${verse.historicalContext}.

Y tiene un significado TRANSFORMADOR para tu vida en este momento.`,
      visualDescription: "Biblia abierta con luz suave dorada, página mostrando el versículo, ambiente cálido y reverente",
      visualStyle: "reverente, acogedor, íntimo, sagrado",
      cameraMovement: "gentle pan",
      mood: "reverencia, paz, conexión espiritual"
    };

    // ESCENA 3: 3 VERDADES (45 segundos)
    const scene3 = {
      id: 3,
      timing: "0:30-1:15",
      duration: 45,
      type: "reflection",
      text: `Tres verdades PODEROSAS que cambiarán tu perspectiva:

PRIMERA VERDAD: ${truths[0]}.
Dios está contigo EN ESTE MOMENTO, no mañana, no cuando seas mejor persona. AHORA.
Es como un padre que nunca suelta la mano de su hijo, incluso cuando el hijo no lo ve.

SEGUNDA VERDAD: ${truths[1]}.
El amor de Dios es tan GRANDE que borra TODO lo que hiciste ayer. Hoy es un nuevo día.
Imagina despertar sin el peso de ayer. Eso es lo que Dios ofrece cada mañana.

Y TERCERA VERDAD: ${truths[2]}.
No estás aquí por casualidad. Dios te creó con una misión específica que SOLO TÚ puedes cumplir.
Y cuando lo descubras, tu vida tendrá un sentido que nunca imaginaste.`,
      visualDescription: "Amanecer majestuoso sobre montañas, cielo naranja y dorado, naturaleza inspiradora y épica",
      visualStyle: "esperanzador, majestuoso, natural, inspirador",
      cameraMovement: "slow aerial rise",
      mood: "inspiración, asombro, revelación"
    };

    // ESCENA 4: APLICACIÓN PRÁCTICA (25 segundos)
    const scene4 = {
      id: 4,
      timing: "1:15-1:40",
      duration: 25,
      type: "application",
      text: `¿Qué significa esto HOY para TI?

Significa que AHORA MISMO puedes experimentar ${verse.emotionalBenefit.toLowerCase()}. No necesitas esperar.

Cierra tus ojos por un segundo. Respira profundo. Y di: "Dios, estoy aquí. Te necesito."

Eso es todo. Así de SIMPLE. Y verás cómo Dios responde de maneras que ni imaginas.

Hoy es TU día. El día en que todo puede cambiar.`,
      visualDescription: "Manos abiertas hacia el cielo recibiendo luz celestial dorada, rayos brillantes, conexión íntima con lo divino",
      visualStyle: "personal, transformador, íntimo, poderoso",
      cameraMovement: "static close-up",
      mood: "conexión personal, transformación, esperanza"
    };

    // ESCENA 5: CALL-TO-ACTION (20 segundos)
    const scene5 = {
      id: 5,
      timing: "1:40-2:00",
      duration: 20,
      type: "cta",
      text: `Si este versículo tocó tu corazón, déjame un AMÉN en los comentarios. Me encanta leer cómo Dios está obrando en tu vida.

Y si quieres recibir un versículo transformador CADA DÍA, SUSCRÍBETE y activa la campanita 🔔.

Comparte este video con alguien que esté pasando por un momento difícil. Puede ser justo el mensaje que necesita HOY.

Nos vemos MAÑANA con más Palabra de Dios que cambiará tu vida.

¡Dios te bendiga!`,
      visualDescription: "Cruz con resplandor dorado brillante, cielo azul celeste profundo, rayos de luz convergentes, gloria divina",
      visualStyle: "triunfante, esperanzador, glorioso, victorioso",
      cameraMovement: "dramatic zoom out",
      mood: "victoria, esperanza, comunidad, bendición"
    };

    const scenes = [scene1, scene2, scene3, scene4, scene5];

    // Combinar todo el texto
    const fullText = scenes.map(s => s.text).join('\n\n');

    // Metadata de YouTube
    const youtubeMetadata = {
      title: this.generateTitle(verse),
      description: this.generateDescription(verse),
      tags: this.generateTags(verse),
      category: "22" // People & Blogs
    };

    // Objeto final del script
    const script = {
      metadata: {
        verse: verse.reference,
        category: verse.category,
        targetAudience: verse.targetAudience,
        keywords: verse.keywords,
        duration: 120,
        emotionalBenefit: verse.emotionalBenefit,
        generatedAt: new Date().toISOString()
      },
      scenes: scenes,
      fullText: fullText,
      youtubeMetadata: youtubeMetadata
    };

    // Guardar en archivo
    const filename = `script-${verse.reference.replace(/\s|:/g, '-')}-${Date.now()}.json`;
    const filepath = path.join(this.outputPath, filename);
    fs.writeFileSync(filepath, JSON.stringify(script, null, 2));

    console.log(`✅ Guión maestro generado: ${verse.reference}`);
    console.log(`📁 Archivo: ${filename}`);
    console.log(`🎯 Objetivo: ${verse.emotionalBenefit}`);
    console.log(`📊 Keywords SEO: ${verse.keywords.join(', ')}`);

    return {
      success: true,
      script: script,
      filepath: filepath,
      filename: filename,
      verse: verse.reference
    };
  }
}

// ============================================================================
// CLI
// ============================================================================
if (require.main === module) {
  const agent = new MasterScriptwriterAgent();

  const args = process.argv.slice(2);
  const versePreference = args[0] || 'random';

  const result = agent.generate({ versePreference });

  if (result.success) {
    console.log('\n✨ GUIÓN MAESTRO LISTO PARA PRODUCCIÓN ✨\n');
    process.exit(0);
  } else {
    console.error('\n❌ Error generando guión\n');
    process.exit(1);
  }
}

module.exports = MasterScriptwriterAgent;
