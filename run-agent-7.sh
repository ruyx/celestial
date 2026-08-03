#!/bin/bash
# ============================================================================
# Agent 7 Wrapper - Ejecuta video editor (NO requiere Claude Code/MCP)
# A diferencia de Agents 4,5,6, este es un script Node.js standalone con ffmpeg
# ============================================================================

set -e

# Auto-detect project directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Parámetro: versículo (requerido)
VERSE="$1"
if [ -z "$VERSE" ]; then
  echo "❌ Error: Se requiere el versículo como parámetro"
  echo "Uso: $0 \"Filipenses 2:3\""
  exit 1
fi

# Convertir versículo a formato de filename (espacios → -, : → -)
VERSE_FILENAME=$(echo "$VERSE" | sed 's/ /-/g' | sed 's/:/-/g')

echo "🎬 Iniciando Agent 7 (Video Editor) para compilación de video final..."
echo "📖 Versículo: $VERSE"

# Ejecutar Agent 7 directamente (es Node.js standalone, NO usa Claude Code)
node agents/agent-7-video-editor.js "$VERSE" || {
  echo "❌ Error: Agent 7 falló"
  exit 1
}

echo "✅ Agent 7 completado exitosamente"

# VERIFICAR que el video final se creó antes de terminar (CRÍTICO para el guardian)
echo "🔍 Verificando que el video final se compiló..."
echo "🔍 Buscando: final-${VERSE_FILENAME}.mp4"
MAX_WAIT=60  # 1 minuto máximo (la compilación es rápida con ffmpeg)
WAIT_COUNT=0
VIDEO_FOUND=false

while [ $WAIT_COUNT -lt $MAX_WAIT ]; do
  # Buscar el video final ESPECÍFICO del versículo
  FINAL_VIDEO=$(find "$SCRIPT_DIR/output/final-videos/" -name "final-${VERSE_FILENAME}.mp4" -type f | sort | tail -1)

  if [ -n "$FINAL_VIDEO" ] && [ -s "$FINAL_VIDEO" ]; then
    # Verificar que el archivo tiene al menos 1MB (video compilado mínimo)
    FILE_SIZE=$(stat -c%s "$FINAL_VIDEO" 2>/dev/null || echo "0")
    if [ "$FILE_SIZE" -gt 1048576 ]; then
      echo "✅ Video final encontrado y válido: $(basename $FINAL_VIDEO)"
      echo "📊 Tamaño: $(du -h "$FINAL_VIDEO" | cut -f1)"
      VIDEO_FOUND=true
      break
    fi
  fi

  echo "⏳ Esperando video final... ($WAIT_COUNT/$MAX_WAIT)"
  sleep 1
  WAIT_COUNT=$((WAIT_COUNT + 1))
done

if [ "$VIDEO_FOUND" = false ]; then
  echo "❌ Error: Video final no se generó después de Agent 7"
  exit 1
fi

echo "✅ Agent 7 y video final completos"
