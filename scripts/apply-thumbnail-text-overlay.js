#!/usr/bin/env node

/**
 * Script para aplicar text overlay al thumbnail Oscar Marrón
 * Usa Sharp + SVG para texto 100% legible
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Configuración de colores según categoría
const CATEGORY_COLORS = {
  esperanza: {
    textColor: '#FFD700',        // Oro brillante
    textColorSecondary: '#FFFFFF', // Blanco
    textStroke: '#000000'         // Negro para contraste
  },
  fortaleza: {
    textColor: '#FF6B35',        // Naranja
    textColorSecondary: '#FFFFFF',
    textStroke: '#000000'
  },
  consuelo: {
    textColor: '#FFD700',
    textColorSecondary: '#FFFFFF',
    textStroke: '#1B2845'
  },
  amor: {
    textColor: '#FF6B9D',        // Rosa
    textColorSecondary: '#FFFFFF',
    textStroke: '#000000'
  },
  sabiduria: {
    textColor: '#9C27B0',        // Púrpura
    textColorSecondary: '#FFD700',
    textStroke: '#000000'
  },
  fe: {
    textColor: '#4ECDC4',        // Teal
    textColorSecondary: '#FFFFFF',
    textStroke: '#000000'
  }
};

/**
 * Crea SVG con texto estilizado
 */
function createTextSVG(title, keyword, category, width = 1920, height = 1080) {
  const colors = CATEGORY_COLORS[category] || CATEGORY_COLORS.esperanza;

  // Extraer verso del título (ej: "Romanos 8:28 | ...")
  const verseMatch = title.match(/^([^\|]+)/);
  const verseText = verseMatch ? verseMatch[1].trim().toUpperCase() : title.substring(0, 30).toUpperCase();

  // Keyword en mayúsculas
  const keywordText = keyword.toUpperCase();

  // Posición: tercio superior LEFT (espacio limpio según Oscar Marrón)
  const x = 100;
  const yVerse = 180;    // Título principal arriba
  const yKeyword = 280;  // Keyword debajo

  const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@900&amp;display=swap');
      .verse-text {
        font-family: 'Montserrat', 'Impact', sans-serif;
        font-size: 120px;
        font-weight: 900;
        fill: ${colors.textColor};
        stroke: ${colors.textStroke};
        stroke-width: 6px;
        paint-order: stroke fill;
        text-anchor: start;
        dominant-baseline: hanging;
      }
      .keyword-text {
        font-family: 'Montserrat', 'Impact', sans-serif;
        font-size: 80px;
        font-weight: 900;
        fill: ${colors.textColorSecondary};
        stroke: ${colors.textStroke};
        stroke-width: 4px;
        paint-order: stroke fill;
        text-anchor: start;
        dominant-baseline: hanging;
      }
    </style>
    <filter id="shadow">
      <feGaussianBlur in="SourceAlpha" stdDeviation="4"/>
      <feOffset dx="2" dy="4" result="offsetblur"/>
      <feComponentTransfer>
        <feFuncA type="linear" slope="0.8"/>
      </feComponentTransfer>
      <feMerge>
        <feMergeNode/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>

  <!-- Título principal con sombra -->
  <text x="${x}" y="${yVerse}" class="verse-text" filter="url(#shadow)">${verseText}</text>

  <!-- Keyword con sombra -->
  <text x="${x}" y="${yKeyword}" class="keyword-text" filter="url(#shadow)">${keywordText}</text>
</svg>`;

  return Buffer.from(svg);
}

/**
 * Aplica text overlay a imagen base
 */
async function applyTextOverlay(baseImagePath, outputPath, title, keyword, category) {
  console.log(`\n🎨 Aplicando text overlay...`);
  console.log(`   Base: ${path.basename(baseImagePath)}`);
  console.log(`   Title: ${title}`);
  console.log(`   Keyword: ${keyword}`);
  console.log(`   Category: ${category}\n`);

  // Obtener dimensiones reales de la imagen
  const metadata = await sharp(baseImagePath).metadata();
  const width = metadata.width;
  const height = metadata.height;

  console.log(`   Dimensiones: ${width}x${height}\n`);

  const textSVG = createTextSVG(title, keyword, category, width, height);

  await sharp(baseImagePath)
    .composite([{
      input: textSVG,
      top: 0,
      left: 0
    }])
    .toFile(outputPath);

  // Validar resultado
  const stats = fs.statSync(outputPath);
  console.log(`✅ Text overlay aplicado exitosamente`);
  console.log(`   Output: ${outputPath}`);
  console.log(`   Tamaño: ${(stats.size / 1024 / 1024).toFixed(2)} MB\n`);

  return outputPath;
}

// CLI
if (require.main === module) {
  const baseImagePath = process.argv[2];
  const outputPath = process.argv[3];
  const title = process.argv[4] || 'Romanos 8:28';
  const keyword = process.argv[5] || 'ESPERANZA';
  const category = process.argv[6] || 'esperanza';

  if (!baseImagePath || !outputPath) {
    console.error(`
❌ USO: node apply-thumbnail-text-overlay.js <base-image> <output> [title] [keyword] [category]

EJEMPLO:
  node apply-thumbnail-text-overlay.js \\
    base-image.png \\
    thumbnail-final.png \\
    "Romanos 8:28 | Promesa de Esperanza" \\
    "ESPERANZA" \\
    esperanza
`);
    process.exit(1);
  }

  if (!fs.existsSync(baseImagePath)) {
    console.error(`❌ ERROR: Imagen base no encontrada: ${baseImagePath}`);
    process.exit(1);
  }

  applyTextOverlay(baseImagePath, outputPath, title, keyword, category)
    .then(() => {
      console.log(`🎉 THUMBNAIL COMPLETO LISTO PARA YOUTUBE!\n`);
      process.exit(0);
    })
    .catch(err => {
      console.error(`❌ ERROR:`, err);
      process.exit(1);
    });
}

module.exports = { createTextSVG, applyTextOverlay };
