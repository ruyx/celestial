# 🚂 Configuración Railway para n8n

## Problema Identificado

n8n en Railway bloquea el módulo `child_process` por seguridad, causando el error:
```
Error: Module 'child_process' is disallowed [line 1]
```

## Solución: Variables de Entorno en Railway

n8n permite configurar módulos permitidos vía variables de entorno.

### Variables Requeridas

Agregar estas variables de entorno en Railway:

```bash
# Permitir child_process, fs y path (necesarios para ejecutar agentes)
NODE_FUNCTION_ALLOW_BUILTIN=child_process,fs,path

# Permitir módulos externos (Supabase, etc.)
NODE_FUNCTION_ALLOW_EXTERNAL=*

# Opcional: aumentar timeout para Code nodes
NODE_OPTIONS=--max-old-space-size=4096
```

### Cómo Configurar en Railway

#### Opción 1: CLI de Railway
```bash
# Conectar a proyecto
railway link

# Configurar variables
railway variables set NODE_FUNCTION_ALLOW_BUILTIN="child_process,fs,path"
railway variables set NODE_FUNCTION_ALLOW_EXTERNAL="*"

# Redeploy
railway up
```

#### Opción 2: Dashboard de Railway
1. Ir a https://railway.com/project/[PROJECT_ID]/service/[SERVICE_ID]
2. Tab "Variables"
3. Agregar:
   - `NODE_FUNCTION_ALLOW_BUILTIN` = `child_process,fs,path`
   - `NODE_FUNCTION_ALLOW_EXTERNAL` = `*`
4. Guardar (auto-redeploy)

### Alternativa: Archivo railway.json

Crear `railway.json` en la raíz del proyecto n8n:

```json
{
  "variables": {
    "NODE_FUNCTION_ALLOW_BUILTIN": "child_process,fs,path",
    "NODE_FUNCTION_ALLOW_EXTERNAL": "*"
  }
}
```

## Documentación Oficial

- n8n Code Node: https://docs.n8n.io/code/builtin/code-node/
- n8n Security: https://docs.n8n.io/hosting/security/

## Verificación

Después de configurar, ejecutar prueba via webhook:

```bash
curl -X POST "https://n8n.xprinta.net/webhook/youtube-viral-manual" \
  -H "Content-Type: application/json" \
  -d '{"test": "verify_child_process"}'
```

Debería ejecutar Agent 0 sin error de `child_process`.

## Alternativa (NO RECOMENDADA)

Si no se puede modificar Railway, se puede:
1. Crear servidor HTTP separado para agentes
2. Usar HTTP Request nodes en n8n
3. Más complejo y menos eficiente

**RECOMENDACIÓN**: Usar la solución de variables de entorno (más simple y nativa).

---

**Status**: Pendiente configuración en Railway
**Prioridad**: ALTA - Bloquea pipeline completo
**Impacto**: 100% - Sin esto el workflow no puede ejecutarse
