#!/usr/bin/env node
/**
 * UPLOAD TO YOUTUBE V2 - Con validación completa y procesamiento automático
 *
 * Mejoras vs V1:
 * ✅ Procesa metadata automáticamente (reemplaza @TuCanal con @rey-celestial)
 * ✅ Busca y sube thumbnail automáticamente (FTP o local)
 * ✅ Ejecuta validación post-upload para garantizar 100% completitud
 * ✅ Logs detallados de cada paso
 * ✅ Manejo robusto de errores
 */

// WebSocket polyfill para Node.js 18
if (typeof WebSocket === 'undefined') {
  global.WebSocket = require('ws');
}

const fs = require('fs');
const path = require('path');
const { uploadVideo, listPlaylists } = require('./youtube-manager.js');
const { processMetadata, loadPlaylists } = require('./process-metadata.js');
const { validateVideoUpload } = require('./validate-video-upload.js');
const { createClient } = require('@supabase/supabase-js');

// Configuración
const FINAL_VIDEOS_DIR = path.join(__dirname, 'output', 'final-videos');
const YOUTUBE_METADATA_DIR = path.join(__dirname, 'output', 'youtube-metadata');
const FTP_THUMBNAILS_BASE_URL = 'https://project-yt.ruydejesus.com/thumbnails';

// Configuración Supabase para registro de videos publicados
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://qhlqrflccdgpslozzfyh.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Inicializar cliente Supabase si la key está configurada
let supabase = null;
if (SUPABASE_SERVICE_KEY) {
  supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  console.log('✅ Supabase client inicializado para registro de videos publicados');
} else {
  console.log('⚠️  SUPABASE_SERVICE_ROLE_KEY no configurada - registro de publicados deshabilitado');
}

/**
 * 📝 REGISTRAR VIDEO PUBLICADO EN SUPABASE
 * Inserta un registro en published_videos para tracking de deduplicación
 * Usa fail-open: Si falla, NO bloquea el upload (solo logea error)
 */
async function registerPublishedVideo(videoData) {
  if (!supabase) {
    console.log('⚠️  Supabase no configurado - saltando registro de video publicado');
    return { success: false, reason: 'Supabase not configured' };
  }

  try {
    console.log('\n📝 Registrando video publicado en Supabase...');
    console.log(`   Versículo: ${videoData.verse}`);
    console.log(`   YouTube ID: ${videoData.youtube_id}`);

    const { data, error } = await supabase
      .from('published_videos')
      .insert([
        {
          verse: videoData.verse,
          youtube_id: videoData.youtube_id,
          youtube_url: videoData.youtube_url,
          video_metadata_path: videoData.video_metadata_path,
          image_metadata_path: videoData.image_metadata_path,
          status: 'published',
          published_at: new Date().toISOString()
        }
      ])
      .select();

    if (error) {
      // PGRST116 = tabla no existe aún (migración no aplicada)
      if (error.code === 'PGRST116' || error.code === '42P01') {
        console.log('⚠️  Tabla published_videos no existe - migración pendiente');
        console.log('   (El video se subió correctamente, pero no se registró en BD)');
        return { success: false, reason: 'Table does not exist', error: error.code };
      }

      // 23505 = duplicate key (versículo ya registrado)
      if (error.code === '23505') {
        console.log('⚠️  Versículo ya registrado previamente en published_videos');
        console.log('   (Esto no debería pasar si el Guardian funcionó correctamente)');
        return { success: false, reason: 'Already registered', error: error.code };
      }

      throw error;
    }

    console.log('✅ Video registrado exitosamente en published_videos');
    console.log(`   ID de registro: ${data[0].id}`);
    return { success: true, data: data[0] };

  } catch (error) {
    console.error('❌ Error registrando video publicado en Supabase:', error.message);
    console.error('   Stack:', error.stack);
    console.log('⚠️  Continuando sin registro (fail-open) - el video SÍ se subió a YouTube');

    // Fail-open: NO fallar el upload por error de BD
    return { success: false, reason: error.message, error: error.code };
  }
}

