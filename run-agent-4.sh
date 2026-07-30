#!/bin/bash
# ============================================================================
# Agent 4 Wrapper - Ejecuta Claude Code con Magnific MCP
# Diseñado para ser llamado via SSH para evitar recursión
# ============================================================================

set -e

cd ~/project-yt

# Ruta absoluta al binario de Claude (crítico para execSync)
CLAUDE_BIN="/home/desarrollo/.local/bin/claude"

echo "🎨 Iniciando Agent 4 (Magnific MCP) para generación de imágenes..."

# Ejecutar Agent 4 con Claude Code MCP
# IMPORTANTE: Usar --bg (background) y --permission-mode dontAsk
SESSION_ID=$("$CLAUDE_BIN" --bg --permission-mode dontAsk \
  "$(cat agents/agent-4-magnific-mcp.md)" 2>&1 | grep "backgrounded" | awk '{print $3}')

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
MAX_WAIT=30  # 30 segundos máximo
WAIT_COUNT=0
METADATA_FOUND=false

while [ $WAIT_COUNT -lt $MAX_WAIT ]; do
  # Buscar el archivo de metadata más reciente en los últimos 5 minutos
  LATEST_METADATA=$(find ~/project-yt/output/image-metadata/ -name "images-*.json" -mmin -5 -type f | sort | tail -1)
  
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
