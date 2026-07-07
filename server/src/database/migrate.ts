import fs from 'fs'
import path from 'path'
import { Pool } from 'pg'
import dotenv from 'dotenv'

dotenv.config({ path: path.resolve(__dirname, '../../.env') })

async function migrate() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  const sqlPath = path.resolve(__dirname, 'migrations/001_initial.sql')
  const sql = fs.readFileSync(sqlPath, 'utf8')

  console.log('Running migrations...')
  try {
    await pool.query(sql)
    console.log('✅ Migrations completed successfully')
  } catch (err) {
    console.error('❌ Migration failed:', err)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

migrate()
