/**
 * Vercel Edge Function: Video Compiler & FTP Uploader
 *
 * Recibe: { clips: [{url, duration}], audio: {url}, verse: "Romanos 8:28" }
 * Proceso:
 *   1. Descarga 10 clips + audio desde Magnific CDN
 *   2. Compila video final con ffmpeg
 *   3. Sube a FTP: project-yt.ruydejesus.com/videos/{verse}/final.mp4
 *   4. Retorna URL pública + metadata
 *
 * Requiere:
 *   - @vercel/blob o tmp storage
 *   - fluent-ffmpeg
 *   - basic-ftp
 */

import { NextRequest, NextResponse } from 'next/server';
import ffmpeg from 'fluent-ffmpeg';
import { Client as FTPClient } from 'basic-ftp';
import { createWriteStream } from 'fs';
import { promisify } from 'util';
import { pipeline } from 'stream';
import { tmpdir } from 'os';
import { join } from 'path';
import { unlink, readFile } from 'fs/promises';

const streamPipeline = promisify(pipeline);

interface CompileRequest {
  verse: string;
  clips: Array<{
    url: string;
    duration: number;
    index: number;
  }>;
  audio: {
    url: string;
  };
}

interface CompileResponse {
  success: boolean;
  publicUrl?: string;
  ftpPath?: string;
  duration?: number;
  fileSize?: number;
  error?: string;
}

export const config = {
  runtime: 'nodejs',
  maxDuration: 300, // 5 minutos timeout
};

export default async function handler(req: NextRequest): Promise<NextResponse> {
  if (req.method !== 'POST') {
    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
  }

  const startTime = Date.now();
  const tmpFiles: string[] = [];

  try {
    const body: CompileRequest = await req.json();
    const { verse, clips, audio } = body;

    console.log(`[Compiler] Starting compilation for ${verse}`);
    console.log(`[Compiler] Clips: ${clips.length}, Audio: ${audio.url}`);

    // 1. Crear directorio temporal
    const tmpDir = join(tmpdir(), `compile-${Date.now()}`);
    const videoListPath = join(tmpDir, 'concat-list.txt');
    const outputPath = join(tmpDir, 'final.mp4');

    // 2. Descargar clips
    console.log('[Compiler] Downloading clips...');
    const clipPaths: string[] = [];

    for (const clip of clips.sort((a, b) => a.index - b.index)) {
      const clipPath = join(tmpDir, `clip-${clip.index.toString().padStart(2, '0')}.mp4`);
      await downloadFile(clip.url, clipPath);
      clipPaths.push(clipPath);
      tmpFiles.push(clipPath);
      console.log(`[Compiler] Downloaded clip ${clip.index}`);
    }

    // 3. Descargar audio
    console.log('[Compiler] Downloading audio...');
    const audioPath = join(tmpDir, 'audio.mp3');
    await downloadFile(audio.url, audioPath);
    tmpFiles.push(audioPath);

    // 4. Crear lista de concatenación
    const concatList = clipPaths.map(p => `file '${p}'`).join('\n');
    await Bun.write(videoListPath, concatList);
    tmpFiles.push(videoListPath);

    // 5. Compilar video con ffmpeg
    console.log('[Compiler] Compiling video with ffmpeg...');
    await compileVideo(videoListPath, audioPath, outputPath);
    tmpFiles.push(outputPath);

    // 6. Obtener metadata del video
    const stats = await Bun.file(outputPath).stat();
    const duration = await getVideoDuration(outputPath);

    console.log(`[Compiler] Video compiled: ${(stats.size / 1024 / 1024).toFixed(2)} MB, ${duration.toFixed(2)}s`);

    // 7. Subir a FTP
    console.log('[Compiler] Uploading to FTP...');
    const ftpPath = `videos/${verse}/final.mp4`;
    await uploadToFTP(outputPath, ftpPath);

    // 8. Generar URL pública
    const publicUrl = `https://project-yt.ruydejesus.com/${ftpPath}`;

    console.log(`[Compiler] Success! Public URL: ${publicUrl}`);
    console.log(`[Compiler] Total time: ${((Date.now() - startTime) / 1000).toFixed(2)}s`);

    return NextResponse.json({
      success: true,
      publicUrl,
      ftpPath,
      duration,
      fileSize: stats.size,
      processingTime: Date.now() - startTime,
    } as CompileResponse);

  } catch (error: any) {
    console.error('[Compiler] Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
    } as CompileResponse, { status: 500 });

  } finally {
    // Cleanup temporal files
    console.log('[Compiler] Cleaning up temporary files...');
    for (const file of tmpFiles) {
      try {
        await unlink(file);
      } catch (e) {
        console.warn(`[Compiler] Could not delete ${file}`);
      }
    }
  }
}

/**
 * Descarga un archivo desde URL a path local
 */
async function downloadFile(url: string, destPath: string): Promise<void> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download ${url}: ${response.statusText}`);
  }

  const buffer = await response.arrayBuffer();
  await Bun.write(destPath, buffer);
}

/**
 * Compila video usando ffmpeg
 */
async function compileVideo(
  concatListPath: string,
  audioPath: string,
  outputPath: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg()
      .input(concatListPath)
      .inputOptions(['-f concat', '-safe 0'])
      .input(audioPath)
      .outputOptions([
        '-c:v libx264',
        '-preset medium',
        '-crf 23',
        '-c:a aac',
        '-b:a 192k',
        '-map 0:v:0',
        '-map 1:a:0',
        '-shortest',
      ])
      .output(outputPath)
      .on('end', () => resolve())
      .on('error', (err) => reject(err))
      .run();
  });
}

/**
 * Obtiene duración del video en segundos
 */
async function getVideoDuration(videoPath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(videoPath, (err, metadata) => {
      if (err) return reject(err);
      resolve(metadata.format.duration || 0);
    });
  });
}

/**
 * Sube archivo a FTP
 */
async function uploadToFTP(localPath: string, remotePath: string): Promise<void> {
  const client = new FTPClient();
  client.ftp.verbose = true;

  try {
    await client.access({
      host: 'ftp.ruydejesus.com',
      user: 'project-yt@project-yt.ruydejesus.com',
      password: process.env.FTP_PASSWORD || 'Tera2Sira!',
      secure: false,
    });

    // Crear directorios si no existen
    const remoteDir = remotePath.split('/').slice(0, -1).join('/');
    await client.ensureDir(remoteDir);

    // Subir archivo
    await client.uploadFrom(localPath, remotePath);

    console.log(`[FTP] Uploaded ${localPath} → ${remotePath}`);
  } finally {
    client.close();
  }
}
