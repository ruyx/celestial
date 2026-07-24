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
   * 1. Subject: El cielo y elementos celestiales
   * 2. Action: Nubes partiendo, luz penetrando
   * 3. Setting: Atmosfera celestial con profundidad
   * 4. Lighting: GOD RAYS, volumétrica
   * 5. Style: Film stock + referencias
   */
  generateHookPrompt() {
    const subjects = {
      'consuelo': 'Vast heavenly sky with soft clouds gently parting',
      'fortaleza': 'Massive storm clouds swirling with raw power, lightning illuminating edges',
      'salvación': 'Brilliant white clouds breaking open to reveal pure light',
      'propósito': 'Golden sunrise clouds forming natural gateway',
      'esperanza': 'Dawn sky with first light breaking through darkness',
      'guía': 'Star-filled cosmic sky with milky way visible',
      'descanso': 'Peaceful twilight sky with soft purple and blue tones'
    };

    const actions = {
      'consuelo': 'Divine golden sunrays breaking through softly, gentle ethereal glow spreading',
      'fortaleza': 'Powerful divine light exploding through storm, fierce penetrating beams',
      'salvación': 'Radiant heavenly light flooding down, overwhelming darkness',
      'propósito': 'Warm sunrise rays stretching across horizon, illuminating path forward',
      'esperanza': 'First light of dawn slowly conquering night, hope emerging',
      'guía': 'Mystical starlight beams descending, cosmic guidance visible',
      'descanso': 'Soft evening light settling peacefully, calm descending'
    };

    const settings = {
      'consuelo': 'Epic celestial atmosphere at golden hour, vast scale with depth and serenity, peaceful grandeur',
      'fortaleza': 'Apocalyptic biblical atmosphere at storm peak, raw power and scale, dramatic intensity',
      'salvación': 'Heavenly realm opening, infinite depth and divine presence, overwhelming beauty',
      'propósito': 'Horizon at the break of new day, endless possibilities, forward momentum',
      'esperanza': 'Dawn breaking after long night, transition from darkness to light, transformation visible',
      'guía': 'Cosmic expanse at midnight, infinite wisdom and mystery, contemplative vastness',
      'descanso': 'Twilight peace at day end, gentle closure, restful atmosphere'
    };

    const subject = subjects[this.category] || subjects['consuelo'];
    const action = actions[this.category] || actions['consuelo'];
    const setting = settings[this.category] || settings['consuelo'];

    return `${subject}, ${action}. ${setting}. LIGHTING: ${this.palette.lighting}, cinematic volumetric lighting with god rays. CAMERA: low-angle wide shot, slowly pushing in, capturing heavenly grandeur. LENS: 35mm wide angle, deep focus showing scale. Shot on ${this.palette.filmStock}, ${this.palette.colorGrade}. ${this.palette.styleRef}. Photorealistic biblical epic cinematography. Ultra detailed 8K, ray tracing. 16:9 aspect ratio.`;
  }

  /**
   * ESCENA 2: INTRO - Biblia Antigua (SIN TEXTO VISIBLE)
   */
  generateIntroPrompt() {
    return `Ancient leather-bound bible with worn edges and aged binding, pages naturally falling open showing weathered parchment — pages completely blurred in shallow focus with no visible text or typography. Resting on weathered wooden table surface with visible grain and character. LIGHTING: soft warm candlelight from single source to the left, creating Rembrandt shadows, gentle golden glow illuminating edges of pages. CAMERA: overhead close-up shot, static locked-off framing, intimate perspective. LENS: 85mm macro, extremely shallow depth of field (f/1.4), background fading to soft bokeh. Shot on ${this.palette.filmStock}, warm amber and golden tones with deep shadows, ${this.palette.colorGrade}. ${this.palette.styleRef} meets still life photography masters. Photorealistic with rich texture detail, subtle film grain visible. Mood: reverent, ancient wisdom, sacred intimacy. Ultra detailed 8K. 16:9 aspect ratio. NO TEXT VISIBLE, NO TYPOGRAPHY, pure visual aesthetic.`;
  }

  /**
   * ESCENA 3: BODY - Naturaleza Majestuosa con Simbolismo
   */
  generateBodyPrompt() {
    const subjects = {
      'consuelo': 'Peaceful shepherd silhouette with staff, standing on gentle hillside overlooking rolling green valleys',
      'fortaleza': 'Lone warrior figure in silhouette, standing triumphant on rugged mountain summit, arms slightly raised',
      'salvación': 'Solitary wooden cross on hilltop, weathered and ancient, standing against sky',
      'propósito': 'Single person walking on winding path through golden valley, moving toward distant light',
      'esperanza': 'Rainbow arcing across sky after storm, touching distant horizon',
      'guía': 'Lighthouse standing tall on rocky coast, beam of light cutting through darkness',
      'descanso': 'Peaceful garden with still reflecting pool, single tree providing shade'
    };

    const actions = {
      'consuelo': 'Shepherd gazing peacefully over flock below, posture relaxed and protective',
      'fortaleza': 'Warrior turning to face viewer, expression of victory and determination',
      'salvación': 'Cross catching divine light, appearing to glow from within',
      'propósito': 'Figure mid-stride toward horizon, purposeful movement, steady pace',
      'esperanza': 'Rainbow emerging from receding storm clouds, light conquering darkness',
      'guía': 'Lighthouse beam sweeping across turbulent sea, steady and unwavering',
      'descanso': 'Water perfectly still, reflecting clouds above, absolute tranquility'
    };

    const settings = {
      'consuelo': 'Golden hour in pastoral valley, 6:30 PM summer evening, warm breeze visible in swaying grass, distant mountains soft in haze',
      'fortaleza': 'Sunrise at mountain peak, 5:45 AM, thin air visible, storm clouds below summit, sense of conquest',
      'salvación': 'Heavenly atmosphere on sacred hill, timeless moment, clouds parting above, rays of light descending',
      'propósito': 'Morning in valley with clear path ahead, 7:00 AM, dew visible on grass, future bright',
      'esperanza': 'After-storm clearing, 4:30 PM, puddles reflecting light, air fresh and renewed',
      'guía': 'Midnight on rocky shore, stars visible above, waves crashing below, beacon steady',
      'descanso': 'Late afternoon in secret garden, 5:00 PM, golden light filtered through leaves, birdsong implied'
    };

    const camerawork = {
      'consuelo': 'slow aerial rise from medium to wide shot, revealing scale of peace',
      'fortaleza': 'wide crane rising with slow orbit, emphasizing triumph and elevation',
      'salvación': 'slow dolly in from wide to medium, focusing on cross, building emotion',
      'propósito': 'tracking shot following figure, steady forward momentum, hopeful progression',
      'esperanza': 'static locked-off shot, letting transformation happen in frame',
      'guía': 'slow orbit around lighthouse, contemplative circling, revealing all sides',
      'descanso': 'gentle crane down from sky to water level, peaceful descent to rest'
    };

    const subject = subjects[this.category] || subjects['consuelo'];
    const action = actions[this.category] || actions['consuelo'];
    const setting = settings[this.category] || settings['consuelo'];
    const camera = camerawork[this.category] || camerawork['consuelo'];

    return `${subject}, ${action}. ${setting}. LIGHTING: ${this.palette.lighting}, vast atmospheric perspective with depth, volumetric light beams visible. CAMERA: ${camera}, epic scale captured. LENS: 35mm wide angle, deep focus with foreground and background sharp. Shot on ${this.palette.filmStock}, ${this.palette.colorGrade}. ${this.palette.styleRef} meets National Geographic epic nature photography. Photorealistic with majestic scale. Ultra detailed 8K, cinematic color grading. 16:9 aspect ratio.`;
  }

  /**
   * ESCENA 4: APPLICATION - Manos en Oración (Conexión Humana)
   */
  generateApplicationPrompt() {
    const subjects = {
      'consuelo': 'Gentle hands clasped together in prayer, fingers interlaced softly, peaceful gesture',
      'fortaleza': 'Strong weathered hands clenched in determined prayer, knuckles tense, powerful posture',
      'salvación': 'Open palms reaching upward toward heaven, fingers spread wide, receiving gesture',
      'propósito': 'Steady hands holding compass or map, determination visible in grip',
      'esperanza': 'Hands releasing white dove upward, letting go gesture, faith visible',
      'guía': 'Hands gently opening ancient book, seeking gesture, reverence in touch',
      'descanso': 'Relaxed hands resting on still water surface, complete surrender, peace'
    };

    const actions = {
      'consuelo': 'Hands gently pressing together, eyes closed in peaceful surrender, breathing calm',
      'fortaleza': 'Hands gripping tightly, jaw set with determination, power in posture',
      'salvación': 'Palms turned upward receiving divine light, face tilted skyward, gratitude',
      'propósito': 'Hands steady on compass, finger pointing forward, clarity in decision',
      'esperanza': 'Hands opening to release dove, watching it fly, letting go with faith',
      'guía': 'Fingers tracing text on page, seeking wisdom, contemplative study',
      'descanso': 'Hands completely still on water, breathing slowed, total rest achieved'
    };

    const lighting = {
      'consuelo': 'soft golden rays descending from above like gentle embrace',
      'fortaleza': 'intense celestial beam from directly overhead, powerful illumination',
      'salvación': 'brilliant white radiance flooding down, overwhelming divine presence',
      'propósito': 'warm directional light from future/horizon, hopeful glow',
      'esperanza': 'soft diffused morning light, new beginning, gentle warmth',
      'guía': 'focused spotlight from above, wisdom illuminating darkness',
      'descanso': 'peaceful twilight glow, restful shadows, calming light'
    };

    const subject = subjects[this.category] || subjects['consuelo'];
    const action = actions[this.category] || actions['consuelo'];
    const lightDesc = lighting[this.category] || lighting['consuelo'];

    return `${subject}, ${action}. Background with soft bokeh of heavenly atmosphere, out of focus clouds or sky, depth implied. LIGHTING: ${lightDesc}, warm intimate shadows wrapping around fingers, Rembrandt lighting on hands creating dimension. CAMERA: close-up shot from low angle (looking up), slowly pushing in from medium to tight close-up, building intimacy. LENS: 85mm portrait lens, extremely shallow depth of field (f/1.4), background melting into bokeh. Shot on ${this.palette.filmStock}, ${this.palette.colorGrade}, warm skin tones. ${this.palette.styleRef} meets cinematic portrait photography. Photorealistic with emotional depth, visible film grain. Mood: surrender, connection, personal encounter. Ultra detailed 8K. 16:9 aspect ratio.`;
  }

  /**
   * ESCENA 5: CTA - Cruz Radiante (Gloria Final)
   */
  generateCTAPrompt() {
    const skies = {
      'consuelo': 'serene golden sunset sky with soft clouds',
      'fortaleza': 'blazing fiery sunset with dramatic storm clouds receding',
      'salvación': 'brilliant white heaven with golden rays bursting through',
      'propósito': 'vibrant sunrise with rainbow emerging',
      'esperanza': 'glorious dawn breaking with warm light flooding horizon',
      'guía': 'starlit cosmic sky with milky way visible',
      'descanso': 'peaceful purple dusk with first stars appearing'
    };

    const crossActions = {
      'consuelo': 'Cross silhouette peaceful and still, blessed presence, calm authority',
      'fortaleza': 'Cross standing triumphant, victorious over darkness, conquering',
      'salvación': 'Cross glowing with divine radiance, emanating love, redemptive power',
      'propósito': 'Cross pointing skyward, gateway to future, hopeful direction',
      'esperanza': 'Cross illuminated by new dawn, transformation complete, victory',
      'guía': 'Cross aligned with north star, cosmic guidance, eternal truth',
      'descanso': 'Cross at peace under evening sky, journey complete, rest achieved'
    };

    const sky = skies[this.category] || skies['consuelo'];
    const crossAction = crossActions[this.category] || crossActions['consuelo'];

    return `Radiant weathered wooden cross silhouette, ${crossAction}. Set against glorious ${sky}, divine light rays converging from all directions in perfect radial pattern, ethereal atmospheric glow. Epic heavenly atmosphere with maximum depth and majesty, sense of infinite scale. LIGHTING: ${this.palette.lighting}, dramatic volumetric god rays visible, rim light around cross edges, backlit perfection. CAMERA: wide low-angle shot slowly craning up, emphasizing triumph and glory, revealing full majesty. LENS: 35mm wide angle, deep focus capturing foreground cross sharp against distant sky. Shot on ${this.palette.filmStock}, ${this.palette.colorGrade}. ${this.palette.styleRef} meets biblical epic finale cinematography. Photorealistic with maximum drama and beauty. Ultra detailed 8K, ray tracing, cinematic color grading. Mood: victory, eternal glory, blessing, completion. 16:9 aspect ratio.`;
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
    { type: 'hook', generator: () => builder.generateHookPrompt() },
    { type: 'intro', generator: () => builder.generateIntroPrompt() },
    { type: 'body', generator: () => builder.generateBodyPrompt() },
    { type: 'application', generator: () => builder.generateApplicationPrompt() },
    { type: 'cta', generator: () => builder.generateCTAPrompt() }
  ];

  script.scenes.forEach((scene, index) => {
    console.log(`🎬 Escena ${scene.id}: ${scene.type.toUpperCase()}`);

    const generator = promptGenerators.find(g => g.type === scene.type);
    const prompt = generator ? generator.generator() : builder.generateHookPrompt();

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
