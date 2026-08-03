#!/bin/bash

# 🧪 Automated Pipeline Testing & Scoring System
# Executes full pipeline and generates autonomy scorecard

set -e  # Exit on error (disabled for scoring purposes)

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
VERSE="${1:-Isaías 41:10}"  # Default test verse
TIMESTAMP=$(date +%s%3N)
SCORECARD_FILE="output/pipeline-scorecard-${TIMESTAMP}.json"

# Initialize scores
declare -A AUTONOMY
declare -A RELIABILITY
declare -A RECOVERY
declare -A LOGGING

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}🧪 PIPELINE AUTONOMY TEST${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "📖 Versículo de prueba: ${VERSE}"
echo -e "⏰ Inicio: $(date)"
echo ""

# Function to evaluate an agent
evaluate_agent() {
  local agent_name=$1
  local agent_script=$2
  local expected_output=$3
  local required_fields=$4
  
  echo -e "${YELLOW}Testing: ${agent_name}${NC}"
  
  local start_time=$(date +%s)
  local autonomy_score=0
  local reliability_score=0
  local recovery_score=0
  local logging_score=0
  
  # Execute agent
  set +e  # Don't exit on error
  node "${agent_script}" "${VERSE}" > /tmp/agent_output.log 2>&1
  local exit_code=$?
  set -e
  
  local end_time=$(date +%s)
  local duration=$((end_time - start_time))
  
  # 1. Autonomy Score (requires no manual intervention)
  if [ $exit_code -eq 0 ]; then
    autonomy_score=100
    echo -e "  ${GREEN}✓${NC} Autonomía: 100% (sin intervención manual)"
  else
    autonomy_score=0
    echo -e "  ${RED}✗${NC} Autonomía: 0% (falló, requiere intervención)"
  fi
  
  # 2. Reliability Score (output file exists and valid)
  # Expand wildcard if present
  local actual_file="${expected_output}"
  if [[ "${expected_output}" == *"*"* ]]; then
    # Find most recent file matching pattern
    actual_file=$(ls -t ${expected_output} 2>/dev/null | head -1)
  fi

  if [ -f "${actual_file}" ]; then
    # Check if it's valid JSON using node (no jq dependency)
    if node -e "JSON.parse(require('fs').readFileSync('${actual_file}', 'utf8'))" 2>/dev/null; then
      reliability_score=100
      echo -e "  ${GREEN}✓${NC} Confiabilidad: 100% (output válido: ${actual_file})"

      # Check required fields using node (supports nested paths like 'metadata.verse')
      local missing_fields=0
      IFS=',' read -ra FIELDS <<< "$required_fields"
      for field in "${FIELDS[@]}"; do
        # Use node to check if field exists (handles nested paths correctly)
        if ! node -e "const obj = JSON.parse(require('fs').readFileSync('${actual_file}', 'utf8')); const path = '${field}'.split('.'); let value = obj; for (const key of path) { if (value === undefined || value === null) process.exit(1); value = value[key]; } if (value === undefined) process.exit(1);" 2>/dev/null; then
          missing_fields=$((missing_fields + 1))
          echo -e "  ${RED}✗${NC} Campo faltante: ${field}"
        fi
      done

      if [ $missing_fields -gt 0 ]; then
        reliability_score=$((100 - (missing_fields * 20)))
      fi
    else
      reliability_score=0
      echo -e "  ${RED}✗${NC} Confiabilidad: 0% (JSON inválido)"
    fi
  else
    reliability_score=0
    echo -e "  ${RED}✗${NC} Confiabilidad: 0% (sin output - buscando: ${expected_output})"
  fi
  
  # 3. Recovery Score (logs show retry attempts)
  if grep -q "Intento\|Reintentando\|retry" /tmp/agent_output.log 2>/dev/null; then
    recovery_score=100
    echo -e "  ${GREEN}✓${NC} Recuperación: 100% (reintentos detectados)"
  else
    recovery_score=50
    echo -e "  ${YELLOW}○${NC} Recuperación: 50% (no hay evidencia de reintentos)"
  fi
  
  # 4. Logging Score (detailed logs present)
  if grep -q "📊\|✅\|❌\|⚠️" /tmp/agent_output.log 2>/dev/null; then
    logging_score=100
    echo -e "  ${GREEN}✓${NC} Logging: 100% (logs detallados)"
  else
    logging_score=50
    echo -e "  ${YELLOW}○${NC} Logging: 50% (logs básicos)"
  fi
  
  # Store scores
  AUTONOMY[$agent_name]=$autonomy_score
  RELIABILITY[$agent_name]=$reliability_score
  RECOVERY[$agent_name]=$recovery_score
  LOGGING[$agent_name]=$logging_score
  
  local avg_score=$(( (autonomy_score + reliability_score + recovery_score + logging_score) / 4 ))
  echo -e "  ${BLUE}Score Total: ${avg_score}%${NC}"
  echo -e "  Duración: ${duration}s"
  echo ""
}

# Clean previous outputs (essential for test autonomy - prevents batch conflicts)
echo "🧹 Limpiando outputs previos..."
rm -rf output/agent-0-decision.json
rm -rf output/scripts/script-*
rm -rf output/image-batches/batch-*
rm -rf output/image-metadata/images-*
rm -rf output/video-metadata/video-*
echo ""

# Execute pipeline
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}EJECUTANDO PIPELINE COMPLETO${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Agent 0: Verse Researcher
evaluate_agent "Agent-0-Verse-Researcher" \
  "agents/agent-0-verse-researcher.js" \
  "output/agent-0-decision.json" \
  "reference,viralPotential,category"

# Agent 1: Viral Scriptwriter
evaluate_agent "Agent-1-Viral-Scriptwriter" \
  "agents/agent-1-viral-scriptwriter.js" \
  "output/scripts/script-*.json" \
  "metadata.verse,scenes"

# Agent 2: Image Designer PRO
evaluate_agent "Agent-2-Image-Designer-PRO" \
  "agents/agent-2-image-designer-pro.js" \
  "output/image-prompts/visual-design-PRO-*.json" \
  "verse,scenes"

# Agent 3: Batch Generator
evaluate_agent "Agent-3-Batch-Generator" \
  "agents/agent-3-batch-generator.js" \
  "output/image-batches/batch-*.json" \
  "verse,scenes"

# Agent 4: Magnific MCP (Images)
evaluate_agent "Agent-4-Magnific-Images" \
  "agents/agent-4-magnific-mcp.js" \
  "output/image-metadata/images-*.json" \
  "verse,images"

# Guardian: Images
evaluate_agent "Guardian-Images" \
  "agents/guardian-images.js" \
  "output/image-metadata/images-*.json" \
  "images"

# Agent 5: Video Animator
evaluate_agent "Agent-5-Video-Animator" \
  "agents/agent-5-video-animator.js" \
  "output/video-metadata/video-*.json" \
  "clips,totalDuration"

# Guardian: Videos
evaluate_agent "Guardian-Videos" \
  "agents/guardian-videos.js" \
  "output/video-metadata/video-*.json" \
  "clips"

# Generate Scorecard JSON
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}GENERANDO SCORECARD${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Calculate averages
total_autonomy=0
total_reliability=0
total_recovery=0
total_logging=0
agent_count=0

for agent in "${!AUTONOMY[@]}"; do
  total_autonomy=$((total_autonomy + AUTONOMY[$agent]))
  total_reliability=$((total_reliability + RELIABILITY[$agent]))
  total_recovery=$((total_recovery + RECOVERY[$agent]))
  total_logging=$((total_logging + LOGGING[$agent]))
  agent_count=$((agent_count + 1))
done

avg_autonomy=$((total_autonomy / agent_count))
avg_reliability=$((total_reliability / agent_count))
avg_recovery=$((total_recovery / agent_count))
avg_logging=$((total_logging / agent_count))
avg_total=$(( (avg_autonomy + avg_reliability + avg_recovery + avg_logging) / 4 ))

# Create JSON scorecard
cat > "${SCORECARD_FILE}" << EOF
{
  "testDate": "$(date -Iseconds)",
  "verse": "${VERSE}",
  "agents": {
EOF

first=true
for agent in "${!AUTONOMY[@]}"; do
  if [ "$first" = false ]; then
    echo "," >> "${SCORECARD_FILE}"
  fi
  first=false
  
  cat >> "${SCORECARD_FILE}" << EOF
    "${agent}": {
      "autonomy": ${AUTONOMY[$agent]},
      "reliability": ${RELIABILITY[$agent]},
      "recovery": ${RECOVERY[$agent]},
      "logging": ${LOGGING[$agent]},
      "average": $(( (AUTONOMY[$agent] + RELIABILITY[$agent] + RECOVERY[$agent] + LOGGING[$agent]) / 4 ))
    }
EOF
done

cat >> "${SCORECARD_FILE}" << EOF

  },
  "averages": {
    "autonomy": ${avg_autonomy},
    "reliability": ${avg_reliability},
    "recovery": ${avg_recovery},
    "logging": ${avg_logging},
    "total": ${avg_total}
  }
}
EOF

echo -e "${GREEN}✓ Scorecard guardado en: ${SCORECARD_FILE}${NC}"
echo ""

# Display final results
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}📊 RESULTADOS FINALES${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "| Agente                     | Autonomía | Confiabilidad | Recuperación | Logging | Total |"
echo "|----------------------------|-----------|---------------|--------------|---------|-------|"

for agent in "${!AUTONOMY[@]}"; do
  avg=$(( (AUTONOMY[$agent] + RELIABILITY[$agent] + RECOVERY[$agent] + LOGGING[$agent]) / 4 ))
  printf "| %-26s | %8d%% | %12d%% | %11d%% | %6d%% | %4d%% |\n" \
    "$agent" "${AUTONOMY[$agent]}" "${RELIABILITY[$agent]}" "${RECOVERY[$agent]}" "${LOGGING[$agent]}" "$avg"
done

echo "|----------------------------|-----------|---------------|--------------|---------|-------|"
printf "| %-26s | %8d%% | %12d%% | %11d%% | %6d%% | %4d%% |\n" \
  "PROMEDIO TOTAL" "$avg_autonomy" "$avg_reliability" "$avg_recovery" "$avg_logging" "$avg_total"
echo ""

# Final summary
if [ $avg_total -ge 80 ]; then
  echo -e "${GREEN}✅ PIPELINE ${avg_total}% AUTÓNOMO - Excelente${NC}"
elif [ $avg_total -ge 60 ]; then
  echo -e "${YELLOW}⚠️  PIPELINE ${avg_total}% AUTÓNOMO - Requiere mejoras${NC}"
else
  echo -e "${RED}❌ PIPELINE ${avg_total}% AUTÓNOMO - Requiere intervención significativa${NC}"
fi

echo ""
echo -e "⏰ Finalizado: $(date)"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
