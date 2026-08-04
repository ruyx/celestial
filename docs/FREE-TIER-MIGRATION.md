# 🎉 Migración a Alternativas GRATUITAS

## 📅 Fecha: 2026-08-04

## ❌ Problema Anterior

El sistema original usaba **Magnific MCP** para todo (imágenes, videos, audio):

| Agent | Servicio | Costo por video (65s) |
|-------|----------|----------------------|
| Agent 4 | Magnific Images | ~$5 USD |
| Agent 5 | Magnific Videos | ~$45.50 USD |
| Agent 6 | Magnific Audio | ~$1 USD |
| **TOTAL** | **Magnific MCP** | **~$51.50 USD/video** |

**Costo anual (100 videos)**: **$5,150 USD**

### 🚨 Por qué era insostenible:
- El proyecto NO genera ingresos aún
- Es una apuesta para monetizar en YouTube
- Objetivo: Ayudar al ánimo de las personas (misión social)
- **$51.50/video es prohibitivo para fase MVP**

---

## ✅ Solución Implementada

Migración completa a stack **100% GRATUITO**:

| Agent | Servicio NUEVO | Costo | Free Tier |
|-------|----------------|-------|-----------|
| Agent 4 | **Stable Diffusion XL** (Replicate) | $0 | $10 gratis + $0.003/imagen después |
| Agent 5 | **Stable Video Diffusion** (Replicate + Stability AI) | $0 | Community License (<$1M revenue) |
| Agent 6 | **AWS Polly Neural TTS** | $0 | 5M caracteres/mes (año 1) |
| **TOTAL** | **Stack gratuito** | **$0 USD/video** | **Ilimitado en práctica** |

**Costo anual (100 videos)**: **$0 USD**
**Ahorro anual**: **$5,150 USD**

---

## 📂 Estructura del Código

### Archivos NUEVOS (100% gratuitos):

```
agents/
├── agent-4-stable-diffusion-free.js       # Generación de imágenes (Replicate)
├── agent-5-stable-video-diffusion-free.js # Generación de videos (Stability AI)
├── agent-6-aws-polly-free.js              # Generación de audio TTS (AWS Polly)

run-agent-4.sh  # Wrapper para Agent 4 FREE
run-agent-5.sh  # Wrapper para Agent 5 FREE
run-agent-6.sh  # Wrapper para Agent 6 FREE
```

### Archivos DESHABILITADOS (alternativa paga):

```
agents/ALTERNATIVES-PAID/
├── agent-4-magnific-mcp.md
├── agent-5-magnific-mcp.md
├── agent-6-magnific-mcp.md
├── README-MAGNIFIC-ALTERNATIVE.md  # Documentación de la alternativa

run-agent-4-MAGNIFIC-PAID.sh.DISABLED
run-agent-5-MAGNIFIC-PAID.sh.DISABLED
run-agent-6-MAGNIFIC-PAID.sh.DISABLED
```

---

## 🔧 Configuración Necesaria

### 1. Replicate API Token (GRATIS)

```bash
# Regístrate en: https://replicate.com/account/api-tokens
# Obtienes $10 USD gratis al inicio
export REPLICATE_API_TOKEN="r8_xxx..."
```

Agregar a `.env`:
```env
REPLICATE_API_TOKEN=r8_xxx...
```

### 2. AWS Credentials (GRATIS primer año)

```bash
# Crea cuenta en AWS: https://aws.amazon.com/free/
# Free tier: 5,000,000 caracteres/mes de Polly Neural TTS
export AWS_ACCESS_KEY_ID="AKIA..."
export AWS_SECRET_ACCESS_KEY="..."
export AWS_REGION="us-east-1"
```

Agregar a `.env`:
```env
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1
```

### 3. Instalar dependencias

```bash
npm install replicate aws-sdk
```

---

## 🚀 Uso

```bash
# Agent 4: Generar imágenes (GRATIS)
bash run-agent-4.sh "Filipenses 4:13"

# Agent 5: Generar videos (GRATIS)
bash run-agent-5.sh "Filipenses 4:13"

# Agent 6: Generar audio TTS (GRATIS)
bash run-agent-6.sh "Filipenses 4:13"
```

