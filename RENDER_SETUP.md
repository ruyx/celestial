# Configuración de Render.com para Agent Server

## 📋 Pasos Necesarios

### 1. Configurar Variable de Entorno `SSH_PRIVATE_KEY`

1. Ve a tu dashboard de Render: https://dashboard.render.com/
2. Selecciona el servicio `agent-server-uvp2`
3. Ve a **Environment** en el menú lateral
4. Agrega nueva variable de entorno:
   - **Key**: `SSH_PRIVATE_KEY`
   - **Value**: (pegar el valor base64 de abajo)

```
LS0tLS1CRUdJTiBPUEVOU1NIIFBSSVZBVEUgS0VZLS0tLS0KYjNCbGJuTnphQzFyWlhrdGRqRUFBQUFBQkc1dmJtVUFBQUFFYm05dVpRQUFBQUFBQUFBQkFBQUFNd0FBQUF0emMyZ3RaVwpReU5UVXhPUUFBQUNBSVNHcnRRR3FYak91Vmw2VTJKNnZHSUtnWVg1cGtvb25oUzA4cUFlK2NUd0FBQUpnTitwd0dEZnFjCkJnQUFBQXR6YzJndFpXUXlOVFV4T1FBQUFDQUlTR3J0UUdxWGpPdVZsNlUySjZ2R0lLZ1lYNXBrb29uaFMwOHFBZStjVHcKQUFBRUNqdWo4TTNFelFhbHY2MDNaZ2NNcTV1VS9Jc2tmLzNEc1VVRGlRTGZEY3NBaElhdTFBYXBlTTY1V1hwVFlucThZZwpxQmhmbW1TaWllRkxUeW9CNzV4UEFBQUFEMFJGVTB0VVQxQXRVVWc0U2xZMk5BRUNBd1FGQmc9PQotLS0tLUVORCBPUEVOU1NIIFBSSVZBVEUgS0VZLS0tLS0K
```

5. Click **Save Changes**

### 2. Actualizar Start Command

1. En el dashboard de Render, ve a **Settings**
2. En la sección **Build & Deploy**, encuentra **Start Command**
3. Cambia el comando actual a:

```bash
bash start-server.sh
```

4. Click **Save Changes**

### 3. Redeploy

1. Ve a la pestaña **Manual Deploy**
2. Click **Deploy latest commit**
3. Espera a que el deploy complete (~2-3 minutos)

## ✅ Verificación

Una vez completado el deploy, verifica en los logs que veas:

```
🔐 Configurando SSH para acceso a servidor xprinta...
✅ Clave privada SSH configurada
✅ Configuración SSH completa
🚀 Iniciando servidor...
📁 Creando directorios...
🎬 Iniciando agent-server...
Agent Server running on port 10000
```

## 🧪 Prueba

Ejecuta un test del endpoint:

```bash
curl -X POST https://agent-server-uvp2.onrender.com/guardian-images \
  -H "Content-Type: application/json" \
  -d '{"verse": "Salmos 23:1"}'
```

Deberías ver en los logs:

```
👼 Executing Guardian Images + Agent 4 for: Salmos 23:1
🎨 Step 1/2: Running Agent 4 (Magnific MCP) via SSH to xprinta server...
```

## 🔍 Troubleshooting

### Error: "Permission denied (publickey)"
- Verifica que la variable `SSH_PRIVATE_KEY` esté correctamente configurada
- Asegúrate de que el valor base64 no tenga saltos de línea

### Error: "Connection timeout"
- El servidor xprinta puede estar apagado o la red bloqueando la conexión
- Verifica que el servidor xprinta (10.254.80.29) esté accesible desde Render

### Error: "Host key verification failed"
- El script setup-ssh.sh debería prevenir esto
- Si persiste, verifica que ssh-keyscan se ejecutó correctamente
