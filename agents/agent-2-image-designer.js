#!/usr/bin/env node

/**
 * AGENTE 2: DISEÑADOR VISUAL EXPERTO
 *
 * Genera prompts cinematográficos optimizados para Magnific AI
 * basándose en el guión creado por el Agente 1
 *
 * Input: Script JSON del Agente 1
 * Output: JSON con 5 prompts optimizados + metadata visual
 */

const fs = require('fs');
const path = require('path');

// Directorios
const SCRIPTS_DIR = path.join(__dirname, '../output/scripts');
const IMAGES_PROMPTS_DIR = path.join(__dirname, '../output/image-prompts');

// Asegurar que existen los directorios
if (!fs.existsSync(IMAGES_PROMPTS_DIR)) {
  fs.mkdirSync(IMAGES_PROMPTS_DIR, { recursive: true });
}

/**
 * PALETAS DE COLORES POR CATEGORÍA BÍBLICA
 */
const COLOR_PALETTES = {
  'consuelo': {
    colors: ['#1E3A8A', '#F59E0B', '#FFFFFF'], // Azul suave, dorado, blanco
    lighting: 'golden hour soft glow',
    mood: 'peaceful and hopeful'
  },
  'fortaleza': {
    colors: ['#DC2626', '#F97316', '#F59E0B'], // Rojo, naranja, dorado
    lighting: 'dramatic storm light with intense contrasts',
    mood: 'powerful and courageous'
  },
  'salvación': {
    colors: ['#FFFFFF', '#60A5FA', '#FDE68A'], // Blanco, azul celeste, dorado
    lighting: 'radiant heavenly glow',
    mood: 'divine and loving'
  },
  'propósito': {
    colors: ['#10B981', '#FBBF24', '#3B82F6'], // Verde, amarillo, azul
    lighting: 'warm sunset optimism',
    mood: 'hopeful and purposeful'
  },
  'esperanza': {
    colors: ['#10B981', '#FBBF24', '#3B82F6'], // Verde esperanza, amarillo sol, azul
    lighting: 'warm sunset optimism',
    mood: 'hopeful and transformative'
  },
  'guía': {
    colors: ['#8B5CF6', '#1E40AF', '#CBD5E1'], // Púrpura, azul profundo, plata
    lighting: 'mystical focused spotlight',
    mood: 'wise and guiding'
  },
  'descanso': {
    colors: ['#60A5FA', '#FFFFFF', '#FDE68A'], // Azul suave, blanco, dorado cálido
    lighting: 'soft morning light',
    mood: 'restful and peaceful'
  }
};

/**
 * PROMPTS TEMPLATES POR TIPO DE ESCENA
 */
class PromptBuilder {
  constructor(category, verse) {
    this.category = category;
    this.verse = verse;
    this.palette = COLOR_PALETTES[category] || COLOR_PALETTES['consuelo'];
  }

  /**
   * ESCENA 1: HOOK - Impacto Visual Dramático
   */
  generateHookPrompt(scene) {
    const colorDescriptors = {
      'consuelo': 'dark blue',
      'fortaleza': 'crimson and orange',
      'salvación': 'brilliant white and gold',
      'propósito': 'vibrant amber and green',
      'esperanza': 'warm golden',
      'guía': 'deep purple and silver',
      'descanso': 'soft azure'
    };

    const moodDescriptors = {
      'consuelo': 'awe and peace',
      'fortaleza': 'urgency and power',
      'salvación': 'wonder and love',
      'propósito': 'curiosity and hope',
      'esperanza': 'anticipation and optimism',
      'guía': 'mystery and wisdom',
      'descanso': 'serenity and relief'
    };

    const color = colorDescriptors[this.category] || 'dark blue';
    const mood = moodDescriptors[this.category] || 'awe and urgency';

    return `Dramatic ${color} sky with massive storm clouds parting, divine golden sunrays breaking through with ethereal glow, epic celestial atmosphere with vast scale and depth, cinematic volumetric lighting with god rays, low-angle wide shot capturing heavenly grandeur, photorealistic biblical epic style, mood of ${mood}, ultra detailed 8K, ray tracing, award-winning cinematography`;
  }

  /**
   * ESCENA 2: INTRO - Biblia y Reverencia
   * IMPORTANTE: SIN TEXTO VISIBLE
   */
  generateIntroPrompt(scene) {
    const surfaces = ['wooden table', 'stone altar', 'ancient stone', 'weathered wood'];
    const surface = surfaces[Math.floor(Math.random() * surfaces.length)];

    return `Ancient worn bible open on ${surface}, soft warm light illuminating aged pages with gentle glow, shallow depth of field with pages softly blurred, cozy intimate atmosphere with golden ambient lighting, overhead close-up shot with natural shadows, photorealistic with subtle film grain texture, no visible text, no typography, pure visual aesthetic, mood of reverence and wisdom, ultra detailed 8K, soft focus background, award-winning still life photography`;
  }

