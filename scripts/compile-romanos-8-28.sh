#!/bin/bash

# Script de compilación Agent-7 (Video Editor) - Romanos 8:28
# Concatena 10 clips + audio voiceover para producir video final de 120s

VERSE="Romanos-8-28"
INPUT_DIR="/home/suario/ruy-projects/project-yt/output/videos/${VERSE}"
OUTPUT_DIR="/home/suario/ruy-projects/project-yt/output/final-videos"
OUTPUT_FILE="${OUTPUT_DIR}/final-${VERSE}.mp4"
METADATA_FILE="${OUTPUT_DIR}/video-metadata-${VERSE}.json"

mkdir -p "${OUTPUT_DIR}"
cd "${INPUT_DIR}"

echo "🎬 Agent-7: Compilando video final de ${VERSE}"
echo ""

# Crear archivo de lista para concatenación
cat > /tmp/concat-list.txt <<EOF
file '${INPUT_DIR}/clip-01-hook-5s.mp4'
file '${INPUT_DIR}/clip-02-intro-13s.mp4'
file '${INPUT_DIR}/clip-03-intro-12s.mp4'
file '${INPUT_DIR}/clip-04-body-15s.mp4'
file '${INPUT_DIR}/clip-05-body-15s.mp4'
file '${INPUT_DIR}/clip-06-body-15s.mp4'
file '${INPUT_DIR}/clip-07-application-13s.mp4'
file '${INPUT_DIR}/clip-08-application-12s.mp4'
file '${INPUT_DIR}/clip-09-cta-10s.mp4'
file '${INPUT_DIR}/clip-10-cta-10s.mp4'
EOF

echo "📋 Lista de concatenación creada (10 clips)"
echo ""

# Verificar duración total esperada
echo "⏱️  Verificando duración de clips..."
for i in {01..10}; do
  clip=$(ls clip-${i}-*.mp4 2>/dev/null | head -1)
  if [ -f "$clip" ]; then
    duration=$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$clip")
    printf "Clip %s: %.2fs\n" "$i" "$duration"
  fi
done
echo ""

# Compilación final: concatenar videos + sobreponer audio
echo "🎵 Compilando video final con audio..."
echo ""

ffmpeg -f concat -safe 0 -i /tmp/concat-list.txt \
  -i "${INPUT_DIR}/audio-voiceover.mp3" \
  -c:v libx264 -preset medium -crf 23 \
  -c:a aac -b:a 192k \
  -map 0:v:0 -map 1:a:0 \
  -shortest \
  -y "${OUTPUT_FILE}" \
  2>&1 | grep -E '(Duration|time=|frame=|size=)' | tail -20

echo ""
echo "✅ Video final compilado:"
ls -lh "${OUTPUT_FILE}"
echo ""

# Obtener duración final
final_duration=$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${OUTPUT_FILE}")
printf "⏱️  Duración final: %.2fs (esperado: 120s)\n" "$final_duration"
echo ""

# Guardar metadata
cat > "${METADATA_FILE}" <<METADATA
{
  "verse": "${VERSE}",
  "compiledAt": "$(date -Iseconds)",
  "finalVideoPath": "${OUTPUT_FILE}",
  "finalDuration": ${final_duration},
  "clips": 10,
  "audioPath": "${INPUT_DIR}/audio-voiceover.mp3",
  "status": "completed"
}
METADATA

echo "📝 Metadata guardado: ${METADATA_FILE}"
echo ""
echo "🎬 Agent-7: Compilación completada exitosamente"
