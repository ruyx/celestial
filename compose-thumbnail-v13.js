#!/usr/bin/env node
/**
 * 🎨 THUMBNAIL COMPOSER V13 - ENFOQUE SIMPLE: FONDO + TEXTO BLANCO
 *
 * Solución al problema de superposición:
 * - Frase COMPLETA en BLANCO (una sola anotación)
 * - Fondo decorativo DEBAJO de toda la frase
 * - NO intentar cambiar colores de palabras individuales
 * - Bordes delgados (2px)
 * - Letras gruesas (bold)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const CANVAS = {
  width: 1344,
  height: 768,
  margin: 40
};

const FONTS = {
  primary: 'DejaVu-Sans-Bold',
  fallback1: 'Anton-Regular',
  fallback2: 'Arial-Bold'
};

const COLORS = {
  yellow: '#FFED00',
  white: '#FFFFFF',
  red: '#FF0000',
  gold: '#FFD700',
  black: '#000000'
};

/**
 * Construir thumbnail simple: fondo + frase
 */
function buildCommand(baseImage, phrase, category, font, output) {
  const phraseUpper = phrase.toUpperCase();
  
  // Tamaño según longitud
  const wordCount = phrase.split(' ').length;
  let size;
  if (wordCount <= 2) size = 220;
  else if (wordCount <= 3) size = 190;
  else if (wordCount <= 5) size = 160;
  else size = 130;
  
  // Color de fondo según categoría
  const bgColors = {
    sabiduria: COLORS.gold,
    fortaleza: COLORS.red,
    esperanza: COLORS.yellow,
    amor: COLORS.red,
    consuelo: '#9C27B0',
    fe: '#2196F3'
  };
  const bgColor = bgColors[category] || COLORS.gold;
  
  // Posición centrada verticalmente (West gravity)
  const yPos = -30;
  
  // Calcular dimensiones del fondo (rectángulo decorativo)
  const bgWidth = Math.min(700, phraseUpper.length * size * 0.65);
  const bgHeight = size * 1.8;
  const bgX = CANVAS.margin - 20;
  const bgY = (CANVAS.height / 2) + yPos - (bgHeight / 2);
  
  let cmd = `convert "${baseImage}"`;
  
  // PASO 1: Fondo decorativo (rectángulo con bordes redondeados)
  cmd += ` \\
    \\( -size ${Math.round(bgWidth)}x${Math.round(bgHeight)} \\
      xc:"${bgColor}" \\
      -alpha set -channel A -evaluate set 70% +channel \\
      -background none \\
      \\( +clone -alpha extract \\
        -draw 'fill black polygon 0,0 0,20 20,0 fill white circle 20,20 20,0' \\
        \\( +clone -flip \\) -compose Multiply -composite \\
        \\( +clone -flop \\) -compose Multiply -composite \\
      \\) -alpha off -compose CopyOpacity -composite \\
    \\) -geometry +${Math.round(bgX)}+${Math.round(bgY)} -composite`;
  
  // PASO 2: Frase completa en BLANCO encima
  cmd += ` -font ${font} \\
    -pointsize ${size} \\
    -fill "${COLORS.white}" \\
    -stroke "${COLORS.black}" \\
    -strokewidth 2 \\
    -gravity West \\
    -annotate +${CANVAS.margin}+${yPos} "${phraseUpper}"`;
  
  cmd += ` \\
    -quality 95 \\
    "${output}"`;
  
  return { cmd, size, bgColor };
}

function detectAvailableFont() {
  const fonts = [FONTS.primary, FONTS.fallback1, FONTS.fallback2];
  for (const font of fonts) {
    try {
      execSync(`convert -list font | grep -i "${font}"`, { stdio: 'pipe' });
      console.log(`✅ Fuente detectada: ${font}`);
      return font;
    } catch (e) {}
  }
  throw new Error('❌ Ninguna fuente compatible encontrada');
}

async function composeThumbnail(baseImagePath, phrase, category, outputPath) {
  console.log('\n🎨 COMPOSITOR V13 - FONDO DECORATIVO + TEXTO BLANCO');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  if (!fs.existsSync(baseImagePath)) {
    throw new Error(`Imagen base no encontrada: ${baseImagePath}`);
  }
  
  const font = detectAvailableFont();
  const { cmd, size, bgColor } = buildCommand(baseImagePath, phrase, category, font, outputPath);
  
  console.log(`\n📐 Layout: ${category}`);
  console.log(`   Frase: "${phrase.toUpperCase()}"`);
  console.log(`   Texto: BLANCO con bordes negros (2px)`);
  console.log(`   Fondo: ${bgColor} (70% opacidad)`);
  console.log(`   Tamaño: ${size}pt`);
  console.log(`   ✅ Sin superposiciones - frase completa\n`);
  
  try {
    execSync(cmd, { stdio: 'pipe' });
    
    const fileSize = (fs.statSync(outputPath).size / 1024).toFixed(0);
    console.log(`✅ Thumbnail V13 generado exitosamente`);
    console.log(`   Archivo: ${path.basename(outputPath)}`);
    console.log(`   Tamaño: ${fileSize}KB\n`);
    
    return { success: true, path: outputPath, size: fileSize };
  } catch (error) {
    throw new Error(`Error ejecutando ImageMagick: ${error.message}`);
  }
}

if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length < 3) {
    console.error('\n❌ Uso: node compose-thumbnail-v13.js <base-image> <phrase> <category> <output>');
    console.error('\nEjemplo:');
    console.error('  node compose-thumbnail-v13.js base.png "Esto te cambiará" sabiduria output.jpg\n');
    process.exit(1);
  }
  
  const [baseImage, phrase, category, output] = args;
  
  composeThumbnail(baseImage, phrase, category, output || '/tmp/thumbnail-v13.jpg')
    .then(() => process.exit(0))
    .catch(err => {
      console.error('\n❌ Error:', err.message);
      process.exit(1);
    });
}

module.exports = { composeThumbnail };
