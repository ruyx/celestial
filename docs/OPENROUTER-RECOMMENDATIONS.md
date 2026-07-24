# 🚀 OpenRouter: Recomendaciones para Generación de Metadata (30,987 versículos)

## 📊 Estimaciones

- **Total versículos**: 30,987
- **Input tokens estimados**: 15.49M tokens (500 tokens/versículo)
- **Output tokens estimados**: 9.30M tokens (300 tokens/versículo)
- **Total tokens**: ~24.8M tokens

---

## 🏆 TOP 5 RECOMENDACIONES (ordenadas por precio)

### 1. 🥇 Mistral Nemo - **LA MÁS BARATA** ⭐

```
ID: mistralai/mistral-nemo
Context: 131,072 tokens
Precio: $0.02/M prompt | $0.03/M completion
💰 COSTO TOTAL: $0.57 USD
```

**✅ PROS:**
- Precio increíblemente bajo ($0.57 total)
- Context window grande (131K tokens)
- Modelo oficial de Mistral
- Relación calidad/precio excelente

**❌ CONTRAS:**
- Modelo más pequeño (puede ser menos "creativo")
- Sin datos de ranking en LLM leaderboards

**💡 RECOMENDACIÓN:** **USAR ESTE** si quieres minimizar costos. Ideal para MVP.

---

### 2. 🥈 Mistral Small 3 - **BALANCE CALIDAD/PRECIO**

```
ID: mistralai/mistral-small-24b-instruct-2501
Context: 32,768 tokens
Precio: $0.05/M prompt | $0.08/M completion
💰 COSTO TOTAL: $1.52 USD
```

**✅ PROS:**
- Precio muy bajo ($1.52)
- Modelo 24B (mejor que Nemo para razonamiento)
- Actualizado recientemente (2501)

**❌ CONTRAS:**
- Context window más pequeño (32K)

**💡 RECOMENDACIÓN:** Mejor opción si Mistral Nemo no da resultados suficientemente buenos.

---

### 3. 🥉 Qwen 2.5 7B Instruct - **OPCIÓN INTERMEDIA**

```
ID: qwen/qwen-2.5-7b-instruct
Context: 32,768 tokens
Precio: $0.04/M prompt | $0.10/M completion
💰 COSTO TOTAL: $1.55 USD
```

**✅ PROS:**
- Precio bajo ($1.55)
- Familia Qwen (buenos resultados en benchmarks)
- 7B parámetros (buen balance)

**❌ CONTRAS:**
- Context window limitado (32K)

**💡 RECOMENDACIÓN:** Alternativa sólida a Mistral.

---

### 4. 💎 Qwen3.5-Flash - **TU CANDIDATO + CONTEXT GIGANTE**

```
ID: qwen/qwen3.5-flash-02-23
Context: 1,000,000 tokens (1M!)
Precio: $0.07/M prompt | $0.26/M completion
💰 COSTO TOTAL: $3.42 USD
```

**✅ PROS:**
- **1 MILLÓN de tokens de context** (ideal para prompts complejos)
- Modelo "Flash" (rápido)
- Familia Qwen 3.5 (actualizada)
- Precio razonable ($3.42)

**❌ CONTRAS:**
- Un poco más caro que las opciones anteriores

**💡 RECOMENDACIÓN:** Usar si necesitas context window gigante para incluir ejemplos en el prompt.

---

### 5. 🎯 Qwen3 Coder 30B A3B Instruct - **TU CANDIDATO ESPECÍFICO**

```
ID: qwen/qwen3-coder-30b-a3b-instruct
Context: 262,144 tokens
Precio: $0.07/M prompt | $0.27/M completion
💰 COSTO TOTAL: $3.59 USD
```

**✅ PROS:**
- Modelo que mencionaste específicamente
- 30B parámetros (excelente capacidad)
- Context window grande (262K)
- Entrenado para generación estructurada (perfecto para JSON)

**❌ CONTRAS:**
- Versión "Coder" (optimizada para código, no para escritura narrativa)

**💡 RECOMENDACIÓN:** Puede ser overkill para metadata. Usar si necesitas máxima calidad.

---

## ⚠️ SOBRE LongCat-Flash-Lite

**No encontrado** en OpenRouter. Encontré:

```
Meituan: LongCat 2.0
ID: meituan/longcat-2.0
Context: 1,048,756 tokens (1M!)
Precio: $0.30/M prompt | $1.20/M completion
💰 COSTO TOTAL: $15.80 USD
```

