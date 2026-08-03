#!/usr/bin/env node
/**
 * VALIDATION GUARDIAN - Post-Upload Verification
 *
 * Verifica que TODOS los pasos críticos se completaron correctamente:
 * ✅ Video existe en YouTube
 * ✅ Thumbnail personalizado fue subido
 * ✅ Video está en la playlist correcta
 * ✅ Metadata está completa (título, descripción, tags)
 * ✅ Estado de privacidad es correcto
 *
 * Este script DEBE ejecutarse después de cada upload para garantizar
 * que el video está 100% listo para publicación.
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const TOKEN_PATH = path.join(__dirname, 'youtube-token.json');

function getAuthClient() {
  if (!fs.existsSync(TOKEN_PATH)) {
    throw new Error('No se encontró youtube-token.json');
  }

  const token = JSON.parse(fs.readFileSync(TOKEN_PATH));
  const credentials = JSON.parse(fs.readFileSync(path.join(__dirname, 'client_secret.json')));
  const { client_id, client_secret } = credentials.installed;

  const oauth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    'http://localhost:8080/oauth2callback'
  );

  oauth2Client.setCredentials(token);
  return oauth2Client;
}

async function validateVideoUpload(videoId, expectedMetadata = {}) {
  const auth = getAuthClient();
  const youtube = google.youtube({ version: 'v3', auth });

  console.log('\n🔍 VALIDATION GUARDIAN - Post-Upload Verification');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📹 Video ID: ${videoId}\n`);

  const errors = [];
  const warnings = [];
  let videoData = null;

  try {
    // ============================================
    // CHECK 1: Video existe en YouTube
    // ============================================
    console.log('[1/6] Verificando existencia del video...');

    const videoResponse = await youtube.videos.list({
      part: 'snippet,status,contentDetails',
      id: videoId
    });

    if (!videoResponse.data.items || videoResponse.data.items.length === 0) {
      errors.push('❌ CRÍTICO: Video no encontrado en YouTube');
      throw new Error('Video no existe');
    }

    videoData = videoResponse.data.items[0];
    console.log('   ✅ Video existe en YouTube\n');

    // ============================================
    // CHECK 2: Thumbnail personalizado
    // ============================================
    console.log('[2/6] Verificando thumbnail personalizado...');

    const hasThumbnail = videoData.snippet.thumbnails &&
                         videoData.snippet.thumbnails.maxres;

    if (!hasThumbnail) {
      errors.push('❌ CRÍTICO: Thumbnail personalizado NO fue subido');
      console.log('   ❌ Thumbnail personalizado FALTA\n');
    } else {
      console.log('   ✅ Thumbnail personalizado OK');
      console.log(`      URL: ${videoData.snippet.thumbnails.maxres.url}\n`);
    }

    // ============================================
    // CHECK 3: Metadata completa
    // ============================================
    console.log('[3/6] Verificando metadata...');

    const snippet = videoData.snippet;

    // Verificar título
    if (!snippet.title || snippet.title.trim() === '') {
      errors.push('❌ CRÍTICO: Título vacío');
    } else {
      console.log(`   ✅ Título: "${snippet.title}"`);
    }

    // Verificar descripción
    if (!snippet.description || snippet.description.trim() === '') {
      warnings.push('⚠️  Descripción vacía');
    } else {
      console.log(`   ✅ Descripción: ${snippet.description.length} caracteres`);
    }

    // Verificar tags
    if (!snippet.tags || snippet.tags.length === 0) {
      warnings.push('⚠️  Sin tags (afecta SEO)');
    } else {
      console.log(`   ✅ Tags: ${snippet.tags.length} tags`);
    }

    // Verificar idioma
    if (!snippet.defaultLanguage || snippet.defaultLanguage !== 'es') {
      warnings.push('⚠️  Idioma no configurado como español');
    } else {
      console.log(`   ✅ Idioma: ${snippet.defaultLanguage}`);
    }

    console.log('');

    // ============================================
    // CHECK 4: Estado de privacidad
    // ============================================
    console.log('[4/6] Verificando estado de privacidad...');

    const privacyStatus = videoData.status.privacyStatus;
    console.log(`   ℹ️  Estado actual: ${privacyStatus}`);

    if (expectedMetadata.privacyStatus &&
        privacyStatus !== expectedMetadata.privacyStatus) {
      warnings.push(`⚠️  Privacidad esperada: ${expectedMetadata.privacyStatus}, actual: ${privacyStatus}`);
    } else {
      console.log('   ✅ Estado de privacidad OK\n');
    }

    // ============================================
    // CHECK 5: Video en playlist
    // ============================================
    console.log('[5/6] Verificando inclusión en playlist...');

    if (expectedMetadata.playlistId) {
      const playlistItemsResponse = await youtube.playlistItems.list({
        part: 'snippet',
        playlistId: expectedMetadata.playlistId,
        videoId: videoId,
        maxResults: 1
      });

      if (!playlistItemsResponse.data.items ||
          playlistItemsResponse.data.items.length === 0) {
        errors.push(`❌ CRÍTICO: Video NO está en playlist ${expectedMetadata.playlistId}`);
        console.log('   ❌ Video NO está en la playlist esperada\n');
      } else {
        console.log(`   ✅ Video está en playlist ${expectedMetadata.playlistId}\n`);
      }
    } else {
      console.log('   ℹ️  No se especificó playlist esperada (skip)\n');
    }

    // ============================================
    // CHECK 6: Duración y tamaño
    // ============================================
    console.log('[6/6] Verificando duración del video...');

    const duration = videoData.contentDetails.duration;
    console.log(`   ℹ️  Duración: ${duration}`);

    // Convertir ISO 8601 duration a segundos
    const match = duration.match(/PT(\d+)M(\d+)S/);
    if (match) {
      const minutes = parseInt(match[1]);
      const seconds = parseInt(match[2]);
      const totalSeconds = minutes * 60 + seconds;

      console.log(`   ℹ️  Total: ${totalSeconds} segundos (${minutes}:${seconds.toString().padStart(2, '0')})`);

      if (totalSeconds < 10) {
        warnings.push('⚠️  Video muy corto (< 10 segundos)');
      }
    }
    console.log('');

  } catch (error) {
    errors.push(`❌ Error de API: ${error.message}`);
  }

  // ============================================
  // RESUMEN FINAL
  // ============================================
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 RESUMEN DE VALIDACIÓN');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  if (errors.length === 0 && warnings.length === 0) {
    console.log('✅ VALIDACIÓN EXITOSA - Video 100% listo');
    console.log('   Todos los checks pasaron sin problemas\n');
    return { success: true, errors: [], warnings: [] };
  }

  if (errors.length > 0) {
    console.log('❌ VALIDACIÓN FALLIDA - Errores críticos detectados:\n');
    errors.forEach(err => console.log(`   ${err}`));
    console.log('');
  }

  if (warnings.length > 0) {
    console.log('⚠️  ADVERTENCIAS:\n');
    warnings.forEach(warn => console.log(`   ${warn}`));
    console.log('');
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  if (errors.length > 0) {
    console.log('🚨 ACCIÓN REQUERIDA:');
    console.log('   El video NO está listo para publicación.');
    console.log('   Corrige los errores críticos antes de continuar.\n');
    return { success: false, errors, warnings };
  } else {
    console.log('✅ Video listo con advertencias menores.');
    console.log('   Puedes proceder pero considera revisar las advertencias.\n');
    return { success: true, errors: [], warnings };
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  const videoId = process.argv[2];
  const playlistId = process.argv[3]; // Opcional

  if (!videoId) {
    console.error('\n❌ Error: Debes especificar el video ID');
    console.error('Uso: node validate-video-upload.js VIDEO_ID [PLAYLIST_ID]');
    console.error('\nEjemplo: node validate-video-upload.js IPCdbz49CNM PLYwKTflEBQts\n');
    process.exit(1);
  }

  const expectedMetadata = {
    privacyStatus: 'public',
    playlistId: playlistId
  };

  validateVideoUpload(videoId, expectedMetadata)
    .then(result => {
      if (result.success) {
        console.log('✅ Proceso completado exitosamente\n');
        process.exit(0);
      } else {
        console.log('❌ Validación fallida - se requiere acción manual\n');
        process.exit(1);
      }
    })
    .catch(err => {
      console.error('\n❌ Error fatal:', err.message);
      process.exit(1);
    });
}

module.exports = { validateVideoUpload };
