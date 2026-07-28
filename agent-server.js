#!/usr/bin/env node

console.log('🔍 Starting agent-server.js...');
console.log('🔍 Node version:', process.version);
console.log('🔍 Working directory:', process.cwd());

/**
 * 🚀 AGENT SERVER
 * HTTP server para ejecutar agentes desde n8n sin child_process
 *
 * n8n bloqueó child_process por seguridad, así que los agentes
 * se ejecutan a través de este servidor HTTP local.
 */

// Load environment variables (Render uses dashboard, but this handles local .env too)
console.log('🔍 Loading dotenv...');
require('dotenv').config();

console.log('🔍 Loading dependencies...');
const express = require('express');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
console.log('🔍 Dependencies loaded successfully');

console.log('🔍 Initializing Express app...');
const app = express();
const PORT = process.env.PORT || process.env.AGENT_SERVER_PORT || 3100;
console.log('🔍 PORT detected:', PORT);

// Base directory - works both locally and on Railway
const BASE_DIR = process.cwd();
console.log('🔍 BASE_DIR:', BASE_DIR);

// Create output directories if they don't exist (needed for Render)
console.log('🔍 Creating output directories...');
const outputDirs = [
  'output',
  'output/scripts',
  'output/image-prompts',
  'output/image-batches',
  'output/image-metadata',
  'output/videos',
  'output/final-videos',
  'output/youtube-metadata',
  'output/video-metadata'
];

outputDirs.forEach(dir => {
  const fullPath = path.join(BASE_DIR, dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
    console.log(`✅ Created: ${dir}`);
  }
});
console.log('✅ Output directories ready');

console.log('🔍 Setting up middleware...');
app.use(express.json());

// Logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Debug endpoint - check env vars (REMOVE IN PRODUCTION)
app.get('/debug-env', (req, res) => {
  res.json({
    SUPABASE_URL: process.env.SUPABASE_URL ? process.env.SUPABASE_URL.substring(0, 30) + '...' : 'NOT SET',
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET (length: ' + process.env.SUPABASE_SERVICE_ROLE_KEY.length + ')' : 'NOT SET',
    OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY ? 'SET (length: ' + process.env.OPENROUTER_API_KEY.length + ')' : 'NOT SET',
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY ? 'SET (length: ' + process.env.ANTHROPIC_API_KEY.length + ')' : 'NOT SET',
    NODE_ENV: process.env.NODE_ENV,
    PORT: process.env.PORT
  });
});

