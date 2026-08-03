#!/usr/bin/env node
/**
 * 🎨 THUMBNAIL COMPOSER V11 - FRASES CORTAS MOTIVACIONALES
 *
 * Nuevo enfoque:
 * ✅ Frase corta (3-7 palabras): "Esto te cambiará", "Fortaleza espiritual"
 * ✅ UNA palabra en ROJO/AMARILLO (keyword)
 * ✅ Resto en BLANCO
 * ✅ Bordes delgados (1-2px)
 * ✅ Letras GRUESAS (bold)
 * ✅ Fondo decorativo para keyword (rectángulo dorado, mancha)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const CANVAS = {
  width: 1344,
  height: 768,
  textZoneWidth: 538,
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
 * Detectar palabra clave (la más importante para resaltar)
 * Prioridad: Palabras en mayúsculas > Palabras largas > Primera palabra
 */
function detectKeyword(phrase) {
  const words = phrase.split(' ');
  
  // Buscar palabra toda en mayúsculas
  const upperWord = words.find(w => w === w.toUpperCase() && w.length > 2);
  if (upperWord) return upperWord;
  
  // Buscar palabra más larga (>5 letras)
  const longWords = words.filter(w => w.length > 5);
  if (longWords.length > 0) {
    return longWords.sort((a, b) => b.length - a.length)[0];
  }
  
  // Última palabra si es emotiva
  const lastWord = words[words.length - 1];
  if (lastWord.length > 4) return lastWord;
  
  // Primera palabra por defecto
  return words[0];
}

/**
 * Crear fondo decorativo para keyword
 */
function createDecorativeBackground(keyword, font, size, y, category) {
  const colors = {
    sabiduria: COLORS.gold,
    fortaleza: COLORS.red,
    esperanza: COLORS.yellow,
    amor: COLORS.red,
    consuelo: '#9C27B0',
    fe: '#2196F3'
  };
  
  const bgColor = colors[category] || COLORS.gold;
  
  // Calcular dimensiones aproximadas
  const width = keyword.length * size * 0.7;
  const height = size * 1.5;
  const x = CANVAS.margin;
  
  // Rectángulo con bordes redondeados
  return `\\( -size ${Math.round(width)}x${Math.round(height)} \\
    xc:"${bgColor}" \\
    -alpha set -channel A -evaluate set 80% +channel \\
    -background none \\
    -gravity center \\
  \\) -geometry +${x}+${Math.round(y - height/4)} -composite`;
}

/**
 * Generar thumbnail con frase corta
 */
function buildCommand(baseImage, phrase, category, font, output) {
  const keyword = detectKeyword(phrase);
  const keywordUpper = keyword.toUpperCase();
  const phraseUpper = phrase.toUpperCase();
  
  // Reemplazar keyword con placeholder
  const beforeKeyword = phraseUpper.split(keywordUpper)[0];
  const afterKeyword = phraseUpper.split(keywordUpper).slice(1).join(keywordUpper);
  
  // Tamaño base adaptado a longitud de frase
  const baseSize = phrase.split(' ').length <= 3 ? 200 : 160;
  
  // Posición vertical centrada
  const yPos = 350;
  
  let cmd = `convert "${baseImage}" -font ${font}`;
  
  // Si hay texto antes de keyword
  if (beforeKeyword.trim()) {
    cmd += ` \\
      -pointsize ${baseSize} \\
      -fill "${COLORS.white}" \\
      -stroke "${COLORS.black}" \\
      -strokewidth 2 \\
      -gravity West \\
      -annotate +${CANVAS.margin}+${yPos} "${beforeKeyword.trim()}"`;
  }
  
  // Fondo decorativo para keyword
  const bgCmd = createDecorativeBackground(keywordUpper, font, baseSize, yPos, category);
  cmd += ` ${bgCmd}`;
  
  // Keyword en color (ROJO o AMARILLO)
  const keywordColor = category === 'esperanza' ? COLORS.yellow : COLORS.red;
  const keywordX = beforeKeyword.trim() ? CANVAS.margin + beforeKeyword.length * baseSize * 0.6 : CANVAS.margin;
  
  cmd += ` \\
    -pointsize ${baseSize} \\
    -fill "${keywordColor}" \\
    -stroke "${COLORS.black}" \\
    -strokewidth 2 \\
    -gravity NorthWest \\
    -annotate +${Math.round(keywordX)}+${yPos} "${keywordUpper}"`;
  
  // Si hay texto después de keyword
  if (afterKeyword.trim()) {
    const afterX = keywordX + keywordUpper.length * baseSize * 0.6;
    cmd += ` \\
      -pointsize ${baseSize} \\
      -fill "${COLORS.white}" \\
      -stroke "${COLORS.black}" \\
      -strokewidth 2 \\
      -annotate +${Math.round(afterX)}+${yPos} "${afterKeyword.trim()}"`;
  }
  
  cmd += ` \\
    -quality 95 \\
    "${output}"`;
  
  return { cmd, keyword: keywordUpper, size: baseSize };
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
  console.log('\n🎨 COMPOSITOR V11 - FRASES CORTAS MOTIVACIONALES');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  if (!fs.existsSync(baseImagePath)) {
    throw new Error(`Imagen base no encontrada: ${baseImagePath}`);
  }
  
  const font = detectAvailableFont();
  const { cmd, keyword, size } = buildCommand(baseImagePath, phrase, category, font, outputPath);
  
  console.log(`\n📐 Layout: ${category}`);
  console.log(`   Frase: "${phrase}"`);
  console.log(`   Keyword resaltada: "${keyword}" (ROJO/AMARILLO)`);
  console.log(`   Resto: BLANCO`);
  console.log(`   Tamaño: ${size}pt`);
  console.log(`   Bordes: 2px (delgados)`);
  console.log(`   ✅ Frase corta con fondo decorativo\n`);
  
  try {
    execSync(cmd, { stdio: 'pipe' });
    
    const fileSize = (fs.statSync(outputPath).size / 1024).toFixed(0);
    console.log(`✅ Thumbnail V11 generado exitosamente`);
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
    console.error('\n❌ Uso: node compose-thumbnail-v11.js <base-image> <phrase> <category> <output>');
    console.error('\nEjemplo:');
    console.error('  node compose-thumbnail-v11.js base.png "Esto te cambiará" sabiduria output.jpg');
    console.error('  node compose-thumbnail-v11.js base.png "Fortaleza espiritual" fortaleza output.jpg\n');
    process.exit(1);
  }
  
  const [baseImage, phrase, category, output] = args;
  
  composeThumbnail(baseImage, phrase, category, output || '/tmp/thumbnail-v11.jpg')
    .then(() => process.exit(0))
    .catch(err => {
      console.error('\n❌ Error:', err.message);
      process.exit(1);
    });
}

module.exports = { composeThumbnail };
