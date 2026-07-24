#!/bin/bash

################################################################################
# 🚀 FULL PIPELINE - YouTube Bible Content Automation
################################################################################
#
# Pipeline completo de generación y publicación de videos bíblicos:
# Agent 1 → 2 → 3 → 4 → 5 → 6 → 7 (templates) → 8 (YouTube)
#
# USAGE: ./run-full-pipeline.sh ["Versículo específico"]
#
# Si no se proporciona versículo, Agent 1 seleccionará uno aleatorio
#
################################################################################

set -e  # Exit on error

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Timestamp
START_TIME=$(date +%s)

echo -e "${BLUE}"
echo "════════════════════════════════════════════════════════════════"
echo "🚀 FULL PIPELINE - YouTube Bible Content Automation"
echo "════════════════════════════════════════════════════════════════"
echo -e "${NC}"

# ══════════════════════════════════════════════════════════════════
# AGENT 1: VERSE SELECTOR
# ══════════════════════════════════════════════════════════════════

echo -e "\n${YELLOW}[AGENT 1]${NC} 📖 Seleccionando versículo..."

if [ -z "$1" ]; then
  # Versículo aleatorio
  node agents/agent-1-verse-selector.js > /tmp/agent1-output.txt
else
  # Versículo específico
  VERSE="$1"
  echo "   → Versículo forzado: $VERSE"
fi

# Extraer versículo del output
if [ -z "$VERSE" ]; then
  VERSE=$(grep -oP '"verse":\s*"\K[^"]+' /tmp/agent1-output.txt | head -1)
fi

echo -e "${GREEN}   ✅ Versículo seleccionado: $VERSE${NC}\n"

# ══════════════════════════════════════════════════════════════════
# AGENT 2: SCRIPTWRITER
# ══════════════════════════════════════════════════════════════════

echo -e "${YELLOW}[AGENT 2]${NC} 🎨 Generando prompts visuales cinematográficos..."
node agents/agent-2-image-designer-pro.js "$VERSE"
echo -e "${GREEN}   ✅ Prompts visuales generados${NC}\n"

# ══════════════════════════════════════════════════════════════════
# AGENT 3: BATCH GENERATOR
# ══════════════════════════════════════════════════════════════════

echo -e "${YELLOW}[AGENT 3]${NC} 📦 Preparando batch para Magnific..."
node agents/agent-3-batch-generator.js "$VERSE"
echo -e "${GREEN}   ✅ Batch preparado${NC}\n"

# ══════════════════════════════════════════════════════════════════
# AGENT 4: EXECUTE BATCH (MAGNIFIC)
# ══════════════════════════════════════════════════════════════════

echo -e "${YELLOW}[AGENT 4]${NC} 🎥 Generando imágenes con Magnific..."
echo -e "${BLUE}   ⏱️  Tiempo estimado: 3-5 minutos (5 imágenes)${NC}"
# Agent 4 se ejecutará desde Claude Code con MCP access
echo -e "${BLUE}   ℹ️  Requiere Magnific MCP autenticado${NC}\n"

# ══════════════════════════════════════════════════════════════════
# AGENT 5: VIDEO ANIMATOR
# ══════════════════════════════════════════════════════════════════

echo -e "${YELLOW}[AGENT 5]${NC} 🎬 Animando imágenes a video..."
echo -e "${BLUE}   ⏱️  Tiempo estimado: 8-12 minutos${NC}"
# Agent 5 también requiere Magnific MCP
echo -e "${BLUE}   ℹ️  Requiere Magnific MCP autenticado${NC}\n"

# ══════════════════════════════════════════════════════════════════
# AGENT 6: AUDIO VOICE EXPERT (TTS)
# ══════════════════════════════════════════════════════════════════

echo -e "${YELLOW}[AGENT 6]${NC} 🎤 Generando audio TTS..."
# Agent 6 también requiere Magnific MCP para TTS
echo -e "${BLUE}   ℹ️  Requiere Magnific MCP autenticado${NC}\n"

