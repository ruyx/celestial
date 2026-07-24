#!/usr/bin/env node

// ============================================================================
// 📊 AGENT ANALYTICS MASTER - YouTube Performance Analyst & Learning System
// ============================================================================
//
// PROPÓSITO: Analizar performance de videos publicados y generar instrucciones
// específicas para cada agente del pipeline, creando un sistema de aprendizaje
// continuo basado en datos reales de YouTube.
//
// CAPACIDADES:
// - Recolección de analytics de YouTube Data API v3
// - Análisis profundo de CTR, Retention, Engagement, Traffic Sources
// - Generación de instrucciones específicas para cada agente
// - Sistema de aprendizaje acumulativo (no estático)
// - Detección de patrones exitosos y fallidos
//
// USAGE: node agents/analytics-monitor.js <videoId>
// ============================================================================

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

// Paths
const YOUTUBE_TOKEN_PATH = path.join(__dirname, '..', 'youtube-token.json');
const ANALYTICS_DIR = path.join(__dirname, '..', 'logs', 'analytics');
const FEEDBACK_PATH = path.join(__dirname, '..', 'logs', 'analytics-feedback.json');
const LEARNING_DB_PATH = path.join(__dirname, '..', 'logs', 'learning-database.json');

// Crear directorios si no existen
if (!fs.existsSync(ANALYTICS_DIR)) {
  fs.mkdirSync(ANALYTICS_DIR, { recursive: true });
}

// ============================================================================
// THRESHOLDS DE PERFORMANCE (basados en benchmarks de YouTube)
// ============================================================================
const PERFORMANCE_THRESHOLDS = {
  ctr: {
    excellent: 10,    // >10% CTR es excelente
    good: 5,          // 5-10% es bueno
    average: 2,       // 2-5% es promedio
    poor: 2           // <2% es pobre
  },
  avgViewDuration: {
    excellent: 70,    // >70% retention es excelente
    good: 50,         // 50-70% es bueno
    average: 30,      // 30-50% es promedio
    poor: 30          // <30% es pobre
  },
  engagement: {
    excellent: 8,     // >8% engagement rate es excelente
    good: 5,          // 5-8% es bueno
    average: 2,       // 2-5% es promedio
    poor: 2           // <2% es pobre
  }
};

// ============================================================================
// CLASE PRINCIPAL: Analytics Monitor
// ============================================================================
class AnalyticsMonitor {
  constructor() {
    this.youtube = null;
    this.youtubeAnalytics = null;
  }

  // Autenticar con YouTube Data API v3
  async authenticate() {
    console.log('\n🔐 Autenticando con YouTube API...\n');

    if (!fs.existsSync(YOUTUBE_TOKEN_PATH)) {
      throw new Error('Token de YouTube no encontrado. Ejecuta: node youtube-auth.js');
    }

    const token = JSON.parse(fs.readFileSync(YOUTUBE_TOKEN_PATH, 'utf-8'));

    const oauth2Client = new google.auth.OAuth2(
      process.env.YOUTUBE_CLIENT_ID,
      process.env.YOUTUBE_CLIENT_SECRET,
      process.env.YOUTUBE_REDIRECT_URI
    );

    oauth2Client.setCredentials(token);

    this.youtube = google.youtube({
      version: 'v3',
      auth: oauth2Client
    });

    this.youtubeAnalytics = google.youtubeAnalytics({
      version: 'v2',
      auth: oauth2Client
    });

    console.log('   ✅ Autenticación exitosa\n');
  }

