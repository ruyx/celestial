#!/usr/bin/env node

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Leer metadata para obtener el título SEO del experto
const verse = process.argv[2] || 'Salmos 23:1';
// Convertir espacios y dos puntos a guiones (e.g., "Salmos 23:1" → "Salmos-23-1")
const verseSlug = verse.replace(/[\s:]+/g, '-');
const metadataPath = `/home/suario/ruy-projects/project-yt/output/youtube-metadata/youtube-metadata-${verseSlug}.json`;
const ytMetadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));

if (!ytMetadata.youtube || !ytMetadata.youtube.title) {
  throw new Error('Metadata no contiene título SEO (youtube.title)');
}

const category = ytMetadata.category || 'consuelo';
const seoTitle = ytMetadata.youtube.title;

// Extraer versículo del título SEO (e.g., "Salmos 23:1 | ...")
const verseMatch = seoTitle.match(/^([^\|]+)/);
const verseText = verseMatch ? verseMatch[1].trim().toUpperCase() : verse.toUpperCase();
const keywordText = category.toUpperCase();

// Función para dividir el nombre del libro en líneas óptimas
function splitBookName(fullText) {
  // Separar el libro de la referencia numérica (e.g., "SALMOS 23:1" → ["SALMOS", "23:1"])
  const parts = fullText.split(' ');
  const reference = parts[parts.length - 1]; // Último elemento es la referencia (23:1, 3:16, etc.)
  const bookName = parts.slice(0, -1).join(' '); // Todo antes de la referencia es el libro

  const lines = [];

  // Si el libro tiene espacios (e.g., "1 CORINTIOS"), separar por espacio
  if (bookName.includes(' ')) {
    const bookParts = bookName.split(' ');
    lines.push(...bookParts);
  }
  // Si el libro es de una sola palabra (ISAÍAS, ROMANOS, SALMOS, etc.)
  // NO cortar - mantener la palabra completa
  else {
    lines.push(bookName);
  }

  // Agregar la referencia numérica como última línea del versículo
  lines.push(reference);

  return lines;
}

const verseLines = splitBookName(verseText);

// Category color schemes (matching Agent 9 v3)
const CATEGORY_COLORS = {
  consuelo: { primary: '#FFD700', secondary: '#FFFFFF', stroke: '#000000' },
  fortaleza: { primary: '#FF6B35', secondary: '#FFFFFF', stroke: '#000000' },
  esperanza: { primary: '#4ECDC4', secondary: '#FFFFFF', stroke: '#000000' },
  amor: { primary: '#FF1744', secondary: '#FFFFFF', stroke: '#000000' },
  sabiduria: { primary: '#9C27B0', secondary: '#FFFFFF', stroke: '#000000' },
  fe: { primary: '#2196F3', secondary: '#FFFFFF', stroke: '#000000' }
};

const colors = CATEGORY_COLORS[category] || CATEGORY_COLORS.consuelo;

// Create SVG text overlay - DOMINANTE como referencias (70% del espacio)
const width = 1920;
const height = 1080;

// Texto en el LADO IZQUIERDO (espacio vacío) - personaje está a la derecha
const xLeftArea = width * 0.35;  // 35% del ancho (lado izquierdo vacío)

// Calcular posiciones Y dinámicamente según el número de líneas del versículo
const totalLines = verseLines.length + 1; // versículo + categoría
const lineSpacing = 180; // Espaciado entre líneas grandes
const startY = 240; // Posición inicial

// Generar posiciones Y para cada línea del versículo
const verseYPositions = verseLines.map((_, index) => startY + (index * lineSpacing));
// Última línea para la categoría (más pequeña, con espaciado extra)
const keywordY = verseYPositions[verseYPositions.length - 1] + 220;

