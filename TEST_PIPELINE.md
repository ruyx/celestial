# 🧪 Test Completo del Pipeline - Evaluación de Autonomía

## Objetivo
Evaluar si cada parte del proceso está 100% autónomo y sin errores.

## 🤖 Ejecución Automatizada

Para ejecutar el test completo automáticamente con generación de scorecard:

```bash
# Ejecutar con versículo por defecto (Isaías 41:10)
./run-full-pipeline.sh

# Ejecutar con versículo específico
./run-full-pipeline.sh "Salmos 23:1"
```

**El script ejecuta:**
1. Todos los agentes en secuencia (Agent 0-7 + Guardians)
2. Evalúa cada uno en 4 métricas (Autonomía, Confiabilidad, Recuperación, Logging)
3. Genera scorecard JSON en `output/pipeline-scorecard-{timestamp}.json`
4. Muestra tabla de resultados con colores en consola
5. Calcula promedio total de autonomía del sistema

**Output esperado:**
- ✅ PIPELINE 80%+ AUTÓNOMO - Excelente
- ⚠️ PIPELINE 60-79% AUTÓNOMO - Requiere mejoras
- ❌ PIPELINE <60% AUTÓNOMO - Requiere intervención significativa

## Scorecard de Evaluación

Cada agente será evaluado en:
- ✅ **Autonomía**: 0-100% (¿Requiere intervención manual?)
- ✅ **Confiabilidad**: 0-100% (¿Funciona sin errores?)
- ✅ **Recuperación**: 0-100% (¿Se recupera de errores automáticamente?)
- ✅ **Logging**: 0-100% (¿Registra su estado correctamente?)

---

## 📋 Pipeline Completo

### Agent 0: Verse Researcher
**Input:** Base de datos de versículos
**Output:** `output/agent-0-decision.json`

**Tests:**
- [ ] Selecciona versículo dinámicamente
- [ ] Analiza viral potential (1-10)
- [ ] Evita duplicados recientes
- [ ] Guarda decisión en JSON

**Criterios de Éxito:**
- Selección sin intervención manual
- Viral potential >= 7
- JSON válido generado

---

### Agent 1: Viral Scriptwriter
**Input:** Versículo seleccionado
**Output:** `output/scripts/script-{verse}-{timestamp}.json`

**Tests:**
- [ ] Genera guión de 5 escenas (hook, intro, body, application, cta)
- [ ] Cada escena tiene prompt cinematográfico
- [ ] Incluye style cinematográfico coherente
- [ ] Timing total = 60-120s

**Criterios de Éxito:**
- 5 escenas completas
- Prompts listos para generación
- JSON válido

---

### Agent 4: Magnific API (Imágenes)
**Input:** Script con prompts
**Output:** `output/image-metadata/images-metadata-{verse}-{timestamp}.json`

**Tests:**
- [ ] Genera 5 imágenes (una por escena)
- [ ] Todas con status "completed"
- [ ] URLs válidas y accesibles
- [ ] Identifiers presentes

**Criterios de Éxito:**
- 5/5 imágenes completadas
- 0 errores de moderación
- URLs descargables

---

### 👼 Guardian: Images
**Input:** Metadata de imágenes
**Output:** Validación + retry si necesario

**Tests:**
- [ ] Detecta imágenes faltantes
- [ ] Clasifica errores correctamente
- [ ] Reintenta con backoff exponencial
- [ ] Se detiene si 100% moderación

**Criterios de Éxito:**
- Validación sin intervención
- Reintentos automáticos
- Logging detallado

---

### Agent 5: Video Animator
**Input:** Script + imágenes
**Output:** `output/video-metadata/video-batch-{verse}-{timestamp}.json`

**Tests:**
- [ ] Genera 10 clips de video
- [ ] Usa múltiples movimientos de cámara
- [ ] Todos con status "completed"
- [ ] URLs y creationIdentifiers presentes

**Criterios de Éxito:**
- 10/10 clips completados
- 0 errores de moderación
- Duración total = 60-120s

---

### 👼 Guardian: Videos
**Input:** Metadata de videos
**Output:** Validación + retry si necesario

**Tests:**
- [ ] Detecta videos faltantes
- [ ] Clasifica errores (moderation, API, download)
- [ ] Reintenta con backoff más largo (videos son pesados)
- [ ] Advierte si >50% moderación

**Criterios de Éxito:**
- Validación automática
- Detección temprana de moderación
- Logging detallado

---

### Agent 6: Audio/TTS
**Input:** Script
**Output:** `output/audio/voiceover-{verse}.mp3`

**Tests:**
- [ ] Genera voiceover con voz seleccionada
- [ ] Duración coincide con video total
- [ ] Calidad de audio adecuada
- [ ] Archivo MP3 válido

**Criterios de Éxito:**
- Audio generado sin errores
- Duración correcta
- Sincronización con video

---

### Agent 7: Video Editor
**Input:** Clips de video + audio
**Output:** `output/final-videos/final-{verse}.mp4`