async function uploadVideoToYouTube(verse) {
  console.log('\n🚀 AGENT 8: YouTube Upload V2 (con validación completa)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  try {
    // ============================================
    // PASO 1: Buscar archivos del versículo
    // ============================================
    const verseForFilename = verse.replace(/\s+/g, '-').replace(/:/g, '-');

    // 1.1 Buscar video final
    const videoPath = path.join(FINAL_VIDEOS_DIR, `final-${verseForFilename}.mp4`);
    if (!fs.existsSync(videoPath)) {
      throw new Error(`Video final no encontrado: ${videoPath}`);
    }

    const videoSize = (fs.statSync(videoPath).size / (1024 * 1024)).toFixed(2);
    console.log(`[1/7] 📹 Video encontrado: ${path.basename(videoPath)}`);
    console.log(`      Tamaño: ${videoSize} MB\n`);

    // 1.2 Buscar thumbnail (local o FTP)
    let thumbnailPath = null;

    // Buscar en /tmp primero
    const tmpThumbnail = `/tmp/thumbnail-${verseForFilename}.jpg`;
    if (fs.existsSync(tmpThumbnail)) {
      thumbnailPath = tmpThumbnail;
      console.log(`[2/7] 📸 Thumbnail encontrado (local): ${thumbnailPath}\n`);
    } else {
      // Buscar en FTP
      const ftpThumbnailUrl = `${FTP_THUMBNAILS_BASE_URL}/${verseForFilename}.jpg`;
      console.log(`[2/7] 📸 Thumbnail no encontrado localmente`);
      console.log(`      Verificando FTP: ${ftpThumbnailUrl}\n`);

      // Descargar desde FTP
      try {
        const { exec } = require('child_process');
        const downloadPath = `/tmp/thumbnail-${verseForFilename}-downloaded.jpg`;

        await new Promise((resolve, reject) => {
          exec(`curl -s -o ${downloadPath} ${ftpThumbnailUrl}`, (error, stdout, stderr) => {
            if (error) reject(error);
            else resolve();
          });
        });

        if (fs.existsSync(downloadPath) && fs.statSync(downloadPath).size > 1000) {
          thumbnailPath = downloadPath;
          console.log(`      ✅ Thumbnail descargado desde FTP\n`);
        }
      } catch (err) {
        console.warn(`      ⚠️  No se pudo descargar thumbnail desde FTP: ${err.message}\n`);
      }
    }

    if (!thumbnailPath) {
      console.warn(`      ⚠️  ADVERTENCIA: No se encontró thumbnail - se subirá sin thumbnail personalizado\n`);
    }

    // ============================================
    // PASO 2: Cargar y procesar metadata
    // ============================================
    console.log(`[3/7] 📋 Cargando metadata de YouTube...\n`);

    const metadataFiles = fs.readdirSync(YOUTUBE_METADATA_DIR)
      .filter(file => file.includes(verseForFilename) && file.endsWith('.json') && !file.includes('-processed'));

    if (metadataFiles.length === 0) {
      throw new Error(`Metadata de YouTube no encontrada para: ${verse}`);
    }

    const metadataPath = path.join(YOUTUBE_METADATA_DIR, metadataFiles[0]);
    const rawMetadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));

    console.log(`      Título: ${rawMetadata.youtube.title}`);
    console.log(`      Descripción: ${rawMetadata.youtube.description.substring(0, 100)}...`);
    console.log(`      Tags: ${rawMetadata.youtube.tags.length} tags`);
    console.log(`      Categoría: ${rawMetadata.youtube.categoryId}\n`);

    // Procesar metadata (reemplazar placeholders)
    console.log(`[4/7] 🔄 Procesando metadata (reemplazando placeholders)...\n`);
    const playlistsMap = await loadPlaylists();
    const ytMetadata = await processMetadata(rawMetadata, playlistsMap);

    // ============================================
    // PASO 3: Buscar playlist destino
    // ============================================
    console.log(`[5/7] 📁 Buscando playlists del canal...\n`);
    const playlists = await listPlaylists();

    const targetPlaylist = playlists.find(p =>
      p.snippet.title.toLowerCase().includes('versículos') ||
      p.snippet.title.toLowerCase().includes('daily') ||
      p.snippet.title.toLowerCase().includes('diario')
    );

    const playlistId = targetPlaylist ? targetPlaylist.id : null;
    if (playlistId) {
      console.log(`      ✅ Playlist encontrada: ${targetPlaylist.snippet.title} (${playlistId})\n`);
    } else {
      console.log(`      ⚠️  No se encontró playlist automáticamente\n`);
    }

    // ============================================
    // PASO 4: Preparar metadata de upload
    // ============================================
    console.log(`[6/7] 📤 Preparando upload a YouTube...\n`);

    // Filtrar tags problemáticos
    const cleanTags = ytMetadata.youtube.tags
      .filter(tag => tag && tag.trim().length > 0)
      .filter(tag => tag.length <= 30)
      .map(tag => tag.replace(/[:;]/g, ''))
      .filter(tag => tag.trim().length > 0)
      .slice(0, 15);

    console.log(`      Tags filtrados: ${cleanTags.length}/${ytMetadata.youtube.tags.length}`);
    console.log(`      Thumbnail: ${thumbnailPath ? '✅ Incluido' : '❌ No disponible'}\n`);

    const uploadMetadata = {
      title: ytMetadata.youtube.title,
      description: ytMetadata.youtube.description,
      tags: cleanTags,
      categoryId: ytMetadata.youtube.categoryId.toString(),
      privacyStatus: 'public',
      madeForKids: false,
      thumbnailPath: thumbnailPath, // ← CRÍTICO: Incluir thumbnail
      playlistId: playlistId
    };

    // ============================================
    // PASO 5: Subir video
    // ============================================
    console.log('      Subiendo video a YouTube...');
    console.log('      (Esto puede tardar varios minutos)\n');

    const uploadResult = await uploadVideo(videoPath, uploadMetadata);

    // ============================================
    // PASO 6: Guardar resultado
    // ============================================
    const resultPath = path.join(YOUTUBE_METADATA_DIR, `upload-result-${verseForFilename}.json`);
    fs.writeFileSync(resultPath, JSON.stringify({
      videoId: uploadResult.id,
      verse: verse,
      uploadedAt: new Date().toISOString(),
      videoUrl: `https://youtube.com/watch?v=${uploadResult.id}`,
      title: uploadResult.snippet.title,
      status: uploadResult.status.uploadStatus,
      privacyStatus: uploadResult.status.privacyStatus,
      playlistId: playlistId,
      thumbnailIncluded: thumbnailPath !== null
    }, null, 2));

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ VIDEO SUBIDO EXITOSAMENTE A YOUTUBE');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`\n📺 URL del video: https://youtube.com/watch?v=${uploadResult.id}`);
    console.log(`📄 Resultado guardado: ${resultPath}\n`);

    // ============================================
    // PASO 6.5: REGISTRAR VIDEO PUBLICADO EN SUPABASE
    // ============================================
    // Buscar el archivo de metadata de imágenes para referencia
    const imageMetadataFiles = fs.readdirSync(path.join(__dirname, 'output', 'image-metadata'))
      .filter(file => file.includes(verseForFilename) && file.endsWith('.json'));
    const imageMetadataPath = imageMetadataFiles.length > 0
      ? path.join(__dirname, 'output', 'image-metadata', imageMetadataFiles[0])
      : null;

    await registerPublishedVideo({
      verse: verse,
      youtube_id: uploadResult.id,
      youtube_url: `https://youtube.com/watch?v=${uploadResult.id}`,
      video_metadata_path: resultPath,
      image_metadata_path: imageMetadataPath
    });

    // ============================================
    // PASO 7: VALIDACIÓN POST-UPLOAD
    // ============================================
    console.log(`[7/7] 🔍 Ejecutando validación post-upload...\n`);

    const validation = await validateVideoUpload(uploadResult.id, {
      privacyStatus: 'public',
      playlistId: playlistId
    });

    if (!validation.success) {
      console.error('\n⚠️  ADVERTENCIA: La validación detectó problemas');
      console.error('    El video fue subido pero no está 100% completo');
      console.error('    Revisa los errores arriba y corrígelos manualmente\n');
    }

    return uploadResult;

  } catch (error) {
    console.error('\n❌ Error en Agent 8 (YouTube Upload):');
    console.error('   ', error.message);

    if (error.message.includes('youtube-token.json')) {
      console.error('\n💡 Solución: Ejecuta primero el script de autenticación:');
      console.error('   node youtube-auth.js\n');
    } else if (error.message.includes('quota')) {
      console.error('\n💡 Has alcanzado el límite de cuota de YouTube API.');
      console.error('   Las cuotas se resetean diariamente a las 12:00 AM PST.\n');
    }

    throw error;
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  const verse = process.argv[2];

  if (!verse) {
    console.error('\n❌ Error: Debes especificar el versículo');
    console.error('Uso: node upload-to-youtube-v2.js "Salmos 23:1"\n');
    process.exit(1);
  }

  uploadVideoToYouTube(verse)
    .then(() => {
      console.log('✅ Proceso completado exitosamente\n');
      process.exit(0);
    })
    .catch(err => {
      console.error('\n❌ Error fatal:', err.message);
      process.exit(1);
    });
}

module.exports = { uploadVideoToYouTube };