  // Obtener analytics del video
  async getVideoAnalytics(videoId) {
    console.log(`\n📊 OBTENIENDO ANALYTICS DEL VIDEO\n`);
    console.log(`   Video ID: ${videoId}\n`);

    // 1. Obtener estadísticas básicas del video
    const videoStats = await this.youtube.videos.list({
      part: 'statistics,snippet,contentDetails',
      id: videoId
    });

    if (!videoStats.data.items || videoStats.data.items.length === 0) {
      throw new Error(`Video no encontrado: ${videoId}`);
    }

    const video = videoStats.data.items[0];
    const stats = video.statistics;
    const snippet = video.snippet;

    // 2. Calcular métricas derivadas
    const views = parseInt(stats.viewCount || 0);
    const likes = parseInt(stats.likeCount || 0);
    const comments = parseInt(stats.commentCount || 0);
    const impressions = views * 10; // Estimación conservadora (ratio 1:10)

    const ctr = impressions > 0 ? (views / impressions) * 100 : 0;
    const engagementRate = views > 0 ? ((likes + comments) / views) * 100 : 0;

    // 3. Obtener retention data (requiere YouTube Analytics API)
    let avgViewDuration = 0;
    let avgViewPercentage = 0;

    try {
      const analyticsData = await this.youtubeAnalytics.reports.query({
        ids: 'channel==MINE',
        startDate: this.getStartDate(snippet.publishedAt),
        endDate: 'today',
        metrics: 'averageViewDuration,averageViewPercentage',
        filters: `video==${videoId}`
      });

      if (analyticsData.data.rows && analyticsData.data.rows.length > 0) {
        avgViewDuration = analyticsData.data.rows[0][0];
        avgViewPercentage = analyticsData.data.rows[0][1];
      }
    } catch (error) {
      console.log('   ⚠️  Analytics API no disponible, usando estimaciones');
      // Estimación basada en engagement
      avgViewPercentage = Math.min(engagementRate * 10, 100);
    }

    // 4. Compilar analytics completos
    const analytics = {
      videoId: videoId,
      title: snippet.title,
      publishedAt: snippet.publishedAt,
      collectedAt: new Date().toISOString(),
      metrics: {
        views: views,
        likes: likes,
        comments: comments,
        impressions: impressions,
        ctr: parseFloat(ctr.toFixed(2)),
        avgViewDuration: avgViewDuration,
        avgViewPercentage: parseFloat(avgViewPercentage.toFixed(2)),
        engagementRate: parseFloat(engagementRate.toFixed(2))
      },
      thumbnail: {
        url: snippet.thumbnails.high.url
      }
    };

    console.log('   📈 Métricas recolectadas:');
    console.log(`      Views: ${views.toLocaleString()}`);
    console.log(`      CTR: ${analytics.metrics.ctr}%`);
    console.log(`      Retention: ${analytics.metrics.avgViewPercentage}%`);
    console.log(`      Engagement: ${analytics.metrics.engagementRate}%\n`);

    return analytics;
  }

  // Analizar performance y generar insights
  analyzePerformance(analytics) {
    console.log('\n🧠 ANÁLISIS DE PERFORMANCE\n');

    const { ctr, avgViewPercentage, engagementRate } = analytics.metrics;

    // Evaluar cada métrica
    const ctrLevel = this.evaluateMetric(ctr, PERFORMANCE_THRESHOLDS.ctr);
    const retentionLevel = this.evaluateMetric(avgViewPercentage, PERFORMANCE_THRESHOLDS.avgViewDuration);
    const engagementLevel = this.evaluateMetric(engagementRate, PERFORMANCE_THRESHOLDS.engagement);

    console.log(`   📊 CTR: ${ctr}% - ${ctrLevel.toUpperCase()}`);
    console.log(`   ⏱️  Retention: ${avgViewPercentage}% - ${retentionLevel.toUpperCase()}`);
    console.log(`   💬 Engagement: ${engagementRate}% - ${engagementLevel.toUpperCase()}\n`);

    // Calcular score general (0-100)
    const overallScore = (
      this.getMetricScore(ctr, PERFORMANCE_THRESHOLDS.ctr) * 0.4 +
      this.getMetricScore(avgViewPercentage, PERFORMANCE_THRESHOLDS.avgViewDuration) * 0.4 +
      this.getMetricScore(engagementRate, PERFORMANCE_THRESHOLDS.engagement) * 0.2
    );

    const analysis = {
      overallScore: Math.round(overallScore),
      ctrLevel: ctrLevel,
      retentionLevel: retentionLevel,
      engagementLevel: engagementLevel,
      strengths: [],
      weaknesses: [],
      criticalIssues: []
    };

    // Identificar fortalezas y debilidades
    if (ctrLevel === 'excellent' || ctrLevel === 'good') {
      analysis.strengths.push('thumbnail_title');
    } else if (ctrLevel === 'poor') {
      analysis.weaknesses.push('thumbnail_title');
      analysis.criticalIssues.push('CTR bajo - Thumbnail y título no atraen clicks');
    }

    if (retentionLevel === 'excellent' || retentionLevel === 'good') {
      analysis.strengths.push('content_quality');
    } else if (retentionLevel === 'poor') {
      analysis.weaknesses.push('content_quality');
      analysis.criticalIssues.push('Retention baja - Contenido no mantiene atención');
    }

    if (engagementLevel === 'excellent' || engagementLevel === 'good') {
      analysis.strengths.push('engagement');
    } else if (engagementLevel === 'poor') {
      analysis.weaknesses.push('engagement');
    }

    console.log(`   ⭐ Score General: ${analysis.overallScore}/100\n`);

    if (analysis.criticalIssues.length > 0) {
      console.log('   🚨 ISSUES CRÍTICOS:');
      analysis.criticalIssues.forEach(issue => console.log(`      - ${issue}`));
      console.log('');
    }

    return analysis;
  }

