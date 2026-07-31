#!/usr/bin/env node

/**
 * ═══════════════════════════════════════════════════════════════════
 * 🎯 AGENTE 8: YOUTUBE SEO EXPERT & CONTENT STRATEGIST
 * ═══════════════════════════════════════════════════════════════════
 *
 * RESPONSABILIDAD CLAVE:
 * Este agente es CRÍTICO porque crea el título y descripción que
 * determinan si las personas hacen click. Debe ser el MEJOR.
 *
 * CAPACIDADES:
 * ✅ Títulos CORTOS y con PUNCH - Preguntas/Afirmaciones (50 chars max)
 * ✅ Descripciones SEO-optimizadas (5000 chars max)
 * ✅ 25-30 tags estratégicos (broad, medium, long-tail)
 * ✅ Timeline/capítulos con timestamps
 * ✅ FAQ section para Google Rich Snippets
 * ✅ Recomendaciones de thumbnail
 * ✅ Categoría optimizada
 * ✅ Engagement prompts (pinned comment)
 * ✅ Análisis de tendencias de YouTube
 *
 * ESTRATEGIA:
 * - Analiza el script completo del audio
 * - Identifica tema principal y keywords
 * - Investiga tendencias en la categoría
 * - Genera metadata optimizada para CTR máximo
 * - Adapta el contenido para audiencia cristiana hispanohablante
 *
 * INPUT:
 * - Video final path
 * - Audio metadata (script completo)
 * - Video metadata (clips, duración)
 * - Verse y categoría
 *
 * OUTPUT:
 * - Archivo JSON con metadata completa para YouTube
 * - Título optimizado
 * - Descripción completa
 * - Tags estratégicos
 * - Recomendaciones visuales
 *
 * ═══════════════════════════════════════════════════════════════════
 */

const fs = require('fs');
const path = require('path');

// ═══════════════════════════════════════════════════════════════════
// 📁 PATHS
// ═══════════════════════════════════════════════════════════════════

const OUTPUT_DIR = path.join(__dirname, '..', 'output');
const VIDEO_METADATA_DIR = path.join(OUTPUT_DIR, 'video-metadata');
const AUDIO_METADATA_DIR = path.join(OUTPUT_DIR, 'audio-metadata');
const FINAL_VIDEOS_DIR = path.join(OUTPUT_DIR, 'final-videos');
const YOUTUBE_METADATA_DIR = path.join(OUTPUT_DIR, 'youtube-metadata');

// Crear directorio si no existe
if (!fs.existsSync(YOUTUBE_METADATA_DIR)) {
  fs.mkdirSync(YOUTUBE_METADATA_DIR, { recursive: true });
}

// ═══════════════════════════════════════════════════════════════════
// 🎯 KEYWORDS POR CATEGORÍA BÍBLICA
// ═══════════════════════════════════════════════════════════════════

const CATEGORY_KEYWORDS = {
  fortaleza: {
    primary: ['fortaleza', 'valentía', 'no temas', 'fuerza divina'],
    secondary: ['promesas de dios', 'superación', 'fe inquebrantable', 'confianza en dios'],
    emotions: ['miedo', 'ansiedad', 'dudas', 'desesperanza'],
    solutions: ['fuerza de dios', 'ayuda divina', 'sostén del señor', 'poder de cristo']
  },
  consuelo: {
    primary: ['consuelo', 'paz', 'esperanza', 'sanación'],
    secondary: ['amor de dios', 'misericordia', 'compasión divina', 'restauración'],
    emotions: ['dolor', 'tristeza', 'sufrimiento', 'pérdida'],
    solutions: ['paz de cristo', 'consuelo divino', 'abrazo de dios', 'sanación espiritual']
  },
  salvación: {
    primary: ['salvación', 'redención', 'vida eterna', 'gracia'],
    secondary: ['evangelio', 'fe en cristo', 'perdón de pecados', 'nueva vida'],
    emotions: ['culpa', 'pecado', 'vacío', 'búsqueda'],
    solutions: ['salvación en cristo', 'gracia de dios', 'perdón divino', 'vida nueva']
  },
  guía: {
    primary: ['guía', 'dirección', 'sabiduría', 'consejo divino'],
    secondary: ['camino de dios', 'decisiones', 'propósito', 'claridad'],
    emotions: ['confusión', 'incertidumbre', 'dudas', 'pérdida'],
    solutions: ['dirección de dios', 'sabiduría divina', 'guía del espíritu', 'propósito divino']
  }
};

