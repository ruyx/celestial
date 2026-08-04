#!/bin/bash
# ============================================================================
# Agent 6 Wrapper - FREE VERSION (AWS Polly TTS)
# ============================================================================
#
# COSTO: $0 USD (AWS Polly free tier: 5M caracteres/mes primer año)
#
# ALTERNATIVA PAGA: run-agent-6-MAGNIFIC-PAID.sh.DISABLED
# Magnific cuesta créditos por cada audio generado
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

echo "🎤 Iniciando Agent 6 (AWS Polly FREE) para generación de audio..."
echo "📖 Versículo: $VERSE"
echo "💰 Costo: \$0 USD (5M caracteres/mes gratis)"
echo ""

# Ejecutar Agent 6 con Node.js
node agents/agent-6-aws-polly-free.js "$VERSE" || {
  echo "❌ Error: Agent 6 falló"
  exit 1
}

echo "✅ Agent 6 completado exitosamente"

# VERIFICAR que el audio se creó
echo ""
echo "🔍 Verificando que el audio se generó..."
echo "🔍 Buscando: audio-metadata-${VERSE_FILENAME}-*.json"
MAX_WAIT=30
WAIT_COUNT=0
AUDIO_FOUND=false

while [ $WAIT_COUNT -lt $MAX_WAIT ]; do
  AUDIO_METADATA=$(find "$SCRIPT_DIR/output/audio-metadata/" -name "audio-metadata-${VERSE_FILENAME}-*.json" -type f | sort | tail -1)

  if [ -n "$AUDIO_METADATA" ] && [ -s "$AUDIO_METADATA" ]; then
    FILE_SIZE=$(stat -c%s "$AUDIO_METADATA" 2>/dev/null || stat -f%z "$AUDIO_METADATA" 2>/dev/null || echo "0")
    if [ "$FILE_SIZE" -gt 512 ]; then
      echo "✅ Metadata de audio encontrado: $(basename $AUDIO_METADATA)"
      echo "📊 Tamaño: $(du -h "$AUDIO_METADATA" | cut -f1)"
      AUDIO_FOUND=true
      break
    fi
  fi

  echo "⏳ Esperando metadata de audio... ($WAIT_COUNT/$MAX_WAIT)"
  sleep 1
  WAIT_COUNT=$((WAIT_COUNT + 1))
done

if [ "$AUDIO_FOUND" = false ]; then
  echo "❌ Error: Metadata de audio no se generó después de Agent 6"
  exit 1
fi

echo "✅ Agent 6 y metadata completos"
