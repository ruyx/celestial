#!/bin/bash
# ============================================================================
# Agent 5 Wrapper - FREE VERSION (Stable Video Diffusion via Replicate)
# ============================================================================
#
# COSTO: $0 USD (Stability AI Community License + free tier)
#
# ALTERNATIVA PAGA: run-agent-5-MAGNIFIC-PAID.sh.DISABLED
# Magnific cuesta ~$45.50 USD por 5 videos de 13s
#
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

echo "🎬 Iniciando Agent 5 (Stable Video Diffusion FREE) para generación de videos..."
echo "📖 Versículo: $VERSE"
echo "💰 Costo: \$0 USD (Community License)"
echo ""

# Ejecutar Agent 5 con Node.js
node agents/agent-5-stable-video-diffusion-free.js "$VERSE" || {
  echo "❌ Error: Agent 5 falló"
  exit 1
}

echo "✅ Agent 5 completado exitosamente"

# VERIFICAR que los videos se crearon
echo ""
echo "🔍 Verificando que los videos se generaron..."
echo "🔍 Buscando: videos-completed-${VERSE_FILENAME}-*.json"
MAX_WAIT=60
WAIT_COUNT=0
VIDEOS_FOUND=false

while [ $WAIT_COUNT -lt $MAX_WAIT ]; do
  VIDEO_METADATA=$(find "$SCRIPT_DIR/output/video-metadata/" -name "videos-completed-${VERSE_FILENAME}-*.json" -type f | sort | tail -1)

  if [ -n "$VIDEO_METADATA" ] && [ -s "$VIDEO_METADATA" ]; then
    FILE_SIZE=$(stat -c%s "$VIDEO_METADATA" 2>/dev/null || stat -f%z "$VIDEO_METADATA" 2>/dev/null || echo "0")
    if [ "$FILE_SIZE" -gt 1024 ]; then
      echo "✅ Metadata de videos encontrado: $(basename $VIDEO_METADATA)"
      echo "📊 Tamaño: $(du -h "$VIDEO_METADATA" | cut -f1)"
      VIDEOS_FOUND=true
      break
    fi
  fi

  echo "⏳ Esperando metadata de videos... ($WAIT_COUNT/$MAX_WAIT)"
  sleep 1
  WAIT_COUNT=$((WAIT_COUNT + 1))
done

if [ "$VIDEOS_FOUND" = false ]; then
  echo "❌ Error: Metadata de videos no se generó después de Agent 5"
  exit 1
fi

echo "✅ Agent 5 y metadata completos"
