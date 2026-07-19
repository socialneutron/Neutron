import fs from 'fs'
import path from 'path'
import { Pool } from 'pg'
import dotenv from 'dotenv'

dotenv.config({ path: path.resolve(__dirname, '../../.env') })

async function migrate() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  const migrationsDir = path.resolve(__dirname, 'migrations')
  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort()

  console.log('Running migrations...')
  try {
    for (const file of files) {
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8')
      console.log(`Running migration: ${file}`)
      await pool.query(sql)
    }
    console.log('✅ Migrations completed successfully')
  } catch (err) {
    console.error('❌ Migration failed:', err)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

migrate()
