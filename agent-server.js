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

// Guardian Deduplication INTELIGENTE con Auto-Loop (en el servidor)
// ARQUITECTURA:
// 1. Guardian: Solo verifica duplicados (sin llamadas HTTP)
// 2. Agent-server: Maneja el auto-loop llamando a Agent 0
// 3. Agent 0: Selecciona versículos de su base de datos
//
// Filosofía: 0 bloqueos estáticos, proceso autosuficiente
app.post('/guardian/deduplication', async (req, res) => {
  const initialVerse = req.body?.verse || 'Juan 3:16'; // Default si no viene
  const MAX_ATTEMPTS = 10;

  console.log(`\n👼 Guardian Deduplicación Inteligente (Auto-Loop en servidor)`);
  console.log(`📖 Versículo inicial: "${initialVerse}"`);

  const checkedVerses = [];
  let currentVerse = initialVerse;
  let attempts = 0;

  while (attempts < MAX_ATTEMPTS) {
    attempts++;
    console.log(`\n🔄 Intento ${attempts}/${MAX_ATTEMPTS}: Verificando "${currentVerse}"...`);

    try {
      // Paso 1: Llamar al Guardian para verificar duplicado
      const guardianOutput = execSync(
        `node agents/guardian-deduplication.js "${currentVerse}"`,
        { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024, cwd: BASE_DIR }
      );

      console.log(guardianOutput);

      // Parsear resultado del Guardian
      const jsonMatch = guardianOutput.match(/\{[\s\S]*"isDuplicate"[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Guardian no devolvió JSON válido');
      }

      const guardianResult = JSON.parse(jsonMatch[0]);

      // Paso 2: Si no es duplicado, ÉXITO
      if (!guardianResult.isDuplicate) {
        console.log(`\n✅ VERSÍCULO ÚNICO ENCONTRADO: "${currentVerse}"`);
        console.log(`📊 Intentos necesarios: ${attempts}`);
        console.log(`📝 Versículos probados: ${checkedVerses.join(', ')}`);

        return res.json({
          success: true,
          isDuplicate: false,
          verse: currentVerse,
          originalVerse: initialVerse,
          wasReplaced: currentVerse !== initialVerse,
          attempts: attempts,
          checkedVerses: checkedVerses,
          message: currentVerse !== initialVerse
            ? `Versículo original "${initialVerse}" duplicado, reemplazado por "${currentVerse}"`
            : `Versículo "${currentVerse}" es único - puede continuar`
        });
      }

      // Paso 3: Duplicado detectado
      console.log(`❌ DUPLICADO DETECTADO: "${currentVerse}" ya fue publicado`);
      checkedVerses.push(currentVerse);

      if (attempts >= MAX_ATTEMPTS) {
        throw new Error(`No se pudo encontrar versículo único después de ${MAX_ATTEMPTS} intentos`);
      }

      // Paso 4: Llamar a Agent 0 para generar nuevo versículo
      console.log(`\n🔬 Consultando Agent 0 (experto en versículos) para generar alternativa...`);
      const agent0Output = execSync(
        `node agents/agent-0-verse-researcher.js`,
        { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024, cwd: BASE_DIR }
      );

      console.log(agent0Output);

      // Parsear decisión de Agent 0
      const decisionPath = path.join(BASE_DIR, 'output/agent-0-decision.json');
      if (!fs.existsSync(decisionPath)) {
        throw new Error('Agent 0 no generó archivo de decisión');
      }

      const decision = JSON.parse(fs.readFileSync(decisionPath, 'utf-8'));
      const newVerse = decision.reference;

      if (!newVerse) {
        throw new Error('Agent 0 no devolvió un versículo válido');
      }

      if (checkedVerses.includes(newVerse)) {
        console.log(`⚠️  Agent 0 generó un versículo ya probado: "${newVerse}"`);
        console.log(`🔄 Reintentando con Agent 0...`);
        continue;
      }

      currentVerse = newVerse;
      console.log(`🎯 Nuevo versículo candidato: "${currentVerse}"`);

    } catch (error) {
      console.error(`\n❌ Error en auto-loop:`, error.message);
      return res.status(500).json({
        success: false,
        isDuplicate: null,
        error: error.message,
        verse: initialVerse,
        attempts: attempts,
        checkedVerses: checkedVerses
      });
    }
  }

  // No debería llegar aquí, pero por seguridad
  return res.status(500).json({
    success: false,
    error: `No se pudo encontrar versículo único después de ${MAX_ATTEMPTS} intentos`,
    verse: initialVerse,
    attempts: MAX_ATTEMPTS,
    checkedVerses: checkedVerses
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

// Agent 1: Viral Scriptwriter (lee decisión de Agent 0 y GENERA script)
app.post('/agent-1', async (req, res) => {
  console.log('\n📝 Executing Agent 1: Viral Scriptwriter');

  try {
    // 1. Leer decisión COMPLETA de Agent 0
    const agent0DecisionPath = path.join(BASE_DIR, 'output/agent-0-decision.json');

    if (!fs.existsSync(agent0DecisionPath)) {
      throw new Error('Agent 0 decision file not found - run Agent 0 first');
    }

    const agent0Decision = JSON.parse(fs.readFileSync(agent0DecisionPath, 'utf-8'));
    console.log(`✅ Using verse from Agent 0: "${agent0Decision.reference}"`);

    // 2. GENERAR script llamando al agente Node.js
    console.log('🤖 Llamando a agent-1-viral-scriptwriter.js para GENERAR script...');

    const scriptwriterOutput = execSync(
      `node agents/agent-1-viral-scriptwriter.js`,
      {
        encoding: 'utf-8',
        maxBuffer: 10 * 1024 * 1024,
        cwd: BASE_DIR
      }
    );

    console.log('✅ Script generado exitosamente');

    // 3. Leer el script guardado por el agente
    const { createClient } = require('@supabase/supabase-js');
    const ws = require('ws');

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { autoRefreshToken: false, persistSession: false },
      realtime: { transport: ws }
    });

    // Obtener el script recién generado
    const { data: script, error } = await supabase
      .from('generated_scripts')
      .select('*')
      .eq('verse_reference', agent0Decision.reference)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) throw error;

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
    // SOLUCIÓN FINAL: Leer el último script desde Supabase (Agent 1 ya lo guardó)
    // Esto elimina la dependencia de n8n para pasar parámetros
    const { createClient } = require('@supabase/supabase-js');
    const ws = require('ws');

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { autoRefreshToken: false, persistSession: false },
      realtime: { transport: ws }
    });

    // Obtener el script más reciente (Agent 1 acaba de crearlo)
    const { data: scripts, error } = await supabase
      .from('generated_scripts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) throw error;
    if (!scripts || scripts.length === 0) throw new Error('No hay scripts disponibles');

    const script = scripts[0];
    const scriptId = script.id;
    console.log(`✅ Script recuperado desde Supabase: ID ${scriptId}, verso ${script.verse_reference}`);

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
    const verse = req.body?.verse;
    if (!verse) {
      return res.status(400).json({
        success: false,
        error: 'Verse parameter required in request body'
      });
    }

    const result = execSync(
      `node agents/agent-3-batch-generator.js "${verse}"`,
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
  let verse; // Declarar fuera del try para que esté disponible en el catch
  try {
    // FIX: Priorizar req.body.verse (pasado desde n8n) sobre consulta a Supabase
    verse = req.body?.verse;

    // Si no viene en el request, consultar Supabase como fallback
    if (!verse) {
      const { createClient } = require('@supabase/supabase-js');
      const ws = require('ws');
      const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
        auth: { autoRefreshToken: false, persistSession: false },
        realtime: { transport: ws }
      });

      const { data: scripts } = await supabase
        .from('generated_scripts')
        .select('verse_reference')
        .order('created_at', { ascending: false })
        .limit(1);

      verse = scripts?.[0]?.verse_reference;
    }

    if (!verse) throw new Error('No verse found');

  console.log(`\n👼 Executing Guardian Images + Agent 4 for: ${verse}`);

    // Paso 0.5: Sincronizar archivos de Agent 2 y Agent 3 HACIA el servidor remoto
    // CRÍTICO: Agents 0-3 generan archivos localmente, pero Agent 4 corre remotamente
    // Necesitamos copiar batch y visual design AL servidor remoto ANTES de ejecutar Agent 4
    console.log('\n📤 Step 0.5/3: Syncing batch and visual design files TO remote server...');
    const verseFilename = verse.replace(/[:\s]/g, '-');

    // Sincronizar batch file (Agent 3) al servidor remoto
    execSync(
      `scp output/image-batches/batch-${verseFilename}-*.json desarrollo@10.254.80.29:~/project-yt/output/image-batches/ || echo "No batch files to sync"`,
      { encoding: 'utf-8', cwd: BASE_DIR }
    );
    console.log(`✅ Synced batch file for ${verse} to remote server`);

    // Sincronizar visual design file (Agent 2) al servidor remoto
    execSync(
      `scp output/image-prompts/visual-design-PRO-${verseFilename}-*.json desarrollo@10.254.80.29:~/project-yt/output/image-prompts/ || echo "No visual design files to sync"`,
      { encoding: 'utf-8', cwd: BASE_DIR }
    );
    console.log(`✅ Synced visual design file for ${verse} to remote server`);

    // Paso 1: Ejecutar Agent 4 via SSH en el servidor remoto con MCP configurado
    // Agent 4 requiere MCP para Magnific - solo está disponible en servidor desarrollo@10.254.80.29
    console.log('\n🎨 Step 1/3: Running Agent 4 (Magnific MCP) via SSH on remote server...');
    const agent4Result = execSync(
      `ssh desarrollo@10.254.80.29 "cd ~/project-yt && bash run-agent-4.sh \\"${verse}\\""`,
      { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024, timeout: 15 * 60 * 1000, cwd: BASE_DIR }
    );
    console.log(agent4Result);

    // Paso 1.5: Sincronizar metadata y base-images desde servidor remoto a local
    // CRÍTICO: Agent 4 corre en remoto, Guardian corre local - necesitamos copiar los archivos
    console.log('\n📦 Step 1.5/3: Syncing metadata and base-images from remote server to local...');

    // Sincronizar image metadata
    execSync(
      `scp desarrollo@10.254.80.29:~/project-yt/output/image-metadata/images-${verseFilename}-*.json output/image-metadata/ || echo "No metadata files to sync"`,
      { encoding: 'utf-8', cwd: BASE_DIR }
    );
    console.log(`✅ Synced image metadata for ${verse}`);

    // Sincronizar base images
    execSync(
      `scp desarrollo@10.254.80.29:~/project-yt/output/base-images/base-${verseFilename}-*.png output/base-images/ || echo "No base image files to sync"`,
      { encoding: 'utf-8', cwd: BASE_DIR }
    );
    console.log(`✅ Synced base images for ${verse}`);

    // Paso 2: Ejecutar Guardian para validar las imágenes
    console.log('\n👼 Step 2/3: Running Guardian to validate images...');
    const guardianResult = execSync(
      `node agents/guardian-images-FIXED.js "${verse}"`,
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
  let verse; // Declarar fuera del try para que esté disponible en el catch
  try {
    // FIX: Priorizar req.body.verse (pasado desde n8n) sobre consulta a Supabase
    verse = req.body?.verse;

    // Si no viene en el request, consultar Supabase como fallback
    if (!verse) {
      const { createClient } = require('@supabase/supabase-js');
      const ws = require('ws');
      const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
        auth: { autoRefreshToken: false, persistSession: false },
        realtime: { transport: ws }
      });

      const { data: scripts } = await supabase
        .from('generated_scripts')
        .select('verse_reference')
        .order('created_at', { ascending: false })
        .limit(1);

      verse = scripts?.[0]?.verse_reference;
    }

    if (!verse) throw new Error('No verse found');

    console.log(`\n👼 Executing Guardian Videos + Agent 5 for: ${verse}`);

    // Paso 0.5: Sincronizar archivos necesarios HACIA el servidor remoto
    // Agent 5 necesita: script (Agent 1), visual design (Agent 2), images (Agent 4)
    console.log('\n📤 Step 0.5/3: Syncing required files TO remote server...');
    const verseFilename = verse.replace(/[:\s]/g, '-');

    // Sincronizar script (Agent 1)
    execSync(
      `scp output/scripts/script-${verseFilename}-*.json desarrollo@10.254.80.29:~/project-yt/output/scripts/ || echo "No script files to sync"`,
      { encoding: 'utf-8', cwd: BASE_DIR }
    );

    // Sincronizar visual design (Agent 2)
    execSync(
      `scp output/image-prompts/visual-design-PRO-${verseFilename}-*.json desarrollo@10.254.80.29:~/project-yt/output/image-prompts/ || echo "No visual design to sync"`,
      { encoding: 'utf-8', cwd: BASE_DIR }
    );

    // Sincronizar image metadata (Agent 4)
    execSync(
      `scp output/image-metadata/images-${verseFilename}-*.json desarrollo@10.254.80.29:~/project-yt/output/image-metadata/ || echo "No image metadata to sync"`,
      { encoding: 'utf-8', cwd: BASE_DIR }
    );

    console.log(`✅ Synced all required files for Agent 5 to remote server`);

    // Paso 1: Ejecutar Agent 5 para generar los videos (Magnific MCP)
    // Ejecutar Agent 5 via SSH en el servidor remoto con MCP configurado
    // Agent 5 requiere MCP para Magnific video animation - solo disponible en servidor desarrollo@10.254.80.29
    console.log('\n🎬 Step 1/3: Running Agent 5 (Magnific MCP) via SSH on remote server...');
    const agent5Result = execSync(
      `ssh desarrollo@10.254.80.29 "cd ~/project-yt && bash run-agent-5.sh \\"${verse}\\""`,
      { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024, timeout: 30 * 60 * 1000, cwd: BASE_DIR }
    );
    console.log(agent5Result);

    // Paso 1.5: Sincronizar metadata de video desde servidor remoto a local
    console.log('\n📦 Step 1.5/3: Syncing video metadata and clips from remote server to local...');

    // Sincronizar video metadata
    execSync(
      `scp desarrollo@10.254.80.29:~/project-yt/output/video-metadata/videos-${verseFilename}-*.json output/video-metadata/ || echo "No video metadata to sync"`,
      { encoding: 'utf-8', cwd: BASE_DIR }
    );
    console.log(`✅ Synced video metadata for ${verse}`);

    // Sincronizar clips de video
    execSync(
      `scp desarrollo@10.254.80.29:~/project-yt/output/clips/clip-${verseFilename}-*.mp4 output/clips/ || echo "No video clips to sync"`,
      { encoding: 'utf-8', cwd: BASE_DIR }
    );
    console.log(`✅ Synced video clips for ${verse}`);

    // Paso 2: Ejecutar Guardian FIXED para validar los videos
    console.log('\n👼 Step 2/3: Running Guardian FIXED to validate videos...');
    const guardianResult = execSync(
      `node agents/guardian-videos-FIXED.js "${verse}"`,
      { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024, timeout: 20 * 60 * 1000, cwd: BASE_DIR }
    );
    console.log(guardianResult);

    res.json({
      success: true,
      verse,
      guardianVideosSuccess: true
    });
  } catch (error) {
    console.error('❌ Guardian Videos error:', error.message);
    res.status(500).json({
      success: false,
      verse: error.message,
      guardianVideosSuccess: false,
      error: error.message
    });
  }
});

// Guardian Audio + Agent 6
app.post('/guardian-audio', async (req, res) => {
  let verse; // Declarar fuera del try para que esté disponible en el catch
  try {
    // Leer último script desde Supabase
    const { createClient } = require('@supabase/supabase-js');
    const ws = require('ws');
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
      realtime: { transport: ws }
    });

    const { data: scripts } = await supabase
      .from('generated_scripts')
      .select('verse_reference')
      .order('created_at', { ascending: false })
      .limit(1);

    verse = scripts?.[0]?.verse_reference || req.body?.verse;
    if (!verse) throw new Error('No verse found');

    console.log(`\n👼 Executing Guardian Audio + Agent 6 for: ${verse}`);

    // PASO 0.5: Sincronizar archivos necesarios HACIA el servidor remoto
    // Agent 6 necesita: script (Agent 1) para leer el texto TTS
    console.log('\n📤 PASO 0.5/3: Sincronizando script TO remote server...');
    const verseFilename = verse.replace(/[:\s]/g, '-');

    // Sincronizar script (Agent 1)
    execSync(
      `scp output/scripts/script-${verseFilename}-*.json desarrollo@10.254.80.29:~/project-yt/output/scripts/ || echo "No script files to sync"`,
      { encoding: 'utf-8', cwd: BASE_DIR }
    );
    console.log(`✅ Synced script file for ${verse} to remote server`);

    // PASO 1: Ejecutar Agent 6 via SSH en el servidor remoto con MCP configurado
    // Agent 6 requiere MCP para audio TTS via Magnific - solo disponible en servidor desarrollo@10.254.80.29
    console.log('\n🎙️  PASO 1: Ejecutando Agent 6 MCP via SSH on remote server (audio generation via Magnific)...');
    const agent6Result = execSync(
      `ssh desarrollo@10.254.80.29 "cd ~/project-yt && bash run-agent-6.sh \\"${verse}\\""`,
      { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024, timeout: 15 * 60 * 1000, cwd: BASE_DIR }
    );
    console.log(agent6Result);

    // PASO 1.5: Sincronizar metadata de audio desde servidor remoto a local
    console.log('\n📦 PASO 1.5/3: Sincronizando audio metadata desde servidor remoto a local...');
    const verseFilename = verse.replace(/[:\s]/g, '-');

    // Sincronizar audio metadata
    execSync(
      `scp desarrollo@10.254.80.29:~/project-yt/output/audio-metadata/audio-${verseFilename}-*.json output/audio-metadata/ || echo "No audio metadata to sync"`,
      { encoding: 'utf-8', cwd: BASE_DIR }
    );
    console.log(`✅ Synced audio metadata for ${verse}`);

    // Sincronizar archivos de audio
    execSync(
      `scp desarrollo@10.254.80.29:~/project-yt/output/audio/audio-${verseFilename}-*.mp3 output/audio/ || echo "No audio files to sync"`,
      { encoding: 'utf-8', cwd: BASE_DIR }
    );
    console.log(`✅ Synced audio files for ${verse}`);

    // PASO 2: Ejecutar Guardian Audio para validar
    console.log('\n👼 PASO 2/3: Ejecutando Guardian Audio (validación)...');
    const guardianResult = execSync(
      `node agents/guardian-audio-FIXED.js "${verse}"`,
      { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024, timeout: 10 * 60 * 1000, cwd: BASE_DIR }
    );
    console.log(guardianResult);

    res.json({
      success: true,
      verse,
      agent6Success: true,
      guardianAudioSuccess: true
    });
  } catch (error) {
    console.error('❌ Guardian Audio error:', error.message);
    res.status(500).json({
      success: false,
      verse: error.message,
      guardianAudioSuccess: false,
      error: error.message
    });
  }
});