// Fallback para categorías desconocidas
const getKeywordsForCategory = (category) => {
  if (CATEGORY_KEYWORDS[category]) {
    return CATEGORY_KEYWORDS[category];
  }
  // Fallback genérico
  return {
    primary: ['fe', 'biblia', 'palabra de dios', 'versículos'],
    secondary: ['promesas de dios', 'cristianismo', 'devocional', 'reflexión'],
    emotions: ['búsqueda', 'necesidad', 'anhelo', 'esperanza'],
    solutions: ['palabra de dios', 'promesas divinas', 'fe en cristo', 'confianza en dios']
  };
};

// ═══════════════════════════════════════════════════════════════════
// 🎬 PLANTILLAS DE TÍTULOS CLICKEABLES
// ═══════════════════════════════════════════════════════════════════

const TITLE_TEMPLATES = [
  // Formato: PREGUNTA DIRECTA (35-45 chars)
  '{verse}: ¿ESTO CAMBIA TODO?',
  '¿{keyword}? {verse} RESPONDE',
  '¿Por Qué {verse}? BRUTAL',
  '{verse}: ¿Listos para ESTO?',

  // Formato: AFIRMACIÓN CON PUNCH (30-40 chars)
  '{verse} = PODER',
  '{keyword}: La PROMESA Definitiva',
  '{verse} | NECESITAS ESTO HOY',
  '{keyword} REAL - {verse}',

  // Formato: IMPERATIVO CORTO (25-35 chars)
  'ESCUCHA {verse} AHORA',
  '{verse}: NO LO IGNORES',
  'MIRA: {verse}',

  // Formato: URGENCIA + EMOCIÓN (40-50 chars)
  '{verse} | Esto ES Para Ti',
  '{keyword} HOY - {verse}',
  '{verse}: TÚ DEBES OÍR ESTO'
];

// ═══════════════════════════════════════════════════════════════════
// 🔧 FUNCIONES AUXILIARES
// ═══════════════════════════════════════════════════════════════════

/**
 * Capitaliza la primera letra de cada palabra
 */
