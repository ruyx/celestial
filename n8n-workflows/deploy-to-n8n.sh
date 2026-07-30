#!/bin/bash

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 🚀 DEPLOY YOUTUBE PRODUCTION PIPELINE TO N8N
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#
# Este script automatiza el deployment del workflow de producción
# de videos a tu instancia de n8n.
#
# USAGE:
#   ./deploy-to-n8n.sh
#   ./deploy-to-n8n.sh --n8n-url https://n8n.xprinta.net
#   ./deploy-to-n8n.sh --check-only
#
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
N8N_URL="${1:-http://localhost:5678}"
CHECK_ONLY=false

# Parse arguments
while [[ "$#" -gt 0 ]]; do
  case $1 in
    --n8n-url) N8N_URL="$2"; shift ;;
    --check-only) CHECK_ONLY=true ;;
    *) echo "Unknown parameter: $1"; exit 1 ;;
  esac
  shift
done

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}🚀 DEPLOY TO N8N - YouTube Production Pipeline${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# ═══════════════════════════════════════════════════════════════
# STEP 1: PRE-FLIGHT CHECKS
# ═══════════════════════════════════════════════════════════════

echo -e "${YELLOW}STEP 1: Pre-flight Checks${NC}\n"

# Check 1: Workflow file exists
WORKFLOW_FILE="$(dirname "$0")/youtube-video-production-pipeline.json"
if [ ! -f "$WORKFLOW_FILE" ]; then
  echo -e "${RED}❌ Workflow file not found: $WORKFLOW_FILE${NC}"
  exit 1
fi
echo -e "${GREEN}✅ Workflow file found${NC}"

# Check 2: n8n is accessible
if ! curl -s --max-time 5 "$N8N_URL" > /dev/null 2>&1; then
  echo -e "${RED}❌ n8n not accessible at: $N8N_URL${NC}"
  echo -e "${YELLOW}   Tip: Is n8n running? Try: docker ps | grep n8n${NC}"
  exit 1
fi
echo -e "${GREEN}✅ n8n accessible at $N8N_URL${NC}"

# Check 3: Agent 9 production exists and is executable
AGENT9_PROD="$(dirname "$0")/../agents/agent-9-thumbnail-generator-production.js"
if [ ! -f "$AGENT9_PROD" ]; then
  echo -e "${RED}❌ Agent 9 production not found${NC}"
  exit 1
fi
if [ ! -x "$AGENT9_PROD" ]; then
  echo -e "${YELLOW}⚠️  Agent 9 production not executable, fixing...${NC}"
  chmod +x "$AGENT9_PROD"
fi
echo -e "${GREEN}✅ Agent 9 production ready${NC}"

# Check 4: All required directories exist
REQUIRED_DIRS=(
  "$(dirname "$0")/../output/thumbnails"
  "$(dirname "$0")/../output/youtube-metadata"
  "$(dirname "$0")/../logs/agent-9"
)

for dir in "${REQUIRED_DIRS[@]}"; do
  if [ ! -d "$dir" ]; then
    echo -e "${YELLOW}⚠️  Creating directory: $dir${NC}"
    mkdir -p "$dir"
  fi
done
echo -e "${GREEN}✅ All directories ready${NC}"

# Check 5: Node.js dependencies
if ! node -e "require('sharp')" 2>/dev/null; then
  echo -e "${RED}❌ sharp module not installed${NC}"
  echo -e "${YELLOW}   Run: npm install${NC}"
  exit 1
fi
echo -e "${GREEN}✅ Node.js dependencies installed${NC}"

echo ""

# ═══════════════════════════════════════════════════════════════
# STEP 2: HEALTH CHECK
# ═══════════════════════════════════════════════════════════════

echo -e "${YELLOW}STEP 2: System Health Check${NC}\n"

cd "$(dirname "$0")/.."

if node agents/agent-9-thumbnail-generator-production.js --health > /dev/null 2>&1; then
  echo -e "${GREEN}✅ Agent 9 health check passed${NC}"
else
  echo -e "${RED}❌ Agent 9 health check failed${NC}"
  node agents/agent-9-thumbnail-generator-production.js --health
  exit 1
fi

echo ""

# ═══════════════════════════════════════════════════════════════
# STEP 3: ENVIRONMENT VARIABLES CHECK
# ═══════════════════════════════════════════════════════════════

echo -e "${YELLOW}STEP 3: Environment Variables Check${NC}\n"

REQUIRED_VARS=(
  "MAGNIFIC_API_KEY"
  "OPENROUTER_API_KEY"
  "ELEVENLABS_API_KEY"
)

MISSING_VARS=()

for var in "${REQUIRED_VARS[@]}"; do
  if [ -z "${!var}" ]; then
    MISSING_VARS+=("$var")
    echo -e "${YELLOW}⚠️  $var not set${NC}"
  else
    echo -e "${GREEN}✅ $var configured${NC}"
  fi
done

if [ ${#MISSING_VARS[@]} -gt 0 ]; then
  echo -e "\n${YELLOW}⚠️  Missing environment variables. Configure them in n8n:${NC}"
  echo -e "${YELLOW}   Settings → Variables → Add:${NC}"
  for var in "${MISSING_VARS[@]}"; do
    echo -e "${YELLOW}   - $var${NC}"
  done
  echo ""
fi

# ═══════════════════════════════════════════════════════════════
# STEP 4: IMPORT WORKFLOW
# ═══════════════════════════════════════════════════════════════

if [ "$CHECK_ONLY" = true ]; then
  echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${GREEN}✅ PRE-FLIGHT CHECKS PASSED${NC}"
  echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""
  echo -e "${BLUE}Ready to deploy! Run without --check-only to import workflow.${NC}"
  exit 0
fi

echo -e "${YELLOW}STEP 4: Importing Workflow to n8n${NC}\n"

# Check if n8n API is available
N8N_API_ENDPOINT="$N8N_URL/api/v1/workflows"

# Try to import via API (requires n8n API key)
if [ -n "$N8N_API_KEY" ]; then
  echo -e "${BLUE}Importing via n8n API...${NC}"

  RESPONSE=$(curl -s -X POST "$N8N_API_ENDPOINT" \
    -H "X-N8N-API-KEY: $N8N_API_KEY" \
    -H "Content-Type: application/json" \
    -d @"$WORKFLOW_FILE")

  if echo "$RESPONSE" | grep -q '"id"'; then
    WORKFLOW_ID=$(echo "$RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
    echo -e "${GREEN}✅ Workflow imported successfully${NC}"
    echo -e "${GREEN}   Workflow ID: $WORKFLOW_ID${NC}"
    echo -e "${GREEN}   URL: $N8N_URL/workflow/$WORKFLOW_ID${NC}"
  else
    echo -e "${RED}❌ API import failed${NC}"
    echo -e "${YELLOW}   Response: $RESPONSE${NC}"
    echo -e "\n${YELLOW}⚠️  Please import manually:${NC}"
    echo -e "${YELLOW}   1. Open n8n: $N8N_URL${NC}"
    echo -e "${YELLOW}   2. Click '+' → Import from File${NC}"
    echo -e "${YELLOW}   3. Select: $WORKFLOW_FILE${NC}"
  fi
else
  echo -e "${YELLOW}⚠️  N8N_API_KEY not set, skipping API import${NC}\n"
  echo -e "${BLUE}Manual import instructions:${NC}"
  echo -e "  1. Open n8n: ${GREEN}$N8N_URL${NC}"
  echo -e "  2. Click '${GREEN}+${NC}' → '${GREEN}Import from File${NC}'"
  echo -e "  3. Select: ${GREEN}$WORKFLOW_FILE${NC}"
  echo -e "  4. Activate workflow (toggle in top-right)\n"
fi

# ═══════════════════════════════════════════════════════════════
# STEP 5: POST-DEPLOYMENT INSTRUCTIONS
# ═══════════════════════════════════════════════════════════════

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ DEPLOYMENT COMPLETE${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo -e "${BLUE}📋 Next Steps:${NC}\n"

echo -e "${YELLOW}1. Configure Environment Variables in n8n:${NC}"
echo -e "   Settings → Variables → Add:"
echo -e "   ${GREEN}- MAGNIFIC_API_KEY${NC}"
echo -e "   ${GREEN}- OPENROUTER_API_KEY${NC}"
echo -e "   ${GREEN}- ELEVENLABS_API_KEY${NC}"
echo -e "   ${GREEN}- YOUTUBE_CLIENT_ID${NC}"
echo -e "   ${GREEN}- YOUTUBE_CLIENT_SECRET${NC}"
echo ""

echo -e "${YELLOW}2. Test the Pipeline:${NC}"
echo -e "   ${GREEN}curl -X POST $N8N_URL/webhook/youtube-pipeline \\${NC}"
echo -e "   ${GREEN}  -H \"Content-Type: application/json\" \\${NC}"
echo -e "   ${GREEN}  -d '{\"verse\": \"Salmos 23:1\"}'${NC}"
echo ""

echo -e "${YELLOW}3. Monitor Execution:${NC}"
echo -e "   ${GREEN}Open: $N8N_URL${NC}"
echo -e "   ${GREEN}Go to: Workflows → YouTube Production Pipeline → Executions${NC}"
echo ""

echo -e "${YELLOW}4. View Logs:${NC}"
echo -e "   ${GREEN}tail -f $(dirname "$0")/../logs/agent-9/session-*.json${NC}"
echo ""

echo -e "${BLUE}📚 Documentation:${NC}"
echo -e "   ${GREEN}$(dirname "$0")/README.md${NC}"
echo ""

echo -e "${BLUE}🎬 Happy Video Production!${NC}\n"
