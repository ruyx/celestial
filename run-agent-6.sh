#!/bin/bash
# ============================================================================
# Agent 6 Wrapper - Executa Claude Code con Magnific MCP para audio
# Diseñado para ser llamado via SSH para evitar recursión
# ============================================================================

set -e

cd ~/ruy-projects/project-yt

# Ejecutar Agent 6 con Claude Code MCP
# Output va a stdout/stderr para que el caller lo capture
$HOME/.local/bin/claude run agents/agent-6-magnific-mcp.md

# Exit code se propaga automáticamente
