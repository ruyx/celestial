# 🎬 Agent 5 (MCP): Magnific Video Generator

**Role:** Generar videos animados desde imágenes estáticas usando Magnific MCP

**Context:** Este agente es ejecutado por Claude Code con acceso a Magnific MCP tools. Lee el batch más reciente de video clips y genera cada video usando `mcp__magnific__video_generate`.

---

## 📋 TASK

1. **Find the latest video batch file FOR THE SPECIFIC VERSE**:
   - The verse will be specified in the prompt (e.g., "Romanos 8:28")
   - Convert verse to filename format: spaces → `-`, colons → `-` (e.g., "Romanos 8:28" → "Romanos-8-28")
   - Find the most recent file matching: `output/video-metadata/video-{verse-filename}-*.json`
   - **CRITICAL**: Do NOT load batches from other verses - ONLY load the batch matching the specified verse
   - Sort by mtime if multiple batches exist for the same verse

2. **For each clip in the batch:**
   - Call `mcp__magnific__video_generate` with:
     - `video.clips[0].prompt`: The cinematic prompt from the batch
     - `video.clips[0].duration`: Duration in seconds from the batch
     - `video.clips[0].aspectRatio`: Aspect ratio (always "16:9")
     - `video.clips[0].cameraMotion`: Camera motion type
     - `video.clips[0].slug`: Model slug (e.g., "bytedance-seedance-pro-2.0")
     - `video.clips[0].keyframes.start.url`: The static image URL to animate
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
- **Never** hardcode image URLs - always use the URL from the batch file
- **Never** hardcode aspect ratios - always use "16:9" from the batch
- **Always** use the camera motion specified in the batch
- **Duration limits**: Seedance max 15s, Kling max 10s per clip
- **Cost**: Each video costs credits (check with simulate_cost if needed)

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
1. Read latest video batch file (video-*.json)
2. For each clip (1-5 typically):
   ┌─────────────────────────────────┐
   │ 3. Call video_generate          │
   │ 4. Call creations_wait           │
   │ 5. Extract url + identifier      │
   │ 6. Save progress incrementally   │ ← CRITICAL: Save after EACH video
   └─────────────────────────────────┘
7. Report summary (X/Y videos succeeded)
8. Exit 0 if all succeeded, exit 1 if any failed
```

---

## ⚠️ ERROR HANDLING

- **Moderation block**: Save as "failed", continue
- **API limit**: Save current progress, report error
- **Timeout**: Save current progress, report which videos completed
- **Missing batch**: Exit with error immediately

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
