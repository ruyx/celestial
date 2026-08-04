# 🎬 Agent 5 (MCP): Magnific Video Generator

**Role:** Generar videos animados desde imágenes estáticas usando Magnific MCP

**Context:** Este agente es ejecutado por Claude Code con acceso a Magnific MCP tools. Lee el batch más reciente de video clips y genera cada video usando `mcp__magnific__video_generate`.

---

## 📋 TASK

1. **Find the image metadata file FOR THE SPECIFIC VERSE** (from Agent 4):
   - The verse will be specified in the prompt (e.g., "Romanos 8:28")
   - Convert verse to filename format: spaces → `-`, colons → `-` (e.g., "Romanos 8:28" → "Romanos-8-28")
   - Find the most recent file matching: `output/image-metadata/images-{verse-filename}-*.json`
   - **CRITICAL**: Do NOT load metadata from other verses - ONLY load the file matching the specified verse
   - Sort by mtime if multiple files exist for the same verse

2. **Find the script file FOR THE SPECIFIC VERSE** (from Agent 1):
   - Find the most recent file matching: `output/scripts/script-{verse-filename}-*.json`
   - This contains scene durations and camera movements needed for video generation

3. **For each image in the metadata (images array):**
   - Match the image's `sceneType` with the corresponding scene in the script
   - Extract from script: `duration` and `cameraMovement`
   - Map `cameraMovement` to Magnific camera motion format:
     - "slow zoom in" / "zoom in" → "pushIn"
     - "gentle pan" / "pan" → "static"
     - "slow aerial rise" → "craneUp"
     - "static close-up" → "static"
     - "dramatic zoom out" → "pullOut"
   - Call `mcp__magnific__video_generate` with:
     - `video.clips[0].prompt`: Use the image's original `prompt` field
     - `video.clips[0].duration`: Duration from script scene (default: 10 if not found)
     - `video.clips[0].aspectRatio`: Use image's `aspectRatio` (usually "16:9")
     - `video.clips[0].cameraMotion`: Mapped camera motion from script
     - `video.clips[0].slug`: "bytedance-seedance-pro-2.0" (default model)
     - `video.clips[0].keyframes.start.url`: The image's `url` field
     - `video.clips[0].keyframes.start.type`: Always "image"

3. **After EACH video is generated:**
   - Call `mcp__magnific__creations_wait` with the returned `identifiers` array
   - Wait until status is "completed"
   - Extract the `url` and `creationIdentifier` from the result
   - **Immediately save progress** to metadata file (incremental save)

4. **Save metadata** after each video to:
   - Path: `output/video-metadata/videos-completed-{verse}-{timestamp}.json`
   - Include: clipId, sceneId, sceneType, url, creationIdentifier, status, duration, cameraMotion

5. **Handle errors gracefully:**
   - If a video fails, save it with status "failed" and the error message
   - Continue with next videos (don't stop the whole batch)
   - Report which videos succeeded and which failed

---

## 🎯 MAGNIFIC VIDEO GENERATION SPEC

### Supported Models
- **bytedance-seedance-pro-2.0**: Best quality, max 15s per clip
- **kling-v1-5-image-to-video**: Alternative, max 10s per clip

### Parameters

```javascript
{
  video: {
    clips: [{
      prompt: "Cinematic biblical epic. Animate with smooth camera motion...",
      duration: 10,  // seconds (max 15 for Seedance, max 10 for Kling)
      aspectRatio: "16:9",
      cameraMotion: "pushIn",  // or "craneUp", "static", "orbitRight", etc.
      slug: "bytedance-seedance-pro-2.0",
      keyframes: {
        start: {
          type: "image",
          url: "https://pikaso.cdnpk.net/private/production/..."  // From Agent 4
        }
      }
    }]
  }
}
```

### Important Notes
- **Never** hardcode image URLs - always use the URL from the image metadata
- **Never** hardcode aspect ratios - always use the value from image metadata
- **Always** map camera movement from script to Magnific camera motion format
- **Duration limits**: Seedance max 15s, Kling max 10s per clip
- **Cost**: Each video costs credits (check with simulate_cost if needed)
- **Scene matching**: Match images to script scenes by `sceneType` field (hook, intro, body, application, cta)

---

## 💾 OUTPUT FORMAT

Save to: `output/video-metadata/videos-completed-{verse}-{timestamp}.json`

```json
{
  "videoId": "script-23-1785306107977.json",
  "verse": "Romanos 8:28",
  "category": "esperanza",
  "videos": [
    {
      "clipId": 1,
      "sceneId": 1,
      "sceneType": "hook",
      "duration": 10,
      "cameraMotion": "pushIn",
      "imageUrl": "https://pikaso.cdnpk.net/...",
      "url": "https://magnific-video-url.com/...",
      "creationIdentifier": "ABC123XYZ",
      "status": "completed",
      "generatedAt": "2026-07-29T18:40:27Z",
      "credits": 150
    }
  ],
  "generatedAt": "2026-07-29T18:40:27Z",
  "magnificSource": "mcp",
  "totalClips": 5,
  "totalDuration": 47,
  "totalCredits": 750
}
```

---

## 🔄 EXECUTION FLOW

```
1. Read latest image metadata file (output/image-metadata/images-*.json)
2. Read corresponding script file (output/scripts/script-*.json)
3. For each image in metadata.images[] (1-5 typically):
   ┌──────────────────────────────────────────────┐
   │ 4. Match image.sceneType with script scene   │
   │ 5. Extract duration & cameraMovement         │
   │ 6. Map cameraMovement to Magnific format     │
   │ 7. Call video_generate with image URL        │
   │ 8. Call creations_wait                       │
   │ 9. Extract url + identifier                  │
   │ 10. Save progress incrementally              │ ← CRITICAL: Save after EACH video
   └──────────────────────────────────────────────┘
11. Report summary (X/Y videos succeeded)
12. Exit 0 if all succeeded, exit 1 if any failed
```

---

## ⚠️ ERROR HANDLING

- **Moderation block**: Save as "failed", continue
- **API limit**: Save current progress, report error
- **Timeout**: Save current progress, report which videos completed
- **Missing image metadata**: Exit with error immediately
- **Missing script file**: Continue with default durations (10s) and camera motion ("static")

---

## 📊 EXAMPLE EXECUTION

```bash
# This script is executed by agent-server.js via:
claude run agents/agent-5-magnific-mcp.md

# Output will be captured and logged by agent-server.js
```

---

## ✅ SUCCESS CRITERIA

- All videos from batch are generated
- Each video has url + creationIdentifier
- Metadata file is saved with all results
- Status is "completed" for successful videos
- Failed videos are marked with status "failed" + error message

---

## 🎬 CAMERA MOTIONS

Valid camera motions for Seedance 2.0:
- `static`: No camera movement
- `pushIn`: Dolly push in toward subject
- `pullOut`: Dolly pull out from subject
- `craneUp`: Crane up movement
- `craneDown`: Crane down movement
- `orbitLeft`: Orbit around subject (left)
- `orbitRight`: Orbit around subject (right)
- `tiltUp`: Tilt camera up
- `tiltDown`: Tilt camera down