// Guardian Final Video + Agent 7
app.post('/guardian-final-video', async (req, res) => {
  let verse; // Declarar fuera del try para que esté disponible en el catch
  try {
    // Leer último script desde Supabase
    const { createClient } = require('@supabase/supabase-js');
    const ws = require('ws');
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
      realtime: { transport: ws }
    });

    const { data: scripts } = await supabase
      .from('generated_scripts')
      .select('verse_reference')
      .order('created_at', { ascending: false })
      .limit(1);

    verse = scripts?.[0]?.verse_reference || req.body?.verse;
    if (!verse) throw new Error('No verse found');

    console.log(`\n👼 Executing Guardian Final Video + Agent 7 for: ${verse}`);

    // PASO 1: Ejecutar Agent 7 MCP para ensamblar el video final
    console.log('\n🎬 PASO 1: Ejecutando Agent 7 MCP (video assembly via Magnific)...');
    const agent7Result = execSync(
      `bash run-agent-7.sh "${verse}"`,
      { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024, timeout: 20 * 60 * 1000, cwd: BASE_DIR }
    );
    console.log(agent7Result);

    // PASO 2: Ejecutar Guardian Final Video para validar
    console.log('\n👼 PASO 2: Ejecutando Guardian Final Video (validación)...');
    const guardianResult = execSync(
      `node agents/guardian-final-video-FIXED.js "${verse}"`,
      { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024, timeout: 10 * 60 * 1000, cwd: BASE_DIR }
    );
    console.log(guardianResult);

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
      verse: error.message,
      guardianFinalVideoSuccess: false,
      error: error.message
    });
  }
});

