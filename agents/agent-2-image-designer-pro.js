#!/usr/bin/env node

/**
 * AGENTE 2 PRO: DISEÑADOR VISUAL CINEMATOGRÁFICO
 *
 * Genera prompts CINEMATOGRÁFICOS usando el framework de 5 capas profesional:
 * 1. Subject (específico, no vago)
 * 2. Action/Emotion/Pose (momento humano)
 * 3. Setting (mundo completo: tiempo + lugar + detalles sensoriales)
 * 4. Lighting (LA MÁS IMPORTANTE: fuente + dirección + calidad)
 * 5. Style/Aesthetic/Reference (film stock + fotógrafo + películas)
 *
 * Input: Script JSON del Agente 1
 * Output: JSON con 5 prompts CINEMATOGRÁFICOS optimizados
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
 * PALETAS CINEMATOGRÁFICAS POR CATEGORÍA
 */
const CINEMATIC_PALETTES = {
  'consuelo': {
    colorGrade: 'muted greens and soft blues, warm undertones',
    filmStock: '35mm Kodak Portra 400, visible grain',
    styleRef: 'Terrence Malick meets Days of Heaven color palette',
    lighting: 'soft golden hour window light, warm and directional, gentle shadows'
  },
  'fortaleza': {
    colorGrade: 'deep oranges and crimson reds, high contrast',
    filmStock: '35mm Kodak Vision3 500T, cinematic grain',
    styleRef: 'Blade Runner 2049 meets Mad Max Fury Road intensity',
    lighting: 'hard neon backlight with rim glow, dramatic side-light, deep shadows'
  },
  'salvación': {
    colorGrade: 'ethereal whites and golden highlights, heavenly glow',
    filmStock: '35mm Kodak Vision3 200T, clean and sharp',
    styleRef: 'Tree of Life meets The Fountain divine aesthetic',
    lighting: 'radiant overhead glow, soft diffused divine light from above'
  },
  'propósito': {
    colorGrade: 'vibrant greens and warm yellows, optimistic tones',
    filmStock: '35mm Fuji Superia 400, saturated colors',
    styleRef: 'Life of Pi meets The Secret Life of Walter Mitty',
    lighting: 'warm sunset optimism, golden backlight, hopeful atmosphere'
  },
  'esperanza': {
    colorGrade: 'soft pastels and golden hour warmth',
    filmStock: '35mm Kodak Ektar 100, vibrant yet natural',
    styleRef: 'Amélie meets Her color palette',
    lighting: 'warm diffused morning light, soft shadows, gentle glow'
  },
  'guía': {
    colorGrade: 'deep purples and midnight blues, silver moonlight',
    filmStock: '35mm Kodak Tri-X pushed to 1600, dramatic grain',
    styleRef: 'Arrival meets Interstellar cosmic mood',
    lighting: 'mystical focused spotlight, moonlight through clouds, ethereal beams'
  },
  'descanso': {
    colorGrade: 'soft azure blues and warm cream tones',
    filmStock: '35mm Kodak Portra 160, smooth and calm',
    styleRef: 'Lost in Translation meets Before Sunrise intimacy',
    lighting: 'soft morning light through curtains, peaceful and still'
  }
};

/**
 * CINEMATOGRAPHIC PROMPT BUILDER (5 LAYERS)
 */
class CinematicPromptBuilder {
  constructor(category, verse) {
    this.category = category;
    this.verse = verse;
    this.palette = CINEMATIC_PALETTES[category] || CINEMATIC_PALETTES['consuelo'];
  }

