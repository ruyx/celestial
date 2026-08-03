#!/usr/bin/env node

/**
 * Script para actualizar workflow de n8n con pipeline COMPLETO v3.0
 * Incluye Agent 0 + todos los guardianes actualizados
 */

const nodes = [
  // ========== TRIGGERS ==========
  {
    id: "daily-trigger",
    name: "Daily Trigger (12:00 PM)",
    type: "n8n-nodes-base.scheduleTrigger",
    typeVersion: 1.2,
    position: [240, 300],
    parameters: {
      rule: {
        interval: [{ field: "hours", hoursInterval: 24 }]
      }
    }
  },
  {
    id: "manual-trigger",
    name: "Manual Webhook",
    type: "n8n-nodes-base.webhook",
    typeVersion: 1.1,
    position: [240, 480],
    parameters: {
      httpMethod: "POST",
      path: "youtube-viral-manual",
      responseMode: "lastNode"
    }
  },

  // ========== AGENT 0: CEREBRO DEL SISTEMA ==========
  {
    id: "agent-0",
    name: "Agent 0: Verse Researcher",
    type: "n8n-nodes-base.code",
    typeVersion: 2,
    position: [440, 380],
    parameters: {
      mode: "runOnceForAllItems",
      language: "javaScript",
      jsCode: `const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔬 AGENT 0: VERSE RESEARCHER');

try {
  const result = execSync(
    'cd /home/suario/ruy-projects/project-yt && node agents/agent-0-verse-researcher.js',
    { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 }
  );

  console.log(result);

  const decisionPath = '/home/suario/ruy-projects/project-yt/output/agent-0-decision.json';
  const decision = JSON.parse(fs.readFileSync(decisionPath, 'utf-8'));

  return [{
    json: {
      success: true,
      verse: decision.selectedVerse.reference,
      category: decision.selectedVerse.category,
      metadata: decision.metadata,
      agent0Decision: decision
    }
  }];
} catch (error) {
  return [{
    json: {
      success: false,
      error: error.message
    }
  }];
}`
    }
  },

  // ========== AGENT 1: VIRAL SCRIPTWRITER ==========
  {
    id: "agent-1",
    name: "Agent 1: Viral Scriptwriter",
    type: "n8n-nodes-base.code",
    typeVersion: 2,
    position: [640, 380],
    parameters: {
      mode: "runOnceForAllItems",
      language: "javaScript",
      jsCode: `const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Faltan credenciales de Supabase');
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function getLatestScript() {
  const { data: script, error } = await supabase
    .from('generated_scripts')
    .select('*')
    .order('generated_at', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return {
        success: false,
        error: 'No hay scripts disponibles'
      };
    }
    throw error;
  }

  const metadata = script.metadata || {};
  const scenes = script.scenes || [];

  return {
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
  };
}

const result = await getLatestScript();
return [{ json: result }];`
    }
  },

  // ========== AGENTS 2-3 ==========
  {
    id: "agent-2",
    name: "Agent 2: Visual Designer PRO",
    type: "n8n-nodes-base.code",
    typeVersion: 2,
    position: [840, 380],
    parameters: {
      mode: "runOnceForAllItems",
      language: "javaScript",
      jsCode: `const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

try {
  console.log('🎨 AGENT 2: VISUAL DESIGNER PRO');

  const result = execSync(
    'cd /home/suario/ruy-projects/project-yt && node agents/agent-2-image-designer-pro.js',
    { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 }
  );

  console.log(result);

  const designDir = '/home/suario/ruy-projects/project-yt/output/image-prompts';
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

  return [{
    json: {
      success: true,
      verse: designData.verse,
      designData: designData
    }
  }];
} catch (error) {
  return [{
    json: {
      success: false,
      error: error.message
    }
  }];
}`
    }
  },

  {
    id: "agent-3",
    name: "Agent 3: Batch Generator",
    type: "n8n-nodes-base.code",
    typeVersion: 2,
    position: [1040, 380],
    parameters: {
      mode: "runOnceForAllItems",
      language: "javaScript",
      jsCode: `const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

try {
  console.log('📦 AGENT 3: BATCH GENERATOR');

  const result = execSync(
    'cd /home/suario/ruy-projects/project-yt && node agents/agent-3-batch-generator.js',
    { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 }
  );

  console.log(result);

  const batchDir = '/home/suario/ruy-projects/project-yt/output/image-batches';
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

  return [{
    json: {
      success: true,
      verse: batchData.verse,
      batch: batchData
    }
  }];
} catch (error) {
  return [{
    json: {
      success: false,
      error: error.message
    }
  }];
}`
    }
  },

  // ========== GUARDIAN + AGENT 4-9 ==========
  {
    id: "guardian-images",
    name: "Guardian Images + Agent 4",
    type: "n8n-nodes-base.code",
    typeVersion: 2,
    position: [1240, 380],
    parameters: {
      mode: "runOnceForAllItems",
      language: "javaScript",
      jsCode: `const { execSync } = require('child_process');

const verse = $input.first().json.verse;

console.log('👼 GUARDIAN IMAGES + AGENT 4');

try {
  const result = execSync(
    \`cd /home/suario/ruy-projects/project-yt && node agents/guardian-images.js "\${verse}"\`,
    { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024, timeout: 15 * 60 * 1000 }
  );

  console.log(result);

  return [{
    json: {
      ...($input.first().json),
      guardianImagesSuccess: true
    }
  }];
} catch (error) {
  return [{
    json: {
      ...($input.first().json),
      guardianImagesSuccess: false,
      error: error.message
    }
  }];
}`
    }
  },

  {
    id: "guardian-videos",
    name: "Guardian Videos + Agent 5",
    type: "n8n-nodes-base.code",
    typeVersion: 2,
    position: [1440, 380],
    parameters: {
      mode: "runOnceForAllItems",
      language: "javaScript",
      jsCode: `const { execSync } = require('child_process');

const verse = $input.first().json.verse;

console.log('👼 GUARDIAN VIDEOS + AGENT 5');

try {
  const result = execSync(
    \`cd /home/suario/ruy-projects/project-yt && node agents/guardian-videos.js "\${verse}"\`,
    { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024, timeout: 20 * 60 * 1000 }
  );

  console.log(result);

  return [{
    json: {
      ...($input.first().json),
      guardianVideosSuccess: true
    }
  }];
} catch (error) {
  return [{
    json: {
      ...($input.first().json),
      guardianVideosSuccess: false,
      error: error.message
    }
  }];
}`
    }
  },

  {
    id: "guardian-audio",
    name: "Guardian Audio + Agent 6",
    type: "n8n-nodes-base.code",
    typeVersion: 2,
    position: [1640, 380],
    parameters: {
      mode: "runOnceForAllItems",
      language: "javaScript",
      jsCode: `const { execSync } = require('child_process');

const verse = $input.first().json.verse;

console.log('👼 GUARDIAN AUDIO + AGENT 6');

try {
  const result = execSync(
    \`cd /home/suario/ruy-projects/project-yt && node agents/guardian-audio.js "\${verse}"\`,
    { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024, timeout: 10 * 60 * 1000 }
  );

  console.log(result);

  return [{
    json: {
      ...($input.first().json),
      guardianAudioSuccess: true
    }
  }];
} catch (error) {
  return [{
    json: {
      ...($input.first().json),
      guardianAudioSuccess: false,
      error: error.message
    }
  }];
}`
    }
  },

  {
    id: "guardian-final-video",
    name: "Guardian Final Video + Agent 7",
    type: "n8n-nodes-base.code",
    typeVersion: 2,
    position: [1840, 380],
    parameters: {
      mode: "runOnceForAllItems",
      language: "javaScript",
      jsCode: `const { execSync } = require('child_process');

const verse = $input.first().json.verse;

console.log('👼 GUARDIAN FINAL VIDEO + AGENT 7');

try {
  const result = execSync(
    \`cd /home/suario/ruy-projects/project-yt && node agents/guardian-final-video.js "\${verse}"\`,
    { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024, timeout: 15 * 60 * 1000 }
  );

  console.log(result);

  const verseSlug = verse.replace(/[:\\s]/g, '-');
  const videoPath = \`/home/suario/ruy-projects/project-yt/output/final-videos/final-\${verseSlug}.mp4\`;

  return [{
    json: {
      ...($input.first().json),
      guardianFinalVideoSuccess: true,
      finalVideoPath: videoPath
    }
  }];
} catch (error) {
  return [{
    json: {
      ...($input.first().json),
      guardianFinalVideoSuccess: false,
      error: error.message
    }
  }];
}`
    }
  },

  {
    id: "guardian-seo",
    name: "Guardian SEO + Agent 8",
    type: "n8n-nodes-base.code",
    typeVersion: 2,
    position: [2040, 380],
    parameters: {
      mode: "runOnceForAllItems",
      language: "javaScript",
      jsCode: `const { execSync } = require('child_process');

const verse = $input.first().json.verse;

console.log('👼 GUARDIAN SEO + AGENT 8');

try {
  const result = execSync(
    \`cd /home/suario/ruy-projects/project-yt && node agents/guardian-seo.js "\${verse}"\`,
    { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024, timeout: 10 * 60 * 1000 }
  );

  console.log(result);

  const fs = require('fs');
  const verseSlug = verse.replace(/[:\\s]/g, '-');
  const metadataPath = \`/home/suario/ruy-projects/project-yt/output/youtube-metadata/youtube-metadata-\${verseSlug}.json\`;
  const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));

  return [{
    json: {
      ...($input.first().json),
      guardianSeoSuccess: true,
      youtubeTitle: metadata.seoTitle,
      youtubeDescription: metadata.description,
      youtubeTags: metadata.tags
    }
  }];
} catch (error) {
  return [{
    json: {
      ...($input.first().json),
      guardianSeoSuccess: false,
      error: error.message
    }
  }];
}`
    }
  },

  {
    id: "guardian-upload",
    name: "Guardian Upload + YouTube Upload",
    type: "n8n-nodes-base.code",
    typeVersion: 2,
    position: [2240, 380],
    parameters: {
      mode: "runOnceForAllItems",
      language: "javaScript",
      jsCode: `const { execSync } = require('child_process');

const verse = $input.first().json.verse;

console.log('👼 GUARDIAN UPLOAD + YOUTUBE UPLOAD');

try {
  const result = execSync(
    \`cd /home/suario/ruy-projects/project-yt && node agents/guardian-upload.js "\${verse}"\`,
    { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024, timeout: 40 * 60 * 1000 }
  );

  console.log(result);

  const fs = require('fs');
  const verseSlug = verse.replace(/[:\\s]/g, '-');
  const uploadPath = \`/home/suario/ruy-projects/project-yt/output/youtube-metadata/upload-result-\${verseSlug}.json\`;
  const uploadData = JSON.parse(fs.readFileSync(uploadPath, 'utf-8'));

  return [{
    json: {
      ...($input.first().json),
      guardianUploadSuccess: true,
      videoId: uploadData.videoId,
      videoUrl: uploadData.videoUrl
    }
  }];
} catch (error) {
  return [{
    json: {
      ...($input.first().json),
      guardianUploadSuccess: false,
      error: error.message
    }
  }];
}`
    }
  },

  {
    id: "guardian-thumbnail",
    name: "Guardian Thumbnail + Agent 9",
    type: "n8n-nodes-base.code",
    typeVersion: 2,
    position: [2440, 380],
    parameters: {
      mode: "runOnceForAllItems",
      language: "javaScript",
      jsCode: `const { execSync } = require('child_process');

const verse = $input.first().json.verse;
const videoId = $input.first().json.videoId;

console.log('👼 GUARDIAN THUMBNAIL + AGENT 9 OSCAR MARRÓN');

if (!videoId) {
  console.error('videoId no disponible - skip thumbnail');
  return [{
    json: {
      ...($input.first().json),
      guardianThumbnailSuccess: false,
      thumbnailSkipped: true
    }
  }];
}

try {
  const result = execSync(
    \`cd /home/suario/ruy-projects/project-yt && node agents/guardian-thumbnail.js "\${verse}" "\${videoId}"\`,
    { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024, timeout: 15 * 60 * 1000 }
  );

  console.log(result);

  return [{
    json: {
      ...($input.first().json),
      guardianThumbnailSuccess: true,
      thumbnailUpdated: true
    }
  }];
} catch (error) {
  return [{
    json: {
      ...($input.first().json),
      guardianThumbnailSuccess: false,
      thumbnailError: error.message
    }
  }];
}`
    }
  },

  {
    id: "production-check",
    name: "Production Success?",
    type: "n8n-nodes-base.if",
    typeVersion: 1,
    position: [2640, 380],
    parameters: {
      conditions: {
        string: [
          {
            value1: "={{ $json.guardianUploadSuccess }}",
            value2: "true"
          }
        ]
      }
    }
  },

  {
    id: "success-log",
    name: "Production Success Log",
    type: "n8n-nodes-base.set",
    typeVersion: 1,
    position: [2840, 280],
    parameters: {
      values: {
        string: [
          { name: "status", value: "✅ PRODUCCIÓN COMPLETADA" },
          { name: "verse", value: "={{ $json.verse }}" },
          { name: "videoUrl", value: "={{ $json.videoUrl }}" },
          { name: "thumbnailUpdated", value: "={{ $json.thumbnailUpdated }}" }
        ]
      }
    }
  },

  {
    id: "error-log",
    name: "Production Error Log",
    type: "n8n-nodes-base.set",
    typeVersion: 1,
    position: [2840, 480],
    parameters: {
      values: {
        string: [
          { name: "status", value: "❌ PRODUCCIÓN FALLÓ" },
          { name: "error", value: "={{ $json.error }}" }
        ]
      }
    }
  }
];

