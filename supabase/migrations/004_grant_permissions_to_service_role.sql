-- ============================================================================
-- OTORGAR PERMISOS A SERVICE_ROLE
-- ============================================================================
-- Fecha: 2026-07-24
-- Propósito: Permitir que service_role acceda a las tablas de agentes
-- ============================================================================

-- Permisos completos para agent_decisions
GRANT ALL ON TABLE agent_decisions TO service_role;
GRANT USAGE, SELECT ON SEQUENCE agent_decisions_id_seq TO service_role;

-- Permisos completos para analytics_feedback
GRANT ALL ON TABLE analytics_feedback TO service_role;
GRANT USAGE, SELECT ON SEQUENCE analytics_feedback_id_seq TO service_role;

-- Permisos completos para generated_scripts
GRANT ALL ON TABLE generated_scripts TO service_role;
GRANT USAGE, SELECT ON SEQUENCE generated_scripts_id_seq TO service_role;

-- ============================================================================
-- FUNCIONES (también necesitan permisos)
-- ============================================================================

GRANT EXECUTE ON FUNCTION get_latest_agent_decision() TO service_role;
GRANT EXECUTE ON FUNCTION get_latest_analytics_feedback() TO service_role;
GRANT EXECUTE ON FUNCTION get_scripts_by_verse(TEXT) TO service_role;

-- ============================================================================
-- FIN DE LA MIGRACIÓN
-- ============================================================================
