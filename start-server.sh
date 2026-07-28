#!/bin/bash

# Script de inicio para Render.com
# 1. Configura SSH hacia servidor xprinta
# 2. Crea directorios necesarios
# 3. Inicia servidor Node.js

set -e

echo "🚀 Iniciando servidor..."

# Paso 1: Configurar SSH
echo "📡 Configurando acceso SSH..."
bash setup-ssh.sh

# Paso 2: Crear directorios de output
echo "📁 Creando directorios..."
mkdir -p output/{scripts,image-prompts,image-batches,image-metadata,images,videos,final-videos,youtube-metadata,video-metadata}

# Paso 3: Iniciar servidor
echo "🎬 Iniciando agent-server..."
node agent-server.js