const connections = {
  "Daily Trigger (12:00 PM)": {
    main: [[{ node: "Agent 0: Verse Researcher", type: "main", index: 0 }]]
  },
  "Manual Webhook": {
    main: [[{ node: "Agent 0: Verse Researcher", type: "main", index: 0 }]]
  },
  "Agent 0: Verse Researcher": {
    main: [[{ node: "Agent 1: Viral Scriptwriter", type: "main", index: 0 }]]
  },
  "Agent 1: Viral Scriptwriter": {
    main: [[{ node: "Agent 2: Visual Designer PRO", type: "main", index: 0 }]]
  },
  "Agent 2: Visual Designer PRO": {
    main: [[{ node: "Agent 3: Batch Generator", type: "main", index: 0 }]]
  },
  "Agent 3: Batch Generator": {
    main: [[{ node: "Guardian Images + Agent 4", type: "main", index: 0 }]]
  },
  "Guardian Images + Agent 4": {
    main: [[{ node: "Guardian Videos + Agent 5", type: "main", index: 0 }]]
  },
  "Guardian Videos + Agent 5": {
    main: [[{ node: "Guardian Audio + Agent 6", type: "main", index: 0 }]]
  },
  "Guardian Audio + Agent 6": {
    main: [[{ node: "Guardian Final Video + Agent 7", type: "main", index: 0 }]]
  },
  "Guardian Final Video + Agent 7": {
    main: [[{ node: "Guardian SEO + Agent 8", type: "main", index: 0 }]]
  },
  "Guardian SEO + Agent 8": {
    main: [[{ node: "Guardian Upload + YouTube Upload", type: "main", index: 0 }]]
  },
  "Guardian Upload + YouTube Upload": {
    main: [[{ node: "Guardian Thumbnail + Agent 9", type: "main", index: 0 }]]
  },
  "Guardian Thumbnail + Agent 9": {
    main: [[{ node: "Production Success?", type: "main", index: 0 }]]
  },
  "Production Success?": {
    main: [
      [{ node: "Production Success Log", type: "main", index: 0 }],
      [{ node: "Production Error Log", type: "main", index: 0 }]
    ]
  }
};

console.log('✅ Workflow structure created');
console.log(`📊 Nodes: ${nodes.length}`);
console.log(`🔗 Connections: ${Object.keys(connections).length}`);
console.log('\n📋 Pipeline Flow:');
console.log('1. Agent 0: Verse Researcher (Cerebro)');
console.log('2. Agent 1: Viral Scriptwriter');
console.log('3. Agent 2: Visual Designer PRO');
console.log('4. Agent 3: Batch Generator');
console.log('5. Guardian Images + Agent 4: Magnific API');
console.log('6. Guardian Videos + Agent 5: Video Animator');
console.log('7. Guardian Audio + Agent 6: Audio TTS');
console.log('8. Guardian Final Video + Agent 7: Video Editor');
console.log('9. Guardian SEO + Agent 8: YouTube SEO');
console.log('10. Guardian Upload + YouTube Upload');
console.log('11. Guardian Thumbnail + Agent 9: Oscar Marrón');
console.log('12. Production Success Check');

// Export for use with n8n update
module.exports = { nodes, connections };