**Conclusión:** LongCat 2.0 es **28x más caro** que Mistral Nemo. **No recomendado** para tu caso.

---

## 🎯 MI RECOMENDACIÓN FINAL

### Estrategia de 2 fases:

#### **FASE 1: MVP con Mistral Nemo ($0.57)**
1. Procesar los 30,987 versículos con `mistralai/mistral-nemo`
2. Evaluar calidad de metadata generada
3. Si la calidad es aceptable → **LISTO** (ahorraste $476.43 vs Anthropic)

#### **FASE 2: Upgrade selectivo (si es necesario)**
Si Mistral Nemo no da buena calidad en ciertos versículos:
1. Identificar versículos problemáticos (scoring bajo, metadata incompleta)
2. Reprocesar SOLO esos con `qwen/qwen3.5-flash-02-23` ($3.42 total para todos)

### Costo total estimado:
- **Escenario optimista:** $0.57 (solo Mistral Nemo)
- **Escenario conservador:** $0.57 + $3.42 = $4.00
- **Ahorro vs Anthropic:** $477 - $4 = **$473 ahorrados** (99.2% menos)

---

## 🔧 IMPLEMENTACIÓN

Ver `scripts/prepare-cloud-database.js` - Ya está adaptado para usar OpenRouter.

### Configuración rápida:

```bash
# 1. Agregar API key al .env
echo "OPENROUTER_API_KEY=sk-or-v1-YOUR_API_KEY_HERE" >> .env

# 2. Ejecutar con Mistral Nemo (RECOMENDADO)
node scripts/prepare-cloud-database.js --mode=generate --model=mistralai/mistral-nemo

# 3. O usar Qwen3.5-Flash si prefieres
node scripts/prepare-cloud-database.js --mode=generate --model=qwen/qwen3.5-flash-02-23
```

---

## 📈 Comparativa de Costos

| Modelo | Costo Total | Ahorro vs Anthropic | Context Window | Velocidad |
|--------|-------------|---------------------|----------------|-----------|
| **Anthropic Claude Sonnet 4.5** | $477.00 | 0% | 200K | ⭐⭐⭐⭐⭐ |
| **Mistral Nemo** ⭐ | $0.57 | 99.88% | 131K | ⭐⭐⭐⭐ |
| **Mistral Small 3** | $1.52 | 99.68% | 32K | ⭐⭐⭐⭐ |
| **Qwen 2.5 7B** | $1.55 | 99.67% | 32K | ⭐⭐⭐⭐ |
| **Qwen3.5-Flash** | $3.42 | 99.28% | 1M | ⭐⭐⭐⭐⭐ |
| **Qwen3 Coder 30B** | $3.59 | 99.25% | 262K | ⭐⭐⭐ |
| **LongCat 2.0** | $15.80 | 96.69% | 1M | ⭐⭐⭐ |

---

## 🚀 SIGUIENTE PASO

**ACCIÓN RECOMENDADA:**

```bash
# 1. Añadir la API key al .env
echo "OPENROUTER_API_KEY=sk-or-v1-YOUR_API_KEY_HERE" >> .env

# 2. Ejecutar generación con Mistral Nemo (PRUEBA GRATUITA CASI)
node scripts/prepare-cloud-database.js --mode=generate --model=mistralai/mistral-nemo --batch-size=100

# 3. Monitorear calidad en los primeros 100 versículos
# Si la calidad es buena → continuar
# Si la calidad es mala → cambiar a qwen/qwen3.5-flash-02-23
```

---

## 📝 NOTAS ADICIONALES

- **Rate Limiting:** OpenRouter tiene límites. Usar `--batch-size=50` y `--rate-limit-delay=1000` para evitar errores.
- **Checkpoints:** El script guarda progreso cada 100 versículos. Si falla, se reanuda automáticamente.
- **Calidad vs Precio:** Mistral Nemo es 838x más barato que Anthropic. Incluso si necesitas reprocesar 20% de versículos con un modelo mejor, sigues ahorrando 98%+.

---

**💰 RESUMEN:** Usa Mistral Nemo primero. Con $0.57 procesas los 31K versículos. Si no funciona, upgrade a Qwen3.5-Flash por $3.42 adicionales. Total máximo: **$4 vs $477** de Anthropic.