**Tests:**
- [ ] Descarga todos los clips
- [ ] Concatena en orden correcto
- [ ] Añade audio de fondo
- [ ] Genera video final MP4

**Criterios de Éxito:**
- Video final completo
- Sin cortes o glitches
- Audio sincronizado
- Tamaño razonable (~100-200MB)

---

### Upload to YouTube
**Input:** Video final + metadata
**Output:** `output/youtube-metadata/upload-result-{verse}.json`

**Tests:**
- [ ] Busca playlist correcta
- [ ] Sube video a YouTube
- [ ] Aplica título, descripción, tags
- [ ] Configura privacy (public)

**Criterios de Éxito:**
- Upload exitoso
- Video público
- Metadata correcta
- URL de YouTube válida

---

## 🎯 Test de Integración Completa

### Escenario 1: Pipeline Limpio (Sin Errores)

```bash
# 1. Limpiar outputs previos
rm -rf output/agent-0-decision.json
rm -rf output/scripts/script-*
rm -rf output/image-metadata/images-*
rm -rf output/video-metadata/video-*
rm -rf output/audio/voiceover-*
rm -rf output/final-videos/final-*

# 2. Ejecutar pipeline completo
node agents/agent-0-verse-researcher.js
node agents/agent-1-viral-scriptwriter.js
node agents/agent-4-magnific-api.js
node agents/guardian-images.js "{verse}"
node agents/agent-5-video-animator.js
node agents/guardian-videos.js "{verse}"
node agents/agent-6-audio-voice-expert.js "{verse}"
node agents/agent-7-video-editor.js "{verse}"
node upload-to-youtube.js "{verse}"
```

**Métricas:**
- Tiempo total de ejecución
- Número de reintentos totales
- Errores encontrados
- Intervenciones manuales requeridas

---

### Escenario 2: Pipeline con Errores de Moderación

**Setup:** Forzar versículo con alto potencial de moderación (ej: Apocalipsis)

**Expectativa:**
- Guardians detectan moderación
- Sistema se detiene o cambia a Pikaso
- Logging indica qué falló

---

### Escenario 3: Pipeline con API Limits

**Setup:** Ejecutar múltiples versículos consecutivos

**Expectativa:**
- Guardians detectan rate limits
- Backoff exponencial funciona
- Sistema eventualmente completa

---

## 📊 Scorecard Final

| Agente | Autonomía | Confiabilidad | Recuperación | Logging | Score Total |
|--------|-----------|---------------|--------------|---------|-------------|
| Agent 0: Verse Researcher | __% | __% | __% | __% | __% |
| Agent 1: Scriptwriter | __% | __% | __% | __% | __% |
| Agent 4: Images (Magnific) | __% | __% | __% | __% | __% |
| Guardian: Images | __% | __% | __% | __% | __% |
| Agent 5: Videos (Magnific) | __% | __% | __% | __% | __% |
| Guardian: Videos | __% | __% | __% | __% | __% |
| Agent 6: Audio/TTS | __% | __% | __% | __% | __% |
| Agent 7: Video Editor | __% | __% | __% | __% | __% |
| Upload to YouTube | __% | __% | __% | __% | __% |
| **PROMEDIO TOTAL** | **__% ** | **__% ** | **__% ** | **__% ** | **__% ** |

---

## 🚨 Problemas Conocidos

### 1. Moderación de Contenido Religioso
- **Afecta:** Agent 5 (Videos)
- **Modelos:** Seedance Pro 2.0, Google Veo 3.1
- **Solución:** Cambiar a Pikaso API
- **Autonomía:** ❌ Requiere intervención manual

### 2. API Rate Limits
- **Afecta:** Agent 4, Agent 5
- **Solución:** Backoff exponencial en Guardians
- **Autonomía:** ✅ Se recupera automáticamente

### 3. Download Failures
- **Afecta:** Agent 7
- **Solución:** Reintentos automáticos
- **Autonomía:** ✅ Se recupera automáticamente

---

## 📝 Notas de Testing

### Versículos de Prueba Recomendados

**Baja complejidad (debería funcionar 100%):**
- Salmos 23:1 ✅ (ya probado)
- Juan 3:16
- Filipenses 4:13

**Media complejidad:**
- Isaías 41:10 ⚠️ (puede tener problemas de moderación)
- Proverbios 3:5-6

**Alta complejidad (esperamos errores):**
- Apocalipsis 21:4 ❌ (alto riesgo de moderación)
- Ezequiel 37:1-10 ❌ (contenido violento)

---

## 🎬 Resultado Esperado

Al final del test completo, deberíamos tener:

1. ✅ Video publicado en YouTube
2. ✅ Metadata completa en todos los outputs
3. ✅ Logs detallados de cada paso
4. ✅ Scorecard completado
5. ✅ Lista de mejoras identificadas

---

## 💡 Mejoras Identificadas Durante el Test

(Llenar durante la ejecución)

1.
2.
3.
