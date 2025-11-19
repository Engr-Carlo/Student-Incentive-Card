import pg from 'pg'
import dotenv from 'dotenv'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

dotenv.config()

const { Pool } = pg
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
})

async function runMigration() {
  try {
    console.log('🔄 Running migration to add reset token columns...')
    
    const sql = readFileSync(join(__dirname, 'migrations', 'add_reset_token_columns.sql'), 'utf8')
    
    await pool.query(sql)
    
    console.log('✅ Migration completed successfully!')
    console.log('   - Added reset_token column to students table')
    console.log('   - Added reset_token_created_at column to students table')
    console.log('   - Created index for faster token lookups')
    
    // Verify columns were added
    const result = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'students' 
      AND column_name IN ('reset_token', 'reset_token_created_at')
      ORDER BY column_name
    `)
    
    console.log('\n📋 Verified columns:')
    result.rows.forEach(row => {
      console.log(`   ✓ ${row.column_name}`)
    })
    
  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

runMigration()
