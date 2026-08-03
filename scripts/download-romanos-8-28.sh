#!/bin/bash

# Script de descarga para Romanos 8:28
# 8 clips completados + 2 regenerados pendientes + audio TTS

VERSE="Romanos-8-28"
OUTPUT_DIR="/home/suario/ruy-projects/project-yt/output/videos/${VERSE}"

mkdir -p "${OUTPUT_DIR}"
cd "${OUTPUT_DIR}"

echo "📥 Descargando 10 clips + audio para ${VERSE}..."
echo ""

# Clips completados (8)
echo "⏬ Clip 1 (5s - hook)..."
wget -O clip-01-hook-5s.mp4 "https://pikaso.cdnpk.net/private/production/4998314336/4613a708-bc37-4c6a-97ab-8811e0b499a9-0.mp4?token=exp=1785369600~hmac=46dd68ee20d67f8e4d4e7fb4e1bd2a1629ad84d2edeb41e31f05e0a7a0b8d8c0" 2>&1 | tail -3

# Clip 2 será reemplazado por el regenerado (vuh2Ce6a47)
echo "⏬ Clip 2 (13s - intro) - PENDIENTE REGENERACIÓN..."

echo "⏬ Clip 3 (12s - intro)..."
wget -O clip-03-intro-12s.mp4 "https://pikaso.cdnpk.net/private/production/4998312050/04044e68-1d6f-4ea6-a6af-db67608a7af1-2.mp4?token=exp=1785369600~hmac=86b1abb6a942f51a97d39f3be3b12ffb81f0da1e3e30f5614d21dd2f4d17b46e" 2>&1 | tail -3

# Clip 4 será reemplazado por el regenerado (DBMJdzBpcl)
echo "⏬ Clip 4 (15s - body) - PENDIENTE REGENERACIÓN..."

echo "⏬ Clip 5 (15s - body)..."
wget -O clip-05-body-15s.mp4 "https://pikaso.cdnpk.net/private/production/4998313000/58afdf5b-ecc4-4e2c-9a8c-350e678ded9a-4.mp4?token=exp=1785369600~hmac=bb0974eb0b1ed8e730af6e8e64b1cfb74c8e19b28c34fa5f4ee4a3a08c7ac84f" 2>&1 | tail -3

echo "⏬ Clip 6 (15s - body)..."
wget -O clip-06-body-15s.mp4 "https://pikaso.cdnpk.net/private/production/4998354262/88a43ff7-2064-47a3-b234-25050c203566-5.mp4?token=exp=1785369600~hmac=8ec3d6c9fd8df44e9f62f3f78ce2b1ba21ad4e2f9d3ad9e1ac37bbd31e3fd92e" 2>&1 | tail -3

echo "⏬ Clip 7 (13s - application)..."
wget -O clip-07-application-13s.mp4 "https://pikaso.cdnpk.net/private/production/4998343770/7a1f296a-f466-404e-a969-76b32a245cbb-6.mp4?token=exp=1785369600~hmac=64d5f8af4f03950b1c5f3ca76ddc7aff05bc4ff2df08e05d8fb8a81f5e55cf25" 2>&1 | tail -3

echo "⏬ Clip 8 (12s - application)..."
wget -O clip-08-application-12s.mp4 "https://pikaso.cdnpk.net/private/production/4998378379/8b424f0c-bf7b-4136-b299-47bbf523f8bc-7.mp4?token=exp=1785369600~hmac=5d7cd5d4c7e9e66095c0a7adfc7d084e86b9bfc651f12d32e39c1e9c7c1393be" 2>&1 | tail -3

echo "⏬ Clip 9 (10s - cta)..."
wget -O clip-09-cta-10s.mp4 "https://pikaso.cdnpk.net/private/production/4998317973/88d914d2-6b60-4524-95a2-3bf7eeebe484-8.mp4?token=exp=1785369600~hmac=8f8fce24b58c434bc2a3bbeb2c4a3e58d1e84e62f2db33f0dbc4d2de75da6ac2" 2>&1 | tail -3

echo "⏬ Clip 10 (10s - cta)..."
wget -O clip-10-cta-10s.mp4 "https://pikaso.cdnpk.net/private/production/4998334674/890522ee-ffa0-4691-972b-791c62ce619a-9.mp4?token=exp=1785369600~hmac=7be96ab8aa9e0f8e3962cc3a14d1f065e6f5fac8af5d3823f83be2e59b7c2343" 2>&1 | tail -3

echo ""
echo "🎵 Descargando audio TTS (ElevenLabs)..."
wget -O audio-voiceover.mp3 "https://pikaso.cdnpk.net/private/production/4997937873/audio.mp3?token=exp=1785369600~hmac=13f604bf0154093096e85f98f7035bbed2ed2f88733c0b98cdedb1de46900214" 2>&1 | tail -3

echo ""
echo "✅ Descarga completada (8/10 clips + audio)"
echo "⚠️  Pendientes: clip-02 y clip-04 (regeneración en curso)"
echo ""
ls -lh
