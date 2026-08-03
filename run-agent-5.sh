#!/bin/bash
# ============================================================================
# Agent 5 Wrapper - Executa Claude Code con Magnific MCP para videos
# Diseñado para ser llamado via SSH para evitar recursión
# ============================================================================

set -e

# Auto-detect project directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Ejecutar Agent 5 con Claude Code MCP
# Output va a stdout/stderr para que el caller lo capture
$HOME/.local/bin/claude run agents/agent-5-magnific-mcp.md

# Exit code se propaga automáticamente
