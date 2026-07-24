#!/usr/bin/env node

/**
 * ═══════════════════════════════════════════════════════════════════
 * 📚 TEMPLATE SELECTOR - Selector de Intro/Outro por Categoría
 * ═══════════════════════════════════════════════════════════════════
 *
 * Selecciona los templates de intro y outro correctos según la
 * categoría del versículo (fortaleza, consuelo, salvación).
 *
 * USO EN N8N:
 * n8n llama a este script con la categoría del versículo y obtiene
 * las rutas a los videos de intro y outro pre-generados.
 *
 * INPUTS:
 * - category: fortaleza | consuelo | salvación
 *
 * OUTPUTS:
 * - intro: path al video de intro (5s)
 * - outro: path al video de outro (15s)
 * - metadata: información adicional
 *
 * ═══════════════════════════════════════════════════════════════════
 */

const fs = require('fs');
const path = require('path');

// ═══════════════════════════════════════════════════════════════════
// 📁 PATHS
// ═══════════════════════════════════════════════════════════════════

const INTRO_DIR = path.join(__dirname, '../output/intro-videos');
const OUTRO_DIR = path.join(__dirname, '../output/outro-videos');
const TEMPLATES_DIR = path.join(__dirname, '../output/templates');

// ═══════════════════════════════════════════════════════════════════
// 🎨 TEMPLATES MAPPING
// ═══════════════════════════════════════════════════════════════════

const TEMPLATES = {
  fortaleza: {
    category: 'fortaleza',
    theme: 'Fuerza y Valentía',
    intro: {
      file: 'intro-Fortaleza.mp4',
      duration: 5,
      description: 'Guerrero épico emergiendo de mist y llamas, neon backlight, Mad Max intensity'
    },
    outro: {
      file: 'outro-Fortaleza.mp4',
      duration: 15,
      description: 'Silhouette en mountain peak, golden hour, peaceful victorious ending'
    },
    colorScheme: {
      primary: '#FA8029',  // Orange
      secondary: '#FF6B35', // Deep orange
      accent: '#FDB750'     // Golden
    }
  },

  consuelo: {
    category: 'consuelo',
    theme: 'Paz y Consuelo',
    intro: {
      file: 'intro-Consuelo.mp4',
      duration: 5,
      description: 'Gentle silhouette con luz suave, lluvia gentil, peaceful atmosphere'
    },
    outro: {
      file: 'outro-Consuelo.mp4',
      duration: 15,
      description: 'Person en gentle rain, sunset, comforting peaceful ending'
    },
    colorScheme: {
      primary: '#6B9BD1',  // Soft blue
      secondary: '#A39EC7', // Gentle purple
      accent: '#F4B860'     // Warm amber
    }
  },

  salvación: {
    category: 'salvación',
    theme: 'Salvación y Redención',
    intro: {
      file: 'intro-Salvación.mp4',
      duration: 5,
      description: 'Silhouette alcanzando luz divina rompiendo tormenta, transformational'
    },
    outro: {
      file: 'outro-Salvación.mp4',
      duration: 15,
      description: 'Person caminando hacia gateway de luz radiante, salvation triumph'
    },
    colorScheme: {
      primary: '#4A90E2',  // Divine blue
      secondary: '#FFD700', // Sacred gold
      accent: '#FFFFFF'     // Pure white
    }
  }
};

// Alias para aceptar variaciones de nombres
const CATEGORY_ALIASES = {
  'fortaleza': 'fortaleza',
  'fuerza': 'fortaleza',
  'valentía': 'fortaleza',
  'valor': 'fortaleza',

  'consuelo': 'consuelo',
  'paz': 'consuelo',
  'esperanza': 'consuelo',
  'comfort': 'consuelo',

  'salvación': 'salvación',
  'salvacion': 'salvación',
  'redención': 'salvación',
  'redencion': 'salvación'
};

// ═══════════════════════════════════════════════════════════════════
// 🔍 SELECCIÓN DE TEMPLATE
// ═══════════════════════════════════════════════════════════════════