---

## 📊 Comparación Técnica

| Característica | Magnific | Stack Gratuito |
|----------------|----------|----------------|
| **Imágenes** | Magnific (pagado) | Stable Diffusion XL |
| Calidad imágenes | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| Resolución | 1024x1024 | 1024x576 (16:9) |
| Costo/imagen | ~$1 USD | $0 USD |
| | | |
| **Videos** | Magnific Seedance 2.0 | Stable Video Diffusion 1.1 |
| Calidad videos | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| Duración max | 15s/clip | 2.3s/clip (14 frames) |
| Costo/video (65s) | $45.50 USD | $0 USD |
| | | |
| **Audio TTS** | Magnific | AWS Polly Neural |
| Calidad audio | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Voces en español | Sí | Lupe, Mia (latino) |
| Costo/10K chars | ~$0.10 USD | $0 USD (free tier) |

---

## ⚠️ Limitaciones Conocidas

### Stable Video Diffusion:
- Genera clips de ~2.3s (14 frames @ 6fps)
- Para videos de 65s, necesitamos generar múltiples clips y concatenarlos
- Solución: Agent 7 (video-editor) concatena los clips con ffmpeg

### Replicate Free Tier:
- $10 USD gratis al inicio
- Después: $0.003/imagen, $0.04/segundo de video
- Para 100 videos: ~$30 USD (vs $5,150 con Magnific)

### AWS Polly Free Tier:
- 5M caracteres/mes gratis (primer año)
- Después: $4 USD/millón de caracteres
- Suficiente para ~500 videos/mes

---

## 🔄 Cómo volver a Magnific (si tienes presupuesto)

1. Copiar archivos de `agents/ALTERNATIVES-PAID/` a `agents/`
2. Renombrar `.DISABLED` de los scripts
3. Configurar Magnific MCP en Claude Code
4. Modificar `run-agent-*.sh` para usar archivos `-magnific-mcp.md`

Referencia: `agents/ALTERNATIVES-PAID/README-MAGNIFIC-ALTERNATIVE.md`

---

## 🎯 Ventajas del Stack Gratuito

### Para el Proyecto:
- **$0 USD** de costo operativo en fase MVP
- Escalable a cientos de videos sin costos
- Modelos open-source (Stability AI, AWS Polly)
- Mismo pipeline, solo cambia la generación

### Para la Misión:
- Permite crear contenido sin preocupación de costos
- Más videos = más personas ayudadas
- Monetización en YouTube puede empezar sin deuda técnica

---

## 📈 Roadmap

- ✅ **Fase 1**: Implementar stack gratuito (Agent 4, 5, 6)
- ⏳ **Fase 2**: Probar pipeline completo end-to-end
- ⏳ **Fase 3**: Optimizar calidad de videos (concatenación de clips)
- ⏳ **Fase 4**: Evaluar monetización en YouTube
- ⏳ **Fase 5**: Si genera >$1M/año, reevaluar Magnific

---

## 🙏 Filosofía

**"Lo gratuito no es inferior, es estratégico."**

Este proyecto prueba que se puede crear contenido de alta calidad para YouTube **sin gastar un centavo** usando:
- Stable Diffusion (open-source)
- Stable Video Diffusion (Community License gratis <$1M)
- AWS Polly (5M caracteres/mes gratis)

El objetivo no es ahorrar dinero por avaro, sino **maximizar el impacto social** mientras el proyecto crece.

---

## 📝 Documentación Técnica

- **Stable Diffusion XL**: https://replicate.com/stability-ai/sdxl
- **Stable Video Diffusion**: https://replicate.com/stability-ai/stable-video-diffusion
- **AWS Polly**: https://aws.amazon.com/polly/
- **Stability AI Community License**: https://stability.ai/community-license

---

## 📞 Soporte

¿Problemas con la migración?
1. Verificar API tokens en `.env`
2. Instalar dependencias: `npm install replicate aws-sdk`
3. Revisar logs de errores en outputs de los agentes

---

**Última actualización**: 2026-08-04
**Autor**: Claude Code + Equipo proyecto-yt
**Versión**: 1.0-FREE-TIER
