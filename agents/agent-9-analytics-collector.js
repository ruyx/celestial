#!/usr/bin/env node

// ============================================================================
// AGENT 9: ANALYTICS COLLECTOR
// ============================================================================
// Proyecto: Rey Celestial - YouTube Bible Automation
// Propósito: Recolectar métricas de YouTube y almacenarlas en Supabase
// ============================================================================

const { createClient } = require('@supabase/supabase-js');
const youtubeManager = require('../youtube-manager');
require('dotenv').config();

// ============================================================================
// CONFIGURACIÓN
// ============================================================================

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Error: SUPABASE_URL y SUPABASE_SERVICE_KEY deben estar configuradas en .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// ============================================================================
// FUNCIONES DE CÁLCULO
// ============================================================================

/**
 * Calcula tasas de engagement
 */
function calculateEngagementRates(stats) {
  const views = parseInt(stats.viewCount) || 0;
  const likes = parseInt(stats.likeCount) || 0;
  const comments = parseInt(stats.commentCount) || 0;

  if (views === 0) {
    return {
      engagementRate: 0,
      likeRate: 0,
      commentRate: 0
    };
  }

  return {
    engagementRate: ((likes + comments) / views * 100).toFixed(2),
    likeRate: (likes / views * 100).toFixed(2),
    commentRate: (comments / views * 100).toFixed(2)
  };
}

/**
 * Calcula performance score usando la misma lógica de la función SQL
 */
function calculatePerformanceScore(views, likes, comments, engagementRate) {
  let score = 0;

  // Componente de vistas (max 3 puntos)
  if (views >= 10000) score += 3;
  else if (views >= 5000) score += 2;
  else if (views >= 1000) score += 1;

  // Componente de engagement rate (max 4 puntos)
  const engRate = parseFloat(engagementRate);
  if (engRate >= 10.0) score += 4;
  else if (engRate >= 7.0) score += 3;
  else if (engRate >= 5.0) score += 2;
  else if (engRate >= 3.0) score += 1;

  // Componente de likes (max 2 puntos)
  if (likes >= 500) score += 2;
  else if (likes >= 100) score += 1;

  // Componente de comentarios (max 1 punto)
  if (comments >= 50) score += 1;

  return Math.min(score, 10); // Cap en 10
}

// ============================================================================
// RECOLECCIÓN DE MÉTRICAS
// ============================================================================

/**
 * Recolecta métricas de un solo video
 */
async function collectVideoMetrics(verse) {
  try {
    console.log(`\n📊 Recolectando métricas para: ${verse.reference}`);

    // Obtener estadísticas de YouTube
    const stats = await youtubeManager.getVideoStats(verse.video_id);

    // Calcular tasas
    const rates = calculateEngagementRates(stats);

    // Calcular performance score
    const performanceScore = calculatePerformanceScore(
      parseInt(stats.viewCount) || 0,
      parseInt(stats.likeCount) || 0,
      parseInt(stats.commentCount) || 0,
      rates.engagementRate
    );

    // Preparar registro para Supabase
    const analyticsRecord = {
      verse_id: verse.id,
      video_id: verse.video_id,
      reference: verse.reference,
      views: parseInt(stats.viewCount) || 0,
      likes: parseInt(stats.likeCount) || 0,
      dislikes: 0, // YouTube API ya no devuelve dislikes públicos
      comments: parseInt(stats.commentCount) || 0,
      shares: 0, // No disponible en API pública
      watch_time_minutes: 0, // Requiere YouTube Analytics API
      average_view_duration_seconds: 0, // Requiere YouTube Analytics API
      engagement_rate: parseFloat(rates.engagementRate),
      like_rate: parseFloat(rates.likeRate),
      comment_rate: parseFloat(rates.commentRate),
      performance_score: performanceScore,
      viral_potential_score: verse.viral_potential,
      collected_at: new Date().toISOString(),
      collection_type: 'scheduled'
    };

    // Guardar en Supabase
    const { data, error } = await supabase
      .from('video_analytics')
      .insert([analyticsRecord]);

    if (error) {
      console.error(`   ❌ Error guardando analytics para ${verse.reference}:`, error.message);
      return null;
    }

    console.log(`   ✅ Métricas guardadas`);
    console.log(`      Vistas: ${analyticsRecord.views}`);
    console.log(`      Likes: ${analyticsRecord.likes}`);
    console.log(`      Comentarios: ${analyticsRecord.comments}`);
    console.log(`      Engagement: ${analyticsRecord.engagement_rate}%`);
    console.log(`      Performance Score: ${analyticsRecord.performance_score}/10`);
    console.log(`      Viral Potential (predicción): ${analyticsRecord.viral_potential_score}/10`);

    return analyticsRecord;
  } catch (error) {
    console.error(`   ❌ Error recolectando métricas para ${verse.reference}:`, error.message);
    return null;
  }
}

/**
 * Recolecta métricas de todos los videos publicados
 */
