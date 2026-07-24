# 🚀 Quick Start: Generar Metadata con OpenRouter

## ✅ PASO 1: Configuración Completada

Ya tienes todo listo:
- ✅ API Key de OpenRouter configurada en `.env`
- ✅ Script adaptado: `scripts/prepare-cloud-database-openrouter.js`
- ✅ 30,987 versículos ya extraídos en `data/extracted-verses.json`

---

## 🎯 PASO 2: Ejecutar Generación (RECOMENDADO)

### Opción A: Mistral Nemo ⭐ (MÁS BARATO - $0.57)

```bash
node scripts/prepare-cloud-database-openrouter.js \
  --mode=generate \
  --model=mistralai/mistral-nemo
```

**Tiempo estimado**: ~5 horas
**Costo total**: $0.57 USD
**Ahorro vs Anthropic**: 99.88%

---

### Opción B: Qwen3.5-Flash (TU CANDIDATO - $3.42)

```bash
node scripts/prepare-cloud-database-openrouter.js \
  --mode=generate \
  --model=qwen/qwen3.5-flash-02-23
```

**Tiempo estimado**: ~6 horas
**Costo total**: $3.42 USD
**Context window**: 1M tokens (gigante!)

---

### Opción C: Qwen3 Coder 30B A3B ($3.59)

```bash
node scripts/prepare-cloud-database-openrouter.js \
  --mode=generate \
  --model=qwen/qwen3-coder-30b-a3b-instruct
```

**Tiempo estimado**: ~6 horas
**Costo total**: $3.59 USD
**Especializado**: Generación estructurada (JSON)

---

## 📊 PASO 3: Monitorear Progreso

El script guarda progreso automáticamente cada 10 versículos:

```bash
# Ver checkpoint actual
cat data/checkpoint.json

# Ver versículos procesados
cat data/processed-verses.json | head -100
```

Si el proceso se interrumpe, **se reanuda automáticamente** desde donde quedó.

---

## ⚠️ PASO 4: Si Algo Falla

### Reanudar desde checkpoint:
```bash
# Continúa desde donde quedó
node scripts/prepare-cloud-database-openrouter.js --mode=generate --model=mistralai/mistral-nemo
```

### Reiniciar desde cero:
```bash
# Borrar checkpoint
rm data/checkpoint.json data/processed-verses.json

# Volver a ejecutar
node scripts/prepare-cloud-database-openrouter.js --mode=generate --model=mistralai/mistral-nemo
```

---

## 🔍 PASO 5: Validar Calidad

Después de procesar los primeros 100 versículos, revisa la calidad:

```bash
# Ver primeros 5 versículos procesados
cat data/processed-verses.json | head -200
```

Verifica que tengan:
- ✅ `category`: Categoría válida
- ✅ `keywords`: 5-10 palabras clave
- ✅ `viralPotential`: Score 1-10
- ✅ `visualDescriptions`: Objeto con hook/intro/body/application/cta

Si la calidad es **mala**, detén el proceso y cambia a un modelo mejor (Qwen3.5-Flash).

---

## 📤 PASO 6: Subir a Supabase (Cuando Termines)

```bash
node scripts/prepare-cloud-database-openrouter.js --mode=upload
```

**Nota**: Necesitas credenciales de Supabase configuradas en `.env`:
```bash
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_SERVICE_KEY=tu-service-key
```

---

## 🎯 RECOMENDACIÓN FINAL

**1. EMPEZAR CON MISTRAL NEMO** ($0.57)
   - Es el más barato
   - Si funciona bien → LISTO
   - Si la calidad es mala → paso 2

**2. UPGRADE A QWEN3.5-FLASH** ($3.42)
   - Solo si Mistral Nemo no da buenos resultados
   - Context window gigante (1M tokens)
   - Mejor calidad

**Costo total máximo**: $4.00 USD (vs $477 de Anthropic)
**Ahorro**: 99.2%

---

## 📚 Documentación Completa

- Ver modelos disponibles y precios: `docs/OPENROUTER-RECOMMENDATIONS.md`
- Ver código del script: `scripts/prepare-cloud-database-openrouter.js`

---

## 🆘 Problemas Comunes

### Error: "OPENROUTER_API_KEY not found"
```bash
# Verificar que está en .env
grep OPENROUTER .env

# Si no está, añadir:
echo "OPENROUTER_API_KEY=sk-or-v1-..." >> .env
```

### Error: "fetch is not defined"
```bash
# Necesitas Node.js 18+ (fetch es nativo)
node --version  # Debe ser >= 18.0.0

# Si es menor, actualizar Node.js
```

### El proceso es muy lento
```bash
# Aumentar batch size (más paralelismo)
# Editar scripts/prepare-cloud-database-openrouter.js
# Cambiar: batchSize: 10 → batchSize: 20
```

---

## ✅ Siguiente Paso

**¡EJECUTA YA!** 🚀

```bash
node scripts/prepare-cloud-database-openrouter.js \
  --mode=generate \
  --model=mistralai/mistral-nemo
```

Déjalo corriendo en segundo plano y revisa en 1 hora cómo va.
