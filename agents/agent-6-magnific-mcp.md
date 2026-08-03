# 🎙️ Agent 6 (MCP): Magnific Audio Generator

**Role:** Generar voiceover TTS desde texto usando Magnific MCP

**Context:** Este agente es ejecutado por Claude Code con acceso a Magnific MCP tools. Lee la especificación de audio más reciente y genera el voiceover usando `mcp__magnific__audio_tts`.

---

## 📋 TASK

1. **Find the latest audio spec file FOR THE SPECIFIC VERSE**:
   - The verse will be specified in the prompt (e.g., "Romanos 8:28")
   - Convert verse to filename format: spaces → `-`, colons → `-` (e.g., "Romanos 8:28" → "Romanos-8-28")
   - Find the most recent file matching: `output/audio-metadata/audio-{verse-filename}-*.json`
   - **CRITICAL**: Do NOT load specs from other verses - ONLY load the spec matching the specified verse
   - Sort by mtime if multiple specs exist for the same verse

2. **Generate the audio:**
   - Call `mcp__magnific__audio_tts` with:
     - `text`: The full concatenated text from the spec
     - `voiceId`: The voice ID from the spec (default: 863 - Matías Cárdenas)
     - `model`: Model from spec (default: "eleven_v3")
     - `speed`: Speech speed from spec (default: 1.0)
     - `stability`: Voice stability from spec (default: 0.5)
     - `similarityBoost`: Similarity boost from spec (default: 0.2)
     - `useSpeakerBoost`: Speaker boost flag from spec (default: true)

3. **After audio is generated:**
   - Call `mcp__magnific__creations_wait` with the returned `identifiers` array
   - Wait until status is "completed"
   - Extract the `url` and `creationIdentifier` from the result

4. **Save metadata** to:
   - Path: `output/audio-metadata/audio-completed-{verse}-{timestamp}.json`
   - Include: url, creationIdentifier, status, voiceId, voiceName, duration, model

5. **Handle errors gracefully:**
   - If audio fails, save it with status "failed" and the error message
   - Report the error details
   - Exit with error code 1

---

## 🎯 MAGNIFIC AUDIO TTS SPEC

### Supported Models
- **eleven_v3**: Best quality, natural speech
- **eleven_turbo_v2_5**: Faster generation, good quality

### Parameters

```javascript
{
  text: "Full narration script text concatenated from all scenes...",
  voiceId: 863,  // Matías Cárdenas - deep dramatic Chilean Spanish
  model: "eleven_v3",
  speed: 1.0,  // 0.7-1.2 range
  stability: 0.5,  // 0-1 range
  similarityBoost: 0.2,  // 0-1 range
  useSpeakerBoost: true
}
```

### Voice Configuration

Default voice: **Matías Cárdenas (voiceId: 863)**
- Deep, dramatic Chilean Spanish
- Powerful storytelling presence
- Best for biblical epic narratives

### Important Notes
- **Never** hardcode voice IDs - always use the voiceId from the spec
- **Never** hardcode model - always use "eleven_v3" from the spec
- **Always** use the speech parameters specified in the spec
- **Text limit**: Max 40k characters (Eleven v3 best for ≤3k)
- **Cost**: Each audio generation costs credits

---

## 💾 OUTPUT FORMAT

Save to: `output/audio-metadata/audio-completed-{verse}-{timestamp}.json`

```json
{
  "verse": "Romanos 8:28",
  "category": "esperanza",
  "voiceId": 863,
  "voiceName": "Matías Cárdenas",
  "voiceProvider": "elevenlabs",
  "model": "eleven_v3",
  "url": "https://magnific-audio-url.com/...",
  "creationIdentifier": "ABC123XYZ",
  "status": "completed",
  "duration": 47.5,
  "textLength": 1245,
  "generatedAt": "2026-07-29T18:40:27Z",
  "magnificSource": "mcp",
  "credits": 50
}
```

---

## 🔄 EXECUTION FLOW

```
1. Read latest audio spec file (audio-spec-*.json)
2. Extract magnificParams from spec
3. Call audio_tts with params
4. Call creations_wait until completed
5. Extract url + creationIdentifier
6. Save metadata to audio-completed-*.json
7. Report success or error
8. Exit 0 if succeeded, exit 1 if failed
```

---

## ⚠️ ERROR HANDLING

- **Moderation block**: Save as "failed", exit 1
- **API limit**: Save current progress, report error, exit 1
- **Timeout**: Save current progress, report error, exit 1
- **Missing spec**: Exit with error immediately
- **Text too long**: Truncate or split if >40k characters

---

## 📊 EXAMPLE EXECUTION

```bash
# This script is executed by agent-server.js via:
claude run agents/agent-6-magnific-mcp.md

# Output will be captured and logged by agent-server.js
```

---

## ✅ SUCCESS CRITERIA

- Audio is generated successfully
- Metadata includes url + creationIdentifier
- Status is "completed"
- File saved to correct location
- Exit code 0 on success

---

## 🎙️ VOICE PARAMETERS

### Speed (0.7-1.2)
- `0.8`: Slower, more dramatic
- `1.0`: Normal (default)
- `1.1`: Slightly faster

### Stability (0-1)
- `0.3`: More variation, expressive
- `0.5`: Balanced (default)
- `0.7`: More consistent, stable

### Similarity Boost (0-1)
- `0.0`: More creative interpretation
- `0.2`: Balanced (default)
- `0.5`: Closer to voice sample

---

## 📝 AUDIO SPEC STRUCTURE

The audio spec file contains:

```json
{
  "verse": "Romanos 8:28",
  "category": "esperanza",
  "voiceConfig": {
    "voiceId": 863,
    "name": "Matías Cárdenas",
    "description": "Deep, dramatic Chilean Spanish...",
    "provider": "elevenlabs",
    "model": "eleven_v3"
  },
  "magnificParams": {
    "text": "Full concatenated narration text...",
    "voiceId": 863,
    "model": "eleven_v3",
    "speed": 1.0,
    "stability": 0.5,
    "similarityBoost": 0.2,
    "useSpeakerBoost": true
  },
  "generatedAt": "2026-07-29T18:40:27Z"
}
```

**Use magnificParams directly** - all parameters are ready for `mcp__magnific__audio_tts` call.
