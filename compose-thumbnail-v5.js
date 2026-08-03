#!/usr/bin/env node
/**
 * 🎨 THUMBNAIL COMPOSER V5 - TEXTO BOLD + IMAGEN LIMPIA
 *
 * Cambios críticos vs V4:
 * ❌ SIN fondos difuminados - imagen limpia y clara
 * ✅ Texto ULTRA bold con bordes gruesos negros
 * ✅ Colores brillantes para máximo contraste
 * ✅ Tamaños grandes para legibilidad en móvil
 * ✅ Imagen y texto AMBOS protagonistas
 *
 * Lección: NO tapar la imagen con fondos - solo texto puro con bordes
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuración de fuentes
const FONTS = {
  primary: 'Impact',
  fallback1: 'Anton-Regular',
  fallback2: 'DejaVu-Sans-Bold'
};

// Colores brillantes para máximo contraste
const COLORS = {
  yellow: '#FFED00',    // Amarillo brillante
  white: '#FFFFFF',     // Blanco puro
  red: '#FF0000',       // Rojo brillante
  black: '#000000',     // Negro para bordes
  gold: '#FFD700'       // Dorado alternativo
};

// Layouts V5 - SIN fondos, solo texto puro
const LAYOUTS = {
  sabiduria: {
    // "PROVERBIOS 3:5-6" - arriba izquierda
    ref: {
      size: 110,
      y: 40,
      color: COLORS.yellow,
      stroke: 16
    },
    // "CONFÍA EN DIOS" - centro izquierda
    main: {
      size: 190,
      y: -30,
      lines: 2,
      color: COLORS.white,
      stroke: 18
    },
    // "SIEMPRE" - abajo izquierda, rojo brillante
    emphasis: {
      size: 230,
      y: 230,
      color: COLORS.red,
      stroke: 20
    }
  },
  fortaleza: {
    ref: { size: 110, y: 40, color: COLORS.yellow, stroke: 16 },
    main: { size: 200, y: -25, lines: 2, color: COLORS.white, stroke: 18 },
    emphasis: { size: 240, y: 240, color: COLORS.red, stroke: 20 }
  },
  esperanza: {
    ref: { size: 110, y: 40, color: COLORS.yellow, stroke: 16 },
    main: { size: 185, y: -35, lines: 2, color: COLORS.white, stroke: 18 },
    emphasis: { size: 225, y: 225, color: COLORS.gold, stroke: 20 }
  },
  amor: {
    ref: { size: 110, y: 40, color: COLORS.yellow, stroke: 16 },
    main: { size: 195, y: -28, lines: 2, color: COLORS.white, stroke: 18 },
    emphasis: { size: 235, y: 235, color: COLORS.red, stroke: 20 }
  },
  consuelo: {
    ref: { size: 110, y: 40, color: COLORS.yellow, stroke: 16 },
    main: { size: 188, y: -32, lines: 2, color: COLORS.white, stroke: 18 },
    emphasis: { size: 228, y: 228, color: '#9C27B0', stroke: 20 }
  },
  fe: {
    ref: { size: 110, y: 40, color: COLORS.yellow, stroke: 16 },
    main: { size: 192, y: -30, lines: 2, color: COLORS.white, stroke: 18 },
    emphasis: { size: 232, y: 232, color: '#2196F3', stroke: 20 }
  }
};

/**
 * Construir comando ImageMagick V5
 * SOLO TEXTO - Sin fondos ni difuminados
 */
function buildImageMagickCommand(baseImage, verse, parts, layout, font, output) {
  const refText = verse.replace(' ', '\n').toUpperCase();
  const mainText = parts.line2 ? `${parts.line1}\n${parts.line2}` : parts.line1;

  // COMANDO SIMPLE: imagen base + 3 capas de texto (sin fondos)
  return `convert "${baseImage}" \\
    -font ${font} \\
    -pointsize ${layout.ref.size} \\
    -fill "${layout.ref.color}" \\
    -stroke "${COLORS.black}" \\
    -strokewidth ${layout.ref.stroke} \\
    -gravity NorthWest \\
    -annotate +40+${layout.ref.y} "${refText}" \\
    \\
    -pointsize ${layout.main.size} \\
    -fill "${layout.main.color}" \\
    -strokewidth ${layout.main.stroke} \\
    -gravity West \\
    -annotate +40+${layout.main.y} "${mainText}" \\
    \\
    -pointsize ${layout.emphasis.size} \\
    -fill "${layout.emphasis.color}" \\
    -strokewidth ${layout.emphasis.stroke} \\
    -annotate +40+${layout.emphasis.y} "${parts.emphasis.toUpperCase()}" \\
    \\
    -quality 95 \\
    "${output}"`;
}

