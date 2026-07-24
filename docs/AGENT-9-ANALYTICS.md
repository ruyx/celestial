# 📊 Agent 9: Analytics Collector

## Descripción

Agent 9 es el **sistema de recolección y análisis de métricas** de YouTube. Recolecta automáticamente estadísticas de todos los videos publicados, las almacena en Supabase, calcula engagement rates y performance scores, y compara el rendimiento real contra las predicciones de `viral_potential`.

---

## 🎯 Funcionalidades

### 1. Recolección de Métricas

Obtiene de cada video publicado:

- **Métricas básicas**:
  - Vistas (`views`)
  - Likes (`likes`)
  - Comentarios (`comments`)

- **Tasas calculadas**:
  - Engagement rate: `(likes + comments) / views * 100`
  - Like rate: `likes / views * 100`
  - Comment rate: `comments / views * 100`

- **Scoring**:
  - Performance score (1-10): Calculado con la misma lógica de `calculate_performance_score()` en PostgreSQL
  - Viral potential score: Guardado desde la predicción AI original

### 2. Almacenamiento

Inserta registros en la tabla `video_analytics` con toda la información recolectada más:

- Timestamp de recolección
- Tipo de recolección (`scheduled`, `manual`, `triggered`)
- Referencia al versículo (`verse_id`)

### 3. Análisis e Insights

Genera automáticamente:

- **Top 5 videos** por performance score
- **Comparación predicción vs realidad**: Muestra qué tan precisas fueron las predicciones de `viral_potential`
- **Diferencia promedio**: Indica si el modelo de predicción necesita calibración

---

## 🚀 Uso

### Ejecución Básica

```bash
# Recolectar métricas de TODOS los videos publicados
node agents/agent-9-analytics-collector.js
```

### Opciones Avanzadas

```bash
# Recolectar solo los últimos 10 videos
node agents/agent-9-analytics-collector.js --limit=10

# Recolectar solo videos con 7+ días desde publicación
node agents/agent-9-analytics-collector.js --min-days=7

# Solo mostrar insights (sin recolectar nuevas métricas)
node agents/agent-9-analytics-collector.js --insights

# Mostrar ayuda
node agents/agent-9-analytics-collector.js --help
```

---

## 📊 Output Ejemplo

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 AGENT 9: ANALYTICS COLLECTOR
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📹 Videos publicados encontrados: 15

[1/15]

📊 Recolectando métricas para: Salmos 23:1

   ✅ Métricas guardadas
      Vistas: 12,450
      Likes: 982
      Comentarios: 127
      Engagement: 8.91%
      Performance Score: 8/10
      Viral Potential (predicción): 9/10

[2/15]
...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📈 RESUMEN DE RECOLECCIÓN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total videos: 15
✅ Recolectados exitosamente: 15
❌ Fallidos: 0
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💡 INSIGHTS DE RENDIMIENTO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🏆 TOP 5 VIDEOS POR PERFORMANCE:

1. Salmos 23:1
   Score: 9/10 | Vistas: 15,230 | Engagement: 9.2%

2. Juan 3:16
   Score: 8/10 | Vistas: 12,450 | Engagement: 8.9%

3. Proverbios 3:5-6
   Score: 8/10 | Vistas: 11,890 | Engagement: 8.5%

...

🔮 PREDICCIÓN vs REALIDAD (últimos 10 videos):

✅ Salmos 23:1
   Predicción: 9/10 | Real: 9/10 | Diff: 0

✅ Juan 3:16
   Predicción: 8/10 | Real: 8/10 | Diff: 0

⚠️ Proverbios 3:5-6
   Predicción: 7/10 | Real: 8/10 | Diff: +1

...

📊 Diferencia promedio: 1.2 puntos
   ✅ ¡Excelente! Las predicciones son muy precisas

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 🔧 Requisitos Previos

### 1. Supabase Configurado

```bash
# En .env
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_SERVICE_KEY=tu-service-key
```

Ver: `docs/SUPABASE-SETUP.md` para configuración completa.

### 2. YouTube API Autenticado

```bash
# Verificar que exista youtube-token.json
ls youtube-token.json

# Si no existe, ejecutar primero:
node youtube-auth.js
```

### 3. Videos Publicados en Supabase

Los videos deben estar marcados como publicados en la tabla `bible_verses`:

```sql
SELECT reference, video_id, published, published_at
FROM bible_verses
WHERE published = TRUE
LIMIT 5;
```

Si no hay videos publicados, Agent 9 mostrará:

```
⚠️  No hay videos publicados para analizar
```

