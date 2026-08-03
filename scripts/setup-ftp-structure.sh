#!/bin/bash

# ============================================================================
# FTP Structure Setup Script
# ============================================================================
# Crea la estructura de directorios necesaria en el servidor FTP
# para el pipeline autónomo de generación de videos de YouTube
#
# Estructura:
#   /videos/{verse}/final.mp4
#   /thumbnails/{verse}.jpg
#   /logs/pipeline-{timestamp}.log
#
# Uso: ./setup-ftp-structure.sh
# ============================================================================

set -e # Exit on error

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuración FTP
FTP_HOST="ftp.ruydejesus.com"
FTP_USER="project-yt@project-yt.ruydejesus.com"
FTP_PASS="Tera2Sira!"
FTP_PORT=21

echo -e "${GREEN}============================================================================${NC}"
echo -e "${GREEN}FTP Structure Setup for YouTube Video Pipeline${NC}"
echo -e "${GREEN}============================================================================${NC}"
echo ""
echo -e "${YELLOW}FTP Server:${NC} ${FTP_HOST}"
echo -e "${YELLOW}FTP User:${NC} ${FTP_USER}"
echo ""

# Verificar si lftp está instalado
if ! command -v lftp &> /dev/null; then
  echo -e "${RED}Error: lftp no está instalado${NC}"
  echo ""
  echo "Instalar con:"
  echo "  Ubuntu/Debian: sudo apt-get install lftp"
  echo "  MacOS: brew install lftp"
  echo ""
  exit 1
fi

echo -e "${GREEN}[1/5] Conectando al servidor FTP...${NC}"

# Crear script de comandos FTP
FTP_SCRIPT=$(cat <<'FTPEOF'
# Conectar y configurar
set ssl:verify-certificate no
set ftp:passive-mode on

# Crear directorios principales
mkdir -p videos
mkdir -p thumbnails
mkdir -p logs
mkdir -p temp

# Crear subdirectorios de ejemplo para testing
cd videos
mkdir -p Romanos-8-28
mkdir -p Salmos-23-1
mkdir -p Juan-3-16
cd ..

# Listar estructura creada
echo "============================================================================"
echo "Estructura de directorios creada:"
echo "============================================================================"
ls -la

# Verificar directorios
echo ""
echo "Directorio videos/:"
cd videos
ls -la
cd ..

echo ""
echo "Directorio thumbnails/:"
cd thumbnails
ls -la
cd ..

echo ""
echo "Directorio logs/:"
cd logs
ls -la
cd ..

# Crear archivo de prueba
echo "FTP structure initialized at $(date)" > .ftp-initialized
put .ftp-initialized

echo ""
echo "============================================================================"
echo "Setup completado exitosamente"
echo "============================================================================"

# Cerrar conexión
bye
FTPEOF
)

# Ejecutar comandos FTP
echo "${FTP_SCRIPT}" | lftp -u "${FTP_USER},${FTP_PASS}" "${FTP_HOST}" 2>&1

if [ $? -eq 0 ]; then
  echo ""
  echo -e "${GREEN}============================================================================${NC}"
  echo -e "${GREEN}✅ FTP Structure Setup Completado Exitosamente${NC}"
  echo -e "${GREEN}============================================================================${NC}"
  echo ""
  echo -e "${YELLOW}Directorios creados:${NC}"
  echo "  📁 /videos/{verse}/final.mp4"
  echo "  📁 /thumbnails/{verse}.jpg"
  echo "  📁 /logs/pipeline-{timestamp}.log"
  echo "  📁 /temp/ (archivos temporales)"
  echo ""
  echo -e "${YELLOW}URLs públicas:${NC}"
  echo "  🌐 Videos: https://project-yt.ruydejesus.com/videos/{verse}/final.mp4"
  echo "  🌐 Thumbnails: https://project-yt.ruydejesus.com/thumbnails/{verse}.jpg"
  echo ""
  echo -e "${YELLOW}Próximos pasos:${NC}"
  echo "  1. Configurar variables de entorno en Vercel:"
  echo "     - FTP_PASSWORD=Tera2Sira!"
  echo "     - FTP_HOST=ftp.ruydejesus.com"
  echo "     - FTP_USER=project-yt@project-yt.ruydejesus.com"
  echo ""
  echo "  2. Desplegar Vercel Edge Functions:"
  echo "     - cd vercel-functions && vercel deploy"
  echo ""
  echo "  3. Importar workflow en n8n:"
  echo "     - Abrir n8n → Import workflow → n8n-workflow/youtube-video-pipeline.json"
  echo ""
  echo "  4. Ejecutar migration en Supabase:"
  echo "     - supabase db push"
  echo ""
  echo -e "${GREEN}============================================================================${NC}"
else
  echo ""
  echo -e "${RED}============================================================================${NC}"
  echo -e "${RED}❌ Error al configurar FTP${NC}"
  echo -e "${RED}============================================================================${NC}"
  echo ""
  echo "Verificar:"
  echo "  - Credenciales FTP correctas"
  echo "  - Conectividad al servidor"
  echo "  - Permisos de escritura en el servidor"
  echo ""
  exit 1
fi
