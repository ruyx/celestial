-- Migration: Video Pipeline Tracking Tables
-- Created: 2026-07-28
-- Purpose: Track autonomous YouTube video generation pipeline

-- ============================================================================
-- 1. video_pipeline_runs - Main tracking table for each video generation run
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.video_pipeline_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identificación del verso
  verse TEXT NOT NULL,
  script_id TEXT,

  -- URLs de assets
  video_url TEXT,
  thumbnail_url TEXT,
  youtube_url TEXT,

  -- Metadata del video
  duration_seconds NUMERIC(10, 2),
  file_size_bytes BIGINT,
  thumbnail_width INTEGER,
  thumbnail_height INTEGER,

  -- Estado del pipeline
  status TEXT NOT NULL DEFAULT 'pending',
  -- Posibles valores: pending, generating_images, generating_audio, generating_videos,
  --                   compiling, uploading_thumbnail, uploading_youtube, completed, failed

  current_agent TEXT,
  -- Agent-1 (script), Agent-2 (images), Agent-3 (audio), Agent-4 (videos),
  -- Agent-7 (compilation), Agent-9 (thumbnail), Agent-10 (youtube)

  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,

  -- Performance metrics
  processing_time_ms BIGINT,

  -- Metadata JSON adicional
  metadata JSONB DEFAULT '{}'::jsonb,

  CONSTRAINT valid_status CHECK (
    status IN (
      'pending', 'generating_images', 'generating_audio', 'generating_videos',
      'compiling', 'uploading_thumbnail', 'uploading_youtube', 'completed', 'failed'
    )
  )
);

-- Índices para video_pipeline_runs
CREATE INDEX idx_pipeline_runs_verse ON public.video_pipeline_runs(verse);
CREATE INDEX idx_pipeline_runs_status ON public.video_pipeline_runs(status);
CREATE INDEX idx_pipeline_runs_created_at ON public.video_pipeline_runs(created_at DESC);
CREATE INDEX idx_pipeline_runs_youtube_url ON public.video_pipeline_runs(youtube_url) WHERE youtube_url IS NOT NULL;

-- ============================================================================
-- 2. video_clips - Tracking individual clips for each video
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.video_clips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relación con pipeline run
  pipeline_run_id UUID NOT NULL REFERENCES public.video_pipeline_runs(id) ON DELETE CASCADE,

  -- Identificación del clip
  clip_index INTEGER NOT NULL,
  clip_id TEXT,

  -- Prompts y configuración
  image_prompt TEXT,
  video_prompt TEXT,
  camera_motion TEXT,
  duration_seconds NUMERIC(10, 2),

  -- Identifiers de Magnific
  image_identifier TEXT,
  video_identifier TEXT,

  -- URLs de assets
  image_url TEXT,
  video_url TEXT,

  -- Estado del clip
  status TEXT NOT NULL DEFAULT 'pending',
  -- Posibles valores: pending, generating_image, image_completed,
  --                   generating_video, video_completed, failed

  error_message TEXT,
  moderation_failures INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  image_completed_at TIMESTAMPTZ,
  video_completed_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,

  -- Metadata JSON adicional
  metadata JSONB DEFAULT '{}'::jsonb,

  CONSTRAINT valid_clip_status CHECK (
    status IN (
      'pending', 'generating_image', 'image_completed',
      'generating_video', 'video_completed', 'failed'
    )
  ),
  CONSTRAINT unique_pipeline_clip UNIQUE (pipeline_run_id, clip_index)
);

-- Índices para video_clips
CREATE INDEX idx_clips_pipeline_run ON public.video_clips(pipeline_run_id);
CREATE INDEX idx_clips_status ON public.video_clips(status);
CREATE INDEX idx_clips_moderation_failures ON public.video_clips(moderation_failures) WHERE moderation_failures > 0;

-- ============================================================================
-- 3. audio_generations - Tracking audio/voiceover generations
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.audio_generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relación con pipeline run
  pipeline_run_id UUID NOT NULL REFERENCES public.video_pipeline_runs(id) ON DELETE CASCADE,

  -- Configuración de audio
  audio_script TEXT NOT NULL,
  model TEXT NOT NULL,
  voice_id INTEGER,
  voice_name TEXT,

  -- Identifiers de Magnific
  audio_identifier TEXT,
  audio_url TEXT,

  -- Estado
  status TEXT NOT NULL DEFAULT 'pending',
  -- Posibles valores: pending, generating, completed, failed

  error_message TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,

  -- Metadata JSON adicional
  metadata JSONB DEFAULT '{}'::jsonb,

  CONSTRAINT valid_audio_status CHECK (
    status IN ('pending', 'generating', 'completed', 'failed')
  )
);