---

## 🎛️ Configuración de Recolección

### Frecuencia Recomendada

- **Videos nuevos (0-7 días)**: Recolectar **cada 24 horas** (crecimiento rápido)
- **Videos establecidos (8-30 días)**: Recolectar **cada 7 días**
- **Videos antiguos (30+ días)**: Recolectar **cada 30 días**

### Implementar con Cron

```bash
# Cada día a las 3:00 AM - Todos los videos
0 3 * * * cd /home/suario/ruy-projects/project-yt && node agents/agent-9-analytics-collector.js --min-days=1

# Cada semana - Videos establecidos
0 3 * * 0 cd /home/suario/ruy-projects/project-yt && node agents/agent-9-analytics-collector.js --min-days=8
```

---

## 📈 Análisis de Datos

### Queries Útiles

Una vez recolectadas las métricas, puedes analizarlas directamente en Supabase:

#### Top videos por engagement

```sql
SELECT
  reference,
  views,
  engagement_rate,
  performance_score
FROM video_analytics
ORDER BY engagement_rate DESC
LIMIT 10;
```

#### Evolución de un video específico

```sql
SELECT
  collected_at,
  views,
  likes,
  comments,
  engagement_rate
FROM video_analytics
WHERE reference = 'Salmos 23:1'
ORDER BY collected_at DESC;
```

#### Comparar predicción vs realidad

```sql
SELECT
  bv.reference,
  bv.viral_potential as predicted,
  va.performance_score as actual,
  va.views,
  va.engagement_rate,
  (va.performance_score - bv.viral_potential) as diff
FROM bible_verses bv
JOIN video_analytics va ON bv.id = va.verse_id
WHERE bv.published = TRUE
ORDER BY ABS(va.performance_score - bv.viral_potential) DESC
LIMIT 20;
```

#### Categorías con mejor rendimiento

```sql
SELECT
  bv.category,
  COUNT(*) as total_videos,
  ROUND(AVG(va.views), 0) as avg_views,
  ROUND(AVG(va.engagement_rate), 2) as avg_engagement,
  ROUND(AVG(va.performance_score), 2) as avg_performance
FROM bible_verses bv
JOIN video_analytics va ON bv.id = va.verse_id
GROUP BY bv.category
ORDER BY avg_performance DESC;
```

---

## 🔄 Integración con Otros Agents

Agent 9 se integra con:

- **Agent 2 (Content Selector)**: Usa el performance score real para ajustar futuras selecciones
- **Cron Jobs**: Se ejecuta automáticamente cada 7 días
- **Dashboard (futuro)**: Visualización de métricas en tiempo real

---

## ⚠️ Limitaciones

### YouTube Data API Quotas

- **Lectura de estadísticas**: 1 unidad por video
- **Cuota diaria gratuita**: 10,000 unidades
- **Máximo videos por día**: ~10,000 videos (más que suficiente)

### Métricas No Disponibles (sin YouTube Analytics API)

- Watch time total (requiere OAuth adicional)
- Average view duration (requiere OAuth adicional)
- Shares (no disponible en API pública)
- Dislikes (removidos por YouTube en 2021)

Estas métricas se almacenan como `0` en la tabla.

---

## 🐛 Troubleshooting

### Error: "SUPABASE_URL y SUPABASE_SERVICE_KEY deben estar configuradas"

**Solución**: Agregar credenciales de Supabase a `.env`:

```bash
echo "SUPABASE_URL=https://tu-proyecto.supabase.co" >> .env
echo "SUPABASE_SERVICE_KEY=tu-service-key" >> .env
```

---

### Error: "No se encontró youtube-token.json"

**Solución**: Ejecutar autenticación de YouTube primero:

```bash
node youtube-auth.js
```

---

### Error: "The caller does not have permission"

**Causa**: Token de YouTube expirado.

**Solución**: Volver a autenticar:

```bash
rm youtube-token.json
node youtube-auth.js
```

---

### No se recolectan métricas (0 videos encontrados)

**Causa**: No hay videos marcados como `published = TRUE` en Supabase.

**Solución**: Verificar en Supabase:

```sql
SELECT COUNT(*) FROM bible_verses WHERE published = TRUE;
```

Si es 0, significa que aún no se han publicado videos.

---

## 📚 Siguiente Paso

Una vez Agent 9 funcione correctamente, el siguiente paso es:

**Configurar Cron Jobs Automáticos** para ejecutarlo cada 7 días.

Ver: `docs/CRON-SETUP.md` (próximo)
