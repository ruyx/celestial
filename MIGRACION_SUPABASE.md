# 🚀 Migración a Supabase Database - Solución Definitiva Blindada

## 📋 Resumen

Migración completa del sistema de archivos JSON a Supabase Database para permitir que n8n en Railway acceda a los datos de los agentes sin depender del filesystem local.

**Problema resuelto:** n8n en Railway no puede ejecutar Agent 1 porque el workflow intenta leer archivos locales que no existen en la nube.

**Solución:** Migrar todos los datos de los agentes a Supabase Database (PostgreSQL en la nube).

---

## ✅ Ya Completado

1. ✅ **Migración SQL creada**: `supabase/migrations/003_create_agent_workflow_tables.sql`
   - Tabla `agent_decisions` - reemplaza `/output/agent-0-decision.json`
   - Tabla `analytics_feedback` - reemplaza `/logs/analytics-feedback.json`
   - Tabla `generated_scripts` - reemplaza `/output/scripts/script-*.json`

2. ✅ **Cliente Supabase creado**: `lib/supabase-client.js`
   - Funciones para guardar/leer decisiones de Agent 0
   - Funciones para guardar/leer feedback de analytics
   - Funciones para guardar/leer scripts generados de Agent 1

3. ✅ **Dependencia instalada**: `@supabase/supabase-js`

4. ✅ **Placeholders en .env**: `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY`

---

## 🔧 Pasos Pendientes (Siguientes tareas)

### PASO 1: Crear Proyecto Supabase

Si ya tienes un proyecto Supabase para este sistema, sáltate este paso.

Si no tienes uno:

1. Ve a https://supabase.com
2. Crea una cuenta o inicia sesión
3. Crea un nuevo proyecto
4. Espera 2-3 minutos a que se complete la configuración

### PASO 2: Obtener Credenciales de Supabase

1. En tu proyecto de Supabase, ve a **Settings** > **API**
2. Copia:
   - **Project URL** (ejemplo: `https://abc123.supabase.co`)
   - **service_role key** (⚠️ **IMPORTANTE:** usa el `service_role`, NO el `anon key`)

3. Actualiza el archivo `.env` reemplazando los placeholders:

```bash
# Reemplaza con tus credenciales reales
SUPABASE_URL=https://TU_PROYECTO_ID.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.TU_SERVICE_ROLE_KEY_COMPLETA
```

### PASO 3: Ejecutar la Migración SQL en Supabase

**Opción A: Desde Supabase Dashboard (Recomendado)**

1. Ve a **SQL Editor** en tu proyecto Supabase
2. Abre el archivo `supabase/migrations/003_create_agent_workflow_tables.sql`
3. Copia TODO el contenido
4. Pégalo en el SQL Editor de Supabase
5. Haz clic en **Run** o presiona `Ctrl+Enter`
6. Verifica que no haya errores

**Opción B: Desde CLI de Supabase (si tienes Supabase CLI instalado)**

```bash
# Asegúrate de estar linkeado al proyecto correcto
supabase link

# Ejecuta la migración
supabase db push

# O ejecuta el archivo directamente
supabase db execute --file supabase/migrations/003_create_agent_workflow_tables.sql
```

### PASO 4: Migrar Datos JSON Existentes a Supabase

Voy a crear un script de migración de datos para ti.

**⚠️ IMPORTANTE:** Este script moverá los datos JSON existentes a Supabase. Ejecuta esto ANTES de modificar Agent 1.

Ejecuta el script:

```bash
node scripts/migrate-json-to-supabase.js
```

Este script:
1. Lee `/output/agent-0-decision.json` → guarda en tabla `agent_decisions`
2. Lee `/logs/analytics-feedback.json` → guarda en tabla `analytics_feedback`
3. Lee todos los archivos en `/output/scripts/` → guarda en tabla `generated_scripts`

### PASO 5: Modificar Agent 1 para usar Supabase

**Necesitas modificar `agents/agent-1-viral-scriptwriter.js`:**

1. Agregar al inicio del archivo:

```javascript
const {
  getLatestAgentDecision,
  getLatestAnalyticsFeedback,
  saveGeneratedScript
} = require('../lib/supabase-client');
```

2. Reemplazar el método `loadAgent0Decision()`:

