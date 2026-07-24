#!/bin/bash

# ============================================================================
# SCRIPT: Setup Cron Jobs - Rey Celestial
# ============================================================================
# Descripción: Configura systemd timers para ejecución automática de tareas
# Uso: sudo ./scripts/setup-cron.sh
# ============================================================================

set -e  # Exit on error

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuración
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
USER="$(whoami)"

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}⏰ SETUP: Cron Jobs - Rey Celestial${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

echo -e "Proyecto: ${PROJECT_DIR}"
echo -e "Usuario: ${USER}\n"

# Verificar que se ejecuta con sudo (necesario para systemd)
if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}❌ Error: Este script debe ejecutarse con sudo${NC}"
  echo -e "   Uso: ${YELLOW}sudo ./scripts/setup-cron.sh${NC}\n"
  exit 1
fi

# Obtener el usuario real (cuando se usa sudo)
REAL_USER="${SUDO_USER:-$USER}"

# Verificar que Node.js está instalado
if ! command -v node &> /dev/null; then
  echo -e "${RED}❌ Error: Node.js no está instalado${NC}"
  echo -e "   Instalar con: ${YELLOW}sudo apt install nodejs${NC}\n"
  exit 1
fi

NODE_PATH=$(which node)
echo -e "${GREEN}✅ Node.js encontrado: ${NODE_PATH}${NC}\n"

# Verificar que los scripts existen
if [ ! -f "${PROJECT_DIR}/agents/agent-9-analytics-collector.js" ]; then
  echo -e "${RED}❌ Error: agent-9-analytics-collector.js no encontrado${NC}\n"
  exit 1
fi

echo -e "${GREEN}✅ Scripts verificados${NC}\n"

# ============================================================================
# CREAR SYSTEMD SERVICE: Analytics Collector
# ============================================================================

echo -e "${BLUE}[1/4] Creando servicio systemd: rey-celestial-analytics${NC}\n"

cat > /etc/systemd/system/rey-celestial-analytics.service << EOF
[Unit]
Description=Rey Celestial - YouTube Analytics Collector
After=network.target

[Service]
Type=oneshot
User=${REAL_USER}
WorkingDirectory=${PROJECT_DIR}
ExecStart=${NODE_PATH} ${PROJECT_DIR}/agents/agent-9-analytics-collector.js --min-days=1

# Variables de entorno
EnvironmentFile=${PROJECT_DIR}/.env

# Logging
StandardOutput=journal
StandardError=journal
SyslogIdentifier=rey-celestial-analytics

# Reintentos en caso de error
Restart=on-failure
RestartSec=60

[Install]
WantedBy=multi-user.target
EOF

echo -e "${GREEN}✅ Servicio creado: /etc/systemd/system/rey-celestial-analytics.service${NC}\n"

# ============================================================================
# CREAR SYSTEMD TIMER: Analytics Collector
# ============================================================================

echo -e "${BLUE}[2/4] Creando timer systemd: rey-celestial-analytics${NC}\n"

cat > /etc/systemd/system/rey-celestial-analytics.timer << EOF
[Unit]
Description=Rey Celestial - Weekly Analytics Collection Timer
Requires=rey-celestial-analytics.service

[Timer]
# Ejecutar todos los domingos a las 3:00 AM
OnCalendar=Sun *-*-* 03:00:00

# Si el sistema estaba apagado, ejecutar al arrancar
Persistent=true

[Install]
WantedBy=timers.target
EOF

echo -e "${GREEN}✅ Timer creado: /etc/systemd/system/rey-celestial-analytics.timer${NC}\n"

# ============================================================================
# RECARGAR SYSTEMD Y HABILITAR TIMERS
# ============================================================================

echo -e "${BLUE}[3/4] Recargando systemd y habilitando timers${NC}\n"

# Recargar systemd
systemctl daemon-reload

# Habilitar y activar timer
systemctl enable rey-celestial-analytics.timer
systemctl start rey-celestial-analytics.timer

echo -e "${GREEN}✅ Timer habilitado y activado${NC}\n"

# ============================================================================
# VERIFICAR ESTADO
# ============================================================================

echo -e "${BLUE}[4/4] Verificando estado${NC}\n"

# Estado del timer
echo -e "${YELLOW}📋 Estado del timer:${NC}"
systemctl status rey-celestial-analytics.timer --no-pager | head -10
echo ""

# Próximas ejecuciones programadas
echo -e "${YELLOW}📅 Próximas ejecuciones programadas:${NC}"
systemctl list-timers | grep -E "(NEXT|rey-celestial)" || echo "No se encontraron timers"
echo ""

# ============================================================================
# CREAR DIRECTORIO DE LOGS
# ============================================================================

echo -e "${BLUE}Creando directorio de logs${NC}"
mkdir -p ${PROJECT_DIR}/logs
chown ${REAL_USER}:${REAL_USER} ${PROJECT_DIR}/logs
echo -e "${GREEN}✅ Directorio de logs creado: ${PROJECT_DIR}/logs${NC}\n"

# ============================================================================
# RESUMEN FINAL
# ============================================================================

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ SETUP COMPLETADO${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

echo -e "${YELLOW}📋 TAREAS PROGRAMADAS:${NC}"
echo -e "   • ${GREEN}Analytics Collection${NC}: Domingos a las 3:00 AM\n"

echo -e "${YELLOW}📝 COMANDOS ÚTILES:${NC}"
echo -e "   # Ver estado del timer"
echo -e "   ${BLUE}systemctl status rey-celestial-analytics.timer${NC}\n"

echo -e "   # Ver próximas ejecuciones"
echo -e "   ${BLUE}systemctl list-timers${NC}\n"

echo -e "   # Ejecutar ahora (para testing)"
echo -e "   ${BLUE}sudo systemctl start rey-celestial-analytics.service${NC}\n"

echo -e "   # Ver logs del último run"
echo -e "   ${BLUE}sudo journalctl -u rey-celestial-analytics.service -n 100${NC}\n"

echo -e "   # Ver logs en tiempo real"
echo -e "   ${BLUE}sudo journalctl -u rey-celestial-analytics.service -f${NC}\n"

echo -e "   # Deshabilitar timer"
echo -e "   ${BLUE}sudo systemctl stop rey-celestial-analytics.timer${NC}"
echo -e "   ${BLUE}sudo systemctl disable rey-celestial-analytics.timer${NC}\n"

echo -e "${YELLOW}🧪 TESTING:${NC}"
echo -e "   Para probar la tarea inmediatamente:"
echo -e "   ${BLUE}sudo systemctl start rey-celestial-analytics.service${NC}"
echo -e "   ${BLUE}sudo journalctl -u rey-celestial-analytics.service -f${NC}\n"

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
