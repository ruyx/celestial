// WebSocket polyfill para Node.js 18-20
if (typeof WebSocket === 'undefined') {
  global.WebSocket = require('ws');
}

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://qhlqrflccdgpslozzfyh.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFobHFyZmxjY2RncHNsb3p6ZnloIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDgwOTQ1NywiZXhwIjoyMTAwMzg1NDU3fQ.lzRV3LtTkTouqYkd6vT1ypUd-c84xXKGIJc5XrZvYO4';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false }
});

async function register() {
  console.log('\n📝 Registrando Isaías 41:10 en published_videos...\n');
  
  const { data, error } = await supabase
    .from('published_videos')
    .upsert([{
      verse: 'Isaías 41:10',
      youtube_id: 'W9KFa96S9_E',
      youtube_url: 'https://youtube.com/watch?v=W9KFa96S9_E',
      status: 'published',
      video_metadata_path: 'output/youtube-metadata/youtube-metadata-Isaías-41-10.json',
      published_at: new Date().toISOString()
    }], {
      onConflict: 'verse'
    })
    .select();

  if (error) {
    console.error('❌ Error:', error.message);
    console.error('   Code:', error.code);
    console.error('   Details:', error.details);
    process.exit(1);
  }

  console.log('✅ Video registrado exitosamente en Supabase:');
  console.table(data.map(v => ({
    verse: v.verse,
    youtube_id: v.youtube_id,
    status: v.status,
    published: new Date(v.published_at).toLocaleString()
  })));
  
  console.log('\n🔗 URL del video: https://youtube.com/watch?v=W9KFa96S9_E\n');
}

register();