async function collectAllMetrics(options = {}) {
  const {
    limit = null,           // Límite de videos a procesar (null = todos)
    minDaysSincePublish = 1 // Mínimo de días desde publicación
  } = options;

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 AGENT 9: ANALYTICS COLLECTOR');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  try {
    // Obtener videos publicados desde Supabase
    let query = supabase
      .from('bible_verses')
      .select('id, reference, video_id, viral_potential, published_at')
      .eq('published', true)
      .not('video_id', 'is', null);

    if (minDaysSincePublish > 0) {
      const minDate = new Date();
      minDate.setDate(minDate.getDate() - minDaysSincePublish);
      query = query.lte('published_at', minDate.toISOString());
    }

    if (limit) {
      query = query.limit(limit);
    }

    query = query.order('published_at', { ascending: false });

    const { data: publishedVerses, error } = await query;

    if (error) {
      console.error('❌ Error obteniendo videos publicados:', error.message);
      return;
    }

    if (!publishedVerses || publishedVerses.length === 0) {
      console.log('\n⚠️  No hay videos publicados para analizar');
      return;
    }

    console.log(`\n📹 Videos publicados encontrados: ${publishedVerses.length}`);

    // Recolectar métricas de cada video
    const results = {
      total: publishedVerses.length,
      collected: 0,
      failed: 0
    };

    for (let i = 0; i < publishedVerses.length; i++) {
      const verse = publishedVerses[i];
      console.log(`\n[${i + 1}/${publishedVerses.length}]`);

      const metrics = await collectVideoMetrics(verse);

      if (metrics) {
        results.collected++;
      } else {
        results.failed++;
      }

      // Pausa de 1 segundo entre requests para evitar rate limiting
      if (i < publishedVerses.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // Resumen final
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📈 RESUMEN DE RECOLECCIÓN');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Total videos: ${results.total}`);
    console.log(`✅ Recolectados exitosamente: ${results.collected}`);
    console.log(`❌ Fallidos: ${results.failed}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Mostrar insights
    await showInsights();

  } catch (error) {
    console.error('❌ Error en recolección de analytics:', error);
  }
}

// ============================================================================
// INSIGHTS Y ANÁLISIS
// ============================================================================

/**
 * Muestra insights de rendimiento
 */
async function showInsights() {
  try {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('💡 INSIGHTS DE RENDIMIENTO');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // Top videos por performance
    const { data: topVideos, error: topError } = await supabase
      .from('video_analytics')
      .select('reference, views, engagement_rate, performance_score')
      .order('performance_score', { ascending: false })
      .limit(5);

    if (!topError && topVideos && topVideos.length > 0) {
      console.log('\n🏆 TOP 5 VIDEOS POR PERFORMANCE:\n');
      topVideos.forEach((video, i) => {
        console.log(`${i + 1}. ${video.reference}`);
        console.log(`   Score: ${video.performance_score}/10 | Vistas: ${video.views} | Engagement: ${video.engagement_rate}%`);
      });
    }

    // Comparar predicción vs realidad
    const { data: predictions, error: predError } = await supabase
      .from('video_analytics')
      .select('reference, viral_potential_score, performance_score, views')
      .order('collected_at', { ascending: false })
      .limit(10);

    if (!predError && predictions && predictions.length > 0) {
      console.log('\n🔮 PREDICCIÓN vs REALIDAD (últimos 10 videos):\n');

      let totalDiff = 0;
      predictions.forEach(p => {
        const diff = p.performance_score - p.viral_potential_score;
        totalDiff += Math.abs(diff);
        const diffStr = diff > 0 ? `+${diff}` : `${diff}`;
        const emoji = Math.abs(diff) <= 2 ? '✅' : '⚠️';

        console.log(`${emoji} ${p.reference}`);
        console.log(`   Predicción: ${p.viral_potential_score}/10 | Real: ${p.performance_score}/10 | Diff: ${diffStr}`);
      });

      const avgDiff = (totalDiff / predictions.length).toFixed(2);
      console.log(`\n📊 Diferencia promedio: ${avgDiff} puntos`);
      if (avgDiff <= 2) {
        console.log('   ✅ ¡Excelente! Las predicciones son muy precisas');
      } else if (avgDiff <= 3) {
        console.log('   ⚠️  Las predicciones son razonablemente buenas');
      } else {
        console.log('   ❌ Las predicciones necesitan calibración');
      }
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('❌ Error mostrando insights:', error.message);
  }
}

// ============================================================================
// CLI
// ============================================================================

if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    console.log('\n📚 AGENT 9: ANALYTICS COLLECTOR - Uso:\n');
    console.log('node agents/agent-9-analytics-collector.js [opciones]\n');
    console.log('Opciones:');
    console.log('  --limit=N          Recolectar solo los últimos N videos');
    console.log('  --min-days=N       Recolectar solo videos con N+ días desde publicación');
    console.log('  --insights         Solo mostrar insights (sin recolectar)');
    console.log('  --help, -h         Mostrar esta ayuda\n');
    console.log('Ejemplos:');
    console.log('  node agents/agent-9-analytics-collector.js');
    console.log('  node agents/agent-9-analytics-collector.js --limit=10');
    console.log('  node agents/agent-9-analytics-collector.js --min-days=7');
    console.log('  node agents/agent-9-analytics-collector.js --insights\n');
    process.exit(0);
  }

  // Parsear opciones
  const options = {};

  args.forEach(arg => {
    if (arg.startsWith('--limit=')) {
      options.limit = parseInt(arg.split('=')[1]);
    }
    if (arg.startsWith('--min-days=')) {
      options.minDaysSincePublish = parseInt(arg.split('=')[1]);
    }
  });

  if (args.includes('--insights')) {
    // Solo mostrar insights
    showInsights().then(() => process.exit(0));
  } else {
    // Recolectar métricas
    collectAllMetrics(options)
      .then(() => {
        console.log('✅ Recolección completada');
        process.exit(0);
      })
      .catch(err => {
        console.error('❌ Error fatal:', err);
        process.exit(1);
      });
  }
}

// Exportar para uso como módulo
module.exports = {
  collectVideoMetrics,
  collectAllMetrics,
  showInsights,
  calculateEngagementRates,
  calculatePerformanceScore
};