  /**
   * ESCENA 1: HOOK - Cielo Épico Dramático
   *
   * Framework de 5 capas:
   * 1. Subject: Basado en visualDescription del script
   * 2. Action: Nubes partiendo, luz penetrando
   * 3. Setting: Atmosfera celestial con profundidad
   * 4. Lighting: GOD RAYS, volumétrica
   * 5. Style: Film stock + referencias
   */
  generateHookPrompt(scene) {
    // USAR visualDescription del script como base
    const visualDesc = scene?.visualDescription || 'Imagen dramática relacionada al tema del versículo';

    // Atmosfera según categoría (mantener para consistencia)
    const atmospheres = {
      'consuelo': 'Epic celestial atmosphere at golden hour, vast scale with depth and serenity, peaceful grandeur',
      'fortaleza': 'Apocalyptic biblical atmosphere at storm peak, raw power and scale, dramatic intensity',
      'salvación': 'Heavenly realm opening, infinite depth and divine presence, overwhelming beauty',
      'propósito': 'Horizon at the break of new day, endless possibilities, forward momentum',
      'esperanza': 'Dawn breaking after long night, transition from darkness to light, transformation visible',
      'guía': 'Cosmic expanse at midnight, infinite wisdom and mystery, contemplative vastness',
      'descanso': 'Twilight peace at day end, gentle closure, restful atmosphere'
    };

    const atmosphere = atmospheres[this.category] || atmospheres['consuelo'];

    return `${visualDesc}. ${atmosphere}. LIGHTING: ${this.palette.lighting}, cinematic volumetric lighting with god rays. CAMERA: low-angle wide shot, slowly pushing in, capturing heavenly grandeur. LENS: 35mm wide angle, deep focus showing scale. Shot on ${this.palette.filmStock}, ${this.palette.colorGrade}. ${this.palette.styleRef}. Photorealistic biblical epic cinematography. Ultra detailed 8K, ray tracing. 16:9 aspect ratio.`;
  }

  /**
   * ESCENA 2: INTRO - Contexto del Versículo
   */
  generateIntroPrompt(scene) {
    // USAR visualDescription del script como base
    const visualDesc = scene?.visualDescription || 'Contexto histórico del versículo';

    return `${visualDesc}. Ancient atmosphere with weathered textures and timeless quality, deep symbolic meaning visible in composition. LIGHTING: soft warm light creating Rembrandt shadows, gentle golden glow adding reverence. CAMERA: intimate close-up shot, static locked-off framing, contemplative perspective. LENS: 85mm macro, shallow depth of field (f/1.4), background fading to soft bokeh. Shot on ${this.palette.filmStock}, warm tones with deep shadows, ${this.palette.colorGrade}. ${this.palette.styleRef} meets still life photography masters. Photorealistic with rich texture detail, subtle film grain visible. Mood: reverent, ancient wisdom, sacred intimacy. Ultra detailed 8K. 16:9 aspect ratio. NO TEXT VISIBLE, NO TYPOGRAPHY, pure visual aesthetic.`;
  }

  /**
   * ESCENA 3: BODY - Visualización del Mensaje Principal
   */
  generateBodyPrompt(scene) {
    // USAR visualDescription del script como base
    const visualDesc = scene?.visualDescription || 'Visualización del mensaje del versículo';

    // Settings atmosféricos según categoría (mantener para tiempo/lugar/ambiente)
    const atmosphericSettings = {
      'consuelo': 'Golden hour atmosphere, 6:30 PM summer evening, warm breeze visible in scene, distant elements soft in haze',
      'fortaleza': 'Sunrise at peak moment, 5:45 AM, thin air visible, dramatic clouds in background, sense of conquest',
      'salvación': 'Heavenly atmosphere in timeless moment, clouds parting above, rays of light descending',
      'propósito': 'Morning atmosphere with clear path ahead, 7:00 AM, dew visible, future bright',
      'esperanza': 'After-storm clearing, 4:30 PM, puddles reflecting light, air fresh and renewed',
      'guía': 'Midnight atmosphere, stars visible above, waves or wind in background, beacon of guidance',
      'descanso': 'Late afternoon tranquility, 5:00 PM, golden light filtered naturally, peaceful atmosphere'
    };

    // Camerawork según categoría (mantener para movimiento cinematográfico)
    const camerawork = {
      'consuelo': 'slow aerial rise from medium to wide shot, revealing scale of peace',
      'fortaleza': 'wide crane rising with slow orbit, emphasizing triumph and elevation',
      'salvación': 'slow dolly in from wide to medium, focusing on subject, building emotion',
      'propósito': 'tracking shot following movement, steady forward momentum, hopeful progression',
      'esperanza': 'static locked-off shot, letting transformation happen in frame',
      'guía': 'slow orbit around subject, contemplative circling, revealing all sides',
      'descanso': 'gentle crane down from above, peaceful descent to rest'
    };

    const atmosphere = atmosphericSettings[this.category] || atmosphericSettings['consuelo'];
    const camera = camerawork[this.category] || camerawork['consuelo'];

    return `${visualDesc}. ${atmosphere}. LIGHTING: ${this.palette.lighting}, vast atmospheric perspective with depth, volumetric light beams visible. CAMERA: ${camera}, epic scale captured. LENS: 35mm wide angle, deep focus with foreground and background sharp. Shot on ${this.palette.filmStock}, ${this.palette.colorGrade}. ${this.palette.styleRef} meets National Geographic epic nature photography. Photorealistic with majestic scale. Ultra detailed 8K, cinematic color grading. 16:9 aspect ratio.`;
  }

