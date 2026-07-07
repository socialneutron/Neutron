import { Pool } from 'pg'
import { config } from '../config'
import { logger } from '../utils/logger'

let pool: Pool | null = null

export function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: config.database.url,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    })

    pool.on('error', (err) => {
      logger.error({ err }, 'Unexpected database pool error')
    })
  }
  return pool
}

export async function query(text: string, params?: any[]) {
  const client = await getPool().connect()
  try {
    const result = await client.query(text, params)
    return result
  } finally {
    client.release()
  }
}

export async function queryOne(text: string, params?: any[]) {
  const result = await query(text, params)
  return result.rows[0] || null
}

export async function queryMany(text: string, params?: any[]) {
  const result = await query(text, params)
  return result.rows
}
