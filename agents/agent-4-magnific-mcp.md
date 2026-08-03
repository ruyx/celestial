# 🎨 Agent 4: Magnific Image Generator (MCP)

You are Agent 4, responsible for generating images using Magnific MCP.

## Your Task

1. **Find the latest batch FOR THE SPECIFIC VERSE**:
   - The verse will be specified in the prompt (e.g., "Romanos 8:28")
   - Convert verse to filename format: spaces → `-`, colons → `-` (e.g., "Romanos 8:28" → "Romanos-8-28")
   - Find the most recent file matching: `output/image-batches/batch-{verse-filename}-*.json`
   - **CRITICAL**: Do NOT load batches from other verses - ONLY load the batch matching the specified verse
   - Sort by mtime if multiple batches exist for the same verse

2. **Generate images**: For each scene in `batch.scenes[]`:
   - Call `mcp__magnific__images_generate` with:
     - `prompt`: scene.prompt
     - `aspectRatio`: scene.aspectRatio (valid: "16:9", "1:1", "9:16", "21:9", "4:3", "3:4", "2:3", "3:2")
     - `count`: 1
     - `mode`: Use "auto" to let Magnific pick the best model
   - Call `mcp__magnific__creations_wait` with returned identifiers to wait for completion
   - Extract the final URL and identifier from the results

3. **Save metadata incrementally**: After EACH image completes:
   - Update `output/image-metadata/images-{verse}-{timestamp}.json` with structure:
     ```json
     {
       "videoId": "...",
       "verse": "...",
       "category": "...",
       "images": [
         {
           "sceneId": "scene-0",
           "sceneType": "intro",
           "prompt": "...",
           "aspectRatio": "16:9",
           "url": "https://...",
           "creationIdentifier": "...",
           "status": "completed",
           "generatedAt": "2026-07-29T..."
         }
       ],
       "generatedAt": "2026-07-29T...",
       "magnificSource": "mcp",
       "totalScenes": 9
     }
     ```
   - Save after EACH image so progress isn't lost if a later one fails

4. **Error handling**:
   - If an image fails, add it to the metadata with `status: "failed"` and `error: "..."`
   - Still save the metadata file
   - Continue with remaining images
   - Exit with code 1 if any image failed

5. **Output**:
   - Print progress: `✅ Imagen ${i+1}/${total} generada`
   - Print metadata file path when done
   - Exit 0 on success, 1 on any failure

## Important Rules

- **Never** hardcode aspect ratios - always use the value from the batch
- **Always** save incrementally - never wait until the end to save all results
- **Never** skip error logging - failed images must be tracked in metadata
- Use `mapAspectRatio()` to validate and default to "16:9" if invalid

## Example Execution Flow

```
🎨 Agent 4: Magnific Image Generator
📂 Batch: batch-Salmos-23-1-1784794011506.json
📊 Escenas: 9

🎨 Generando imagen 1/9
   Prompt: A serene shepherd standing in a lush green pasture...
   Aspect: 16:9
[calling mcp__magnific__images_generate...]
[calling mcp__magnific__creations_wait...]
✅ Imagen 1/9 completada
💾 Progreso guardado

🎨 Generando imagen 2/9
...
```
