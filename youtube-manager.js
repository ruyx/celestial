const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

// Paths
const TOKEN_PATH = path.join(__dirname, 'youtube-token.json');

// Cargar autenticación
function getAuthClient() {
  if (!fs.existsSync(TOKEN_PATH)) {
    throw new Error('No se encontró youtube-token.json. Ejecuta youtube-auth.js primero.');
  }

  const token = JSON.parse(fs.readFileSync(TOKEN_PATH));
  const credentials = JSON.parse(fs.readFileSync(path.join(__dirname, 'client_secret.json')));
  const { client_id, client_secret, redirect_uris } = credentials.installed;

  const oauth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    'http://localhost:8080/oauth2callback'
  );

  oauth2Client.setCredentials(token);
  return oauth2Client;
}

// ============================================
// GESTIÓN DE CANAL
// ============================================

async function updateChannelBranding(bannerUrl, description) {
  const auth = getAuthClient();
  const youtube = google.youtube({ version: 'v3', auth });

  try {
    // Actualizar descripción del canal
    const channelResponse = await youtube.channels.list({
      part: 'brandingSettings,id',
      mine: true
    });

    const channel = channelResponse.data.items[0];

    await youtube.channels.update({
      part: 'brandingSettings',
      requestBody: {
        id: channel.id,
        brandingSettings: {
          channel: {
            description: description,
            keywords: 'biblia,reina valera 1960,palabra de Dios,versículos bíblicos,reflexiones cristianas,devocional diario',
            defaultLanguage: 'es',
            country: 'ES'
          }
        }
      }
    });

    console.log('✅ Descripción del canal actualizada');

    // Nota: Para actualizar el banner necesitas usar la API de Channel Banners
    // que requiere subir la imagen primero
    if (bannerUrl) {
      console.log('⚠️  Para actualizar el banner, súbelo manualmente en YouTube Studio');
      console.log('   URL sugerida:', bannerUrl);
    }

    return channel;
  } catch (error) {
    console.error('❌ Error actualizando branding:', error.message);
    throw error;
  }
}

// ============================================
// GESTIÓN DE PLAYLISTS
// ============================================

async function createPlaylist(title, description, tags = []) {
  const auth = getAuthClient();
  const youtube = google.youtube({ version: 'v3', auth });

  try {
    const response = await youtube.playlists.insert({
      part: 'snippet,status',
      requestBody: {
        snippet: {
          title: title,
          description: description,
          tags: tags,
          defaultLanguage: 'es'
        },
        status: {
          privacyStatus: 'public'
        }
      }
    });

    console.log(`✅ Playlist creada: ${title} (ID: ${response.data.id})`);
    return response.data;
  } catch (error) {
    console.error('❌ Error creando playlist:', error.message);
    throw error;
  }
}

async function addVideoToPlaylist(playlistId, videoId) {
  const auth = getAuthClient();
  const youtube = google.youtube({ version: 'v3', auth });

  try {
    const response = await youtube.playlistItems.insert({
      part: 'snippet',
      requestBody: {
        snippet: {
          playlistId: playlistId,
          resourceId: {
            kind: 'youtube#video',
            videoId: videoId
          }
        }
      }
    });

    console.log(`✅ Video ${videoId} añadido a playlist ${playlistId}`);
    return response.data;
  } catch (error) {
    console.error('❌ Error añadiendo video a playlist:', error.message);
    throw error;
  }
}

async function listPlaylists() {
  const auth = getAuthClient();
  const youtube = google.youtube({ version: 'v3', auth });

  try {
    const response = await youtube.playlists.list({
      part: 'snippet,contentDetails',
      mine: true,
      maxResults: 50
    });

    console.log('\n📋 PLAYLISTS DEL CANAL:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    response.data.items.forEach(playlist => {
      console.log(`\n  ${playlist.snippet.title}`);
      console.log(`  ID: ${playlist.id}`);
      console.log(`  Videos: ${playlist.contentDetails.itemCount}`);
    });

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    return response.data.items;
  } catch (error) {
    console.error('❌ Error listando playlists:', error.message);
    throw error;
  }
}

// ============================================
// SUBIDA DE VIDEOS
// ============================================