  /**
   * ESCENA 4: APPLICATION - Aplicación Personal del Mensaje
   */
  generateApplicationPrompt(scene) {
    // USAR visualDescription del script como base
    const visualDesc = scene?.visualDescription || 'Aplicación personal del mensaje del versículo';

    // Lighting según categoría (mantener para consistencia emocional)
    const lighting = {
      'consuelo': 'soft golden rays descending from above like gentle embrace',
      'fortaleza': 'intense celestial beam from directly overhead, powerful illumination',
      'salvación': 'brilliant white radiance flooding down, overwhelming divine presence',
      'propósito': 'warm directional light from future/horizon, hopeful glow',
      'esperanza': 'soft diffused morning light, new beginning, gentle warmth',
      'guía': 'focused spotlight from above, wisdom illuminating darkness',
      'descanso': 'peaceful twilight glow, restful shadows, calming light'
    };

    const lightDesc = lighting[this.category] || lighting['consuelo'];

    return `${visualDesc}. Background with soft bokeh of heavenly atmosphere, out of focus clouds or sky, depth implied. LIGHTING: ${lightDesc}, warm intimate shadows creating dimension, Rembrandt lighting adding depth. CAMERA: close-up shot from low angle (looking up), slowly pushing in from medium to tight close-up, building intimacy. LENS: 85mm portrait lens, extremely shallow depth of field (f/1.4), background melting into bokeh. Shot on ${this.palette.filmStock}, ${this.palette.colorGrade}, warm natural tones. ${this.palette.styleRef} meets cinematic portrait photography. Photorealistic with emotional depth, visible film grain. Mood: surrender, connection, personal encounter. Ultra detailed 8K. 16:9 aspect ratio.`;
  }

  /**
   * ESCENA 5: CTA - Llamado a la Acción Final
   */
  generateCTAPrompt(scene) {
    // USAR visualDescription del script como base
    const visualDesc = scene?.visualDescription || 'Llamado final del mensaje del versículo';

    // Skies atmosféricos según categoría (mantener para ambiente celestial)
    const skies = {
      'consuelo': 'serene golden sunset sky with soft clouds',
      'fortaleza': 'blazing fiery sunset with dramatic storm clouds receding',
      'salvación': 'brilliant white heaven with golden rays bursting through',
      'propósito': 'vibrant sunrise with rainbow emerging',
      'esperanza': 'glorious dawn breaking with warm light flooding horizon',
      'guía': 'starlit cosmic sky with milky way visible',
      'descanso': 'peaceful purple dusk with first stars appearing'
    };

    const sky = skies[this.category] || skies['consuelo'];

    return `${visualDesc}. Set against glorious ${sky}, divine light rays converging from all directions in perfect radial pattern, ethereal atmospheric glow. Epic heavenly atmosphere with maximum depth and majesty, sense of infinite scale. LIGHTING: ${this.palette.lighting}, dramatic volumetric god rays visible, rim light around edges, backlit perfection. CAMERA: wide low-angle shot slowly craning up, emphasizing triumph and glory, revealing full majesty. LENS: 35mm wide angle, deep focus capturing foreground sharp against distant sky. Shot on ${this.palette.filmStock}, ${this.palette.colorGrade}. ${this.palette.styleRef} meets biblical epic finale cinematography. Photorealistic with maximum drama and beauty. Ultra detailed 8K, ray tracing, cinematic color grading. Mood: victory, eternal glory, blessing, completion. 16:9 aspect ratio.`;
  }
}

