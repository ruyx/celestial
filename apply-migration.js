#!/usr/bin/env node

/**
 * SCRIPT DE MIGRACIÓN - Crear tabla published_videos
 *
 * Ejecuta la migración SQL usando el cliente de Supabase JS
 * Puede ser llamado desde n8n o directamente desde el servidor
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://qhlqrflccdgpslozzfyh.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ Error: SUPABASE_SERVICE_ROLE_KEY no configurada');
  console.error('   Configúrala con: export SUPABASE_SERVICE_ROLE_KEY="tu-key"');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

/**
 * Ejecuta el SQL de migración creando la tabla y sus componentes
 */
async function runMigration() {
  console.log('\n🔄 Aplicando migración: create_published_videos_table');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  try {
    // Verificar si la tabla ya existe
    console.log('[1/4] 🔍 Verificando si la tabla ya existe...');
    const { data: existingTable, error: checkError } = await supabase
      .from('published_videos')
      .select('verse')
      .limit(1);

    if (!checkError || checkError.code !== 'PGRST116') {
      console.log('⚠️  La tabla published_videos ya existe');
      console.log('   Saltando migración para evitar errores\n');

      // Mostrar cantidad de registros existentes
      const { count, error: countError } = await supabase
        .from('published_videos')
        .select('*', { count: 'exact', head: true });

      if (!countError) {
        console.log(`   📊 Registros existentes: ${count}`);
      }

      return { success: true, skipped: true, reason: 'Table already exists' };
    }

    console.log('   ✅ Tabla no existe - procediendo con migración\n');

    // Leer archivo SQL de migración
    console.log('[2/4] 📄 Leyendo archivo de migración...');
    const migrationPath = path.join(__dirname, 'supabase', 'migrations', '20260729000001_create_published_videos_table.sql');

    if (!fs.existsSync(migrationPath)) {
      throw new Error(`Archivo de migración no encontrado: ${migrationPath}`);
    }

    const sql = fs.readFileSync(migrationPath, 'utf-8');
    console.log(`   ✅ Migración cargada (${sql.length} caracteres)\n`);

    // IMPORTANTE: El cliente de Supabase JS NO soporta ejecución directa de SQL
    // por seguridad. Necesitamos ejecutarlo vía:
    // 1. Supabase CLI (supabase db push)
    // 2. Supabase UI (SQL Editor)
    // 3. n8n con nodo PostgreSQL
    // 4. psql directo (requiere conectividad)

    console.log('[3/4] ⚠️  Limitación detectada:');
    console.log('   El cliente Supabase JS no soporta ejecución directa de DDL SQL');
    console.log('   por razones de seguridad.\n');

    console.log('[4/4] 💡 Opciones para aplicar la migración:\n');
    console.log('   OPCIÓN A - n8n (recomendado para autonomía):');
    console.log('   1. Crear workflow en n8n con nodo PostgreSQL');
    console.log('   2. Conectar a: postgresql://postgres:PASSWORD@db.qhlqrflccdgpslozzfyh.supabase.co:5432/postgres');
    console.log('   3. Ejecutar el SQL desde: supabase/migrations/20260729000001_create_published_videos_table.sql\n');

    console.log('   OPCIÓN B - Supabase UI:');
    console.log('   1. Ir a: https://supabase.com/dashboard/project/qhlqrflccdgpslozzfyh/editor');
    console.log('   2. Abrir SQL Editor');
    console.log('   3. Pegar y ejecutar el SQL\n');

    console.log('   OPCIÓN C - Supabase CLI (desde el servidor):');
    console.log('   1. ssh al servidor xprinta');
    console.log('   2. cd ~/project-yt');
    console.log('   3. npx supabase db push\n');

    console.log('📋 SQL a ejecutar:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(sql);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    return {
      success: false,
      reason: 'Manual intervention required',
      instructions: 'Use one of the options above to apply the migration',
      sqlPath: migrationPath
    };

  } catch (error) {
    console.error('\n❌ Error ejecutando migración:');
    console.error('   ', error.message);
    console.error('   Stack:', error.stack);
    throw error;
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  runMigration()
    .then(result => {
      if (result.success) {
        console.log('\n✅ Migración completada exitosamente\n');
        process.exit(0);
      } else if (result.skipped) {
        console.log('\n✅ Migración saltada - tabla ya existe\n');
        process.exit(0);
      } else {
        console.log('\n⚠️  Acción manual requerida\n');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('\n❌ Error fatal:', error.message);
      process.exit(1);
    });
}

module.exports = { runMigration };