  // Generar instrucciones específicas para cada agente
  generateAgentInstructions(analytics, analysis) {
    console.log('\n📝 GENERANDO INSTRUCCIONES PARA AGENTES\n');

    const instructions = {
      generatedAt: new Date().toISOString(),
      videoId: analytics.videoId,
      overallScore: analysis.overallScore,
      agentInstructions: {}
    };

    // ========================================================================
    // AGENT 1: SCRIPTWRITER - Mejoras en estructura del guión
    // ========================================================================
    const scriptInstructions = [];

    if (analysis.retentionLevel === 'poor') {
      scriptInstructions.push({
        priority: 'CRITICAL',
        action: 'MODIFY_HOOK_STRATEGY',
        detail: 'Hook actual no mantiene atención. Probar hooks más controversiales o con open loops más fuertes.'
      });
      scriptInstructions.push({
        priority: 'HIGH',
        action: 'SHORTEN_INTRO',
        detail: `Retention baja (${analytics.metrics.avgViewPercentage}%). Reducir intro a máximo 5 segundos.`
      });
    }

    if (analysis.engagementLevel === 'poor') {
      scriptInstructions.push({
        priority: 'MEDIUM',
        action: 'IMPROVE_CTA',
        detail: 'Engagement bajo. Hacer CTA más directo y específico. Usar preguntas que inviten a comentar.'
      });
    }

    if (analysis.retentionLevel === 'excellent') {
      scriptInstructions.push({
        priority: 'INFO',
        action: 'KEEP_STRUCTURE',
        detail: `Retention excelente (${analytics.metrics.avgViewPercentage}%). Mantener estructura actual del guión.`
      });
    }

    instructions.agentInstructions.agent1_scriptwriter = scriptInstructions;

    // ========================================================================
    // AGENT 9: THUMBNAIL GENERATOR - Mejoras en diseño
    // ========================================================================
    const thumbnailInstructions = [];

    if (analysis.ctrLevel === 'poor') {
      thumbnailInstructions.push({
        priority: 'CRITICAL',
        action: 'REDESIGN_THUMBNAIL',
        detail: `CTR muy bajo (${analytics.metrics.ctr}%). Probar: texto más grande, colores más contrastantes, expresión facial más dramática.`
      });
      thumbnailInstructions.push({
        priority: 'HIGH',
        action: 'TEST_NEW_COLORS',
        detail: 'Probar paleta de colores diferente. Actual no destaca en feed.'
      });
    }

    if (analysis.ctrLevel === 'average') {
      thumbnailInstructions.push({
        priority: 'MEDIUM',
        action: 'ENHANCE_CONTRAST',
        detail: `CTR promedio (${analytics.metrics.ctr}%). Aumentar contraste texto-fondo y probar posición diferente del texto.`
      });
    }

    if (analysis.ctrLevel === 'excellent') {
      thumbnailInstructions.push({
        priority: 'INFO',
        action: 'KEEP_STYLE',
        detail: `CTR excelente (${analytics.metrics.ctr}%). Mantener estilo actual de thumbnail.`
      });
    }

    instructions.agentInstructions.agent9_thumbnail = thumbnailInstructions;

    // ========================================================================
    // AGENT 8: SEO EXPERT - Mejoras en título y descripción
    // ========================================================================
    const seoInstructions = [];

    if (analysis.ctrLevel === 'poor') {
      seoInstructions.push({
        priority: 'CRITICAL',
        action: 'REWRITE_TITLE',
        detail: 'Título actual no genera clicks. Usar fórmulas más llamativas: "Esto cambió mi vida" o "Nadie te dice esto sobre..."'
      });
    }

    if (analysis.ctrLevel === 'average') {
      seoInstructions.push({
        priority: 'MEDIUM',
        action: 'ADD_POWER_WORDS',
        detail: 'Agregar power words al título: "Increíble", "Secreto", "Revelado", "Transformador"'
      });
    }

    instructions.agentInstructions.agent8_seo = seoInstructions;

    // ========================================================================
    // AGENT 7: VIDEO EDITOR - Mejoras en edición
    // ========================================================================
    const editorInstructions = [];

    if (analysis.retentionLevel === 'poor') {
      editorInstructions.push({
        priority: 'HIGH',
        action: 'INCREASE_PACING',
        detail: 'Retention baja sugiere ritmo lento. Acortar clips individuales de 15s a 10s máximo.'
      });
      editorInstructions.push({
        priority: 'MEDIUM',
        action: 'ADD_MORE_TRANSITIONS',
        detail: 'Agregar más variedad visual para mantener atención.'
      });
    }

    instructions.agentInstructions.agent7_editor = editorInstructions;

    console.log('   ✅ Instrucciones generadas para 4 agentes\n');

    return instructions;
  }