-- Índices para audio_generations
CREATE INDEX idx_audio_pipeline_run ON public.audio_generations(pipeline_run_id);
CREATE INDEX idx_audio_status ON public.audio_generations(status);

-- ============================================================================
-- 4. pipeline_errors - Log detallado de errores para debugging
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.pipeline_errors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relación con pipeline run
  pipeline_run_id UUID NOT NULL REFERENCES public.video_pipeline_runs(id) ON DELETE CASCADE,

  -- Información del error
  agent TEXT NOT NULL,
  error_type TEXT NOT NULL,
  error_message TEXT NOT NULL,
  error_stack TEXT,

  -- Contexto del error
  context JSONB DEFAULT '{}'::jsonb,

  -- Acción tomada
  retry_attempted BOOLEAN DEFAULT FALSE,
  retry_successful BOOLEAN,

  -- Timestamp
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Metadata JSON adicional
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Índices para pipeline_errors
CREATE INDEX idx_errors_pipeline_run ON public.pipeline_errors(pipeline_run_id);
CREATE INDEX idx_errors_agent ON public.pipeline_errors(agent);
CREATE INDEX idx_errors_type ON public.pipeline_errors(error_type);
CREATE INDEX idx_errors_created_at ON public.pipeline_errors(created_at DESC);

-- ============================================================================
-- 5. Funciones helper para actualizar estado del pipeline
-- ============================================================================

-- Función para iniciar un pipeline run
CREATE OR REPLACE FUNCTION start_pipeline_run(run_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.video_pipeline_runs
  SET
    status = 'generating_images',
    started_at = NOW(),
    current_agent = 'Agent-2'
  WHERE id = run_id;
END;
$$ LANGUAGE plpgsql;

-- Función para marcar pipeline como completado
CREATE OR REPLACE FUNCTION complete_pipeline_run(
  run_id UUID,
  p_video_url TEXT,
  p_thumbnail_url TEXT,
  p_youtube_url TEXT,
  p_duration NUMERIC,
  p_file_size BIGINT
)
RETURNS void AS $$
BEGIN
  UPDATE public.video_pipeline_runs
  SET
    status = 'completed',
    video_url = p_video_url,
    thumbnail_url = p_thumbnail_url,
    youtube_url = p_youtube_url,
    duration_seconds = p_duration,
    file_size_bytes = p_file_size,
    completed_at = NOW(),
    processing_time_ms = EXTRACT(EPOCH FROM (NOW() - started_at)) * 1000
  WHERE id = run_id;
END;
$$ LANGUAGE plpgsql;

-- Función para marcar pipeline como fallido
CREATE OR REPLACE FUNCTION fail_pipeline_run(
  run_id UUID,
  p_error_message TEXT,
  p_agent TEXT
)
RETURNS void AS $$
BEGIN
  UPDATE public.video_pipeline_runs
  SET
    status = 'failed',
    error_message = p_error_message,
    current_agent = p_agent,
    failed_at = NOW(),
    retry_count = retry_count + 1
  WHERE id = run_id;

  -- Log error
  INSERT INTO public.pipeline_errors (
    pipeline_run_id,
    agent,
    error_type,
    error_message
  ) VALUES (
    run_id,
    p_agent,
    'pipeline_failure',
    p_error_message
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 6. Row Level Security (RLS) - Opcional, habilitar si es necesario
-- ============================================================================

-- ALTER TABLE public.video_pipeline_runs ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.video_clips ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.audio_generations ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.pipeline_errors ENABLE ROW LEVEL SECURITY;

-- Crear políticas RLS según necesidad de autenticación

-- ============================================================================
-- 7. Comentarios para documentación
-- ============================================================================

COMMENT ON TABLE public.video_pipeline_runs IS 'Main tracking table for autonomous YouTube video generation pipeline';
COMMENT ON TABLE public.video_clips IS 'Individual clips for each video generation run';
COMMENT ON TABLE public.audio_generations IS 'Audio/voiceover generations tracking';
COMMENT ON TABLE public.pipeline_errors IS 'Detailed error log for debugging';

COMMENT ON COLUMN public.video_pipeline_runs.status IS 'Current status: pending, generating_images, generating_audio, generating_videos, compiling, uploading_thumbnail, uploading_youtube, completed, failed';
COMMENT ON COLUMN public.video_pipeline_runs.current_agent IS 'Current agent executing: Agent-1 (script), Agent-2 (images), Agent-3 (audio), Agent-4 (videos), Agent-7 (compilation), Agent-9 (thumbnail), Agent-10 (youtube)';