  /**
   * ESCENA 3: BODY - Naturaleza Majestuosa y Simbolismo
   */
  generateBodyPrompt(scene) {
    const landscapes = {
      'consuelo': 'rolling green hills with peaceful stream',
      'fortaleza': 'rugged mountain peak at sunrise',
      'salvación': 'heavenly clouds parting with divine light',
      'propósito': 'winding path through golden valley',
      'esperanza': 'sunrise over vast ocean',
      'guía': 'illuminated crossroads under starry sky',
      'descanso': 'tranquil lake reflecting sunset'
    };

    const symbols = {
      'consuelo': 'shepherd with staff on hillside',
      'fortaleza': 'lone warrior silhouette on summit',
      'salvación': 'radiant cross on hill',
      'propósito': 'path leading to bright horizon',
      'esperanza': 'rainbow after storm',
      'guía': 'lighthouse beacon in darkness',
      'descanso': 'peaceful garden with flowing water'
    };

    const emotions = {
      'consuelo': 'peace and comfort',
      'fortaleza': 'strength and conquest',
      'salvación': 'love and redemption',
      'propósito': 'hope and direction',
      'esperanza': 'transformation and renewal',
      'guía': 'clarity and wisdom',
      'descanso': 'rest and renewal'
    };

    const landscape = landscapes[this.category] || landscapes['consuelo'];
    const symbol = symbols[this.category] || symbols['consuelo'];
    const emotion = emotions[this.category] || emotions['consuelo'];

    return `Majestic ${landscape} bathed in ${this.palette.lighting}, ${symbol} prominently featured with divine presence, vast scale with atmospheric perspective and depth, warm cinematic color grading, wide aerial shot capturing epic grandeur, photorealistic nature photography style, mood of ${emotion}, ultra detailed 8K, volumetric lighting, National Geographic quality`;
  }

  /**
   * ESCENA 4: APPLICATION - Conexión Personal
   */
  generateApplicationPrompt(scene) {
    const actions = {
      'consuelo': 'hands gently clasped in peaceful prayer',
      'fortaleza': 'strong hands clenched in determined prayer',
      'salvación': 'hands reaching upward with open palms',
      'propósito': 'hands holding compass pointing forward',
      'esperanza': 'hands releasing dove toward sky',
      'guía': 'hands opening ancient book',
      'descanso': 'hands resting on still water'
    };

    const moods = {
      'consuelo': 'peace and surrender',
      'fortaleza': 'empowerment and courage',
      'salvación': 'gratitude and worship',
      'propósito': 'determination and clarity',
      'esperanza': 'faith and release',
      'guía': 'seeking and discovery',
      'descanso': 'relief and calm'
    };

    const action = actions[this.category] || actions['consuelo'];
    const mood = moods[this.category] || moods['consuelo'];

    return `${action} receiving divine light from above, celestial golden rays descending with ethereal glow, soft bokeh background with heavenly atmosphere, warm intimate lighting with gentle shadows, close-up shot from low angle emphasizing connection, photorealistic with emotional depth, mood of ${mood}, ultra detailed 8K, shallow depth of field, cinematic portrait style`;
  }

  /**
   * ESCENA 5: CTA - Gloria Final
   */
  generateCTAPrompt(scene) {
    const skies = {
      'consuelo': 'serene golden sunset',
      'fortaleza': 'blazing fiery sunset with dramatic clouds',
      'salvación': 'brilliant white heaven with golden rays',
      'propósito': 'vibrant sunrise with rainbow',
      'esperanza': 'glorious dawn breaking',
      'guía': 'starlit twilight sky',
      'descanso': 'peaceful purple dusk'
    };

    const moods = {
      'consuelo': 'blessing and peace',
      'fortaleza': 'conquest and triumph',
      'salvación': 'eternal glory and love',
      'propósito': 'fulfillment and destiny',
      'esperanza': 'victory and renewal',
      'guía': 'wisdom and revelation',
      'descanso': 'rest and completion'
    };

    const sky = skies[this.category] || skies['consuelo'];
    const mood = moods[this.category] || moods['consuelo'];

    return `Radiant cross silhouette against glorious ${sky}, divine light rays converging from all directions with ethereal glow, epic heavenly atmosphere with depth and majesty, dramatic golden hour lighting with volumetric god rays, wide low-angle shot emphasizing triumph and glory, photorealistic biblical epic finale style, mood of ${mood}, ultra detailed 8K, ray tracing, award-winning religious cinematography`;
  }
}

