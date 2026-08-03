#!/usr/bin/env node

const fs = require('fs');
const { google } = require('googleapis');

const VIDEO_ID = 'jO5Hnmi31qI';
const THUMBNAIL_PATH = 'output/thumbnails/thumbnail-Jeremías-29-11.jpg';

async function uploadThumbnail() {
  console.log('📸 Subiendo thumbnail al video', VIDEO_ID);

  // Load OAuth token
  const token = JSON.parse(fs.readFileSync('youtube-token.json', 'utf8'));

  const oauth2Client = new google.auth.OAuth2(
    process.env.YOUTUBE_CLIENT_ID,
    process.env.YOUTUBE_CLIENT_SECRET,
    'http://localhost:3000/oauth2callback'
  );

  oauth2Client.setCredentials(token);

  const youtube = google.youtube({
    version: 'v3',
    auth: oauth2Client
  });

  try {
    const response = await youtube.thumbnails.set({
      videoId: VIDEO_ID,
      media: {
        body: fs.createReadStream(THUMBNAIL_PATH)
      }
    });

    console.log('✅ Thumbnail subido exitosamente!');
    console.log('   URL:', `https://i.ytimg.com/vi/${VIDEO_ID}/maxresdefault.jpg`);

  } catch (error) {
    console.error('❌ Error subiendo thumbnail:', error.message);
    process.exit(1);
  }
}

uploadThumbnail();