// Guardian SEO + Agent 8
app.post('/guardian-seo', async (req, res) => {
  let verse; // Declarar fuera del try para que esté disponible en el catch
  try {
    // Leer último script desde Supabase
    const { createClient } = require('@supabase/supabase-js');
    const ws = require('ws');
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
      realtime: { transport: ws }
    });

    const { data: scripts } = await supabase
      .from('generated_scripts')
      .select('verse_reference')
      .order('created_at', { ascending: false })
      .limit(1);

    verse = scripts?.[0]?.verse_reference || req.body?.verse;
    if (!verse) throw new Error('No verse found');

    console.log(`\n👼 Executing Guardian SEO + Agent 8 for: ${verse}`);

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
      verse: error.message,
      guardianSeoSuccess: false,
      error: error.message
    });
  }
});

// Guardian Upload + YouTube Upload
app.post('/guardian-upload', async (req, res) => {
  let verse; // Declarar fuera del try para que esté disponible en el catch
  try {
    // Leer último script desde Supabase
    const { createClient } = require('@supabase/supabase-js');
    const ws = require('ws');
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
      realtime: { transport: ws }
    });

    const { data: scripts } = await supabase
      .from('generated_scripts')
      .select('verse_reference')
      .order('created_at', { ascending: false })
      .limit(1);

    verse = scripts?.[0]?.verse_reference || req.body?.verse;
    if (!verse) throw new Error('No verse found');

    console.log(`\n👼 Executing Guardian Upload + YouTube Upload for: ${verse}`);

    const result = execSync(
      `node agents/guardian-upload-FIXED.js "${verse}"`,
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
      verse: error.message,
      guardianUploadSuccess: false,
      error: error.message
    });
  }
});