/**
 * FUNCIÓN PRINCIPAL: PROCESAR GUIÓN Y GENERAR PROMPTS
 */
function processScript(scriptPath) {
  console.log('🎨 Agente 2: Diseñador Visual Experto');
  console.log('=====================================\n');

  // Leer el guión
  const scriptContent = fs.readFileSync(scriptPath, 'utf-8');
  const script = JSON.parse(scriptContent);

  console.log(`📖 Procesando guión: ${script.metadata.verse}`);
  console.log(`🎭 Categoría: ${script.metadata.category}`);
  console.log(`✨ Beneficio: ${script.metadata.emotionalBenefit}\n`);

  // Crear el generador de prompts
  const builder = new PromptBuilder(script.metadata.category, script.metadata.verse);

  // Generar prompts para cada escena
  const visualDesign = {
    videoId: path.basename(scriptPath),
    verse: script.metadata.verse,
    category: script.metadata.category,
    emotionalBenefit: script.metadata.emotionalBenefit,
    visualTheme: {
      colorPalette: builder.palette.colors,
      lighting: builder.palette.lighting,
      style: 'photorealistic cinematic',
      mood: builder.palette.mood
    },
    scenes: [],
    generatedAt: new Date().toISOString()
  };

  // Procesar cada escena
  script.scenes.forEach((scene, index) => {
    console.log(`🎬 Escena ${scene.id}: ${scene.type.toUpperCase()}`);

    let prompt = '';

    switch(scene.type) {
      case 'hook':
        prompt = builder.generateHookPrompt(scene);
        break;
      case 'intro':
        prompt = builder.generateIntroPrompt(scene);
        break;
      case 'body':
        prompt = builder.generateBodyPrompt(scene);
        break;
      case 'application':
        prompt = builder.generateApplicationPrompt(scene);
        break;
      case 'cta':
        prompt = builder.generateCTAPrompt(scene);
        break;
      default:
        prompt = builder.generateHookPrompt(scene);
    }

    visualDesign.scenes.push({
      id: scene.id,
      type: scene.type,
      prompt: prompt,
      aspectRatio: '16:9',
      resolution: '4k',
      model: 'recraft-v4-1',
      duration: scene.duration,
      originalText: scene.text
    });

    console.log(`   ✅ Prompt generado (${prompt.length} caracteres)`);
  });

  // Guardar el archivo de diseño visual
  const outputFilename = `visual-design-${script.metadata.verse.replace(/[:\s]/g, '-')}-${Date.now()}.json`;
  const outputPath = path.join(IMAGES_PROMPTS_DIR, outputFilename);

  fs.writeFileSync(outputPath, JSON.stringify(visualDesign, null, 2));

  console.log(`\n✅ Diseño visual guardado: ${outputFilename}`);
  console.log(`📁 Ruta: ${outputPath}`);

  console.log(`\n🎨 Tema Visual:`);
  console.log(`   Paleta: ${visualDesign.visualTheme.colorPalette.join(', ')}`);
  console.log(`   Iluminación: ${visualDesign.visualTheme.lighting}`);
  console.log(`   Mood: ${visualDesign.visualTheme.mood}`);

  console.log(`\n🎯 Resumen:`);
  visualDesign.scenes.forEach(scene => {
    console.log(`   Escena ${scene.id} (${scene.type}): ${scene.prompt.substring(0, 80)}...`);
  });

  return {
    success: true,
    outputFile: outputFilename,
    outputPath: outputPath,
    verse: script.metadata.verse,
    scenesCount: visualDesign.scenes.length
  };
}

/**
 * EJECUCIÓN
 */
if (require.main === module) {
  try {
    // Buscar el script más reciente
    const files = fs.readdirSync(SCRIPTS_DIR)
      .filter(f => f.startsWith('script-') && f.endsWith('.json'))
      .map(f => ({
        name: f,
        path: path.join(SCRIPTS_DIR, f),
        time: fs.statSync(path.join(SCRIPTS_DIR, f)).mtime.getTime()
      }))
      .sort((a, b) => b.time - a.time);

    if (files.length === 0) {
      throw new Error('No se encontró ningún guión para procesar');
    }

    const latestScript = files[0];
    console.log(`\n📂 Guión encontrado: ${latestScript.name}\n`);

    const result = processScript(latestScript.path);

    console.log(`\n🎉 Diseño visual completado exitosamente!`);
    console.log(`\n📋 Siguiente paso: Generar las 5 imágenes con Magnific usando estos prompts`);

    process.exit(0);

  } catch (error) {
    console.error('\n❌ Error en Agente 2:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

module.exports = { processScript, PromptBuilder };
