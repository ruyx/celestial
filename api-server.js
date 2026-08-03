#!/usr/bin/env node

/**
 * API Server para n8n
 * Ejecuta agentes y devuelve resultados sin usar módulos bloqueados en n8n
 */

const http = require('http');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const PORT = 3456;
const PROJECT_DIR = '/home/suario/ruy-projects/project-yt';

const server = http.createServer((req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Endpoint: /agent-1-scriptwriter
  if (req.url === '/agent-1-scriptwriter' && req.method === 'GET') {
    try {
      console.log('[API] Ejecutando agent-1-viral-scriptwriter.js...');

      // Ejecutar el agente
      const scriptPath = path.join(PROJECT_DIR, 'agents/agent-1-viral-scriptwriter.js');
      const output = execSync(`node ${scriptPath}`, {
        encoding: 'utf-8',
        cwd: PROJECT_DIR
      });

      console.log('[API] Script ejecutado:', output.substring(0, 100) + '...');

      // Buscar el archivo JSON más reciente
      const scriptsDir = path.join(PROJECT_DIR, 'output/scripts');
      const files = fs.readdirSync(scriptsDir)
        .filter(f => f.startsWith('script-') && f.endsWith('.json'))
        .map(f => ({
          name: f,
          path: path.join(scriptsDir, f),
          time: fs.statSync(path.join(scriptsDir, f)).mtime.getTime()
        }))
        .sort((a, b) => b.time - a.time);

      if (files.length === 0) {
        throw new Error('No se encontró ningún archivo de script generado');
      }

      const latestFile = files[0];
      console.log('[API] Archivo más reciente:', latestFile.name);

      // Leer el contenido
      const content = fs.readFileSync(latestFile.path, 'utf-8');
      const data = JSON.parse(content);

      res.writeHead(200);
      res.end(JSON.stringify({
        success: true,
        scriptFile: latestFile.name,
        data: data
      }));

    } catch (error) {
      console.error('[API] Error:', error.message);
      res.writeHead(500);
      res.end(JSON.stringify({
        success: false,
        error: error.message,
        stack: error.stack
      }));
    }
    return;
  }

  // Endpoint: /health
  if (req.url === '/health' && req.method === 'GET') {
    res.writeHead(200);
    res.end(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }));
    return;
  }

  // 404
  res.writeHead(404);
  res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(PORT, () => {
  console.log(`✅ API Server running on http://localhost:${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/health`);
  console.log(`   Agent 1: http://localhost:${PORT}/agent-1-scriptwriter`);
});