// Guardian Thumbnail + Agent 9 PRODUCTION (Hardened)
app.post('/guardian-thumbnail', async (req, res) => {
  let verse; // Declarar fuera del try para que esté disponible en el catch
  let videoId; // Declarar fuera del try para que esté disponible en el catch
  try {
    // Leer último script desde Supabase
    const { createClient } = require('@supabase/supabase-js');
    const ws = require('ws');
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
      realtime: { transport: ws }
    });

    const { data: scripts } = await supabase
      .from('generated_scripts')
      .select('verse_reference')
      .order('created_at', { ascending: false })
      .limit(1);

    verse = scripts?.[0]?.verse_reference || req.body?.verse;
    if (!verse) throw new Error('No verse found');

    // Intentar obtener videoId desde el resultado de guardian-upload
    const verseSlug = verse.replace(/[:\s]/g, '-');
    const uploadPath = path.join(BASE_DIR, `output/youtube-metadata/upload-result-${verseSlug}.json`);
    videoId = req.body?.videoId;

    try {
      const uploadData = JSON.parse(fs.readFileSync(uploadPath, 'utf-8'));
      videoId = uploadData.videoId || videoId;
    } catch (e) {
      console.warn('⚠️  No se pudo leer videoId desde upload-result, usando req.body');
    }

    console.log(`\n👼 Executing Agent 9 PRODUCTION (Hardened) for: ${verse}, videoId: ${videoId}`);
    console.log(`✅ Using production version with retry, validation, and error recovery`);

    if (!videoId) {
      console.error('videoId no disponible - skip thumbnail');
      return res.json({
        success: false,
        verse,
        guardianThumbnailSuccess: false,
        thumbnailSkipped: true
      });
    }

    // PASO 1: Ejecutar Agent 9 PRODUCTION (hardened version con retry y validación)
    const result = execSync(
      `node agents/agent-9-thumbnail-generator-production.js "${verse}"`,
      { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024, timeout: 15 * 60 * 1000, cwd: BASE_DIR }
    );

    console.log(result);

    // PASO 2: Ejecutar Guardian para validar thumbnail final y subirlo a YouTube
    console.log('\n👼 Ejecutando Guardian para validar y subir thumbnail...');
    const guardianResult = execSync(
      `node agents/guardian-thumbnail.js "${verse}" "${videoId}"`,
      { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024, timeout: 10 * 60 * 1000, cwd: BASE_DIR }
    );

    console.log(guardianResult);

    res.json({
      success: true,
      verse,
      guardianThumbnailSuccess: true,
      thumbnailUpdated: true,
      productionVersion: true
    });
  } catch (error) {
    console.error('❌ Agent 9 Production error:', error.message);
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
