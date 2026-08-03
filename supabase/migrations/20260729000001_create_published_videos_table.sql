-- ============================================================================
-- Tabla para tracking de videos publicados (evitar duplicados)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.published_videos (
  id SERIAL PRIMARY KEY,
  verse TEXT UNIQUE NOT NULL,
  youtube_id TEXT,
  youtube_url TEXT,
  published_at TIMESTAMP DEFAULT NOW(),
  video_metadata_path TEXT,
  image_metadata_path TEXT,
  status TEXT DEFAULT 'published' CHECK (status IN ('published', 'failed', 'processing', 'deleted')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_published_videos_verse ON public.published_videos(verse);
CREATE INDEX IF NOT EXISTS idx_published_videos_status ON public.published_videos(status);
CREATE INDEX IF NOT EXISTS idx_published_videos_published_at ON public.published_videos(published_at DESC);

-- RLS (Row Level Security) - permitir lectura pública, escritura solo con service_role
ALTER TABLE public.published_videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access"
  ON public.published_videos
  FOR SELECT
  USING (true);

CREATE POLICY "Allow service_role full access"
  ON public.published_videos
  FOR ALL
  USING (auth.role() = 'service_role');

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_published_videos_updated_at
  BEFORE UPDATE ON public.published_videos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comentarios
COMMENT ON TABLE public.published_videos IS 'Tracking de videos publicados en YouTube para evitar duplicados';
COMMENT ON COLUMN public.published_videos.verse IS 'Versículo bíblico (ej: "Salmos 23:1")';
COMMENT ON COLUMN public.published_videos.status IS 'Estado: published, failed, processing, deleted';
