-- Otorgar todos los permisos a service_role en published_videos
-- Necesario para que el Guardian de deduplicación y el upload script
-- puedan consultar e insertar registros de videos publicados

-- El service_role necesita estos permisos porque:
-- 1. Guardian: debe consultar (SELECT) si un versículo ya fue publicado
-- 2. Upload Script: debe insertar (INSERT) el registro después de subir a YouTube

GRANT ALL PRIVILEGES ON TABLE public.published_videos TO service_role;

-- Verificar permisos
SELECT grantee, privilege_type
FROM information_schema.table_privileges
WHERE table_name = 'published_videos'
  AND grantee = 'service_role'
ORDER BY privilege_type;