  // Guardar feedback en base de datos de aprendizaje
  saveLearningData(analytics, analysis, instructions) {
    console.log('\n💾 GUARDANDO EN BASE DE DATOS DE APRENDIZAJE\n');

    // Cargar base de datos existente
    let learningDB = { videos: [], patterns: {} };
    if (fs.existsSync(LEARNING_DB_PATH)) {
      learningDB = JSON.parse(fs.readFileSync(LEARNING_DB_PATH, 'utf-8'));
    }

    // Agregar nuevo video
    learningDB.videos.push({
      videoId: analytics.videoId,
      title: analytics.title,
      publishedAt: analytics.publishedAt,
      metrics: analytics.metrics,
      analysis: analysis,
      instructions: instructions,
      analyzedAt: new Date().toISOString()
    });

    // Detectar patrones (análisis acumulativo)
    this.updatePatterns(learningDB);

    // Guardar
    fs.writeFileSync(LEARNING_DB_PATH, JSON.stringify(learningDB, null, 2));
    console.log(`   ✅ Datos guardados en: ${LEARNING_DB_PATH}`);
    console.log(`   📊 Total videos analizados: ${learningDB.videos.length}\n`);

    // También guardar feedback en formato legible para agentes
    fs.writeFileSync(FEEDBACK_PATH, JSON.stringify(instructions, null, 2));
    console.log(`   ✅ Feedback guardado en: ${FEEDBACK_PATH}\n`);

    return learningDB;
  }

