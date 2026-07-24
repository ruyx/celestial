# 📥 CÓMO IMPORTAR EL WORKFLOW A n8n

## ✅ MÉTODO 1: IMPORTACIÓN MANUAL (RECOMENDADO - 2 minutos)

### Paso 1: Abrir n8n
1. Ve a: **https://n8n.xprinta.net**
2. Inicia sesión

### Paso 2: Crear Nuevo Workflow
1. Click en el botón **"+ New workflow"** (esquina superior derecha)
2. Se abrirá un canvas en blanco

### Paso 3: Importar desde JSON
1. Click en el menú **"☰"** (hamburger menu, esquina superior izquierda)
2. Selecciona **"Import from File"**
3. Navega a: `/home/suario/ruy-projects/project-yt/workflows/youtube-automation.json`
4. Click **"Open"** o **"Abrir"**

### Paso 4: Guardar y Activar
1. Click en **"Save"** (guardar)
2. Dale un nombre: `YouTube Video Production - Automated`
3. Click en el toggle **"Active"** para activarlo
4. ✅ ¡Listo!

---

## ✅ MÉTODO 2: CREAR WORKFLOW MANUALMENTE (5 minutos)

Si el método 1 no funciona, puedes crear el workflow manualmente:

### Nodos a Agregar (en orden):

#### 1. Schedule Trigger
- Tipo: `Schedule Trigger`
- Nombre: `Daily Trigger (12:00 PM)`
- Configuración:
  - Interval: `Hours`
  - Hours: `24`
  - Trigger Time: `12:00`

#### 2. Execute Command
- Tipo: `Execute Command`
- Nombre: `Run Production Pipeline`
- Configuración:
  - Command: `cd /home/suario/ruy-projects/project-yt && node production-pipeline.js produce`

#### 3. IF Conditional
- Tipo: `IF`
- Nombre: `Production Success?`
- Configuración:
  - Condition: `String`
  - Value 1: `{{ $json.success }}`
  - Operation: `Equal`
  - Value 2: `true`

#### 4. Set (Success)
- Tipo: `Set`
- Nombre: `Log Success`
- Configuración:
  - Values to Set:
    - Name: `status`
    - Value: `Video produced successfully`

#### 5. Set (Error)
- Tipo: `Set`
- Nombre: `Log Error`
- Configuración:
  - Values to Set:
    - Name: `status`
    - Value: `Production failed`

#### 6. Wait
- Tipo: `Wait`
- Nombre: `Wait 24h for Analytics`
- Configuración:
  - Amount: `24`
  - Unit: `Hours`

#### 7. Execute Command (Analytics)
- Tipo: `Execute Command`
- Nombre: `Collect Analytics`
- Configuración:
  - Command: `cd /home/suario/ruy-projects/project-yt && node agents/analytics-monitor.js`

### Conexiones:

```
Daily Trigger → Run Production Pipeline
Run Production Pipeline → Production Success?
Production Success? (true) → Log Success
Production Success? (false) → Log Error
Log Success → Wait 24h for Analytics
Wait 24h for Analytics → Collect Analytics
```

---

## ✅ MÉTODO 3: COPY-PASTE DIRECTO

Si n8n tiene la opción "Import from URL" o "Paste JSON":

1. Copia todo el contenido del archivo: `workflows/youtube-automation.json`
2. En n8n, busca la opción **"Import from URL"** o **"Paste JSON"**
3. Pega el contenido completo
4. Click **"Import"**

---

## 🔍 VERIFICACIÓN

Después de importar, verifica que:

1. ✅ Hay 7 nodos en el workflow
2. ✅ El trigger está programado para las 12:00 PM
3. ✅ Las conexiones están correctas
4. ✅ El workflow está **Active** (toggle verde)

---

## 🎯 PRÓXIMO PASO DESPUÉS DE IMPORTAR

Una vez importado y activado:

1. **Prueba manual**: Click en **"Execute Workflow"** para probar
2. **Verifica logs**: Ve a **"Executions"** para ver el resultado
3. **Espera al trigger**: El workflow se ejecutará automáticamente mañana a las 12:00 PM

---

## ❓ PROBLEMAS COMUNES

### "Cannot find module"
- **Solución**: Asegúrate de que el servidor n8n tenga acceso a `/home/suario/ruy-projects/project-yt`

### "Permission denied"
- **Solución**: Verifica permisos de ejecución:
  ```bash
  chmod +x production-pipeline.js
  chmod +x agents/agent-1-scriptwriter.js
  ```

### "Workflow not executing"
- **Solución**: Verifica que el toggle "Active" esté en verde

---

## 📞 ALTERNATIVA SIMPLIFICADA

Si prefieres empezar simple, puedes crear un workflow básico con solo el trigger y el comando:

```
Schedule Trigger (12:00 PM)
  ↓
Execute Command: node production-pipeline.js produce
```

Esto será suficiente para producir videos diarios. Los demás nodos son para logging y analytics avanzados.

---

**¿Necesitas ayuda con algún paso?** ¡Avísame!
