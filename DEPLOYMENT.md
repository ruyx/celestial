# 🚀 Deployment Guide - Autonomous YouTube Video Pipeline

Complete guide to deploy the fully autonomous YouTube video generation pipeline.

## 📋 Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Prerequisites](#prerequisites)
3. [Step 1: FTP Storage Setup](#step-1-ftp-storage-setup)
4. [Step 2: Supabase Database Setup](#step-2-supabase-database-setup)
5. [Step 3: Vercel Edge Functions Deployment](#step-3-vercel-edge-functions-deployment)
6. [Step 4: n8n Workflow Import](#step-4-n8n-workflow-import)
7. [Step 5: Environment Variables](#step-5-environment-variables)
8. [Step 6: YouTube OAuth Setup](#step-6-youtube-oauth-setup)
9. [Testing & Verification](#testing--verification)
10. [Troubleshooting](#troubleshooting)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        n8n Orchestrator                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐            │
│  │ Agent-1  │→ │ Agent-2  │→ │ Agent-3  │→ │ Agent-4  │            │
│  │ Script   │  │ Images   │  │ Audio    │  │ Videos   │            │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘            │
└─────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────┐
│                   Vercel Edge Functions (Cloud)                     │
│  ┌──────────────────────────┐  ┌──────────────────────────┐         │
│  │ Agent-7: Compile Video   │  │ Agent-9: Gen Thumbnail   │         │
│  │ - ffmpeg compilation     │  │ - Extract frame          │         │
│  │ - FTP upload             │  │ - Text overlay           │         │
│  └──────────────────────────┘  └──────────────────────────┘         │
└─────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────┐
│                         Storage Layer                               │
│  ┌──────────────────────────┐  ┌──────────────────────────┐         │
│  │ FTP Hosting (50 GB)      │  │ Supabase PostgreSQL      │         │
│  │ - Videos (final.mp4)     │  │ - Pipeline tracking      │         │
│  │ - Thumbnails (.jpg)      │  │ - Metadata storage       │         │
│  └──────────────────────────┘  └──────────────────────────┘         │
└─────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────┐
│                   Agent-10: YouTube Upload                          │
│  - OAuth authentication                                             │
│  - Metadata (title, description, tags)                              │
│  - Thumbnail upload                                                 │
└─────────────────────────────────────────────────────────────────────┘
```

**Key Benefits:**
- ✅ **100% Cloud-Based:** No dependencia de tu computadora
- ✅ **Autonomous:** Se ejecuta completamente desatendido
- ✅ **Scalable:** 50 GB FTP = ~4,000 videos
- ✅ **Reliable:** Error handling + retry logic + tracking
- ✅ **Cost-Effective:** Supabase gratis + Vercel gratis + FTP barato

---

## Prerequisites

### Required Accounts

1. **FTP Hosting** ✅
   - Host: `ftp.ruydejesus.com`
   - User: `project-yt@project-yt.ruydejesus.com`
   - Password: `Tera2Sira!`
   - Storage: 50 GB

2. **Supabase** (Free Tier)
   - Sign up: https://supabase.com
   - Create project: `project-yt`

3. **Vercel** (Free Tier)
   - Sign up: https://vercel.com
   - Install CLI: `npm install -g vercel`

4. **n8n** (Self-hosted)
   - Already running on separate computer ✅

5. **Magnific API**
   - API credentials configured ✅

6. **YouTube API**
   - Google Cloud Project
   - YouTube Data API v3 enabled
   - OAuth credentials

### Required Tools

```bash
# Install lftp for FTP setup
sudo apt-get install lftp

# Install Supabase CLI
npm install -g supabase

# Install Vercel CLI
npm install -g vercel

# Verify installations
lftp --version
supabase --version
vercel --version
```

---

## Step 1: FTP Storage Setup

### 1.1 Create Directory Structure

```bash
cd /home/suario/ruy-projects/project-yt
chmod +x scripts/setup-ftp-structure.sh
./scripts/setup-ftp-structure.sh
```

**Expected Output:**
```
✅ FTP Structure Setup Completado Exitosamente
Directorios creados:
  📁 /videos/{verse}/final.mp4
  📁 /thumbnails/{verse}.jpg
  📁 /logs/pipeline-{timestamp}.log
```

### 1.2 Verify FTP Access

```bash
lftp -u "project-yt@project-yt.ruydejesus.com,Tera2Sira!" ftp.ruydejesus.com
lftp> ls
lftp> cd videos
lftp> ls
lftp> bye
```

**Public URLs:**
- Videos: `https://project-yt.ruydejesus.com/videos/{verse}/final.mp4`
- Thumbnails: `https://project-yt.ruydejesus.com/thumbnails/{verse}.jpg`

---

## Step 2: Supabase Database Setup

### 2.1 Link Supabase Project

```bash
cd /home/suario/ruy-projects/project-yt
supabase login
supabase link --project-ref <YOUR_PROJECT_REF>
```

### 2.2 Run Migration

```bash
supabase db push
```

This creates:
- `video_pipeline_runs` - Main tracking table
- `video_clips` - Individual clips tracking
- `audio_generations` - Audio tracking
- `pipeline_errors` - Error logging

### 2.3 Verify Tables

```bash
supabase db query "SELECT tablename FROM pg_tables WHERE schemaname = 'public';"
```

**Expected Output:**
```
video_pipeline_runs
video_clips
audio_generations
pipeline_errors
```

---

## Step 3: Vercel Edge Functions Deployment

### 3.1 Project Setup

```bash
cd /home/suario/ruy-projects/project-yt
vercel login
vercel link
```

### 3.2 Install Dependencies

Create `vercel-functions/package.json`:

```json
{
  "name": "project-yt-functions",
  "version": "1.0.0",
  "dependencies": {
    "fluent-ffmpeg": "^2.1.2",
    "basic-ftp": "^5.0.3",
    "canvas": "^2.11.2"
  }
}
```

```bash
cd vercel-functions
npm install
```

### 3.3 Deploy Functions

```bash
vercel deploy --prod
```

**Functions Deployed:**
- `/api/compile-and-upload` - Video compilation + FTP upload
- `/api/generate-thumbnail` - Thumbnail generation + FTP upload

**Save the deployment URL:**
```
https://project-yt-functions.vercel.app
```

---

## Step 4: n8n Workflow Import

### 4.1 Open n8n Web UI

Navigate to your n8n instance (running on separate computer).

### 4.2 Import Workflow

1. Click **"Workflows"** → **"Import from File"**
2. Select: `/home/suario/ruy-projects/project-yt/n8n-workflow/youtube-video-pipeline.json`
3. Click **"Import"**

### 4.3 Configure Credentials

**Magnific API:**
- Type: HTTP Header Auth
- Header Name: `Authorization`
- Header Value: `Bearer <MAGNIFIC_API_KEY>`

**Supabase:**
- Type: Supabase
- Project URL: `https://<PROJECT_REF>.supabase.co`
- API Key: `<SUPABASE_ANON_KEY>`

**YouTube OAuth:**
- Type: YouTube OAuth2
- Follow OAuth setup in Step 6

### 4.4 Update Environment Variables

In n8n Settings → Environment Variables:

```
VERCEL_COMPILE_URL=https://project-yt-functions.vercel.app
FTP_PASSWORD=Tera2Sira!
FTP_HOST=ftp.ruydejesus.com
FTP_USER=project-yt@project-yt.ruydejesus.com
```

---

## Step 5: Environment Variables

### Vercel Environment Variables

```bash
vercel env add FTP_PASSWORD
# Value: Tera2Sira!

vercel env add FTP_HOST
# Value: ftp.ruydejesus.com

vercel env add FTP_USER
# Value: project-yt@project-yt.ruydejesus.com

vercel env add MAGNIFIC_API_KEY
# Value: <YOUR_MAGNIFIC_API_KEY>
```

### n8n Environment Variables

Add to n8n instance:

```bash
VERCEL_COMPILE_URL=https://project-yt-functions.vercel.app
SUPABASE_URL=https://<PROJECT_REF>.supabase.co
SUPABASE_ANON_KEY=<YOUR_ANON_KEY>
```

---

## Step 6: YouTube OAuth Setup

### 6.1 Create Google Cloud Project

1. Go to: https://console.cloud.google.com
2. Create new project: `project-yt-youtube`
3. Enable **YouTube Data API v3**

### 6.2 Create OAuth Credentials

1. Go to: **APIs & Services** → **Credentials**
2. Click: **Create Credentials** → **OAuth client ID**
3. Application type: **Web application**
4. Authorized redirect URIs:
   ```
   https://<YOUR_N8N_DOMAIN>/rest/oauth2-credential/callback
   ```
5. Save **Client ID** and **Client Secret**

### 6.3 Configure in n8n

1. n8n → **Credentials** → **YouTube OAuth2**
2. Enter Client ID and Client Secret
3. Click **Connect** to authorize
4. Grant permissions for YouTube upload

---

## Testing & Verification

### Test 1: FTP Connectivity

```bash
./scripts/setup-ftp-structure.sh
```

Expected: ✅ Directories created successfully

### Test 2: Supabase Connection

```bash
supabase db query "SELECT COUNT(*) FROM video_pipeline_runs;"
```

Expected: `0` (empty table)

### Test 3: Vercel Functions

```bash
curl -X POST https://project-yt-functions.vercel.app/api/compile-and-upload \
  -H "Content-Type: application/json" \
  -d '{
    "verse": "Test-1-1",
    "clips": [],
    "audio": {"url": ""}
  }'
```

Expected: Error message (no clips provided) - confirms function is reachable

### Test 4: n8n Workflow

1. Open workflow in n8n
2. Click **"Execute Workflow"**
3. Provide test input:
   ```json
   {
     "verse": "Romanos-8-28",
     "scriptId": "script-123.json"
   }
   ```
4. Monitor execution logs

---

## End-to-End Test: Romanos 8:28

### Prerequisites

1. All 10 clips already generated and downloaded ✅
2. Audio voiceover generated ✅
3. All infrastructure deployed

### Test Execution

```bash
# 1. Start n8n workflow
curl -X POST https://<N8N_DOMAIN>/webhook/generate-video \
  -H "Content-Type: application/json" \
  -d '{
    "verse": "Romanos-8-28",
    "scriptId": "script-Romanos-8-28-1785147170361.json"
  }'

# 2. Monitor progress in Supabase
watch -n 5 "supabase db query 'SELECT verse, status, current_agent FROM video_pipeline_runs ORDER BY created_at DESC LIMIT 5;'"

# 3. Check FTP for final video
lftp -u "project-yt@project-yt.ruydejesus.com,Tera2Sira!" ftp.ruydejesus.com -e "ls videos/Romanos-8-28; bye"

# 4. Verify public URL
curl -I https://project-yt.ruydejesus.com/videos/Romanos-8-28/final.mp4
```

### Expected Timeline

- **Agent-2 (Images):** Already completed ✅
- **Agent-3 (Audio):** Already completed ✅
- **Agent-4 (Videos):** Already completed ✅
- **Agent-7 (Compilation):** ~2-3 minutes
- **Agent-9 (Thumbnail):** ~30 seconds
- **Agent-10 (YouTube):** ~1-2 minutes

**Total:** ~4-6 minutes from trigger to YouTube publication

---

## Troubleshooting

### Issue: FTP Connection Failed

**Symptoms:**
```
Error: Failed to connect to ftp.ruydejesus.com
```

**Solution:**
```bash
# Test FTP connectivity
ping ftp.ruydejesus.com

# Verify credentials
lftp -u "project-yt@project-yt.ruydejesus.com,Tera2Sira!" ftp.ruydejesus.com

# Check firewall
sudo ufw status
```

---

### Issue: Vercel Function Timeout

**Symptoms:**
```
Error: Function execution timed out after 300s
```

**Solution:**
- Video compilation is too slow
- Reduce video count or duration
- Optimize ffmpeg settings in `compile-and-upload.ts`:
  ```typescript
  '-preset ultrafast',  // Instead of 'medium'
  '-crf 28',            // Instead of 23 (lower quality, faster)
  ```

---

### Issue: Supabase Migration Failed

**Symptoms:**
```
Error: relation "video_pipeline_runs" already exists
```

**Solution:**
```bash
# Drop existing tables
supabase db query "DROP TABLE IF EXISTS video_pipeline_runs CASCADE;"

# Re-run migration
supabase db push
```

---

### Issue: n8n Workflow Stuck

**Symptoms:**
- Workflow execution hangs on "Wait for Videos to Complete"

**Solution:**
1. Check Magnific API status
2. Verify `creations_wait` returns valid identifiers
3. Check n8n logs:
   ```bash
   docker logs n8n-container
   ```

---

### Issue: YouTube Upload Failed - Quota Exceeded

**Symptoms:**
```
Error: The request cannot be completed because you have exceeded your quota
```

**Solution:**
- YouTube API has daily quota limit (10,000 units)
- Each upload = ~1,600 units
- **Max ~6 videos per day**
- Apply for quota increase: https://support.google.com/youtube/contact/yt_api_form

---

## Monitoring & Maintenance

### Daily Checks

```bash
# Check pipeline runs today
supabase db query "
  SELECT verse, status, created_at
  FROM video_pipeline_runs
  WHERE created_at >= CURRENT_DATE
  ORDER BY created_at DESC;
"

# Check FTP usage
lftp -u "project-yt@project-yt.ruydejesus.com,Tera2Sira!" ftp.ruydejesus.com -e "du -sh; bye"

# Check error log
supabase db query "
  SELECT agent, error_message, created_at
  FROM pipeline_errors
  WHERE created_at >= CURRENT_DATE
  ORDER BY created_at DESC;
"
```

### Weekly Cleanup

```bash
# Delete old temporary files from FTP
lftp -u "project-yt@project-yt.ruydejesus.com,Tera2Sira!" ftp.ruydejesus.com -e "rm -rf temp/*; bye"

# Archive old pipeline runs (>30 days)
supabase db query "
  DELETE FROM video_pipeline_runs
  WHERE created_at < NOW() - INTERVAL '30 days'
  AND status = 'completed';
"
```

---

## Next Steps

1. ✅ Complete infrastructure deployment
2. ✅ Run end-to-end test with Romanos 8:28
3. 🔄 **Resume reliability & autonomy testing**
4. 📊 Implement monitoring dashboard
5. 🎯 Optimize for scale (batch processing)
6. 🚀 Add more verses to queue

---

## Support & Documentation

- **FTP Dashboard:** https://project-yt.ruydejesus.com
- **Supabase Dashboard:** https://supabase.com/dashboard/project/<PROJECT_REF>
- **Vercel Dashboard:** https://vercel.com/dashboard
- **n8n Workflow:** Access via n8n web UI

**Questions?** Review this guide or check the error logs in Supabase.
