#!/usr/bin/env node
/**
 * GET CHANNEL INFO
 * Obtiene información del canal autenticado para reemplazar placeholders
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

async function getChannelInfo() {
  const auth = getAuthClient();
  const youtube = google.youtube({ version: 'v3', auth });

  try {
    const response = await youtube.channels.list({
      part: 'snippet,contentDetails,statistics',
      mine: true
    });

    if (!response.data.items || response.data.items.length === 0) {
      throw new Error('No se encontró el canal');
    }

    const channel = response.data.items[0];
    const channelInfo = {
      id: channel.id,
      title: channel.snippet.title,
      description: channel.snippet.description,
      customUrl: channel.snippet.customUrl,
      handle: channel.snippet.customUrl, // @handle
      subscriberCount: channel.statistics.subscriberCount,
      videoCount: channel.statistics.videoCount,
      viewCount: channel.statistics.viewCount,
      subscribeUrl: `https://www.youtube.com/${channel.snippet.customUrl}?sub_confirmation=1`,
      channelUrl: `https://www.youtube.com/${channel.snippet.customUrl}`
    };

    console.log('\n📺 INFORMACIÓN DEL CANAL');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log(`   Nombre: ${channelInfo.title}`);
    console.log(`   Handle: ${channelInfo.handle}`);
    console.log(`   ID: ${channelInfo.id}`);
    console.log(`   URL: ${channelInfo.channelUrl}`);
    console.log(`   Suscriptores: ${parseInt(channelInfo.subscriberCount).toLocaleString()}`);
    console.log(`   Videos: ${channelInfo.videoCount}`);
    console.log(`   Vistas totales: ${parseInt(channelInfo.viewCount).toLocaleString()}\n`);
    console.log(`✅ URL de suscripción: ${channelInfo.subscribeUrl}\n`);

    return channelInfo;
  } catch (error) {
    console.error('❌ Error obteniendo información del canal:', error.message);
    throw error;
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  getChannelInfo()
    .then(info => {
      console.log('✅ Información obtenida exitosamente\n');
      process.exit(0);
    })
    .catch(err => {
      console.error('\n❌ Error fatal:', err.message);
      process.exit(1);
    });
}

module.exports = { getChannelInfo };
