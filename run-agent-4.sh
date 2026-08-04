#!/bin/bash
# ============================================================================
# Agent 4 Wrapper - FREE VERSION (Stable Diffusion via Replicate)
# ============================================================================
#
# COSTO: $0 USD (free tier)
#
# ALTERNATIVA PAGA: run-agent-4-MAGNIFIC-PAID.sh.DISABLED
# Magnific cuesta ~$5 USD por 5 imágenes
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

echo "🎨 Iniciando Agent 4 (Stable Diffusion FREE) para generación de imágenes..."
echo "📖 Versículo: $VERSE"
echo "💰 Costo: \$0 USD (free tier)"
echo ""

# Ejecutar Agent 4 con Node.js
node agents/agent-4-stable-diffusion-free.js "$VERSE" || {
  echo "❌ Error: Agent 4 falló"
  exit 1
}

echo "✅ Agent 4 completado exitosamente"

# VERIFICAR que las imágenes se crearon antes de terminar
echo ""
echo "🔍 Verificando que las imágenes se generaron..."
echo "🔍 Buscando: images-${VERSE_FILENAME}-*.json"
MAX_WAIT=60  # 1 minuto máximo
WAIT_COUNT=0
IMAGES_FOUND=false

while [ $WAIT_COUNT -lt $MAX_WAIT ]; do
  # Buscar el metadata file ESPECÍFICO del versículo
  IMAGES_METADATA=$(find "$SCRIPT_DIR/output/image-metadata/" -name "images-${VERSE_FILENAME}-*.json" -type f | sort | tail -1)

  if [ -n "$IMAGES_METADATA" ] && [ -s "$IMAGES_METADATA" ]; then
    # Verificar que el archivo tiene al menos 1KB (metadata mínimo)
    FILE_SIZE=$(stat -c%s "$IMAGES_METADATA" 2>/dev/null || stat -f%z "$IMAGES_METADATA" 2>/dev/null || echo "0")
    if [ "$FILE_SIZE" -gt 1024 ]; then
      echo "✅ Metadata de imágenes encontrado: $(basename $IMAGES_METADATA)"
      echo "📊 Tamaño: $(du -h "$IMAGES_METADATA" | cut -f1)"
      IMAGES_FOUND=true
      break
    fi
  fi

  echo "⏳ Esperando metadata de imágenes... ($WAIT_COUNT/$MAX_WAIT)"
  sleep 1
  WAIT_COUNT=$((WAIT_COUNT + 1))
done

if [ "$IMAGES_FOUND" = false ]; then
  echo "❌ Error: Metadata de imágenes no se generó después de Agent 4"
  exit 1
fi

echo "✅ Agent 4 y metadata completos"
