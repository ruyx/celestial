#!/usr/bin/env node

/**
 * Actualiza thumbnail de video en YouTube
 * Usa YouTube Data API v3
 */

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

// Cargar credenciales y token
const CREDENTIALS_PATH = path.join(__dirname, '..', 'client_secret.json');
const TOKEN_PATH = path.join(__dirname, '..', 'youtube-token.json');

async function updateThumbnail(videoId, thumbnailPath) {
  console.log(`\n📺 Actualizando thumbnail en YouTube...`);
  console.log(`   Video ID: ${videoId}`);
  console.log(`   Thumbnail: ${path.basename(thumbnailPath)}\n`);

  // Validar archivo
  if (!fs.existsSync(thumbnailPath)) {
    throw new Error(`❌ Thumbnail no encontrado: ${thumbnailPath}`);
  }

  const stats = fs.statSync(thumbnailPath);
  console.log(`   Tamaño: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);

  // Cargar credenciales
  const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH));
  const token = JSON.parse(fs.readFileSync(TOKEN_PATH));

  const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
  oAuth2Client.setCredentials(token);

  const youtube = google.youtube({ version: 'v3', auth: oAuth2Client });

  // Subir thumbnail
  console.log(`\n⏳ Subiendo thumbnail a YouTube...`);

  const response = await youtube.thumbnails.set({
    videoId: videoId,
    media: {
      body: fs.createReadStream(thumbnailPath)
    }
  });

  console.log(`\n✅ Thumbnail actualizado exitosamente!`);
  console.log(`   Video: https://youtube.com/watch?v=${videoId}`);
  console.log(`   Thumbnail URL: ${response.data.items[0].default.url}\n`);

  return response.data;
}

// CLI
if (require.main === module) {
  const videoId = process.argv[2];
  const thumbnailPath = process.argv[3];

  if (!videoId || !thumbnailPath) {
    console.error(`
❌ USO: node update-youtube-thumbnail.js <video-id> <thumbnail-path>

EJEMPLO:
  node update-youtube-thumbnail.js IPCdbz49CNM output/thumbnails/thumbnail-final.png
`);
    process.exit(1);
  }

  updateThumbnail(videoId, thumbnailPath)
    .then(() => {
      console.log(`🎉 THUMBNAIL ACTUALIZADO EN YOUTUBE!\n`);
      process.exit(0);
    })
    .catch(err => {
      console.error(`❌ ERROR:`, err.message);
      if (err.errors) {
        console.error(JSON.stringify(err.errors, null, 2));
      }
      process.exit(1);
    });
}

module.exports = { updateThumbnail };