```javascript
// ❌ VIEJO (filesystem)
loadAgent0Decision() {
  const decisionPath = path.join(__dirname, '../output/agent-0-decision.json');
  if (!fs.existsSync(decisionPath)) {
    throw new Error('Agent 0 no ha ejecutado todavía');
  }
  return JSON.parse(fs.readFileSync(decisionPath, 'utf-8'));
}

// ✅ NUEVO (Supabase)
async loadAgent0Decision() {
  const decision = await getLatestAgentDecision();
  if (!decision) {
    throw new Error('Agent 0 no ha ejecutado todavía');
  }

  // Convertir nombres de columnas snake_case a camelCase
  return {
    id: decision.verse_id,
    reference: decision.reference,
    text: decision.text,
    category: decision.category,
    customHook: decision.custom_hook,
    historicalInsight: decision.historical_insight,
    visualDescriptions: decision.visual_descriptions,
    targetAudience: decision.target_audience,
    keywords: decision.keywords,
    historicalContext: decision.historical_context,
    emotionalBenefit: decision.emotional_benefit,
    bestHookType: decision.best_hook_type,
    searchVolume: decision.search_volume,
    competitionLevel: decision.competition_level,
    viralPotential: decision.viral_potential
  };
}
```

3. Reemplazar el método `loadAnalyticsFeedback()`:

```javascript
// ❌ VIEJO (filesystem)
loadAnalyticsFeedback() {
  const feedbackPath = path.join(__dirname, '../logs/analytics-feedback.json');
  if (!fs.existsSync(feedbackPath)) {
    console.log('⚠️ No hay feedback de analytics todavía');
    return null;
  }
  return JSON.parse(fs.readFileSync(feedbackPath, 'utf-8'));
}

// ✅ NUEVO (Supabase)
async loadAnalyticsFeedback() {
  const feedback = await getLatestAnalyticsFeedback();
  if (!feedback) {
    console.log('⚠️ No hay feedback de analytics todavía');
    return null;
  }

  // Convertir a formato esperado
  return {
    lastUpdate: feedback.last_update,
    totalVideosAnalyzed: feedback.total_videos_analyzed,
    agentInstructions: feedback.agent_instructions,
    learningInsights: feedback.learning_insights
  };
}
```

4. Reemplazar el método `saveScript()`:

```javascript
// ❌ VIEJO (filesystem)
saveScript(masterScript) {
  const timestamp = Date.now();
  const verseSlug = verse.reference.replace(/\s+/g, '-');
  const filename = `script-${verseSlug}-${timestamp}.json`;
  const filepath = path.join(this.outputDir, filename);

  fs.writeFileSync(filepath, JSON.stringify(masterScript, null, 2));
  console.log(`✅ Script guardado: ${filename}`);

  return { ...masterScript, scriptFile: filename };
}

// ✅ NUEVO (Supabase)
async saveScript(masterScript, agentDecisionId) {
  const savedScript = await saveGeneratedScript(masterScript, agentDecisionId);
  console.log(`✅ Script guardado en Supabase: ${savedScript.verse_reference}`);

  return savedScript;
}
```

5. Actualizar el método principal `run()` para manejar async:

```javascript
// Cambiar de:
async run() {
  const verse = this.loadAgent0Decision();  // ❌ NO async
  const feedback = this.loadAnalyticsFeedback();  // ❌ NO async
  // ...
}

// A:
async run() {
  const verse = await this.loadAgent0Decision();  // ✅ await
  const feedback = await this.loadAnalyticsFeedback();  // ✅ await
  const agentDecisionId = verse.id;  // Guardar el ID para asociar el script

  // ... resto del código ...

  const savedScript = await this.saveScript(masterScript, agentDecisionId);  // ✅ await
  return savedScript;
}
```

### PASO 6: Actualizar n8n Workflow

Ahora que Agent 1 lee desde Supabase, el workflow n8n también debe hacerlo.

**Reemplazar el nodo "AI VIRAL Master Scriptwriter" (Code node) con:**

