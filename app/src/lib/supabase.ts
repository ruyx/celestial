/**
 * Supabase Client Configuration - Retea Project
 *
 * IMPORTANTE: Este cliente está configurado SOLO para el proyecto Retea.
 * Las credenciales están aisladas en .env.local (no globales).
 *
 * Uso:
 * - Cliente: import { supabase } from '$lib/supabase'
 * - Server: import { supabaseAdmin } from '$lib/supabase' (con service role)
 */

import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
import { SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private';

/**
 * Cliente de Supabase para uso en cliente (browser)
 *
 * - Usa anon key (PUBLIC_SUPABASE_ANON_KEY)
 * - Protegido por Row Level Security (RLS)
 * - Seguro para exponer en frontend
 *
 * Ejemplo:
 * ```ts
 * import { supabase } from '$lib/supabase';
 *
 * const { data, error } = await supabase
 *   .from('campaigns')
 *   .select('*')
 *   .eq('status', 'active');
 * ```
 */
export const supabase = createClient(
  PUBLIC_SUPABASE_URL,
  PUBLIC_SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  }
);

/**
 * Cliente Admin de Supabase para uso en server-side SOLAMENTE
 *
 * ⚠️ ADVERTENCIA:
 * - Usa service role key (SUPABASE_SERVICE_ROLE_KEY)
 * - BYPASS Row Level Security (RLS)
 * - NUNCA usar en cliente (solo en +page.server.ts, +server.ts, hooks)
 * - Acceso completo a la base de datos
 *
 * Uso apropiado:
 * - Operaciones administrativas
 * - Migraciones de datos
 * - Operaciones que requieren bypass RLS
 * - Server actions que necesitan permisos elevados
 *
 * Ejemplo:
 * ```ts
 * // En +page.server.ts o +server.ts SOLAMENTE
 * import { supabaseAdmin } from '$lib/supabase';
 *
 * export async function load() {
 *   const { data } = await supabaseAdmin
 *     .from('campaigns')
 *     .select('*'); // Bypass RLS
 *
 *   return { campaigns: data };
 * }
 * ```
 */
export const supabaseAdmin = createClient(
  PUBLIC_SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  }
);

/**
 * Tipos de la base de datos (auto-generados)
 *
 * Generar con:
 * ```bash
 * npx supabase gen types typescript --project-id boffacmghclyirjcopzq > src/lib/database.types.ts
 * ```
 */
export type Database = {
  public: {
    Tables: {
      // Se generarán automáticamente
    };
  };
};
