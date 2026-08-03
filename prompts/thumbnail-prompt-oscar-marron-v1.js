#!/usr/bin/env node

/**
 * 🎯 THUMBNAIL PROMPT GENERATOR V2
 *
 * Basado en "7 Prompts Maestros para Miniaturas de YouTube" - Oscar Marrón
 * YouTube Certified Expert
 *
 * APLICACIÓN AL CONTENIDO BÍBLICO:
 * - ✅ PROMPT #7: Interpretación Indirecta (PRINCIPAL)
 * - ✅ PROMPT #5: Transformación Explosiva (SECUNDARIO)
 *
 * PSICOLOGÍA DE CTR:
 * - Captura EMOCIÓN, no literalidad
 * - Iluminación cinematográfica que cuenta historia
 * - Expresión facial de asombro/transformación BRUTAL
 * - Misterio y curiosidad INSANA
 * - Rompe estética monótona del nicho religioso
 */

const fs = require('fs');
const path = require('path');

// Categorías optimizadas según Oscar Marrón
const CATEGORY_PROMPTS = {
  esperanza: {
    // PROMPT #7: Interpretación Indirecta
    emotion: 'discovering divine hope for the first time',
    facialExpression: 'expression of BRUTAL astonishment and overwhelming hope, eyes wide with wonder, mouth slightly open in awe',
    lighting: 'DRAMATIC golden divine light breaking through darkness, intense sunburst rays creating heavenly atmosphere, cinematic god-rays illuminating face',
    mysterySoul: 'What divine promise is transforming this person? Viewer MUST click to discover.',

    // PROMPT #5: Transformación Explosiva
    transformation: 'visual representation of hopelessness transforming into overwhelming hope',
    epicElements: 'golden light explosion, divine rays piercing through dark clouds, ethereal glow surrounding person',
    colorPalette: 'Deep darkness (#1a1a2e) transforming to brilliant gold (#FFD700), cyan highlights (#4ECDC4)',

    // Composición CTR
    composition: 'Person on LEFT 35% looking toward divine light source on RIGHT, RIGHT side completely clean for bold text overlay',
    mood: 'EPIC spiritual breakthrough moment, not calm meditation',

    // Anti-patrones (lo que NO hacer)
    avoid: 'NO stock photo aesthetic, NO peaceful meditation, NO literal Bible imagery, NO generic church setting'
  },

  fortaleza: {
    emotion: 'discovering unstoppable divine strength',
    facialExpression: 'expression of FIERCE determination mixed with divine confidence, intense gaze, jaw set with resolve',
    lighting: 'POWERFUL rim lighting from side, dramatic blue and orange split tones, warrior-like atmosphere with divine backing',
    mysterySoul: 'What divine power is this person accessing? Insane curiosity trigger.',

    transformation: 'weakness obliterated by divine strength',
    epicElements: 'intense blue light with orange rim light, powerful stance, divine armor of light concept',
    colorPalette: 'Navy blue (#2C3E50) with intense orange (#FF6B35) highlights',

    composition: 'Person on RIGHT 35% with confident pose, LEFT side clean for text, strong diagonal lines',
    mood: 'EPIC empowerment moment, spiritual warrior awakening',

    avoid: 'NO bodybuilder imagery, NO literal armor, NO aggressive face, NO gym aesthetic'
  },

  consuelo: {
    emotion: 'discovering divine peace that surpasses understanding',
    facialExpression: 'expression of PROFOUND relief and supernatural peace washing over, tears of joy possible, gentle smile of overwhelming comfort',
    lighting: 'SOFT divine glow enveloping person, warm golden hour light creating sanctuary atmosphere, ethereal wraparound lighting',
    mysterySoul: 'What divine comfort brought such overwhelming peace? Must discover.',

    transformation: 'anguish dissolving into supernatural peace',
    epicElements: 'soft golden divine embrace, gentle rays of comfort, warm ethereal glow',
    colorPalette: 'Warm gold (#FFD700) with soft white (#FFFFFF) highlights, dark blue background (#1B2845)',

    composition: 'Person CENTERED looking upward toward light, sides clean for text overlay',
    mood: 'TRANSFORMATIVE peace arrival, divine comfort breakthrough',

    avoid: 'NO sleeping/resting imagery, NO literal crying, NO mourning aesthetic, NO funeral tones'
  },

  amor: {
    emotion: 'overwhelmed by unconditional divine love revelation',
    facialExpression: 'expression of being OVERWHELMED by love, eyes glistening with emotion, genuine vulnerable joy',
    lighting: 'WARM embracing light, soft pink and golden tones, loving glow surrounding person',
    mysterySoul: 'What divine love truth created this transformation? Viewer compelled to know.',

    transformation: 'feeling unloved to experiencing infinite divine love',
    epicElements: 'warm pink-gold light rays, gentle loving glow, heart-area light emphasis',
    colorPalette: 'Rose gold (#B76E79) with warm pink (#FF6B9D) and golden (#FFD700) highlights',

    composition: 'Person on LEFT looking toward light with open posture, RIGHT clean for text',
    mood: 'BREAKTHROUGH love revelation, divine embrace moment',

    avoid: 'NO romantic couple imagery, NO literal hearts, NO Valentine aesthetic, NO pink overload'
  },

  sabiduria: {
    emotion: 'revelation of profound divine wisdom',
    facialExpression: 'expression of MIND-BLOWN realization, intellectual ecstasy, "aha!" moment captured',
    lighting: 'FOCUSED divine light illuminating mind/head area, purple-gold wisdom tones, enlightenment beam',
    mysterySoul: 'What divine truth just revolutionized their understanding? Insatiable curiosity.',

    transformation: 'confusion shattered by divine clarity',
    epicElements: 'purple-gold light focusing on head, enlightenment rays, wisdom illumination',
    colorPalette: 'Deep purple (#9C27B0) with gold (#FFD700) highlights, dark background',

    composition: 'Person on RIGHT in thoughtful amazement, LEFT clean for text',
    mood: 'EUREKA divine wisdom moment, spiritual enlightenment breakthrough',

    avoid: 'NO library/book imagery, NO professor aesthetic, NO academic setting, NO glasses emphasis'
  },

  fe: {
    emotion: 'experiencing tangible divine presence',
    facialExpression: 'expression of AWE encountering the divine, reverential wonder, overwhelming spiritual experience',
    lighting: 'INTENSE divine light from above, spiritual atmosphere, otherworldly glow, presence of God lighting',
    mysterySoul: 'What divine encounter is happening? Viewer MUST witness this.',

    transformation: 'doubt evaporated by divine manifestation',
    epicElements: 'intense top-down divine light, spiritual mist/atmosphere, supernatural presence indicators',
    colorPalette: 'Teal (#4ECDC4) with bright white divine light (#FFFFFF), dark atmospheric background',

    composition: 'Person CENTERED with hands raised or in worship posture, top emphasis for divine light, sides clean for text',
    mood: 'SUPERNATURAL encounter moment, tangible divine presence',

    avoid: 'NO church building, NO literal angels, NO religious symbols, NO stained glass aesthetic'
  }
};

