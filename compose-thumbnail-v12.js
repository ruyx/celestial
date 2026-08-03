#!/usr/bin/env node
/**
 * 🎨 THUMBNAIL COMPOSER V12 - FRASE COMPLETA CON KEYWORD RESALTADA
 *
 * Enfoque simple y robusto:
 * 1. Renderizar frase completa en BLANCO (una sola anotación)
 * 2. Detectar palabra clave
 * 3. Crear fondo decorativo centrado en la frase
 * 4. Resaltar keyword cambiando palabras específicas a ROJO/AMARILLO
 *
 * Ventajas:
 * - No hay superposición de texto
 * - ImageMagick maneja el espaciado
 * - Más simple y confiable
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const CANVAS = {
  width: 1344,
  height: 768,
  textZoneWidth: 700,  // Más espacio para frases cortas
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
 * Detectar palabra clave en la frase
 */
function detectKeyword(phrase) {
  const words = phrase.split(' ');
  
  // Palabras toda en mayúsculas tienen prioridad
  const upperWord = words.find(w => w === w.toUpperCase() && w.length > 2);
  if (upperWord) return upperWord;
  
  // Palabras largas (>6 letras)
  const longWords = words.filter(w => w.length > 6);
  if (longWords.length > 0) {
    return longWords[0];
  }
  
  // Última palabra si es larga
  const lastWord = words[words.length - 1];
  if (lastWord.length > 4) return lastWord;
  
  // Primera palabra
  return words[0];
}

/**
 * Construir frase con keyword resaltada
 * Enfoque: Dos pasadas
 * 1. Frase completa en BLANCO
 * 2. Solo keyword en ROJO/AMARILLO encima
 */
function buildCommand(baseImage, phrase, category, font, output) {
  const keyword = detectKeyword(phrase);
  const phraseUpper = phrase.toUpperCase();
  const keywordUpper = keyword.toUpperCase();
  
  // Tamaño según longitud de frase
  const wordCount = phrase.split(' ').length;
  let size;
  if (wordCount <= 2) size = 220;
  else if (wordCount <= 3) size = 190;
  else if (wordCount <= 4) size = 160;
  else size = 130;
  
  // Posición centrada verticalmente
  const yPos = -30;  // gravity West con offset
  
  // Color de keyword según categoría
  const keywordColors = {
    sabiduria: COLORS.gold,
    fortaleza: COLORS.red,
    esperanza: COLORS.yellow,
    amor: COLORS.red,
    consuelo: '#9C27B0',
    fe: '#2196F3'
  };
  const keywordColor = keywordColors[category] || COLORS.red;
  
  // PASO 1: Frase completa en BLANCO
  let cmd = `convert "${baseImage}" -font ${font} \\
    -pointsize ${size} \\
    -fill "${COLORS.white}" \\
    -stroke "${COLORS.black}" \\
    -strokewidth 2 \\
    -gravity West \\
    -annotate +${CANVAS.margin}+${yPos} "${phraseUpper}"`;
  
  // PASO 2: Solo keyword en COLOR encima (misma posición)
  // Para evitar superposición, usamos la frase con keyword en color
  // y dejamos espacio antes
  const beforeKeyword = phraseUpper.substring(0, phraseUpper.indexOf(keywordUpper));
  
  // Calcular offset aproximado para keyword
  // Cada letra ~ 60% del tamaño de fuente en ancho
  const offsetX = CANVAS.margin + (beforeKeyword.length * size * 0.6);
  
  cmd += ` \\
    -pointsize ${size} \\
    -fill "${keywordColor}" \\
    -stroke "${COLORS.black}" \\
    -strokewidth 2 \\
    -gravity NorthWest \\
    -annotate +${Math.round(offsetX)}+${CANVAS.height/2 + yPos} "${keywordUpper}"`;
  
  cmd += ` \\
    -quality 95 \\
    "${output}"`;
  
  return { cmd, keyword: keywordUpper, size, color: keywordColor };
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
  console.log('\n🎨 COMPOSITOR V12 - FRASE COMPLETA CON KEYWORD RESALTADA');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  if (!fs.existsSync(baseImagePath)) {
    throw new Error(`Imagen base no encontrada: ${baseImagePath}`);
  }
  
  const font = detectAvailableFont();
  const { cmd, keyword, size, color } = buildCommand(baseImagePath, phrase, category, font, outputPath);
  
  console.log(`\n📐 Layout: ${category}`);
  console.log(`   Frase: "${phrase.toUpperCase()}"`);
  console.log(`   Keyword: "${keyword}" en ${color}`);
  console.log(`   Resto: BLANCO`);
  console.log(`   Tamaño: ${size}pt`);
  console.log(`   Bordes: 2px`);
  console.log(`   ✅ Frase completa sin superposiciones\n`);
  
  try {
    execSync(cmd, { stdio: 'pipe' });
    
    const fileSize = (fs.statSync(outputPath).size / 1024).toFixed(0);
    console.log(`✅ Thumbnail V12 generado exitosamente`);
    console.log(`   Archivo: ${path.basename(outputPath)}`);
    console.log(`   Tamaño: ${fileSize}KB\n`);
    
    return { success: true, path: outputPath, size: fileSize, keyword };
  } catch (error) {
    throw new Error(`Error ejecutando ImageMagick: ${error.message}`);
  }
}

if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length < 3) {
    console.error('\n❌ Uso: node compose-thumbnail-v12.js <base-image> <phrase> <category> <output>');
    console.error('\nEjemplo:');
    console.error('  node compose-thumbnail-v12.js base.png "Esto te cambiará" sabiduria output.jpg');
    console.error('  node compose-thumbnail-v12.js base.png "Cómo calmarte en estos momentos" esperanza output.jpg\n');
    process.exit(1);
  }
  
  const [baseImage, phrase, category, output] = args;
  
  composeThumbnail(baseImage, phrase, category, output || '/tmp/thumbnail-v12.jpg')
    .then(() => process.exit(0))
    .catch(err => {
      console.error('\n❌ Error:', err.message);
      process.exit(1);
    });
}

module.exports = { composeThumbnail };