async function uploadVideo(videoPath, metadata) {
  const auth = getAuthClient();
  const youtube = google.youtube({ version: 'v3', auth });

  const {
    title,
    description,
    tags = [],
    categoryId = '22', // 22 = People & Blogs
    privacyStatus = 'private', // 'private', 'unlisted', 'public'
    publishAt = null, // ISO 8601 datetime para programar
    madeForKids = false,
    thumbnailPath = null,
    playlistId = null
  } = metadata;

  try {
    console.log(`📤 Subiendo video: ${title}...`);

    const response = await youtube.videos.insert({
      part: 'snippet,status',
      requestBody: {
        snippet: {
          title: title,
          description: description,
          tags: tags,
          categoryId: categoryId,
          defaultLanguage: 'es',
          defaultAudioLanguage: 'es'
        },
        status: {
          privacyStatus: privacyStatus,
          selfDeclaredMadeForKids: madeForKids,
          publishAt: publishAt
        }
      },
      media: {
        body: fs.createReadStream(videoPath)
      }
    });

    const videoId = response.data.id;
    console.log(`✅ Video subido exitosamente!`);
    console.log(`   Video ID: ${videoId}`);
    console.log(`   URL: https://youtube.com/watch?v=${videoId}`);

    // Subir thumbnail si se especificó
    if (thumbnailPath && fs.existsSync(thumbnailPath)) {
      await youtube.thumbnails.set({
        videoId: videoId,
        media: {
          body: fs.createReadStream(thumbnailPath)
        }
      });
      console.log(`✅ Thumbnail personalizado subido`);
    }

    // Añadir a playlist si se especificó
    if (playlistId) {
      await addVideoToPlaylist(playlistId, videoId);
    }

    return response.data;
  } catch (error) {
    console.error('❌ Error subiendo video:', error.message);
    throw error;
  }
}

// ============================================
// ACTUALIZACIÓN DE METADATA DE VIDEO
// ============================================

async function updateVideoMetadata(videoId, updates) {
  const auth = getAuthClient();
  const youtube = google.youtube({ version: 'v3', auth });

  try {
    // Primero obtener metadata actual
    const currentVideo = await youtube.videos.list({
      part: 'snippet,status',
      id: videoId
    });

    if (!currentVideo.data.items.length) {
      throw new Error(`Video ${videoId} no encontrado`);
    }

    const video = currentVideo.data.items[0];

    // Mergear con las actualizaciones
    const updatedSnippet = {
      ...video.snippet,
      ...updates.snippet
    };

    const updatedStatus = {
      ...video.status,
      ...updates.status
    };

    const response = await youtube.videos.update({
      part: 'snippet,status',
      requestBody: {
        id: videoId,
        snippet: updatedSnippet,
        status: updatedStatus
      }
    });

    console.log(`✅ Metadata actualizada para video ${videoId}`);
    return response.data;
  } catch (error) {
    console.error('❌ Error actualizando metadata:', error.message);
    throw error;
  }
}

// ============================================
// ESTADÍSTICAS Y ANALÍTICAS
// ============================================

