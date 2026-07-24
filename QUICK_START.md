# 🚀 Quick Start - YouTube Bible Automation

## ✅ Lo que YA ESTÁ HECHO

### 1. Canal Configurado ✅
- **Canal**: ruy dejesus (15 años de antigüedad)
- **Descripción**: SEO optimizado
- **8 playlists creadas**: Versículos del Día, Promesas de Dios, Salmos, Proverbios, etc.

### 2. Autenticación ✅
- YouTube Data API conectada
- Token guardado en `youtube-token.json`
- Full access: upload, metadata, playlists, analytics

### 3. Branding Visual ✅
- 2 opciones de banners (16:9)
- 3 opciones de logos (1:1)
- 1 template de thumbnail

### 4. Scripts Listos ✅
- `youtube-auth.js` - Autenticación OAuth
- `youtube-manager.js` - Gestión completa del canal
- `setup-channel.js` - Setup del canal (ya ejecutado)
- `video-production-pipeline.js` - Pipeline completo de producción
- `n8n-workflow.json` - Workflow de automatización

## 📋 PENDIENTES MANUALES (5 minutos)

### 1. Subir Banner
Ve a: https://studio.youtube.com
- Settings → Branding → Banner image
- Descarga y sube: https://www.magnific.com/app/creation/MX0ljEfDCm

### 2. Subir Logo
- Settings → Branding → Picture
- Descarga y sube: https://www.magnific.com/app/creation/5xHWnG9Kxe

### 3. Agregar URI de Redirección (IMPORTANTE)
Ve a: https://console.cloud.google.com/apis/credentials
- Busca tu OAuth Client ID
- Agregar en "URIs de redirección autorizados":
  ```
  http://localhost:8080/oauth2callback
  ```
- Guardar

## 🎬 EMPEZAR A PRODUCIR VIDEOS

### Opción 1: Producir UN video localmente (prueba)

```bash
cd /home/suario/ruy-projects/project-yt
node video-production-pipeline.js produce
```

Esto genera el video en `output/` SIN subirlo (para revisar primero).

### Opción 2: Producir y SUBIR directamente

```bash
node video-production-pipeline.js upload
```

Esto genera el video Y lo sube automáticamente a YouTube.

### Opción 3: Producir BATCH (semana completa)

```bash
# 7 videos (uno por día)
node video-production-pipeline.js batch 7

# 30 videos (todo el mes)
node video-production-pipeline.js batch 30
```

## 🤖 AUTOMATIZACIÓN COMPLETA (n8n)

### Instalar n8n (si no lo tienes)

```bash
npm install -g n8n
```

### Ejecutar n8n

```bash
n8n start
```

### Importar Workflow

1. Abrir: http://localhost:5678
2. Import → `n8n-workflow.json`
3. Activar workflow

El workflow se ejecutará **diariamente a las 9:00 AM**:
- Selecciona versículo aleatorio
- Genera imagen con Magnific
- Crea video con FFmpeg
- Sube a YouTube programado para 12:00 PM

## 💡 PRÓXIMOS PASOS RECOMENDADOS

### Semana 1: Setup & Pruebas
1. ✅ Subir banner y logo (5 min)
2. ✅ Producir 3 videos de prueba (`batch 3`)
3. ✅ Revisar que se vean bien en YouTube
4. ✅ Ajustar thumbnails si es necesario

### Semana 2-4: Producción
1. ✅ Producir 30 videos en batch
2. ✅ Programar publicación diaria
3. ✅ Activar workflow n8n
4. ✅ Monitorear primeros resultados

### Mes 2-3: Optimización
1. 📊 Analizar qué versículos tienen más vistas
2. 🎯 Ajustar prompts de Magnific según feedback
3. 💬 Responder comentarios activamente
4. 📈 Optimizar títulos y descripciones

### Mes 4-6: Monetización
1. 🎯 Alcanzar 1,000 suscriptores
2. 🎯 Alcanzar 4,000 horas de watch time
3. 💰 Solicitar YouTube Partner Program
4. 💸 ¡Primeros ingresos pasivos!

## 🆘 TROUBLESHOOTING RÁPIDO

### "Token expired"
```bash
node youtube-auth.js
```

### "FFmpeg not found"
```bash
sudo apt-get install ffmpeg
```

### "Port 3000 in use"
Ya está solucionado - usa puerto 8080.

### Ver ayuda de cualquier script
```bash
node video-production-pipeline.js
node youtube-manager.js
```

## 📞 COMANDOS ÚTILES

### Ver playlists del canal
```bash
node -e "require('./youtube-manager.js').listPlaylists()"
```

### Ver mis videos
```bash
node -e "require('./youtube-manager.js').listMyVideos(10)"
```

### Estadísticas de un video
```bash
node -e "require('./youtube-manager.js').getVideoStats('VIDEO_ID')"
```

## 🎯 OBJETIVOS INICIALES

- ✅ **Semana 1**: 7 videos publicados
- 🎯 **Mes 1**: 30 videos, 100-500 vistas
- 🎯 **Mes 3**: 1,000 suscriptores
- 🎯 **Mes 6**: Monetización activa, $150-400/mes

---

**¡Todo listo para empezar! 🚀**

Comienza con:
```bash
cd /home/suario/ruy-projects/project-yt
node video-production-pipeline.js upload
```