```javascript
// Obtener el script más reciente desde Supabase
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Obtener el script generado más reciente
const { data, error } = await supabase
  .from('generated_scripts')
  .select('*')
  .order('generated_at', { ascending: false })
  .limit(1)
  .single();

if (error) {
  throw new Error(`Error obteniendo script desde Supabase: ${error.message}`);
}

if (!data) {
  throw new Error('No hay scripts generados en la base de datos');
}

// Retornar en formato compatible con el resto del workflow
return [{
  json: {
    verse: data.verse_reference,
    category: data.metadata.category,
    hookType: data.metadata.hookType,
    emotionalBenefit: data.metadata.emotionalBenefit,
    scriptId: data.id,
    metadata: data.metadata,
    scenes: data.scenes,
    youtubeMetadata: data.youtube_metadata,
    timestamp: data.generated_at
  }
}];
```

**⚠️ IMPORTANTE:** Asegúrate de agregar las variables de entorno en Railway para n8n:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

### PASO 7: Probar el Flujo Completo

1. **Ejecuta Agent 0** (para generar una decisión):
   ```bash
   node agents/agent-0-verse-researcher.js
   ```
   Esto debería guardar en `agent_decisions` tabla.

2. **Ejecuta Agent 1** (para generar un script):
   ```bash
   node agents/agent-1-viral-scriptwriter.js
   ```
   Esto debería:
   - Leer de `agent_decisions`
   - Leer de `analytics_feedback` (si existe)
   - Guardar en `generated_scripts`

3. **Ejecuta el workflow n8n manualmente** desde la interfaz de n8n
   Esto debería:
   - Leer el script más reciente desde `generated_scripts`
   - Continuar con los siguientes pasos del workflow

---

## 🎯 Beneficios de esta Migración

✅ **n8n en Railway funciona**: Ya no depende de filesystem local
✅ **Datos persistentes**: No se pierden datos entre reinicios
✅ **Escalable**: Soporta múltiples workflows ejecutando en paralelo
✅ **Auditable**: Historial completo de decisiones y scripts generados
✅ **Backup automático**: Supabase hace backups diarios automáticamente
✅ **API accesible**: Puedes consultar los datos desde cualquier lugar

---

## 📁 Archivos Creados/Modificados

### Creados ✨
- `supabase/migrations/003_create_agent_workflow_tables.sql` - Migración de tablas
- `lib/supabase-client.js` - Cliente compartido para todos los agentes
- `MIGRACION_SUPABASE.md` - Este documento

### Modificados 📝
- `.env` - Agregadas variables `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY`
- `package.json` - Agregada dependencia `@supabase/supabase-js`

### Pendientes de Modificar ⏳
- `agents/agent-1-viral-scriptwriter.js` - Reemplazar `fs` por Supabase client
- `agents/agent-0-verse-researcher.js` - Opcional: también puede guardar directamente en Supabase
- Workflow n8n `gZjAXgfLmnEdpG5B` - Nodo "AI VIRAL Master Scriptwriter"

---

## 🆘 Soporte y Troubleshooting

### Error: "Faltan credenciales de Supabase en .env"

**Causa:** No has configurado `SUPABASE_URL` o `SUPABASE_SERVICE_ROLE_KEY` en `.env`

**Solución:** Completa el PASO 2 arriba.

---

### Error: "relation 'agent_decisions' does not exist"

**Causa:** No has ejecutado la migración SQL en Supabase

**Solución:** Completa el PASO 3 arriba.

---

### Error: "Module 'fs' is disallowed" en n8n

**Causa:** El workflow todavía está intentando usar filesystem

**Solución:** Completa el PASO 6 arriba (actualizar el nodo en n8n).

---

### Consultar datos en Supabase

Desde el SQL Editor de Supabase:

```sql
-- Ver decisiones de Agent 0
SELECT * FROM agent_decisions ORDER BY selected_at DESC LIMIT 10;

-- Ver scripts generados
SELECT * FROM generated_scripts ORDER BY generated_at DESC LIMIT 10;

-- Ver feedback de analytics
SELECT * FROM analytics_feedback ORDER BY last_update DESC LIMIT 10;
```

---

## 📞 Próximos Pasos

**¿Qué necesitas hacer ahora?**

1. **Configurar Supabase** (PASOS 1-3)
2. **Migrar datos existentes** (PASO 4) - Voy a crear el script para ti
3. **Modificar Agent 1** (PASO 5)
4. **Actualizar n8n** (PASO 6)
5. **Probar** (PASO 7)

**Tiempo estimado total:** 30-45 minutos

---

**Estado actual:** ✅ Infraestructura completa, listo para configurar credenciales y ejecutar migración.
