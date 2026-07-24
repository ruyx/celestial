#!/usr/bin/env node

/**
 * ═══════════════════════════════════════════════════════════════════
 * 📥 DOWNLOAD INTRO & OUTRO - Descargador de Videos Cinematográficos
 * ═══════════════════════════════════════════════════════════════════
 *
 * Descarga los videos de intro y outro generados por Magnific
 * y los guarda en output/intro-videos/ y output/outro-videos/
 *
 * ═══════════════════════════════════════════════════════════════════
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ═══════════════════════════════════════════════════════════════════
// 📁 PATHS
// ═══════════════════════════════════════════════════════════════════

const INTRO_OUTPUT_DIR = path.join(__dirname, '../output/intro-videos');
const OUTRO_OUTPUT_DIR = path.join(__dirname, '../output/outro-videos');

[INTRO_OUTPUT_DIR, OUTRO_OUTPUT_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// ═══════════════════════════════════════════════════════════════════
// 📥 DESCARGA DE VIDEOS
// ═══════════════════════════════════════════════════════════════════

function downloadVideo(url, destPath, description) {
  console.log(`\n📥 Descargando ${description}...`);
  console.log(`   URL: ${url.substring(0, 80)}...`);
  console.log(`   Destino: ${destPath}`);

  try {
    execSync(`curl -L -o "${destPath}" "${url}"`, {
      stdio: 'inherit'
    });

    const stats = fs.statSync(destPath);
    console.log(`   ✅ Descargado: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);

    return {
      file: destPath,
      size: stats.size
    };

  } catch (error) {
    console.error(`   ❌ Error descargando ${description}:`, error.message);
    throw error;
  }
}

// ═══════════════════════════════════════════════════════════════════
// 🚀 FUNCIÓN PRINCIPAL
// ═══════════════════════════════════════════════════════════════════

async function downloadIntroOutro(verse, introUrl, outroUrl) {
  console.log('\n════════════════════════════════════════════════════════════════');
  console.log('📥 DOWNLOAD INTRO & OUTRO');
  console.log('════════════════════════════════════════════════════════════════\n');

  console.log(`📹 Versículo: ${verse}\n`);

  const verseForFilename = verse.replace(/[:\s]/g, '-');

  try {
    // ───────────────────────────────────────────────────────────────
    // Descargar intro
    // ───────────────────────────────────────────────────────────────

    const introFile = path.join(INTRO_OUTPUT_DIR, `intro-${verseForFilename}.mp4`);
    const intro = downloadVideo(introUrl, introFile, 'INTRO (5s)');

    // ───────────────────────────────────────────────────────────────
    // Descargar outro
    // ───────────────────────────────────────────────────────────────

    const outroFile = path.join(OUTRO_OUTPUT_DIR, `outro-${verseForFilename}.mp4`);
    const outro = downloadVideo(outroUrl, outroFile, 'OUTRO (15s)');

    // ───────────────────────────────────────────────────────────────
    // Guardar metadata
    // ───────────────────────────────────────────────────────────────

    const metadata = {
      verse: verse,
      intro: {
        file: intro.file,
        size: intro.size,
        duration: 5,
        url: introUrl
      },
      outro: {
        file: outro.file,
        size: outro.size,
        duration: 15,
        url: outroUrl
      },
      downloadedAt: new Date().toISOString()
    };

    const metadataPath = path.join(INTRO_OUTPUT_DIR, `downloaded-${verseForFilename}.json`);
    fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));

    console.log('\n════════════════════════════════════════════════════════════════');
    console.log('✅ INTRO & OUTRO DESCARGADOS EXITOSAMENTE');
    console.log('════════════════════════════════════════════════════════════════\n');

    console.log('📁 Archivos descargados:');
    console.log(`   Intro: ${intro.file}`);
    console.log(`   Outro: ${outro.file}`);
    console.log(`   Metadata: ${metadataPath}\n`);

    return metadata;

  } catch (error) {
    console.error('\n❌ Error descargando videos:', error.message);
    throw error;
  }
}

// ═══════════════════════════════════════════════════════════════════
// 🎯 EJECUCIÓN
// ═══════════════════════════════════════════════════════════════════

if (require.main === module) {
  const verse = process.argv[2];
  const introUrl = process.argv[3];
  const outroUrl = process.argv[4];

  if (!verse || !introUrl || !outroUrl) {
    console.error('\n❌ Uso: node download-intro-outro.js "Versículo" "intro_url" "outro_url"\n');
    process.exit(1);
  }

  downloadIntroOutro(verse, introUrl, outroUrl)
    .then(metadata => {
      console.log('🎉 ¡VIDEOS CINEMATOGRÁFICOS LISTOS!');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Fallo en descarga');
      process.exit(1);
    });
}

module.exports = { downloadIntroOutro };