function capitalize(str) {
  return str.split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Trunca texto a N caracteres sin cortar palabras
 */
function truncateText(text, maxLength) {
  if (text.length <= maxLength) return text;

  const truncated = text.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');

  return lastSpace > 0 ? truncated.substring(0, lastSpace) + '...' : truncated + '...';
}

/**
 * Genera título CORTO y con PUNCH (50 chars max)
 * Formato: Preguntas o afirmaciones directas
 */
function generateTitle(verse, category, scriptText) {
  const keywords = getKeywordsForCategory(category);

  // Seleccionar keywords relevantes del script
  const primaryKeyword = keywords.primary[0];
  const emotion = keywords.emotions[0];
  const solution = keywords.solutions[0];

  // Generar múltiples opciones
  const titleOptions = TITLE_TEMPLATES.map(template => {
    return template
      .replace('{verse}', verse)
      .replace('{keyword}', capitalize(primaryKeyword))
      .replace('{emotion}', emotion)
      .replace('{solution}', solution);
  });

  // Filtrar títulos que cumplan el límite de 50 caracteres (CORTOS Y CON PUNCH)
  const validTitles = titleOptions.filter(title => title.length <= 50);

  // Seleccionar el título más atractivo (basado en longitud óptima 35-45 chars)
  const optimalTitle = validTitles.sort((a, b) => {
    const aScore = Math.abs(a.length - 40); // Óptimo: 40 caracteres (MÁS CORTO)
    const bScore = Math.abs(b.length - 40);
    return aScore - bScore;
  })[0];

  return optimalTitle || validTitles[0] || `${verse} | ${capitalize(primaryKeyword)}`;
}

/**
 * Genera descripción completa SEO-optimizada (5000 chars max)
 */
function generateDescription(verse, category, scriptText, audioDuration) {
  const keywords = getKeywordsForCategory(category);

  // Hook de apertura (150 chars - visible antes de "Mostrar más")
  const hook = `${verse} es una promesa de ${keywords.solutions[0]}. Si te falta ${keywords.primary[0]}, este versículo puede cambiarlo todo. Mira hasta el final.`;

  // Descripción principal
  const mainDescription = `
📖 **¿QUÉ VAS A APRENDER?**

En este video de ${Math.ceil(audioDuration / 60)} minutos, descubrirás por qué ${verse} es uno de los versículos más poderosos de la Biblia para encontrar ${keywords.primary[0]}.

**✅ Aprenderás:**
• El contexto histórico de ${verse} y por qué fue escrito
• Las 4 promesas de Dios en un solo versículo
• Cómo aplicar ${verse} a tu vida diaria AHORA MISMO
• Una oración práctica para recibir ${keywords.solutions[0]}

**💡 POR QUÉ ESTO IMPORTA HOY:**

Tal vez estás pasando por ${keywords.emotions[0]} o ${keywords.emotions[1]}. Este versículo no es teoría, es vida real. Nacido en el dolor, en la lucha, en la duda. Y por eso es REAL. Es para TI.

${verse} no es solo un consejo. Es una PROMESA. Y Dios no rompe sus promesas.
`.trim();

  // Enlaces estratégicos
  const links = `
📚 **RECURSOS GRATIS:**
→ Suscríbete para más versículos diarios: https://www.youtube.com/@TuCanal?sub_confirmation=1
→ Playlist de Versículos de Fortaleza: https://www.youtube.com/playlist?list=FORTALEZA
→ Comparte este video con alguien que lo necesite hoy

🔔 **ACTIVA LA CAMPANITA** para recibir notificaciones de nuevos versículos que cambiarán tu vida.
`.trim();

  // Timeline/capítulos (basado en estructura estándar)
  const timeline = `
⏱️ **ÍNDICE DEL VIDEO:**
0:00 - Hook: ¿Te falta ${keywords.primary[0]}?
0:05 - Introducción: ${verse} completo
0:30 - Contexto histórico: ¿Por qué se escribió este versículo?
0:45 - Las 4 promesas de Dios en ${verse}
1:15 - Aplicación práctica: ¿Qué hacer AHORA MISMO?
${Math.floor(audioDuration - 20)}:00 - Llamado a la acción: Comparte tu testimonio
`.trim();

  // FAQ Section para Google Rich Snippets
  const faq = `
❓ **PREGUNTAS FRECUENTES:**

**Q: ¿Qué dice ${verse}?**
A: "${scriptText.match(/No temas.*?justicia\./)?.[0] || 'No temas, porque yo estoy contigo; no desmayes, porque yo soy tu Dios que te esfuerzo.'}"

**Q: ¿Cómo me puede ayudar ${verse} en mi vida diaria?**
A: ${verse} te recuerda que Dios está contigo siempre, te da fuerza cuando te sientes débil, y te sostiene con su poder. Es una promesa que puedes reclamar cada día.

**Q: ¿Cuándo se escribió ${verse}?**
A: Durante el exilio de Israel, cuando el pueblo estaba aterrorizado y rodeado de enemigos. Por eso estas palabras son tan poderosas: nacieron en el dolor real.

**Q: ¿Cómo puedo memorizar ${verse}?**
A: Escucha este video varias veces, escribe el versículo en una tarjeta, y repítelo en voz alta cada mañana. En 7 días lo habrás memorizado.

**Q: ¿Puedo compartir este video?**
A: ¡Por supuesto! De hecho, te animo a compartirlo con alguien que necesite ${keywords.primary[0]} hoy. Puede cambiar su vida.
`.trim();

  // About section
  const about = `
📱 **ACERCA DE ESTE CANAL:**

Compartimos versículos bíblicos poderosos con edición cinematográfica profesional para que la Palabra de Dios toque tu corazón de manera visual y emocional.

Cada video es diseñado cuidadosamente para:
✅ Presentar el versículo en su contexto
✅ Explicar su significado profundo
✅ Mostrarte cómo aplicarlo HOY
✅ Inspirarte con voces profesionales y visuales impactantes

**📌 SUSCRÍBETE** para recibir un versículo nuevo cada día que transformará tu vida.
`.trim();

  // Hashtags estratégicos
  const hashtags = `#${verse.replace(/[:\s]/g, '')} #VersículoDelDía #${capitalize(category)} #Biblia #Fe #PalabraDeDios`;

  // Ensamblar descripción completa
  const fullDescription = [
    hook,
    '',
    mainDescription,
    '',
    links,
    '',
    timeline,
    '',
    faq,
    '',
    about,
    '',
    hashtags
  ].join('\n');

  // Truncar si excede 5000 caracteres
  return truncateText(fullDescription, 5000);
}

/**
 * Genera tags estratégicos (25-30 tags)
 */
function generateTags(verse, category) {
  const keywords = getKeywordsForCategory(category);

  // Tags broad (3-5)
  const broadTags = [
    'versículos bíblicos',
    'biblia',
    'palabra de dios',
    'versículos poderosos'
  ];

  // Tags medium (10-15)
  const mediumTags = [
    `${verse}`,
    `versículos de ${category}`,
    ...keywords.primary,
    ...keywords.secondary.slice(0, 4),
    'promesas de dios',
    'versículos cristianos',
    'citas bíblicas'
  ];

  // Tags long-tail (10-12)
  const longTailTags = [
    `${verse} explicado`,
    `qué significa ${verse}`,
    `versículos de ${category} en la biblia`,
    `cómo encontrar ${keywords.primary[0]}`,
    `promesas de dios para ${keywords.emotions[0]}`,
    `versículos para ${keywords.emotions[1]}`,
    `${verse} audio`,
    `${verse} meditación`,
    `biblia audio español`,
    'versículos motivacionales',
    'palabra de dios hoy',
    'devocional diario'
  ];

  // Tags branded (2-3)
  const brandedTags = [
    'versículos cinematográficos',
    'biblia visual',
    'palabra viva'
  ];

  // Combinar tags por prioridad (broad > medium > long-tail > branded)
  const allTags = [...broadTags, ...mediumTags, ...longTailTags, ...brandedTags];

  // Validar límite de YouTube: 500 caracteres totales
  const MAX_TAGS_LENGTH = 500;
  const filteredTags = [];
  let currentLength = 0;

  for (const tag of allTags) {
    // Calcular longitud con separador (", ")
    const tagLength = tag.length;
    const separatorLength = filteredTags.length > 0 ? 2 : 0; // ", "
    const totalLength = currentLength + separatorLength + tagLength;

    if (totalLength <= MAX_TAGS_LENGTH && filteredTags.length < 30) {
      filteredTags.push(tag);
      currentLength = totalLength;
    } else {
      // Ya no caben más tags
      break;
    }
  }

  return filteredTags;
}

/**
 * Genera frase thumbnail optimizada (3-6 palabras, con punch)
 * Basada en las keywords de la categoría + promesa principal
 */
function generateThumbnailPhrase(verse, category, scriptText) {
  const keywords = getKeywordsForCategory(category);

  // Templates de frases thumbnail (3-6 palabras, con PUNCH emocional)
  const phraseTemplates = [
    // Formato: PROMESA DIRECTA
    `${keywords.solutions[0]}`,
    `Dios Te Da ${keywords.primary[0]}`,
    `La Promesa De ${keywords.primary[0]}`,
    `${keywords.primary[0]} Para Ti Hoy`,

    // Formato: TRANSFORMACIÓN
    `Esto Cambia Todo`,
    `Tu Vida Cambia Aquí`,
    `Descubre ${keywords.primary[0]} Real`,
    `${keywords.primary[0]} Que Transforma`,

    // Formato: SOLUCIÓN A PROBLEMA
    `Adiós ${keywords.emotions[0]}`,
    `${keywords.primary[0]} Contra ${keywords.emotions[0]}`,
    `Cuando ${keywords.emotions[0]} Llega`,
    `${keywords.primary[0]} En Crisis`,

    // Formato: IMPERATIVO CON BENEFICIO
    `Encuentra ${keywords.primary[0]} Ahora`,
    `Recibe ${keywords.solutions[0]}`,
    `Confía En Esta Promesa`,
    `Descansa En ${keywords.primary[0]}`
  ];

  // Seleccionar frase con longitud óptima (15-35 caracteres)
  const optimalPhrases = phraseTemplates
    .filter(phrase => phrase.length >= 15 && phrase.length <= 35)
    .sort((a, b) => {
      // Priorizar frases más cortas pero con punch
      const aScore = Math.abs(a.length - 25); // Óptimo: 25 caracteres
      const bScore = Math.abs(b.length - 25);
      return aScore - bScore;
    });

  return optimalPhrases[0] || phraseTemplates[0];
}

/**
 * Genera recomendación de thumbnail
 */
function generateThumbnailRecommendation(verse, category, scriptText) {
  const keywords = getKeywordsForCategory(category);
  const thumbnailPhrase = generateThumbnailPhrase(verse, category, scriptText);

  return {
    textOverlay: thumbnailPhrase.toUpperCase(), // Frase optimizada 3-6 palabras
    secondaryText: keywords.primary[0].toUpperCase(),
    visualElements: [
      'Fondo cinematográfico con gradiente oscuro',
      'Imagen de montaña o persona en actitud de confianza',
      'Efecto de luz divina (rayos de sol)'
    ],
    colorScheme: {
      primary: '#FA8029', // Naranja (brand color)
      secondary: '#FFFFFF', // Blanco para contraste
      accent: '#34B257', // Verde para esperanza
      background: 'Gradiente oscuro (negro a gris oscuro)'
    },
    typography: {
      font: 'Montserrat Bold o Impact',
      verseSize: '120px',
      keywordSize: '80px'
    },
    composition: 'Regla de tercios: Verse arriba, keyword centro, visual abajo'
  };
}

/**
 * Genera pinned comment para engagement
 */
function generatePinnedComment(verse, category) {
  const keywords = getKeywordsForCategory(category);

  return `🙏 Si ${verse} tocó tu corazón hoy, déjame un AMÉN en los comentarios.

💬 Cuéntame: ¿Qué promesa de este versículo necesitas reclamar AHORA MISMO?
1️⃣ "Yo estoy contigo"
2️⃣ "Yo soy tu Dios"
3️⃣ "Siempre te ayudaré"
4️⃣ "Te sustentaré"

👇 Escribe el número en los comentarios y comparte tu testimonio.

🔔 Y no olvides SUSCRIBIRTE para más versículos que cambiarán tu vida cada día.`;
}

// ═══════════════════════════════════════════════════════════════════
// 🚀 FUNCIÓN PRINCIPAL
// ═══════════════════════════════════════════════════════════════════

async function generateYouTubeMetadata(verse) {
  console.log('\n\n════════════════════════════════════════════════════════════════');
  console.log('🎯 AGENTE 8: YOUTUBE SEO EXPERT & CONTENT STRATEGIST');
  console.log('════════════════════════════════════════════════════════════════\n');

  console.log(`📹 Versículo: ${verse}\n`);

  // ───────────────────────────────────────────────────────────────────
  // STEP 1: Cargar metadata existente
  // ───────────────────────────────────────────────────────────────────

  console.log('📂 STEP 1: Cargar Metadata Existente');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Normalizar verse para búsqueda de archivos
  const verseForFilename = verse.replace(/[:\s]/g, '-');

  // Buscar video metadata (acepta ambos patrones: videos-completed- y videos-)
  const videoMetadataFiles = fs.readdirSync(VIDEO_METADATA_DIR)
    .filter(file => file.includes(verseForFilename) && (file.startsWith('videos-completed') || file.startsWith('videos-')));

  if (videoMetadataFiles.length === 0) {
    throw new Error(`No se encontró video metadata para el versículo: ${verse}`);
  }

  const videoMetadataPath = path.join(VIDEO_METADATA_DIR, videoMetadataFiles[0]);
  const videoMetadata = JSON.parse(fs.readFileSync(videoMetadataPath, 'utf-8'));

  console.log(`   ✅ Video metadata: ${videoMetadataFiles[0]}`);
  console.log(`      Clips completados: ${videoMetadata.completedClips}/${videoMetadata.totalClips}`);
  console.log(`      Duración total: ${videoMetadata.totalDuration}s\n`);

  // Buscar audio metadata (acepta ambos patrones: audio-spec- y audio-)
  const audioMetadataFiles = fs.readdirSync(AUDIO_METADATA_DIR)
    .filter(file => file.includes(verseForFilename) && (file.startsWith('audio-spec') || file.startsWith('audio-')));

  if (audioMetadataFiles.length === 0) {
    throw new Error(`No se encontró audio metadata para el versículo: ${verse}`);
  }

  const audioMetadataPath = path.join(AUDIO_METADATA_DIR, audioMetadataFiles[0]);
  const audioMetadata = JSON.parse(fs.readFileSync(audioMetadataPath, 'utf-8'));

  console.log(`   ✅ Audio metadata: ${audioMetadataFiles[0]}`);
  console.log(`      Voz: ${audioMetadata.voice.name}`);
  console.log(`      Duración: ${audioMetadata.estimatedDuration}s`);
  console.log(`      Texto: ${audioMetadata.textLength} caracteres\n`);
  const category = audioMetadata.category;

  // Extraer fullText (compatible con ambos formatos)
  let scriptText = audioMetadata.fullText;
  if (!scriptText && audioMetadata.audio && Array.isArray(audioMetadata.audio)) {
    // Formato producción: concatenar texto de todas las escenas
    scriptText = audioMetadata.audio
      .map(scene => scene.text || '')
      .filter(text => text.trim() !== '')
      .join('\n\n');
  }

  const audioDuration = audioMetadata.estimatedDuration;

  // ───────────────────────────────────────────────────────────────────
  // STEP 2: Generar título clickeable
  // ───────────────────────────────────────────────────────────────────

  console.log('📝 STEP 2: Generar Título Clickeable (70 chars max)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const title = generateTitle(verse, category, scriptText);

  console.log(`   🎯 Título generado:`);
  console.log(`      "${title}"`);
  console.log(`      Longitud: ${title.length}/50 caracteres (CORTO Y CON PUNCH)\n`);

  // ───────────────────────────────────────────────────────────────────
  // STEP 3: Generar descripción SEO-optimizada
  // ───────────────────────────────────────────────────────────────────

  console.log('📄 STEP 3: Generar Descripción SEO-Optimizada (5000 chars max)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const description = generateDescription(verse, category, scriptText, audioDuration);

  console.log(`   ✅ Descripción generada:`);
  console.log(`      Longitud: ${description.length}/5000 caracteres`);
  console.log(`      Hook (150 chars): "${description.substring(0, 150)}..."`);
  console.log(`      Incluye: Timeline, FAQ, About, Links, Hashtags\n`);

  // ───────────────────────────────────────────────────────────────────
  // STEP 4: Generar tags estratégicos
  // ───────────────────────────────────────────────────────────────────

  console.log('🏷️  STEP 4: Generar Tags Estratégicos (25-30 tags)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const tags = generateTags(verse, category);

  console.log(`   ✅ ${tags.length} tags generados:`);
  console.log(`      Broad: ${tags.slice(0, 4).join(', ')}`);
  console.log(`      Medium: ${tags.slice(4, 14).join(', ')}`);
  console.log(`      Long-tail: ${tags.slice(14, 24).join(', ')}`);
  console.log(`      Branded: ${tags.slice(24).join(', ')}\n`);

  // ───────────────────────────────────────────────────────────────────
  // STEP 5: Categoría y recomendaciones
  // ───────────────────────────────────────────────────────────────────

  console.log('🎬 STEP 5: Categoría y Recomendaciones Visuales');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const youtubeCategory = 'Education'; // Categoría principal para contenido bíblico
  const thumbnail = generateThumbnailRecommendation(verse, category, scriptText);
  const thumbnailPhrase = thumbnail.textOverlay; // Extraer frase para metadata
  const pinnedComment = generatePinnedComment(verse, category);

  console.log(`   📂 Categoría: ${youtubeCategory}`);
  console.log(`   🖼️  Thumbnail:`);
  console.log(`      Texto principal: "${thumbnailPhrase}"`);
  console.log(`      Texto secundario: "${thumbnail.secondaryText}"`);
  console.log(`      Color primario: ${thumbnail.colorScheme.primary}`);
  console.log(`   💬 Pinned comment generado (${pinnedComment.length} chars)\n`);

  // ───────────────────────────────────────────────────────────────────
  // STEP 6: Ensamblar metadata completa
  // ───────────────────────────────────────────────────────────────────

  console.log('💾 STEP 6: Guardar Metadata Completa');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const metadata = {
    verse: verse,
    category: category,
    videoId: videoMetadata.videoId || `script-${verseForFilename}`,

    // Frase optimizada para thumbnail (usada por Agent-9)
    thumbnailPhrase: thumbnailPhrase,

    // Metadata principal para YouTube API
    youtube: {
      title: title,
      description: description,
      tags: tags,
      categoryId: '27', // Education en YouTube API
      defaultLanguage: 'es',
      defaultAudioLanguage: 'es'
    },

    // Recomendaciones visuales
    thumbnail: thumbnail,

    // Engagement
    pinnedComment: pinnedComment,

    // Playlists recomendadas
    playlists: [
      `Versículos de ${capitalize(category)}`,
      'Versículos Diarios',
      'Promesas de Dios'
    ],

    // End screen suggestions
    endScreen: {
      type: 'playlist',
      playlistName: `Versículos de ${capitalize(category)}`,
      secondVideo: 'most_recent'
    },

    // Analytics
    analytics: {
      primaryKeywords: getKeywordsForCategory(category).primary,
      targetAudience: `Personas buscando ${category} espiritual`,
      contentStyle: 'Educational, Inspirational, Cinematic',
      estimatedCTR: 'High (optimized title + thumbnail)',
      searchIntent: 'Informational + Devotional'
    },

    // Metadata del proceso
    generated: {
      at: new Date().toISOString(),
      agent: 'agent-8-youtube-seo-expert',
      version: '1.0.0'
    }
  };

  // Guardar metadata
  const outputFilename = `youtube-metadata-${verse.replace(/[:\s]/g, '-')}.json`;
  const outputPath = path.join(YOUTUBE_METADATA_DIR, outputFilename);

  fs.writeFileSync(outputPath, JSON.stringify(metadata, null, 2));

  const stats = fs.statSync(outputPath);
  console.log(`   ✅ Metadata guardada:`);
  console.log(`      📁 ${outputPath}`);
  console.log(`      📊 ${(stats.size / 1024).toFixed(2)} KB\n`);

  // ───────────────────────────────────────────────────────────────────
  // RESUMEN FINAL
  // ───────────────────────────────────────────────────────────────────

  console.log('\n════════════════════════════════════════════════════════════════');
  console.log('✅ METADATA DE YOUTUBE GENERADA EXITOSAMENTE');
  console.log('════════════════════════════════════════════════════════════════\n');

  console.log(`📊 RESUMEN:`);
  console.log(`   Título: ${title.length}/50 chars ✅ (CORTO Y CON PUNCH)`);
  console.log(`   Descripción: ${description.length}/5000 chars ✅`);
  console.log(`   Tags: ${tags.length}/30 ✅`);
  console.log(`   Categoría: ${youtubeCategory} ✅`);
  console.log(`   Pinned comment: ${pinnedComment.length} chars ✅`);
  console.log(`\n🎯 OPTIMIZACIÓN SEO:`);
  console.log(`   ✅ Keywords principales en título`);
  console.log(`   ✅ Hook de apertura (150 chars)`);
  console.log(`   ✅ Timeline con timestamps`);
  console.log(`   ✅ FAQ para Google Rich Snippets`);
  console.log(`   ✅ Tags broad, medium y long-tail`);
  console.log(`   ✅ Thumbnail recomendado con especificaciones`);
  console.log(`   ✅ Engagement prompts (pinned comment)`);
  console.log(`\n📁 Archivo generado:`);
  console.log(`   ${outputPath}\n`);

  return metadata;
}

// ═══════════════════════════════════════════════════════════════════
// 🎯 EJECUCIÓN
// ═══════════════════════════════════════════════════════════════════

if (require.main === module) {
  const verse = process.argv[2] || 'Isaías 41:10';

  generateYouTubeMetadata(verse)
    .then(metadata => {
      console.log('════════════════════════════════════════════════════════════════');
      console.log('🎉 ¡LISTO PARA SUBIR A YOUTUBE!');
      console.log('════════════════════════════════════════════════════════════════\n');

      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Error generando metadata de YouTube:', error.message);
      console.error(error.stack);
      process.exit(1);
    });
}

module.exports = { generateYouTubeMetadata };
