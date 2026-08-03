/**
 * Vercel Edge Function: Thumbnail Generator & FTP Uploader
 *
 * Recibe: { verse: "Romanos 8:28", videoUrl: "https://..." }
 * Proceso:
 *   1. Descarga video desde FTP
 *   2. Extrae frame en segundo 3 (después del hook)
 *   3. Agrega overlay de texto con verso
 *   4. Sube a FTP: project-yt.ruydejesus.com/thumbnails/{verse}.jpg
 *   5. Retorna URL pública
 *
 * Requiere:
 *   - fluent-ffmpeg
 *   - basic-ftp
 *   - canvas (para text overlay)
 */

import { NextRequest, NextResponse } from 'next/server';
import ffmpeg from 'fluent-ffmpeg';
import { Client as FTPClient } from 'basic-ftp';
import { createCanvas, loadImage } from 'canvas';
import { tmpdir } from 'os';
import { join } from 'path';
import { unlink } from 'fs/promises';

interface ThumbnailRequest {
  verse: string;
  videoUrl: string;
  extractTimeSeconds?: number; // Default: 3s (después del hook)
}

interface ThumbnailResponse {
  success: boolean;
  publicUrl?: string;
  ftpPath?: string;
  width?: number;
  height?: number;
  error?: string;
}

export const config = {
  runtime: 'nodejs',
  maxDuration: 120, // 2 minutos timeout
};

export default async function handler(req: NextRequest): Promise<NextResponse> {
  if (req.method !== 'POST') {
    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
  }

  const startTime = Date.now();
  const tmpFiles: string[] = [];

  try {
    const body: ThumbnailRequest = await req.json();
    const { verse, videoUrl, extractTimeSeconds = 3 } = body;

    console.log(`[Thumbnail] Starting generation for ${verse}`);
    console.log(`[Thumbnail] Video URL: ${videoUrl}`);
    console.log(`[Thumbnail] Extract time: ${extractTimeSeconds}s`);

    // 1. Crear directorio temporal
    const tmpDir = join(tmpdir(), `thumbnail-${Date.now()}`);
    const videoPath = join(tmpDir, 'video.mp4');
    const framePath = join(tmpDir, 'frame.jpg');
    const thumbnailPath = join(tmpDir, 'thumbnail.jpg');

    // 2. Descargar video
    console.log('[Thumbnail] Downloading video...');
    await downloadFile(videoUrl, videoPath);
    tmpFiles.push(videoPath);

    // 3. Extraer frame en segundo especificado
    console.log(`[Thumbnail] Extracting frame at ${extractTimeSeconds}s...`);
    await extractFrame(videoPath, framePath, extractTimeSeconds);
    tmpFiles.push(framePath);

    // 4. Agregar texto overlay
    console.log('[Thumbnail] Adding text overlay...');
    await addTextOverlay(framePath, thumbnailPath, verse);
    tmpFiles.push(thumbnailPath);

    // 5. Obtener dimensiones
    const dimensions = await getImageDimensions(thumbnailPath);

    console.log(`[Thumbnail] Generated: ${dimensions.width}x${dimensions.height}`);

    // 6. Subir a FTP
    console.log('[Thumbnail] Uploading to FTP...');
    const ftpPath = `thumbnails/${verse}.jpg`;
    await uploadToFTP(thumbnailPath, ftpPath);

    // 7. Generar URL pública
    const publicUrl = `https://project-yt.ruydejesus.com/${ftpPath}`;

    console.log(`[Thumbnail] Success! Public URL: ${publicUrl}`);
    console.log(`[Thumbnail] Total time: ${((Date.now() - startTime) / 1000).toFixed(2)}s`);

    return NextResponse.json({
      success: true,
      publicUrl,
      ftpPath,
      width: dimensions.width,
      height: dimensions.height,
      processingTime: Date.now() - startTime,
    } as ThumbnailResponse);

  } catch (error: any) {
    console.error('[Thumbnail] Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
    } as ThumbnailResponse, { status: 500 });

  } finally {
    // Cleanup temporal files
    console.log('[Thumbnail] Cleaning up temporary files...');
    for (const file of tmpFiles) {
      try {
        await unlink(file);
      } catch (e) {
        console.warn(`[Thumbnail] Could not delete ${file}`);
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
 * Extrae un frame del video en el segundo especificado
 */
async function extractFrame(
  videoPath: string,
  outputPath: string,
  timeSeconds: number
): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .seekInput(timeSeconds)
      .frames(1)
      .output(outputPath)
      .on('end', () => resolve())
      .on('error', (err) => reject(err))
      .run();
  });
}

/**
 * Agrega texto overlay al thumbnail
 * - Verso en la parte superior con fondo semi-transparente
 * - Estilo YouTube: texto grande, legible, contraste alto
 */
async function addTextOverlay(
  inputPath: string,
  outputPath: string,
  verse: string
): Promise<void> {
  // Cargar imagen original
  const image = await loadImage(inputPath);
  const canvas = createCanvas(image.width, image.height);
  const ctx = canvas.getContext('2d');

  // Dibujar imagen original
  ctx.drawImage(image, 0, 0);

  // Configuración de texto
  const fontSize = Math.floor(image.width / 15); // ~6.67% del ancho
  const padding = Math.floor(image.width / 30); // ~3.33% del ancho

  ctx.font = `bold ${fontSize}px "Arial", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';

  // Medir texto para calcular fondo
  const textMetrics = ctx.measureText(verse);
  const textWidth = textMetrics.width;
  const textHeight = fontSize * 1.5; // Espacio extra para legibilidad

  // Dibujar fondo semi-transparente
  const bgX = (image.width - textWidth) / 2 - padding;
  const bgY = padding;
  const bgWidth = textWidth + padding * 2;
  const bgHeight = textHeight + padding;

  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(bgX, bgY, bgWidth, bgHeight);

  // Dibujar texto blanco con sombra
  ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
  ctx.shadowBlur = 10;
  ctx.shadowOffsetX = 2;
  ctx.shadowOffsetY = 2;
  ctx.fillStyle = '#FFFFFF';
  ctx.fillText(verse, image.width / 2, padding + padding / 2);

  // Guardar imagen final
  const buffer = canvas.toBuffer('image/jpeg', { quality: 0.92 });
  await Bun.write(outputPath, buffer);
}

/**
 * Obtiene dimensiones de la imagen
 */
async function getImageDimensions(imagePath: string): Promise<{ width: number; height: number }> {
  const image = await loadImage(imagePath);
  return {
    width: image.width,
    height: image.height,
  };
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
