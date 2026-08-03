#!/usr/bin/env node
/**
 * Script para insertar videos ya publicados en YouTube
 * Evita que el sistema los regenere
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: { persistSession: false },
    realtime: { enabled: false },
    global: { headers: { 'x-my-custom-header': 'insert-published-videos' } }
  }
);

async function insertPublishedVideos() {
  console.log('\n📋 Insertando videos ya publicados en YouTube...\n');

  const videosToInsert = [
    {
      verse: 'Romanos 8:28',
      status: 'published',
      youtube_id: null,
      youtube_url: null,
      published_at: new Date().toISOString()
    },
    {
      verse: 'Salmos 23:1',
      status: 'published',
      youtube_id: null,
      youtube_url: null,
      published_at: new Date().toISOString()
    }
  ];

  for (const video of videosToInsert) {
    console.log(`\n🎬 Insertando: ${video.verse}`);

    try {
      // Usar upsert para evitar errores si ya existe
      const { data, error } = await supabase
        .from('published_videos')
        .upsert(
          video,
          {
            onConflict: 'verse',
            ignoreDuplicates: false // Actualizar si ya existe
          }
        )
        .select();

      if (error) {
        console.error(`   ❌ Error: ${error.message}`);
        continue;
      }

      console.log(`   ✅ Insertado correctamente`);
    } catch (err) {
      console.error(`   ❌ Error inesperado: ${err.message}`);
    }
  }

  // Verificar inserción
  console.log('\n\n🔍 Verificando inserción...\n');

  const { data: allPublished, error: queryError } = await supabase
    .from('published_videos')
    .select('verse, status, youtube_id, published_at')
    .in('verse', ['Romanos 8:28', 'Salmos 23:1'])
    .order('verse');

  if (queryError) {
    console.error(`❌ Error al verificar: ${queryError.message}`);
    process.exit(1);
  }

  console.log('Videos publicados encontrados:');
  console.table(allPublished);

  console.log('\n✅ Proceso completado exitosamente\n');
}

insertPublishedVideos().catch(err => {
  console.error('❌ Error fatal:', err);
  process.exit(1);
});