/**
 * FUNCIÓN PRINCIPAL
 */
function processScript(scriptPath) {
  console.log('🎬 Agente 2 PRO: Diseñador Visual Cinematográfico');
  console.log('================================================\n');

  const scriptContent = fs.readFileSync(scriptPath, 'utf-8');
  const script = JSON.parse(scriptContent);

  console.log(`📖 Procesando guión: ${script.metadata.verse}`);
  console.log(`🎭 Categoría: ${script.metadata.category}`);
  console.log(`✨ Beneficio: ${script.metadata.emotionalBenefit}\n`);

  const builder = new CinematicPromptBuilder(script.metadata.category, script.metadata.verse);

  const visualDesign = {
    videoId: path.basename(scriptPath),
    verse: script.metadata.verse,
    category: script.metadata.category,
    emotionalBenefit: script.metadata.emotionalBenefit,
    cinematicStyle: {
      filmStock: builder.palette.filmStock,
      colorGrade: builder.palette.colorGrade,
      styleReference: builder.palette.styleRef,
      lighting: builder.palette.lighting,
      framework: '5-layer cinematographic prompting (Subject, Action, Setting, Lighting, Style)'
    },
    scenes: [],
    generatedAt: new Date().toISOString()
  };

  // Generar prompts cinematográficos
  const promptGenerators = [
    { type: 'hook', generator: (scene) => builder.generateHookPrompt(scene) },
    { type: 'intro', generator: (scene) => builder.generateIntroPrompt(scene) },
    { type: 'body', generator: (scene) => builder.generateBodyPrompt(scene) },
    { type: 'application', generator: (scene) => builder.generateApplicationPrompt(scene) },
    { type: 'cta', generator: (scene) => builder.generateCTAPrompt(scene) }
  ];

  script.scenes.forEach((scene, index) => {
    console.log(`🎬 Escena ${scene.id}: ${scene.type.toUpperCase()}`);
    console.log(`   📝 visualDescription: "${scene.visualDescription}"`);

    const generator = promptGenerators.find(g => g.type === scene.type);
    const prompt = generator ? generator.generator(scene) : builder.generateHookPrompt(scene);

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

    console.log(`   ✅ Prompt CINEMATOGRÁFICO generado (${prompt.length} caracteres)`);
  });

  const outputFilename = `visual-design-PRO-${script.metadata.verse.replace(/[:\s]/g, '-')}-${Date.now()}.json`;
  const outputPath = path.join(IMAGES_PROMPTS_DIR, outputFilename);

  fs.writeFileSync(outputPath, JSON.stringify(visualDesign, null, 2));

  console.log(`\n✅ Diseño visual CINEMATOGRÁFICO guardado: ${outputFilename}`);
  console.log(`📁 Ruta: ${outputPath}`);

  console.log(`\n🎬 Estilo Cinematográfico:`);
  console.log(`   Film Stock: ${visualDesign.cinematicStyle.filmStock}`);
  console.log(`   Color Grade: ${visualDesign.cinematicStyle.colorGrade}`);
  console.log(`   Style Ref: ${visualDesign.cinematicStyle.styleReference}`);

  console.log(`\n🎯 Prompts Generados:`);
  visualDesign.scenes.forEach(scene => {
    console.log(`\n   Escena ${scene.id} (${scene.type}):`);
    console.log(`   ${scene.prompt.substring(0, 150)}...`);
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

    console.log(`\n🎉 Diseño visual CINEMATOGRÁFICO completado!`);
    console.log(`\n📋 Siguiente paso: Generar las 5 imágenes con Magnific usando estos prompts PRO`);

    process.exit(0);

  } catch (error) {
    console.error('\n❌ Error en Agente 2 PRO:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

module.exports = { processScript, CinematicPromptBuilder };