  // Actualizar patrones detectados (aprendizaje acumulativo)
  updatePatterns(learningDB) {
    if (learningDB.videos.length < 3) {
      return; // Necesitamos al menos 3 videos para detectar patrones
    }

    const patterns = {
      bestPerformers: [],
      worstPerformers: [],
      successPatterns: {},
      failurePatterns: {}
    };

    // Ordenar por score
    const sorted = [...learningDB.videos].sort((a, b) => b.analysis.overallScore - a.analysis.overallScore);

    // Top 3 mejores
    patterns.bestPerformers = sorted.slice(0, 3).map(v => ({
      videoId: v.videoId,
      title: v.title,
      score: v.analysis.overallScore,
      ctr: v.metrics.ctr,
      retention: v.metrics.avgViewPercentage
    }));

    // Top 3 peores
    patterns.worstPerformers = sorted.slice(-3).map(v => ({
      videoId: v.videoId,
      title: v.title,
      score: v.analysis.overallScore,
      ctr: v.metrics.ctr,
      retention: v.metrics.avgViewPercentage
    }));

    // Detectar patrones de éxito
    const topVideos = sorted.slice(0, Math.ceil(sorted.length * 0.3));
    patterns.successPatterns = {
      avgCTR: this.calculateAverage(topVideos, 'metrics.ctr'),
      avgRetention: this.calculateAverage(topVideos, 'metrics.avgViewPercentage'),
      commonStrengths: this.findCommonElements(topVideos, 'analysis.strengths')
    };

    // Detectar patrones de fallo
    const bottomVideos = sorted.slice(-Math.ceil(sorted.length * 0.3));
    patterns.failurePatterns = {
      avgCTR: this.calculateAverage(bottomVideos, 'metrics.ctr'),
      avgRetention: this.calculateAverage(bottomVideos, 'metrics.avgViewPercentage'),
      commonWeaknesses: this.findCommonElements(bottomVideos, 'analysis.weaknesses')
    };

    learningDB.patterns = patterns;
  }

  // Helpers
  evaluateMetric(value, thresholds) {
    if (value >= thresholds.excellent) return 'excellent';
    if (value >= thresholds.good) return 'good';
    if (value >= thresholds.average) return 'average';
    return 'poor';
  }

  getMetricScore(value, thresholds) {
    if (value >= thresholds.excellent) return 100;
    if (value >= thresholds.good) return 75;
    if (value >= thresholds.average) return 50;
    return 25;
  }

  getStartDate(publishedAt) {
    const date = new Date(publishedAt);
    return date.toISOString().split('T')[0];
  }

  calculateAverage(items, path) {
    const values = items.map(item => {
      const keys = path.split('.');
      let value = item;
      for (const key of keys) {
        value = value[key];
      }
      return value;
    });
    return parseFloat((values.reduce((a, b) => a + b, 0) / values.length).toFixed(2));
  }

  findCommonElements(items, path) {
    const allElements = items.flatMap(item => {
      const keys = path.split('.');
      let value = item;
      for (const key of keys) {
        value = value[key];
      }
      return value;
    });

    const counts = {};
    allElements.forEach(el => {
      counts[el] = (counts[el] || 0) + 1;
    });

    return Object.entries(counts)
      .filter(([_, count]) => count >= items.length * 0.5)
      .map(([element]) => element);
  }

  // Método principal
  async run(videoId) {
    try {
      await this.authenticate();
      const analytics = await this.getVideoAnalytics(videoId);
      const analysis = this.analyzePerformance(analytics);
      const instructions = this.generateAgentInstructions(analytics, analysis);
      const learningDB = this.saveLearningData(analytics, analysis, instructions);

      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('✅ ANÁLISIS COMPLETADO');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      console.log(`📊 Score General: ${analysis.overallScore}/100`);
      console.log(`📈 Total Videos Analizados: ${learningDB.videos.length}`);
      console.log(`🎯 Instrucciones Generadas: ${Object.keys(instructions.agentInstructions).length} agentes`);
      console.log('\n💡 Los agentes ahora tienen instrucciones específicas para mejorar.\n');

      return {
        success: true,
        analytics: analytics,
        analysis: analysis,
        instructions: instructions
      };

    } catch (error) {
      console.error('\n❌ ERROR EN ANALYTICS MONITOR:');
      console.error('   ', error.message);
      throw error;
    }
  }
}

// ============================================================================
// CLI
// ============================================================================
if (require.main === module) {
  const videoId = process.argv[2];

  if (!videoId) {
    console.error('\n❌ Error: Debes especificar el videoId');
    console.error('Uso: node agents/analytics-monitor.js <videoId>\n');
    process.exit(1);
  }

  const monitor = new AnalyticsMonitor();
  monitor.run(videoId)
    .then(() => {
      console.log('✅ Proceso completado exitosamente\n');
      process.exit(0);
    })
    .catch(err => {
      console.error('\n❌ Error fatal:', err.message);
      process.exit(1);
    });
}

module.exports = AnalyticsMonitor;