const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@900&amp;display=swap');
      .verse-text {
        font-family: 'Montserrat', 'Impact', sans-serif;
        font-size: 200px;
        font-weight: 900;
        fill: ${colors.secondary};
        stroke: ${colors.stroke};
        stroke-width: 10px;
        paint-order: stroke fill;
        text-anchor: middle;
        dominant-baseline: middle;
      }
      .keyword-text {
        font-family: 'Montserrat', 'Impact', sans-serif;
        font-size: 140px;
        font-weight: 900;
        fill: ${colors.primary};
        stroke: ${colors.stroke};
        stroke-width: 8px;
        paint-order: stroke fill;
        text-anchor: middle;
        dominant-baseline: middle;
      }
      .keyword-text-small {
        font-family: 'Montserrat', 'Impact', sans-serif;
        font-size: 100px;
        font-weight: 900;
        fill: ${colors.primary};
        stroke: ${colors.stroke};
        stroke-width: 6px;
        paint-order: stroke fill;
        text-anchor: middle;
        dominant-baseline: middle;
      }
    </style>
    <filter id="shadow">
      <feGaussianBlur in="SourceAlpha" stdDeviation="8"/>
      <feOffset dx="3" dy="6" result="offsetblur"/>
      <feComponentTransfer>
        <feFuncA type="linear" slope="0.9"/>
      </feComponentTransfer>
      <feMerge>
        <feMergeNode/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>

  <!-- Líneas del versículo (generadas dinámicamente) -->
${verseLines.map((line, index) =>
  `  <text x="${xLeftArea}" y="${verseYPositions[index]}" class="verse-text" filter="url(#shadow)">${line}</text>`
).join('\n')}

  <!-- Categoría (más pequeña) -->
  <text x="${xLeftArea}" y="${keywordY}" class="keyword-text-small" filter="url(#shadow)">${keywordText}</text>
</svg>`;

// Compose thumbnail
const baseImagePath = `/home/suario/ruy-projects/project-yt/output/thumbnails/base-${verseSlug}.png`;
const outputPath = `/home/suario/ruy-projects/project-yt/output/thumbnails/thumbnail-${verseSlug}.png`;

console.log(`📝 Título SEO: "${seoTitle}"`);
console.log(`🎨 Texto en thumbnail (${totalLines} líneas):`);
verseLines.forEach((line, index) => {
  console.log(`   Línea ${index + 1}: "${line}" (200px) - Y=${verseYPositions[index]}px`);
});
console.log(`   Línea ${totalLines}: "${keywordText}" (100px - categoría) - Y=${keywordY}px`);
console.log(`🎨 Categoría: ${category}`);
console.log(`🎨 Colores: ${colors.primary} / ${colors.secondary}`);

sharp(baseImagePath)
  .resize(1920, 1080, {
    fit: 'cover',
    position: 'center'
  })
  .composite([{
    input: Buffer.from(svg),
    top: 0,
    left: 0
  }])
  .png({ quality: 95, compressionLevel: 9 })
  .toFile(outputPath)
  .then(() => {
    const stats = fs.statSync(outputPath);
    const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
    console.log(`✅ Thumbnail generado: ${outputPath}`);
    console.log(`📦 Tamaño: ${sizeInMB} MB`);

    // Validar tamaño YouTube (<2MB)
    if (parseFloat(sizeInMB) > 2) {
      console.log(`⚠️  Tamaño excede 2MB, comprimiendo a JPEG...`);
      const jpgPath = outputPath.replace('.png', '.jpg');
      return sharp(baseImagePath)
        .resize(1920, 1080, { fit: 'cover', position: 'center' })
        .composite([{ input: Buffer.from(svg), top: 0, left: 0 }])
        .jpeg({ quality: 85 })
        .toFile(jpgPath)
        .then(() => {
          const jpgStats = fs.statSync(jpgPath);
          const jpgSize = (jpgStats.size / (1024 * 1024)).toFixed(2);
          console.log(`✅ JPEG generado: ${jpgPath} (${jpgSize} MB)`);
        });
    }
  })
  .catch(err => {
    console.error('❌ Error componiendo thumbnail:', err);
    process.exit(1);
  });
