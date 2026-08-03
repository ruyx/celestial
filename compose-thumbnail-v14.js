#!/usr/bin/env node
/**
 * 🎨 THUMBNAIL COMPOSER V14 - KEYWORD RESALTADA CON MEDICIÓN PRECISA
 *
 * Solución definitiva al problema de superposición:
 * 1. Dividir frase en: ANTES + KEYWORD + DESPUÉS
 * 2. Medir ancho real de cada segmento con ImageMagick
 * 3. Posicionar cada segmento usando mediciones exactas
 * 4. Fondo decorativo debajo de toda la frase
 *
 * Características:
 * - Keyword detectada automáticamente (palabra larga, mayúsculas, o última)
 * - Color según categoría (sabiduria=gold, fortaleza=red, esperanza=yellow)
 * - Resto en BLANCO
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
 * Medir ancho real del texto usando ImageMagick
 */
function measureTextWidth(text, font, size) {
  if (!text || text.trim() === '') {
    return { width: 0, height: size };
  }

  const escapedText = text.replace(/"/g, '\\"');
  const cmd = `convert -debug annotate xc: -font ${font} -pointsize ${size} -annotate +0+0 "${escapedText}" null: 2>&1 | grep "Metrics:"`;

  try {
    const output = execSync(cmd, { encoding: 'utf8' });
    const widthMatch = output.match(/width:\s*(\d+)/);
    const heightMatch = output.match(/height:\s*(\d+)/);

    if (widthMatch && heightMatch) {
      return {
        width: parseInt(widthMatch[1]),
        height: parseInt(heightMatch[1])
      };
    }
  } catch (e) {
    console.error(`⚠️  Error midiendo "${text}":`, e.message);
  }

  // Fallback: estimación
  return {
    width: text.length * size * 0.6,
    height: size
  };
}

/**
 * Detectar palabra clave en la frase
 */
function detectKeyword(phrase) {
  const words = phrase.split(' ');

  // Prioridad 1: Palabras toda en mayúsculas
  const upperWord = words.find(w => w === w.toUpperCase() && w.length > 2);
  if (upperWord) return upperWord;

  // Prioridad 2: Palabras largas (>6 letras)
  const longWords = words.filter(w => w.length > 6);
  if (longWords.length > 0) {
    return longWords[0];
  }

  // Prioridad 3: Última palabra si es larga
  const lastWord = words[words.length - 1];
  if (lastWord.length > 4) return lastWord;

  // Fallback: Primera palabra
  return words[0];
}

/**
 * Construir thumbnail con keyword resaltada usando mediciones exactas
 */
function buildCommand(baseImage, phrase, category, font, output) {
  const keyword = detectKeyword(phrase);
  const phraseUpper = phrase.toUpperCase();
  const keywordUpper = keyword.toUpperCase();

  // Tamaño según longitud
  const wordCount = phrase.split(' ').length;
  let size;
  if (wordCount <= 2) size = 220;
  else if (wordCount <= 3) size = 190;
  else if (wordCount <= 5) size = 160;
  else size = 130;

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

  // Dividir frase en 3 partes
  const keywordIndex = phraseUpper.indexOf(keywordUpper);
  const beforeKeyword = phraseUpper.substring(0, keywordIndex);
  const afterKeyword = phraseUpper.substring(keywordIndex + keywordUpper.length);

  // Medir cada segmento
  const beforeMetrics = measureTextWidth(beforeKeyword, font, size);
  const keywordMetrics = measureTextWidth(keywordUpper, font, size);
  const afterMetrics = measureTextWidth(afterKeyword, font, size);

  // Posición vertical centrada
  const yPos = -30;
  const yAbsolute = (CANVAS.height / 2) + yPos;

  // Calcular dimensiones del fondo decorativo
  const totalWidth = beforeMetrics.width + keywordMetrics.width + afterMetrics.width;
  const bgWidth = Math.min(700, totalWidth + 80);  // +80px padding
  const bgHeight = size * 1.8;
  const bgX = CANVAS.margin - 20;
  const bgY = yAbsolute - (bgHeight / 2);

  let cmd = `convert "${baseImage}"`;

  // PASO 1: Fondo decorativo (rectángulo con bordes redondeados)
  cmd += ` \\( -size ${Math.round(bgWidth)}x${Math.round(bgHeight)}`;
  cmd += ` xc:"${bgColor}"`;
  cmd += ` -alpha set -channel A -evaluate set 70% +channel`;
  cmd += ` -background none`;
  cmd += ` \\( +clone -alpha extract`;
  cmd += ` -draw 'fill black polygon 0,0 0,20 20,0 fill white circle 20,20 20,0'`;
  cmd += ` \\( +clone -flip \\) -compose Multiply -composite`;
  cmd += ` \\( +clone -flop \\) -compose Multiply -composite`;
  cmd += ` \\) -alpha off -compose CopyOpacity -composite`;
  cmd += ` \\) -geometry +${Math.round(bgX)}+${Math.round(bgY)} -composite`;

  // PASO 2: Renderizar texto en 3 segmentos con posiciones exactas
  const baseX = CANVAS.margin;

  // Segmento 1: Antes de keyword (BLANCO)
  if (beforeKeyword.trim()) {
    const xPos = baseX;
    cmd += ` -font ${font}`;
    cmd += ` -pointsize ${size}`;
    cmd += ` -fill "${COLORS.white}"`;
    cmd += ` -stroke "${COLORS.black}"`;
    cmd += ` -strokewidth 2`;
    cmd += ` -gravity NorthWest`;
    cmd += ` -annotate +${Math.round(xPos)}+${Math.round(yAbsolute)} "${beforeKeyword}"`;
  }

  // Segmento 2: Keyword (COLOR)
  const keywordX = baseX + beforeMetrics.width;
  cmd += ` -pointsize ${size}`;
  cmd += ` -fill "${keywordColor}"`;
  cmd += ` -stroke "${COLORS.black}"`;
  cmd += ` -strokewidth 2`;
  cmd += ` -gravity NorthWest`;
  cmd += ` -annotate +${Math.round(keywordX)}+${Math.round(yAbsolute)} "${keywordUpper}"`;

  // Segmento 3: Después de keyword (BLANCO)
  if (afterKeyword.trim()) {
    const afterX = keywordX + keywordMetrics.width;
    cmd += ` -pointsize ${size}`;
    cmd += ` -fill "${COLORS.white}"`;
    cmd += ` -stroke "${COLORS.black}"`;
    cmd += ` -strokewidth 2`;
    cmd += ` -gravity NorthWest`;
    cmd += ` -annotate +${Math.round(afterX)}+${Math.round(yAbsolute)} "${afterKeyword}"`;
  }

  cmd += ` -quality 95 "${output}"`;

  return {
    cmd,
    keyword: keywordUpper,
    size,
    keywordColor,
    bgColor,
    measurements: {
      before: beforeMetrics.width,
      keyword: keywordMetrics.width,
      after: afterMetrics.width,
      total: totalWidth
    }
  };
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
  console.log('\n🎨 COMPOSITOR V14 - KEYWORD RESALTADA CON MEDICIÓN PRECISA');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  if (!fs.existsSync(baseImagePath)) {
    throw new Error(`Imagen base no encontrada: ${baseImagePath}`);
  }

  const font = detectAvailableFont();
  const { cmd, keyword, size, keywordColor, bgColor, measurements } = buildCommand(
    baseImagePath,
    phrase,
    category,
    font,
    outputPath
  );

  console.log(`\n📐 Layout: ${category}`);
  console.log(`   Frase: "${phrase.toUpperCase()}"`);
  console.log(`   Keyword: "${keyword}" en ${keywordColor}`);
  console.log(`   Resto: BLANCO`);
  console.log(`   Fondo: ${bgColor} (70% opacidad)`);
  console.log(`   Tamaño: ${size}pt`);
  console.log(`   Bordes: 2px`);
  console.log(`\n📏 Mediciones (px):`);
  console.log(`   Antes: ${measurements.before}px`);
  console.log(`   Keyword: ${measurements.keyword}px`);
  console.log(`   Después: ${measurements.after}px`);
  console.log(`   Total: ${measurements.total}px`);
  console.log(`   ✅ Posicionamiento preciso con mediciones reales\n`);

  try {
    execSync(cmd, { stdio: 'pipe' });

    const fileSize = (fs.statSync(outputPath).size / 1024).toFixed(0);
    console.log(`✅ Thumbnail V14 generado exitosamente`);
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
    console.error('\n❌ Uso: node compose-thumbnail-v14.js <base-image> <phrase> <category> <output>');
    console.error('\nEjemplo:');
    console.error('  node compose-thumbnail-v14.js base.png "Esto te cambiará" sabiduria output.jpg');
    console.error('  node compose-thumbnail-v14.js base.png "Cómo calmarte en estos momentos" esperanza output.jpg\n');
    process.exit(1);
  }

  const [baseImage, phrase, category, output] = args;

  composeThumbnail(baseImage, phrase, category, output || '/tmp/thumbnail-v14.jpg')
    .then(() => process.exit(0))
    .catch(err => {
      console.error('\n❌ Error:', err.message);
      process.exit(1);
    });
}

module.exports = { composeThumbnail };