/**
 * Detectar fuente disponible
 */
function detectAvailableFont() {
  const fonts = [FONTS.primary, FONTS.fallback1, FONTS.fallback2];

  for (const font of fonts) {
    try {
      execSync(`convert -list font | grep -i "${font}"`, { stdio: 'pipe' });
      console.log(`✅ Fuente detectada: ${font}`);
      return font;
    } catch (e) {
      // Fuente no disponible, probar siguiente
    }
  }

  throw new Error('❌ Ninguna fuente compatible encontrada');
}

/**
 * Extraer partes del texto
 */
function extractTextParts(text) {
  // Buscar palabras en mayúsculas al final (énfasis)
  const emphasisMatch = text.match(/\b([A-ZÁÉÍÓÚ]+)\s*$/);
  const emphasis = emphasisMatch ? emphasisMatch[1] : '';

  // Texto sin énfasis
  const mainText = emphasis ? text.replace(emphasis, '').trim() : text;

  // Dividir en 2 líneas si es necesario
  const words = mainText.split(' ');
  const midPoint = Math.ceil(words.length / 2);

  return {
    line1: words.slice(0, midPoint).join(' '),
    line2: words.length > midPoint ? words.slice(midPoint).join(' ') : null,
    emphasis: emphasis
  };
}

/**
 * Componer thumbnail V5
 */
async function composeThumbnail(baseImagePath, verse, text, category, outputPath) {
  console.log('\n🎨 COMPOSITOR V5 - IMAGEN LIMPIA + TEXTO BOLD');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  // Validar inputs
  if (!fs.existsSync(baseImagePath)) {
    throw new Error(`Imagen base no encontrada: ${baseImagePath}`);
  }

  if (!LAYOUTS[category]) {
    throw new Error(`Categoría desconocida: ${category}`);
  }

  // Detectar fuente
  const font = detectAvailableFont();

  // Extraer partes del texto
  const parts = extractTextParts(text);
  const layout = LAYOUTS[category];

  console.log(`\n📐 Layout: ${category}`);
  console.log(`   Referencia: "${verse}" (${layout.ref.size}pt, ${layout.ref.color})`);
  console.log(`   Principal: "${parts.line1}${parts.line2 ? ' / ' + parts.line2 : ''}" (${layout.main.size}pt, ${layout.main.color})`);
  console.log(`   Énfasis: "${parts.emphasis}" (${layout.emphasis.size}pt, ${layout.emphasis.color})`);
  console.log(`   🖼️  SIN fondos - imagen limpia y clara\n`);

  // Construir comando
  const cmd = buildImageMagickCommand(baseImagePath, verse, parts, layout, font, outputPath);

  // Ejecutar
  try {
    execSync(cmd, { stdio: 'pipe' });

    const size = (fs.statSync(outputPath).size / 1024).toFixed(0);
    console.log(`✅ Thumbnail V5 generado exitosamente`);
    console.log(`   Archivo: ${path.basename(outputPath)}`);
    console.log(`   Tamaño: ${size}KB\n`);

    return { success: true, path: outputPath, size };
  } catch (error) {
    throw new Error(`Error ejecutando ImageMagick: ${error.message}`);
  }
}

// CLI
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length < 5) {
    console.error('\n❌ Uso: node compose-thumbnail-v5.js <base-image> <verse> <text> <category> <output>');
    console.error('\nEjemplo:');
    console.error('  node compose-thumbnail-v5.js base.png "Proverbios 3:5-6" "Confía en Dios SIEMPRE" sabiduria output.jpg\n');
    process.exit(1);
  }

  const [baseImage, verse, text, category, output] = args;

  composeThumbnail(baseImage, verse, text, category, output)
    .then(() => process.exit(0))
    .catch(err => {
      console.error('\n❌ Error:', err.message);
      process.exit(1);
    });
}

module.exports = { composeThumbnail };
