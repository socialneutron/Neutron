import http from 'http'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import cookieParser from 'cookie-parser'
import { config } from './config'
import { logger } from './utils/logger'
import { generalLimiter } from './middleware/rateLimiter'
import { errorHandler, notFoundHandler } from './middleware/errorHandler'
import { setupWebSocketServer } from './services/websocketService'
import authRoutes from './routes/auth'
import userRoutes from './routes/user'
import conversationRoutes from './routes/conversation'
import messageRoutes from './routes/message'
import exploreRoutes from './routes/explore'

const app = express()

// ── Security headers ──────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
      connectSrc: ["'self'", config.frontendUrl],
      fontSrc: ["'self'", 'https:', 'data:'],
    },
  },
}))

// ── CORS ──────────────────────────────────────────────
app.use(cors({
  origin: config.frontendUrl,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}))

// ── Body parsing ──────────────────────────────────────
app.use(express.json({ limit: '10kb' }))
app.use(express.urlencoded({ extended: true, limit: '10kb' }))
app.use(cookieParser())

// ── Request logging ───────────────────────────────────
app.use((req, _res, next) => {
  logger.info({ method: req.method, url: req.url, ip: req.ip }, 'Request')
  next()
})

// ── Rate limiting ─────────────────────────────────────
app.use(generalLimiter)

// ── Routes ────────────────────────────────────────────
app.use('/api/auth', authRoutes)
app.use('/api/user', userRoutes)
app.use('/api/conversations', conversationRoutes)
app.use('/api/messages', messageRoutes)
app.use('/api/explore', exploreRoutes)

// ── Health check ──────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ success: true, data: { status: 'ok', timestamp: new Date().toISOString() } })
})

// ── Error handling ────────────────────────────────────
app.use(notFoundHandler)
app.use(errorHandler)

// ── Create HTTP server and attach WebSocket ───────────
const server = http.createServer(app)
setupWebSocketServer(server)

// ── Start server ──────────────────────────────────────
server.listen(config.port, () => {
  logger.info({ port: config.port, env: config.env }, `🚀 Server running on port ${config.port} (HTTP + WebSocket)`)
})

export default app
