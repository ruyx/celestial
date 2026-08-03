#!/bin/bash
# ============================================================================
# Agent 4 Wrapper - Ejecuta Claude Code con Magnific MCP
# Diseñado para ser llamado via SSH para evitar recursión
# ============================================================================

set -e

cd ~/ruy-projects/project-yt

# Parámetro: versículo (requerido)
VERSE="$1"
if [ -z "$VERSE" ]; then
  echo "❌ Error: Se requiere el versículo como parámetro"
  echo "Uso: $0 \"Filipenses 2:3\""
  exit 1
fi

# Convertir versículo a formato de filename (espacios → -, : → -)
VERSE_FILENAME=$(echo "$VERSE" | sed 's/ /-/g' | sed 's/:/-/g')

# Ruta absoluta al binario de Claude (crítico para execSync)
# Usar which para detectar automáticamente en lugar de hardcodear
CLAUDE_BIN=$(which claude)

echo "🎨 Iniciando Agent 4 (Magnific MCP) para generación de imágenes..."
echo "📖 Versículo: $VERSE"

# Ejecutar Agent 4 con Claude Code MCP
# IMPORTANTE: Usar --bg (background) y --permission-mode dontAsk
# Pasar el versículo específico al agente
PROMPT="$(cat agents/agent-4-magnific-mcp.md)

---

**Process this specific verse**: $VERSE

Find the batch file for this exact verse (e.g., batch-${VERSE_FILENAME}-*.json), NOT the most recent batch overall."

SESSION_ID=$("$CLAUDE_BIN" --bg --permission-mode dontAsk \
  "$PROMPT" 2>&1 | grep "backgrounded" | awk '{print $3}')

echo "✅ Agent 4 session started: $SESSION_ID"
echo "📊 Monitor with: claude logs $SESSION_ID"

# ESPERAR a que la sesión termine (CRÍTICO para el guardian)
echo "⏳ Esperando a que Agent 4 complete la generación de imágenes..."
"$CLAUDE_BIN" attach "$SESSION_ID" || {
  echo "❌ Error: Agent 4 falló"
  exit 1
}

echo "✅ Agent 4 completado exitosamente"

# VERIFICAR que el metadata se escribió antes de terminar (CRÍTICO para el guardian)
echo "🔍 Verificando que el metadata se guardó..."
echo "🔍 Buscando: images-${VERSE_FILENAME}-*.json"
MAX_WAIT=300  # 5 minutos máximo (para dar tiempo a Magnific a generar 5 imágenes)
WAIT_COUNT=0
METADATA_FOUND=false

while [ $WAIT_COUNT -lt $MAX_WAIT ]; do
  # Buscar el archivo de metadata ESPECÍFICO del versículo en los últimos 5 minutos
  LATEST_METADATA=$(find ~/ruy-projects/project-yt/output/image-metadata/ -name "images-${VERSE_FILENAME}-*.json" -mmin -5 -type f | sort | tail -1)

  if [ -n "$LATEST_METADATA" ] && [ -s "$LATEST_METADATA" ]; then
    # Verificar que el JSON es válido
    if python3 -c "import json; json.load(open('$LATEST_METADATA'))" 2>/dev/null; then
      echo "✅ Metadata encontrado y válido: $(basename $LATEST_METADATA)"
      METADATA_FOUND=true
      break
    fi
  fi

  echo "⏳ Esperando metadata... ($WAIT_COUNT/$MAX_WAIT)"
  sleep 1
  WAIT_COUNT=$((WAIT_COUNT + 1))
done

if [ "$METADATA_FOUND" = false ]; then
  echo "❌ Error: Metadata no se generó después de Agent 4"
  exit 1
fi

echo "✅ Agent 4 y metadata completos"