/**
 * Genera prompt optimizado para Magnific según Oscar Marrón
 */
function generateOptimizedPrompt(verse, category, seoTitle) {
  const template = CATEGORY_PROMPTS[category] || CATEGORY_PROMPTS.esperanza;

  // ARQUITECTURA DEL PROMPT (Orden psicológico óptimo)

  const prompt = `YouTube thumbnail base image - EMOTIONAL BREAKTHROUGH MOMENT
(Applying Oscar Marrón's Prompt #7: Indirect Interpretation + Prompt #5: Explosive Transformation)

🎯 CORE EMOTION TO CAPTURE:
A Hispanic person in their 40s ${template.emotion}, ${template.facialExpression}.

This is NOT a calm moment - this is an EPIC ${category} BREAKTHROUGH.
Capture the FEELING of discovering a life-changing divine truth, not the literal concept.

💡 LIGHTING STRATEGY (Tells the story):
${template.lighting}

The lighting MUST convey transformation: darkness → divine revelation.
Cinematic quality, NOT stock photo flat lighting.

🎬 COMPOSITION FOR MAXIMUM CTR:
${template.composition}

ONE focal point only: THE FACE and its emotional transformation.
Professional YouTube thumbnail 2025 aesthetic.
16:9 aspect ratio (1920x1080).
High contrast optimized for mobile viewing.

🎨 COLOR PSYCHOLOGY:
${template.colorPalette}
Background: Simple gradient that enhances face (NOT competes with it).
Subject must be 40% BRIGHTER than background for instant visual hierarchy.

✨ TRANSFORMATION ELEMENTS:
${template.transformation}
${template.epicElements}

🔮 MYSTERY & CURIOSITY (CTR Trigger):
${template.mysterySoul}

The viewer should think: "What happened to this person? I NEED to know."

📸 STYLE DIRECTION:
- Cinematic biblical photography (NOT generic stock photo)
- Authentic raw emotion (NOT posed model)
- Spiritual breakthrough aesthetic (${category} theme)
- Professional quality that breaks monotonous niche patterns
- Designed to stop the scroll INSTANTLY

❌ CRITICAL AVOIDS:
${template.avoid}

🚫 TECHNICAL REQUIREMENTS:
- NO TEXT anywhere in image (clean overlay space required)
- NO AI-generated letters or words
- NO cluttered elements competing for attention
- SIMPLE clean background that elevates the subject

📊 QUALITY BENCHMARK:
This must look like a PREMIUM spiritual content thumbnail that:
- Triggers INSANE curiosity
- Promises life-changing ${category}
- Breaks pattern in YouTube feed
- Makes viewer think "I can't NOT click this"

Generate photorealistic cinematic image capturing THIS specific emotional breakthrough moment.`;

  return prompt;
}

