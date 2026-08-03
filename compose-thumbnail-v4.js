#!/usr/bin/env node
/**
 * 🎨 THUMBNAIL COMPOSER V4 - ESTILO REFERENCIA 6
 *
 * Cambios críticos vs V3:
 * ✅ Fuente: Impact (no Bebas Neue) - la preferida para YouTube
 * ✅ Colores: Amarillo brillante + Blanco + Rojo con fondos
 * ✅ Jerarquía visual mejorada (tamaños estratégicos)
 * ✅ Fondos de color para palabras de énfasis
 * ✅ Bordes ultra-gruesos para máxima legibilidad
 *
 * Basado en análisis de referencia6.jpg
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuración de fuentes (Impact primero)
const FONTS = {
  primary: 'Impact',
  fallback1: 'Anton-Regular',
  fallback2: 'DejaVu-Sans-Bold'
};

// Colores basados en referencias exitosas
const COLORS = {
  yellow: '#FFED00',    // Amarillo brillante (ref 6)
  white: '#FFFFFF',     // Blanco puro
  red: '#FF0000',       // Rojo brillante (énfasis)
  black: '#000000',     // Negro para bordes
  gold: '#FFD700'       // Dorado alternativo
};

// Layouts V4 - Basados en referencia 6
const LAYOUTS = {
  sabiduria: {
    // "PROVERBIOS" + "3:5-6"
    ref: {
      size: 120,          // Más grande que V3
      y: 50,
      color: COLORS.yellow,
      stroke: 18
    },
    // "CONFÍA EN DIOS"
    main: {
      size: 200,          // Muy grande
      y: -20,
      lines: 2,
      color: COLORS.white,
      stroke: 20
    },
    // "SIEMPRE" con fondo rojo
    emphasis: {
      size: 240,
      y: 240,
      color: COLORS.red,
      stroke: 22,
      background: true    // ← Fondo rojo difuminado
    }
  },
  fortaleza: {
    ref: { size: 120, y: 50, color: COLORS.yellow, stroke: 18 },
    main: { size: 210, y: -15, lines: 2, color: COLORS.white, stroke: 20 },
    emphasis: { size: 250, y: 250, color: COLORS.red, stroke: 22, background: true }
  },
  esperanza: {
    ref: { size: 120, y: 50, color: COLORS.yellow, stroke: 18 },
    main: { size: 195, y: -25, lines: 2, color: COLORS.white, stroke: 20 },
    emphasis: { size: 235, y: 235, color: COLORS.gold, stroke: 22, background: false }
  },
  amor: {
    ref: { size: 120, y: 50, color: COLORS.yellow, stroke: 18 },
    main: { size: 205, y: -18, lines: 2, color: COLORS.white, stroke: 20 },
    emphasis: { size: 245, y: 245, color: COLORS.red, stroke: 22, background: true }
  },
  consuelo: {
    ref: { size: 120, y: 50, color: COLORS.yellow, stroke: 18 },
    main: { size: 198, y: -22, lines: 2, color: COLORS.white, stroke: 20 },
    emphasis: { size: 238, y: 238, color: '#9C27B0', stroke: 22, background: false }
  },
  fe: {
    ref: { size: 120, y: 50, color: COLORS.yellow, stroke: 18 },
    main: { size: 202, y: -20, lines: 2, color: COLORS.white, stroke: 20 },
    emphasis: { size: 242, y: 242, color: '#2196F3', stroke: 22, background: false }
  }
};

/**
 * Construir comando ImageMagick V4
 * Añade fondos de color para palabras de énfasis
 */
function buildImageMagickCommand(baseImage, verse, parts, layout, font, output) {
  const refText = verse.replace(' ', '\n').toUpperCase();
  const mainText = parts.line2 ? `${parts.line1}\n${parts.line2}` : parts.line1;

  let cmd = `convert "${baseImage}" `;

  // PASO 1: Añadir fondo de color para énfasis (si está habilitado)
  if (layout.emphasis.background) {
    // Crear rectángulo difuminado detrás del texto de énfasis
    cmd += `\\
      -fill "${layout.emphasis.color}80" \\
      -draw "rectangle 0,${768 - 200},672,768" \\
      -blur 0x20 `;
  }

  // PASO 2: Referencia (ej: "PROVERBIOS\n3:5-6")
  cmd += `\\
    -font ${font} \\
    -pointsize ${layout.ref.size} \\
    -fill "${layout.ref.color}" \\
    -stroke "${COLORS.black}" \\
    -strokewidth ${layout.ref.stroke} \\
    -gravity NorthWest \\
    -annotate +40+${layout.ref.y} "${refText}" `;

  // PASO 3: Texto principal (ej: "CONFÍA EN\nDIOS")
  cmd += `\\
    -pointsize ${layout.main.size} \\
    -fill "${layout.main.color}" \\
    -strokewidth ${layout.main.stroke} \\
    -gravity West \\
    -annotate +40+${layout.main.y} "${mainText}" `;

  // PASO 4: Énfasis (ej: "SIEMPRE")
  cmd += `\\
    -pointsize ${layout.emphasis.size} \\
    -fill "${layout.emphasis.color}" \\
    -strokewidth ${layout.emphasis.stroke} \\
    -annotate +40+${layout.emphasis.y} "${parts.emphasis.toUpperCase()}" `;

  // PASO 5: Exportar con calidad alta
  cmd += `\\
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

  throw new Error('❌ Ninguna fuente compatible encontrada (Impact, Anton, DejaVu-Sans-Bold)');
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
 * Componer thumbnail V4
 */
async function composeThumbnail(baseImagePath, verse, text, category, outputPath) {
  console.log('\n🎨 COMPOSITOR V4 - Estilo Referencia 6');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

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
  if (layout.emphasis.background) {
    console.log(`   🎨 Fondo de color activado para énfasis`);
  }

  // Construir comando
  const cmd = buildImageMagickCommand(baseImagePath, verse, parts, layout, font, outputPath);

  // Ejecutar
  try {
    execSync(cmd, { stdio: 'pipe' });

    const size = (fs.statSync(outputPath).size / 1024).toFixed(0);
    console.log(`\n✅ Thumbnail V4 generado exitosamente`);
    console.log(`   Archivo: ${path.basename(outputPath)}`);
    console.log(`   Tamaño: ${size}KB`);

    return { success: true, path: outputPath, size };
  } catch (error) {
    throw new Error(`Error ejecutando ImageMagick: ${error.message}`);
  }
}

// CLI
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length < 5) {
    console.error('\n❌ Uso: node compose-thumbnail-v4.js <base-image> <verse> <text> <category> <output>');
    console.error('\nEjemplo:');
    console.error('  node compose-thumbnail-v4.js base.png "Proverbios 3:5-6" "Confía en Dios SIEMPRE" sabiduria output.jpg\n');
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
