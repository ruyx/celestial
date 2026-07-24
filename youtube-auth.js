const { google } = require('googleapis');
const http = require('http');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Paths
const CLIENT_SECRET_PATH = path.join(__dirname, 'client_secret.json');
const TOKEN_PATH = path.join(__dirname, 'youtube-token.json');

// Scopes necesarios para gestionar el canal completo
const SCOPES = [
  'https://www.googleapis.com/auth/youtube',
  'https://www.googleapis.com/auth/youtube.force-ssl',
  'https://www.googleapis.com/auth/youtube.upload',
  'https://www.googleapis.com/auth/youtubepartner'
];

async function authenticate() {
  // Leer credenciales
  const credentials = JSON.parse(fs.readFileSync(CLIENT_SECRET_PATH));
  const { client_id, client_secret, redirect_uris } = credentials.installed;

  // Usar puerto 8080 (puerto 3000 ocupado por Next.js)
  const redirectUri = 'http://localhost:8080/oauth2callback';

  const oauth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirectUri
  );

  // Verificar si ya tenemos un token guardado
  if (fs.existsSync(TOKEN_PATH)) {
    const token = JSON.parse(fs.readFileSync(TOKEN_PATH));
    oauth2Client.setCredentials(token);
    console.log('✅ Token existente cargado');
    return oauth2Client;
  }

  // Generar URL de autorización
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });

  console.log('🔐 Abriendo navegador para autenticación...');
  console.log('URL:', authUrl);

  // Intentar abrir con wslview (WSL)
  try {
    spawn('wslview', [authUrl], { detached: true });
  } catch (err) {
    console.log('\n⚠️  No se pudo abrir automáticamente.');
    console.log('Por favor abre esta URL en tu navegador:\n');
    console.log(authUrl);
    console.log('');
  }

  // Crear servidor HTTP temporal para recibir el callback
  return new Promise((resolve, reject) => {
    const server = http.createServer(async (req, res) => {
      if (req.url.indexOf('/oauth2callback') > -1) {
        const qs = new URL(req.url, redirectUri).searchParams;
        const code = qs.get('code');

        res.end('✅ Autenticación exitosa! Puedes cerrar esta ventana.');
        server.close();

        try {
          const { tokens } = await oauth2Client.getToken(code);
          oauth2Client.setCredentials(tokens);

          // Guardar token
          fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens));
          console.log('\n✅ Token guardado en:', TOKEN_PATH);
          console.log('✅ Autenticación completada!\n');

          resolve(oauth2Client);
        } catch (err) {
          reject(err);
        }
      }
    });

    server.listen(8080, () => {
      console.log('🌐 Servidor OAuth escuchando en http://localhost:8080');
    });
  });
}

// Función auxiliar para obtener info del canal
async function getChannelInfo(auth) {
  const youtube = google.youtube({ version: 'v3', auth });

  const response = await youtube.channels.list({
    part: 'snippet,statistics,contentDetails',
    mine: true
  });

  const channel = response.data.items[0];

  console.log('\n📺 CANAL CONECTADO:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Nombre:', channel.snippet.title);
  console.log('ID:', channel.id);
  console.log('Suscriptores:', channel.statistics.subscriberCount);
  console.log('Videos:', channel.statistics.videoCount);
  console.log('Vistas totales:', channel.statistics.viewCount);
  console.log('Creado:', channel.snippet.publishedAt.split('T')[0]);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  return channel;
}

// Main
(async () => {
  try {
    console.log('🚀 Iniciando autenticación con YouTube...\n');
    const auth = await authenticate();
    await getChannelInfo(auth);

    console.log('✅ LISTO! Ahora puedes usar la API de YouTube.');
    console.log('📝 Token guardado en:', TOKEN_PATH);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
})();