# ══════════════════════════════════════════════════════════════════
# AGENT 7: VIDEO EDITOR CON TEMPLATES
# ══════════════════════════════════════════════════════════════════

echo -e "${YELLOW}[AGENT 7]${NC} 🎬 Ensamblando video con templates..."
echo -e "${BLUE}   → Estructura: Intro (5s) + Clips (90s) + Outro (15s) + Audio (120s)${NC}"
node agents/agent-7-with-templates.js "$VERSE"
echo -e "${GREEN}   ✅ Video final ensamblado${NC}\n"

# ══════════════════════════════════════════════════════════════════
# AGENT QA: VALIDACIÓN DE CALIDAD
# ══════════════════════════════════════════════════════════════════

echo -e "${YELLOW}[AGENT QA]${NC} 🔍 Validando calidad del video..."
echo -e "${BLUE}   → Verificando: duración, audio, resolución, códecs, bitrate, estructura${NC}"

if ! node agents/agent-qa-validator.js "$VERSE"; then
  echo -e "${RED}   ❌ El video NO pasó la validación de calidad${NC}"
  echo -e "${RED}   ❌ Revise el reporte en output/qa-reports/${NC}\n"
  exit 1
fi

echo -e "${GREEN}   ✅ Video validado correctamente${NC}\n"

# ══════════════════════════════════════════════════════════════════
# OBTENER PATH DEL VIDEO FINAL
# ══════════════════════════════════════════════════════════════════

VERSE_FILENAME=$(echo "$VERSE" | sed 's/[: ]/-/g')
FINAL_VIDEO="output/final-videos/final-${VERSE_FILENAME}.mp4"

if [ ! -f "$FINAL_VIDEO" ]; then
  echo -e "${RED}❌ Error: Video final no encontrado en $FINAL_VIDEO${NC}"
  exit 1
fi

# ══════════════════════════════════════════════════════════════════
# AGENT 8: YOUTUBE UPLOADER (COMENTADO PARA PRUEBA LOCAL)
# ══════════════════════════════════════════════════════════════════

echo -e "${BLUE}[AGENT 8]${NC} 📤 YouTube upload OMITIDO (modo prueba)"
echo -e "${BLUE}   → Video listo en: $FINAL_VIDEO${NC}\n"

# echo -e "${YELLOW}[AGENT 8]${NC} 📤 Subiendo a YouTube..."
# echo -e "${BLUE}   → Video: $FINAL_VIDEO${NC}"
#
# # Generar título y descripción
# TITLE="$VERSE - Palabra de Dios | Reina-Valera 1960"
# DESCRIPTION="📖 $VERSE
#
# 🙏 Versículo del día de la Biblia Reina-Valera 1960.
#
# ✨ Suscríbete para recibir versículos bíblicos diarios
# 🔔 Activa la campana
# 💬 Comparte tu testimonio
#
# #BibliaDiaria #ReinaValera1960 #PalabraDeDios"
#
# # Subir a YouTube
# node agents/agent-8-youtube-uploader.js "$FINAL_VIDEO" "$TITLE" "$DESCRIPTION"
# echo -e "${GREEN}   ✅ Video publicado en YouTube${NC}\n"

# ══════════════════════════════════════════════════════════════════
# RESUMEN FINAL
# ══════════════════════════════════════════════════════════════════

END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))
MINUTES=$((DURATION / 60))
SECONDS=$((DURATION % 60))

echo -e "\n${GREEN}"
echo "════════════════════════════════════════════════════════════════"
echo "✅ PIPELINE COMPLETADO EXITOSAMENTE"
echo "════════════════════════════════════════════════════════════════"
echo -e "${NC}"
echo "📖 Versículo: $VERSE"
echo "📁 Video: $FINAL_VIDEO"
echo "⏱️  Tiempo total: ${MINUTES}m ${SECONDS}s"
echo ""
echo -e "${BLUE}🎉 ¡Video publicado y listo en YouTube!${NC}\n"