async function getVideoStats(videoId) {
  const auth = getAuthClient();
  const youtube = google.youtube({ version: 'v3', auth });

  try {
    const response = await youtube.videos.list({
      part: 'statistics,snippet',
      id: videoId
    });

    const video = response.data.items[0];

    console.log(`\n📊 ESTADÍSTICAS: ${video.snippet.title}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Vistas:', video.statistics.viewCount);
    console.log('Likes:', video.statistics.likeCount);
    console.log('Comentarios:', video.statistics.commentCount);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    return video.statistics;
  } catch (error) {
    console.error('❌ Error obteniendo estadísticas:', error.message);
    throw error;
  }
}

async function getChannelAnalytics(startDate, endDate) {
  const auth = getAuthClient();
  const youtubeAnalytics = google.youtubeAnalytics({ version: 'v2', auth });

  try {
    // Primero obtener el channel ID
    const youtube = google.youtube({ version: 'v3', auth });
    const channelResponse = await youtube.channels.list({
      part: 'id',
      mine: true
    });

    const channelId = channelResponse.data.items[0].id;

    const response = await youtubeAnalytics.reports.query({
      ids: `channel==${channelId}`,
      startDate: startDate,
      endDate: endDate,
      metrics: 'views,estimatedMinutesWatched,averageViewDuration,subscribersGained,subscribersLost',
      dimensions: 'day'
    });

    console.log('\n📈 ANALÍTICAS DEL CANAL');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Período:', startDate, 'a', endDate);
    console.log('Datos:', response.data.rows);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    return response.data;
  } catch (error) {
    console.error('❌ Error obteniendo analíticas:', error.message);
    throw error;
  }
}

// ============================================
// GESTIÓN DE COMENTARIOS
// ============================================

async function listComments(videoId, maxResults = 20) {
  const auth = getAuthClient();
  const youtube = google.youtube({ version: 'v3', auth });

  try {
    const response = await youtube.commentThreads.list({
      part: 'snippet',
      videoId: videoId,
      maxResults: maxResults,
      order: 'time'
    });

    console.log(`\n💬 COMENTARIOS DEL VIDEO ${videoId}:`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    response.data.items.forEach(item => {
      const comment = item.snippet.topLevelComment.snippet;
      console.log(`\n  ${comment.authorDisplayName}:`);
      console.log(`  ${comment.textDisplay}`);
      console.log(`  👍 ${comment.likeCount} | ${comment.publishedAt.split('T')[0]}`);
    });

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    return response.data.items;
  } catch (error) {
    console.error('❌ Error listando comentarios:', error.message);
    throw error;
  }
}

async function replyToComment(commentId, text) {
  const auth = getAuthClient();
  const youtube = google.youtube({ version: 'v3', auth });

  try {
    const response = await youtube.comments.insert({
      part: 'snippet',
      requestBody: {
        snippet: {
          parentId: commentId,
          textOriginal: text
        }
      }
    });

    console.log(`✅ Respuesta publicada al comentario ${commentId}`);
    return response.data;
  } catch (error) {
    console.error('❌ Error respondiendo comentario:', error.message);
    throw error;
  }
}

// ============================================
// BÚSQUEDA DE VIDEOS EXISTENTES
// ============================================

async function listMyVideos(maxResults = 50) {
  const auth = getAuthClient();
  const youtube = google.youtube({ version: 'v3', auth });

  try {
    const response = await youtube.search.list({
      part: 'snippet',
      forMine: true,
      type: 'video',
      maxResults: maxResults,
      order: 'date'
    });

    console.log('\n🎥 MIS VIDEOS:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    response.data.items.forEach(video => {
      console.log(`\n  ${video.snippet.title}`);
      console.log(`  ID: ${video.id.videoId}`);
      console.log(`  Publicado: ${video.snippet.publishedAt.split('T')[0]}`);
    });

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    return response.data.items;
  } catch (error) {
    console.error('❌ Error listando videos:', error.message);
    throw error;
  }
}

// Exportar todas las funciones
module.exports = {
  // Canal
  updateChannelBranding,

  // Playlists
  createPlaylist,
  addVideoToPlaylist,
  listPlaylists,

  // Videos
  uploadVideo,
  updateVideoMetadata,
  listMyVideos,

  // Analíticas
  getVideoStats,
  getChannelAnalytics,

  // Comentarios
  listComments,
  replyToComment
};

// Si se ejecuta directamente, mostrar ayuda
if (require.main === module) {
  console.log('\n📚 YOUTUBE MANAGER - Funciones disponibles:\n');
  console.log('const yt = require("./youtube-manager.js");');
  console.log('');
  console.log('// Gestión de canal');
  console.log('await yt.updateChannelBranding(bannerUrl, description);');
  console.log('');
  console.log('// Playlists');
  console.log('await yt.createPlaylist(title, description, tags);');
  console.log('await yt.listPlaylists();');
  console.log('await yt.addVideoToPlaylist(playlistId, videoId);');
  console.log('');
  console.log('// Subida de videos');
  console.log('await yt.uploadVideo(videoPath, metadata);');
  console.log('await yt.updateVideoMetadata(videoId, updates);');
  console.log('await yt.listMyVideos();');
  console.log('');
  console.log('// Analíticas');
  console.log('await yt.getVideoStats(videoId);');
  console.log('await yt.getChannelAnalytics(startDate, endDate);');
  console.log('');
  console.log('// Comentarios');
  console.log('await yt.listComments(videoId);');
  console.log('await yt.replyToComment(commentId, text);');
  console.log('');
}