function selectTemplate(category) {
  // Normalizar categoría
  const normalizedCategory = (category || 'fortaleza').toLowerCase().trim();

  // Resolver alias
  const resolvedCategory = CATEGORY_ALIASES[normalizedCategory] || 'fortaleza';

  // Obtener template
  const template = TEMPLATES[resolvedCategory];

  if (!template) {
    console.warn(`⚠️  Categoría no reconocida: ${category}, usando fortaleza por defecto`);
    return TEMPLATES.fortaleza;
  }

  return template;
}

// ═══════════════════════════════════════════════════════════════════
// 📍 OBTENER PATHS DE TEMPLATES
// ═══════════════════════════════════════════════════════════════════

function getTemplatePaths(category) {
  const template = selectTemplate(category);

  const introPath = path.join(INTRO_DIR, template.intro.file);
  const outroPath = path.join(OUTRO_DIR, template.outro.file);

  // Verificar que existen
  const introExists = fs.existsSync(introPath);
  const outroExists = fs.existsSync(outroPath);

  if (!introExists || !outroExists) {
    throw new Error(
      `Templates no encontrados para categoría "${category}":\n` +
      `  Intro: ${introPath} ${introExists ? '✅' : '❌'}\n` +
      `  Outro: ${outroPath} ${outroExists ? '✅' : '❌'}\n` +
      `Ejecuta primero la generación de templates.`
    );
  }

  return {
    category: template.category,
    theme: template.theme,
    intro: {
      path: introPath,
      duration: template.intro.duration,
      description: template.intro.description,
      size: fs.statSync(introPath).size
    },
    outro: {
      path: outroPath,
      duration: template.outro.duration,
      description: template.outro.description,
      size: fs.statSync(outroPath).size
    },
    colorScheme: template.colorScheme
  };
}

// ═══════════════════════════════════════════════════════════════════
// 🚀 FUNCIÓN PRINCIPAL
// ═══════════════════════════════════════════════════════════════════

function main() {
  const category = process.argv[2];

  if (!category) {
    console.error('\n❌ Uso: node template-selector.js <categoría>\n');
    console.error('Categorías válidas:');
    console.error('  - fortaleza (fuerza, valentía, valor)');
    console.error('  - consuelo (paz, esperanza)');
    console.error('  - salvación (redención)\n');
    process.exit(1);
  }

  try {
    const templates = getTemplatePaths(category);

    console.log('\n════════════════════════════════════════════════════════════════');
    console.log('📚 TEMPLATE SELECTOR');
    console.log('════════════════════════════════════════════════════════════════\n');

    console.log(`🎨 Categoría: ${templates.category} (${templates.theme})`);
    console.log(`\n📹 INTRO (${templates.intro.duration}s):`);
    console.log(`   ${templates.intro.description}`);
    console.log(`   📁 ${templates.intro.path}`);
    console.log(`   📊 ${(templates.intro.size / 1024 / 1024).toFixed(2)} MB`);

    console.log(`\n📹 OUTRO (${templates.outro.duration}s):`);
    console.log(`   ${templates.outro.description}`);
    console.log(`   📁 ${templates.outro.path}`);
    console.log(`   📊 ${(templates.outro.size / 1024 / 1024).toFixed(2)} MB`);

    console.log(`\n🎨 Color Scheme:`);
    console.log(`   Primary: ${templates.colorScheme.primary}`);
    console.log(`   Secondary: ${templates.colorScheme.secondary}`);
    console.log(`   Accent: ${templates.colorScheme.accent}`);

    console.log('\n════════════════════════════════════════════════════════════════\n');

    // Output JSON para n8n
    console.log(JSON.stringify(templates, null, 2));

    return templates;

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

// ═══════════════════════════════════════════════════════════════════
// 🎯 EJECUCIÓN
// ═══════════════════════════════════════════════════════════════════

if (require.main === module) {
  main();
}

module.exports = { selectTemplate, getTemplatePaths, TEMPLATES };
