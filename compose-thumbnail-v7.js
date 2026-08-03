#!/usr/bin/env node
/**
 * 🎨 THUMBNAIL COMPOSER V7 - INTERLINEADO CORRECTO
 *
 * Cambios críticos vs V6:
 * ✅ INTERLINEADO adecuado entre líneas (no se montan)
 * ✅ Cada línea de texto separada individualmente
 * ✅ Espaciado calculado según tamaño de fuente
 * ✅ Texto tratado como bloque coherente
 *
 * Basado en feedback: "el texto esta montado uno sobre otro no es legible"
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

// Layouts V7 - Con interlineado calculado
const LAYOUTS = {
  sabiduria: {
    // "PROVERBIOS" + "3:5-6" (dos líneas separadas)
    ref: {
      size: 110,
      y: 40,
      lineSpacing: 115,  // ← Espacio entre líneas de referencia
      color: COLORS.yellow,
      stroke: 7
    },
    // "CONFÍA EN" + "DIOS" (dos líneas separadas)
    main: {
      size: 190,
      y: 250,            // ← Posición vertical del bloque
      lineSpacing: 200,  // ← Espacio entre líneas principales
      color: COLORS.white,
      stroke: 9
    },
    // "SIEMPRE" (una línea)
    emphasis: {
      size: 230,
      y: 580,            // ← Posición después del main
      color: COLORS.red,
      stroke: 10
    }
  },
  fortaleza: {
    ref: { size: 110, y: 40, lineSpacing: 115, color: COLORS.yellow, stroke: 7 },
    main: { size: 200, y: 250, lineSpacing: 210, color: COLORS.white, stroke: 9 },
    emphasis: { size: 240, y: 590, color: COLORS.red, stroke: 10 }
  },
  esperanza: {
    ref: { size: 110, y: 40, lineSpacing: 115, color: COLORS.yellow, stroke: 7 },
    main: { size: 185, y: 240, lineSpacing: 195, color: COLORS.white, stroke: 9 },
    emphasis: { size: 225, y: 570, color: COLORS.gold, stroke: 10 }
  },
  amor: {
    ref: { size: 110, y: 40, lineSpacing: 115, color: COLORS.yellow, stroke: 7 },
    main: { size: 195, y: 245, lineSpacing: 205, color: COLORS.white, stroke: 9 },
    emphasis: { size: 235, y: 585, color: COLORS.red, stroke: 10 }
  },
  consuelo: {
    ref: { size: 110, y: 40, lineSpacing: 115, color: COLORS.yellow, stroke: 7 },
    main: { size: 188, y: 242, lineSpacing: 198, color: COLORS.white, stroke: 9 },
    emphasis: { size: 228, y: 575, color: '#9C27B0', stroke: 10 }
  },
  fe: {
    ref: { size: 110, y: 40, lineSpacing: 115, color: COLORS.yellow, stroke: 7 },
    main: { size: 192, y: 244, lineSpacing: 202, color: COLORS.white, stroke: 9 },
    emphasis: { size: 232, y: 580, color: '#2196F3', stroke: 10 }
  }
};

/**
 * Construir comando ImageMagick V7
 * Cada línea separada con interlineado correcto
 */
function buildImageMagickCommand(baseImage, verse, parts, layout, font, output) {
  // Separar versículo en dos líneas: "PROVERBIOS" y "3:5-6"
  const verseParts = verse.split(' ');
  const refLine1 = verseParts[0].toUpperCase();          // "PROVERBIOS"
  const refLine2 = verseParts.slice(1).join(' ').toUpperCase(); // "3:5-6"

  let cmd = `convert "${baseImage}" -font ${font}`;

  // PASO 1: Referencia línea 1 "PROVERBIOS"
  cmd += ` \\
    -pointsize ${layout.ref.size} \\
    -fill "${layout.ref.color}" \\
    -stroke "${COLORS.black}" \\
    -strokewidth ${layout.ref.stroke} \\
    -gravity NorthWest \\
    -annotate +40+${layout.ref.y} "${refLine1}"`;

  // PASO 2: Referencia línea 2 "3:5-6"
  const refY2 = layout.ref.y + layout.ref.lineSpacing;
  cmd += ` \\
    -annotate +40+${refY2} "${refLine2}"`;

  // PASO 3: Texto principal línea 1
  cmd += ` \\
    -pointsize ${layout.main.size} \\
    -fill "${layout.main.color}" \\
    -strokewidth ${layout.main.stroke} \\
    -gravity NorthWest \\
    -annotate +40+${layout.main.y} "${parts.line1.toUpperCase()}"`;

  // PASO 4: Texto principal línea 2 (si existe)
  if (parts.line2) {
    const mainY2 = layout.main.y + layout.main.lineSpacing;
    cmd += ` \\
    -annotate +40+${mainY2} "${parts.line2.toUpperCase()}"`;
  }

  // PASO 5: Énfasis
  cmd += ` \\
    -pointsize ${layout.emphasis.size} \\
    -fill "${layout.emphasis.color}" \\
    -strokewidth ${layout.emphasis.stroke} \\
    -annotate +40+${layout.emphasis.y} "${parts.emphasis.toUpperCase()}"`;

  // PASO 6: Exportar
  cmd += ` \\
    -quality 95 \\
    "${output}"`;

  return cmd;
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
 * Componer thumbnail V7
 */
async function composeThumbnail(baseImagePath, verse, text, category, outputPath) {
  console.log('\n🎨 COMPOSITOR V7 - INTERLINEADO CORRECTO');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

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
  console.log(`   Referencia: "${verse}" (${layout.ref.size}pt, spacing ${layout.ref.lineSpacing}px)`);
  console.log(`   Principal: "${parts.line1}${parts.line2 ? ' / ' + parts.line2 : ''}" (${layout.main.size}pt, spacing ${layout.main.lineSpacing}px)`);
  console.log(`   Énfasis: "${parts.emphasis}" (${layout.emphasis.size}pt)`);
  console.log(`   ✅ Cada línea separada con interlineado adecuado\n`);

  // Construir comando
  const cmd = buildImageMagickCommand(baseImagePath, verse, parts, layout, font, outputPath);

  // Ejecutar
  try {
    execSync(cmd, { stdio: 'pipe' });

    const size = (fs.statSync(outputPath).size / 1024).toFixed(0);
    console.log(`✅ Thumbnail V7 generado exitosamente`);
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
    console.error('\n❌ Uso: node compose-thumbnail-v7.js <base-image> <verse> <text> <category> <output>');
    console.error('\nEjemplo:');
    console.error('  node compose-thumbnail-v7.js base.png "Proverbios 3:5-6" "Confía en Dios SIEMPRE" sabiduria output.jpg\n');
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
