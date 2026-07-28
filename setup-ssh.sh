#!/bin/bash

# Setup SSH para Render.com
# Este script se ejecuta en el contenedor de Render para configurar SSH hacia xprinta

set -e

echo "🔐 Configurando SSH para acceso a servidor xprinta..."

# Crear directorio .ssh si no existe
mkdir -p ~/.ssh
chmod 700 ~/.ssh

# Crear clave SSH desde variable de entorno
if [ -n "$SSH_PRIVATE_KEY" ]; then
  echo "$SSH_PRIVATE_KEY" > ~/.ssh/id_ed25519
  chmod 600 ~/.ssh/id_ed25519
  echo "✅ Clave privada SSH configurada"
else
  echo "⚠️  Variable SSH_PRIVATE_KEY no configurada"
fi

# Agregar host key del servidor xprinta para evitar prompts
ssh-keyscan -H 10.254.80.29 >> ~/.ssh/known_hosts 2>/dev/null || true
chmod 600 ~/.ssh/known_hosts

# Configurar SSH config
cat > ~/.ssh/config <<EOF
Host xprinta
    HostName 10.254.80.29
    User desarrollo
    IdentityFile ~/.ssh/id_ed25519
    StrictHostKeyChecking no
    ServerAliveInterval 60
    ConnectTimeout 10
EOF
chmod 600 ~/.ssh/config

echo "✅ Configuración SSH completa"

# Verificar conectividad (opcional, puede fallar en build time)
echo "🔍 Verificando conectividad..."
ssh -o BatchMode=yes -o ConnectTimeout=5 xprinta 'echo "✅ Conexión SSH OK"' 2>/dev/null || echo "⚠️ No se pudo verificar conexión (normal en build time)"