// Agent 0: Verse Researcher
app.post('/agent-0', async (req, res) => {
  console.log('\n🔬 Executing Agent 0: Verse Researcher');

  try {
    const result = execSync(
      'node agents/agent-0-verse-researcher.js',
      { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024, cwd: BASE_DIR }
    );

    console.log(result);

    const decisionPath = path.join(BASE_DIR, 'output/agent-0-decision.json');
    const decision = JSON.parse(fs.readFileSync(decisionPath, 'utf-8'));

    res.json({
      success: true,
      verse: decision.reference,
      category: decision.category,
      metadata: decision,
      agent0Decision: decision
    });
  } catch (error) {
    console.error('❌ Agent 0 error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Agent 1: Viral Scriptwriter (lee de Supabase)
app.post('/agent-1', async (req, res) => {
  console.log('\n📝 Executing Agent 1: Viral Scriptwriter');

  try {
    const { createClient } = require('@supabase/supabase-js');
    const ws = require('ws');

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Faltan credenciales de Supabase');
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { autoRefreshToken: false, persistSession: false },
      realtime: { transport: ws }
    });

    const { data: script, error } = await supabase
      .from('generated_scripts')
      .select('*')
      .order('generated_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          error: 'No hay scripts disponibles'
        });
      }
      throw error;
    }

    const metadata = script.metadata || {};
    const scenes = script.scenes || [];

    res.json({
      success: true,
      verse: script.verse_reference,
      scriptId: script.id,
      category: metadata.category || 'general',
      hookType: metadata.hookType || 'direct',
      emotionalBenefit: metadata.emotionalBenefit || 'peace',
      viralPotential: metadata.viralPotential || 7,
      scenesCount: scenes.length,
      youtubeTitle: script.youtube_metadata?.title || '',
      youtubeDescription: script.youtube_metadata?.description || '',
      youtubeTags: script.youtube_metadata?.tags || []
    });
  } catch (error) {
    console.error('❌ Agent 1 error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Agent 2: Visual Designer PRO
app.post('/agent-2', async (req, res) => {
  console.log('\n🎨 Executing Agent 2: Visual Designer PRO');

  try {
    // Get scriptId from Agent 1 output (passed via n8n)
    const { scriptId } = req.body;

    if (!scriptId) {
      throw new Error('scriptId is required');
    }

    // Fetch script from Supabase
    const { createClient } = require('@supabase/supabase-js');
    const ws = require('ws');

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { autoRefreshToken: false, persistSession: false },
      realtime: { transport: ws }
    });

    const { data: script, error } = await supabase
      .from('generated_scripts')
      .select('*')
      .eq('id', scriptId)
      .single();

    if (error) throw error;
    if (!script) throw new Error(`Script ${scriptId} not found`);

    // Save script temporarily for agent-2 to read
    const scriptsDir = path.join(BASE_DIR, 'output/scripts');

    // Ensure directory exists (in case Render has ephemeral filesystem)
    if (!fs.existsSync(scriptsDir)) {
      fs.mkdirSync(scriptsDir, { recursive: true });
      console.log('✅ Created scripts directory');
    }

    // Use a simple timestamp-based filename to avoid special characters issues
    const timestamp = Date.now();
    const tempScriptPath = path.join(scriptsDir, `script-${scriptId}-${timestamp}.json`);
    fs.writeFileSync(tempScriptPath, JSON.stringify(script, null, 2));
    console.log(`✅ Script saved to: ${tempScriptPath}`);
    console.log(`📁 Files in scripts dir: ${fs.readdirSync(scriptsDir).join(', ')}`);

    // Execute agent-2
    const result = execSync(
      'node agents/agent-2-image-designer-pro.js',
      { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024, cwd: BASE_DIR }
    );

    console.log(result);

    const designDir = path.join(BASE_DIR, 'output/image-prompts');
    const files = fs.readdirSync(designDir)
      .filter(f => f.startsWith('visual-design-PRO-') && f.endsWith('.json'))
      .map(f => ({
        name: f,
        path: path.join(designDir, f),
        time: fs.statSync(path.join(designDir, f)).mtime.getTime()
      }))
      .sort((a, b) => b.time - a.time);

    const latestDesign = files[0];
    const designData = JSON.parse(fs.readFileSync(latestDesign.path, 'utf-8'));

    res.json({
      success: true,
      verse: designData.verse,
      designData: designData
    });
  } catch (error) {
    console.error('❌ Agent 2 error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Agent 3: Batch Generator
app.post('/agent-3', async (req, res) => {
  console.log('\n📦 Executing Agent 3: Batch Generator');

  try {
    const result = execSync(
      'node agents/agent-3-batch-generator.js',
      { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024, cwd: BASE_DIR }
    );

    console.log(result);

    const batchDir = path.join(BASE_DIR, 'output/image-batches');
    const files = fs.readdirSync(batchDir)
      .filter(f => f.startsWith('batch-') && f.endsWith('.json'))
      .map(f => ({
        name: f,
        path: path.join(batchDir, f),
        time: fs.statSync(path.join(batchDir, f)).mtime.getTime()
      }))
      .sort((a, b) => b.time - a.time);

    const latestBatch = files[0];
    const batchData = JSON.parse(fs.readFileSync(latestBatch.path, 'utf-8'));

    res.json({
      success: true,
      verse: batchData.verse,
      batch: batchData
    });
  } catch (error) {
    console.error('❌ Agent 3 error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Guardian Images + Agent 4
app.post('/guardian-images', async (req, res) => {
  const { verse } = req.body;

  console.log(`\n👼 Executing Guardian Images + Agent 4 for: ${verse}`);

  try {
    // Paso 1: Ejecutar Agent 4 para generar las imágenes
    console.log('🎨 Step 1/2: Running Agent 4 (Magnific MCP) to generate images...');
    const agent4Result = execSync(
      `node agents/agent-4-magnific-mcp.js "${verse}"`,
      { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024, timeout: 15 * 60 * 1000, cwd: BASE_DIR }
    );
    console.log(agent4Result);

    // Paso 2: Ejecutar Guardian para validar las imágenes
    console.log('\n👼 Step 2/2: Running Guardian to validate images...');
    const guardianResult = execSync(
      `node agents/guardian-images.js "${verse}"`,
      { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024, timeout: 15 * 60 * 1000, cwd: BASE_DIR }
    );
    console.log(guardianResult);

    res.json({
      success: true,
      verse,
      guardianImagesSuccess: true
    });
  } catch (error) {
    console.error('❌ Guardian Images error:', error.message);
    res.status(500).json({
      success: false,
      verse,
      guardianImagesSuccess: false,
      error: error.message
    });
  }
});

// Guardian Videos + Agent 5
app.post('/guardian-videos', async (req, res) => {
  const { verse } = req.body;

  console.log(`\n👼 Executing Guardian Videos + Agent 5 for: ${verse}`);

  try {
    const result = execSync(
      `node agents/guardian-videos.js "${verse}"`,
      { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024, timeout: 20 * 60 * 1000, cwd: BASE_DIR }
    );

    console.log(result);

    res.json({
      success: true,
      verse,
      guardianVideosSuccess: true
    });
  } catch (error) {
    console.error('❌ Guardian Videos error:', error.message);
    res.status(500).json({
      success: false,
      verse,
      guardianVideosSuccess: false,
      error: error.message
    });
  }
});

// Guardian Audio + Agent 6
app.post('/guardian-audio', async (req, res) => {
  const { verse } = req.body;

  console.log(`\n👼 Executing Guardian Audio + Agent 6 for: ${verse}`);

  try {
    const result = execSync(
      `node agents/guardian-audio.js "${verse}"`,
      { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024, timeout: 10 * 60 * 1000, cwd: BASE_DIR }
    );

    console.log(result);

    res.json({
      success: true,
      verse,
      guardianAudioSuccess: true
    });
  } catch (error) {
    console.error('❌ Guardian Audio error:', error.message);
    res.status(500).json({
      success: false,
      verse,
      guardianAudioSuccess: false,
      error: error.message
    });
  }
});

// Guardian Final Video + Agent 7
app.post('/guardian-final-video', async (req, res) => {
  const { verse } = req.body;

  console.log(`\n👼 Executing Guardian Final Video + Agent 7 for: ${verse}`);

  try {
    const result = execSync(
      `node agents/guardian-final-video.js "${verse}"`,
      { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024, timeout: 15 * 60 * 1000, cwd: BASE_DIR }
    );

    console.log(result);

    const verseSlug = verse.replace(/[:\s]/g, '-');
    const videoPath = path.join(BASE_DIR, `output/final-videos/final-${verseSlug}.mp4`);

    res.json({
      success: true,
      verse,
      guardianFinalVideoSuccess: true,
      finalVideoPath: videoPath
    });
  } catch (error) {
    console.error('❌ Guardian Final Video error:', error.message);
    res.status(500).json({
      success: false,
      verse,
      guardianFinalVideoSuccess: false,
      error: error.message
    });
  }
});

// Guardian SEO + Agent 8
app.post('/guardian-seo', async (req, res) => {
  const { verse } = req.body;

  console.log(`\n👼 Executing Guardian SEO + Agent 8 for: ${verse}`);

  try {
    const result = execSync(
      `node agents/guardian-seo.js "${verse}"`,
      { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024, timeout: 10 * 60 * 1000, cwd: BASE_DIR }
    );

    console.log(result);

    const verseSlug = verse.replace(/[:\s]/g, '-');
    const metadataPath = path.join(BASE_DIR, `output/youtube-metadata/youtube-metadata-${verseSlug}.json`);
    const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));

    res.json({
      success: true,
      verse,
      guardianSeoSuccess: true,
      youtubeTitle: metadata.seoTitle,
      youtubeDescription: metadata.description,
      youtubeTags: metadata.tags
    });
  } catch (error) {
    console.error('❌ Guardian SEO error:', error.message);
    res.status(500).json({
      success: false,
      verse,
      guardianSeoSuccess: false,
      error: error.message
    });
  }
});

// Guardian Upload + YouTube Upload
app.post('/guardian-upload', async (req, res) => {
  const { verse } = req.body;

  console.log(`\n👼 Executing Guardian Upload + YouTube Upload for: ${verse}`);

  try {
    const result = execSync(
      `node agents/guardian-upload.js "${verse}"`,
      { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024, timeout: 40 * 60 * 1000, cwd: BASE_DIR }
    );

    console.log(result);

    const verseSlug = verse.replace(/[:\s]/g, '-');
    const uploadPath = path.join(BASE_DIR, `output/youtube-metadata/upload-result-${verseSlug}.json`);
    const uploadData = JSON.parse(fs.readFileSync(uploadPath, 'utf-8'));

    res.json({
      success: true,
      verse,
      guardianUploadSuccess: true,
      videoId: uploadData.videoId,
      videoUrl: uploadData.videoUrl
    });
  } catch (error) {
    console.error('❌ Guardian Upload error:', error.message);
    res.status(500).json({
      success: false,
      verse,
      guardianUploadSuccess: false,
      error: error.message
    });
  }
});

// Guardian Thumbnail + Agent 9
app.post('/guardian-thumbnail', async (req, res) => {
  const { verse, videoId } = req.body;

  console.log(`\n👼 Executing Guardian Thumbnail + Agent 9 for: ${verse}, videoId: ${videoId}`);

  if (!videoId) {
    console.error('videoId no disponible - skip thumbnail');
    return res.json({
      success: false,
      verse,
      guardianThumbnailSuccess: false,
      thumbnailSkipped: true
    });
  }

  try {
    const result = execSync(
      `node agents/guardian-thumbnail.js "${verse}" "${videoId}"`,
      { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024, timeout: 15 * 60 * 1000, cwd: BASE_DIR }
    );

    console.log(result);

    res.json({
      success: true,
      verse,
      guardianThumbnailSuccess: true,
      thumbnailUpdated: true
    });
  } catch (error) {
    console.error('❌ Guardian Thumbnail error:', error.message);
    res.status(500).json({
      success: false,
      verse,
      guardianThumbnailSuccess: false,
      thumbnailError: error.message
    });
  }
});

// Error handler
app.use((err, req, res, next) => {
  console.error('❌ Server error:', err);
  res.status(500).json({
    success: false,
    error: err.message
  });
});

// Global error handlers
process.on('uncaughtException', (err) => {
  console.error('💥 UNCAUGHT EXCEPTION:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 UNHANDLED REJECTION at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start server with error handling
try {
  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log('🚀 Agent Server running');
    console.log(`📡 Port: ${PORT}`);
    console.log(`🔗 Base URL: http://localhost:${PORT}`);
    console.log(`📂 BASE_DIR: ${BASE_DIR}`);
    console.log('\n✅ Ready to receive n8n requests\n');
  });

  server.on('error', (err) => {
    console.error('❌ Server failed to start:', err);
    process.exit(1);
  });
} catch (err) {
  console.error('❌ Fatal error starting server:', err);
  process.exit(1);
}
