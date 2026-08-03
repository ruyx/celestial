#!/usr/bin/env node

/**
 * GUARDIAN DE DEDUPLICACIÓN (Versión Simplificada)
 *
 * RESPONSABILIDAD ÚNICA: Verificar si un versículo ya fue publicado
 *
 * El auto-loop es manejado por agent-server.js para evitar
 * dependencias circulares (Guardian no llama a Agent 0 vía HTTP)
 *
 * Filosofía: Simple, rápido, sin dependencias externas
 */

// WebSocket polyfill para Node.js 18
if (typeof WebSocket === 'undefined') {
  global.WebSocket = require('ws');
}

const { createClient } = require('@supabase/supabase-js');

// Configuración Supabase
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://qhlqrflccdgpslozzfyh.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ Error: SUPABASE_SERVICE_ROLE_KEY no configurada');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

/**
 * Verifica si un versículo ya fue publicado
 */
async function checkDeduplication(verse) {
  console.log(`\n👼 Guardian Deduplicación: Verificando "${verse}"...`);

  try {
    // Consultar tabla published_videos
    const { data, error } = await supabase
      .from('published_videos')
      .select('*')
      .eq('verse', verse)
      .eq('status', 'published')
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = "no rows returned", que es OK (no duplicado)
      throw error;
    }

    if (data) {
      console.log(`❌ DUPLICADO DETECTADO:`);
      console.log(`   Versículo: ${data.verse}`);
      console.log(`   YouTube ID: ${data.youtube_id || 'N/A'}`);
      console.log(`   Publicado: ${data.published_at}`);
      console.log(`   URL: ${data.youtube_url || 'N/A'}`);

      return {
        isDuplicate: true,
        reason: `El versículo "${verse}" ya fue publicado`,
        existingVideo: {
          verse: data.verse,
          youtubeId: data.youtube_id,
          youtubeUrl: data.youtube_url,
          publishedAt: data.published_at
        }
      };
    }

    console.log(`✅ Versículo "${verse}" no está publicado - puede continuar`);
    return {
      isDuplicate: false,
      reason: 'Versículo no encontrado en published_videos',
      verse
    };

  } catch (error) {
    console.error(`❌ Error consultando Supabase:`, error.message);

    // En caso de error de BD, permitir continuar (fail-open)
    // para no bloquear el pipeline por problemas temporales
    console.log(`⚠️  Permitiendo continuar por error de BD (fail-open)`);
    return {
      isDuplicate: false,
      reason: `Error de BD (fail-open): ${error.message}`,
      verse,
      warning: true
    };
  }
}

/**
 * EJECUCIÓN PRINCIPAL (CLI)
 */
async function main() {
  const verse = process.argv[2];

  if (!verse) {
    console.error(`
❌ Uso: node guardian-deduplication.js "<versículo>"

Ejemplos:
  node guardian-deduplication.js "Salmos 23:1"
  node guardian-deduplication.js "Juan 3:16"
`);
    process.exit(1);
  }

  const result = await checkDeduplication(verse);

  // Imprimir resultado en JSON para que agent-server.js lo pueda parsear
  console.log('\n📊 RESULTADO:');
  console.log(JSON.stringify(result, null, 2));

  // Exit code 0 siempre - agent-server maneja el auto-loop
  console.log('\n✅ Verificación completada');
  process.exit(0);
}

if (require.main === module) {
  main().catch(error => {
    console.error('\n❌ Error fatal:', error);
    console.log('\n📊 RESULTADO ERROR:');
    console.log(JSON.stringify({
      isDuplicate: false, // fail-open en caso de error crítico
      error: error.message,
      warning: true
    }, null, 2));
    process.exit(0); // Exit 0 para no bloquear el pipeline
  });
}

module.exports = { checkDeduplication };