/**
 * Genera informe detallado del prompt para debugging
 */
function generatePromptReport(verse, category, seoTitle) {
  const template = CATEGORY_PROMPTS[category] || CATEGORY_PROMPTS.esperanza;

  return {
    verse,
    category,
    seoTitle,
    oscarMarronStrategy: {
      primaryPrompt: 'PROMPT #7: Interpretación Indirecta',
      secondaryPrompt: 'PROMPT #5: Transformación Explosiva',
      ctrPsychology: template.mysterySoul,
      emotionTarget: template.emotion,
      moodLevel: template.mood
    },
    visualStrategy: {
      lightingType: template.lighting.substring(0, 100) + '...',
      colorScheme: template.colorPalette,
      composition: template.composition,
      facialExpression: template.facialExpression.substring(0, 100) + '...'
    },
    antiPatterns: template.avoid
  };
}

// CLI
if (require.main === module) {
  const verse = process.argv[2] || 'Salmos 23:1';
  const category = process.argv[3] || 'esperanza';
  const seoTitle = process.argv[4] || `${verse} | Promesa de Esperanza`;

  const prompt = generateOptimizedPrompt(verse, category, seoTitle);
  const report = generatePromptReport(verse, category, seoTitle);

  console.log('\n🎯 THUMBNAIL PROMPT GENERATOR V2 (Oscar Marrón)\n');
  console.log('━'.repeat(80) + '\n');

  console.log('📊 ESTRATEGIA:\n');
  console.log(JSON.stringify(report, null, 2));

  console.log('\n\n🤖 PROMPT COMPLETO:\n');
  console.log('━'.repeat(80));
  console.log(prompt);
  console.log('━'.repeat(80) + '\n');

  // Guardar en archivo
  const outputDir = path.join(__dirname, '..', 'output', 'thumbnail-prompts');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const verseSlug = verse.replace(/\s+/g, '-').replace(/:/g, '-');
  const promptPath = path.join(outputDir, `prompt-oscar-marron-${verseSlug}.txt`);
  const reportPath = path.join(outputDir, `report-oscar-marron-${verseSlug}.json`);

  fs.writeFileSync(promptPath, prompt);
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  console.log(`✅ Prompt guardado: ${promptPath}`);
  console.log(`✅ Reporte guardado: ${reportPath}\n`);
}

module.exports = {
  generateOptimizedPrompt,
  generatePromptReport,
  CATEGORY_PROMPTS
};
