import { Server as HttpServer } from 'http'
import { WebSocketServer, WebSocket } from 'ws'
import jwt from 'jsonwebtoken'
import { config } from '../config'
import { logger } from '../utils/logger'
import type { JwtPayload } from '../types'

interface AuthenticatedSocket extends WebSocket {
  userId?: string
  username?: string
  isAlive?: boolean
}

const connections = new Map<string, Set<AuthenticatedSocket>>()

export function setupWebSocketServer(server: HttpServer) {
  const wss = new WebSocketServer({ server, path: '/ws' })

  wss.on('connection', (ws: AuthenticatedSocket, req) => {
    ws.isAlive = true

    const url = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`)
    const token = url.searchParams.get('token')

    if (!token) {
      ws.close(4001, 'Authentication required')
      return
    }

    try {
      const decoded = jwt.verify(token, config.jwt.accessSecret) as JwtPayload
      ws.userId = decoded.sub
      ws.username = decoded.username

      if (!connections.has(ws.userId)) {
        connections.set(ws.userId, new Set())
      }
      connections.get(ws.userId)!.add(ws)

      logger.info({ userId: ws.userId }, 'WebSocket client connected')
    } catch {
      ws.close(4001, 'Invalid token')
      return
    }

    ws.on('pong', () => { ws.isAlive = true })

    ws.on('message', (data) => {
      try {
        const parsed = JSON.parse(data.toString())
        handleMessage(ws, parsed)
      } catch {
        ws.send(JSON.stringify({ event: 'error', message: 'Invalid JSON' }))
      }
    })

    ws.on('close', () => {
      if (ws.userId && connections.has(ws.userId)) {
        connections.get(ws.userId)!.delete(ws)
        if (connections.get(ws.userId)!.size === 0) {
          connections.delete(ws.userId)
        }
      }
      logger.info({ userId: ws.userId }, 'WebSocket client disconnected')
    })

    ws.send(JSON.stringify({ event: 'connected', userId: ws.userId }))
  })

  const interval = setInterval(() => {
    wss.clients.forEach((ws: any) => {
      if (ws.isAlive === false) return ws.terminate()
      ws.isAlive = false
      ws.ping()
    })
  }, 30000)

  wss.on('close', () => clearInterval(interval))

  logger.info('WebSocket server initialized on /ws')
  return wss
}

function handleMessage(ws: AuthenticatedSocket, data: any) {
  switch (data.event) {
    case 'typing':
    case 'stop_typing':
      broadcastToConversation(data.conversation_id, ws.userId!, {
        event: data.event,
        conversation_id: data.conversation_id,
        user_id: ws.userId,
        username: ws.username,
      })
      break

    case 'ping':
      ws.send(JSON.stringify({ event: 'pong' }))
      break

    default:
      ws.send(JSON.stringify({ event: 'error', message: `Unknown event: ${data.event}` }))
  }
}

export function broadcastToConversation(
  conversationId: string,
  senderId: string,
  data: any,
  excludeSender = true,
) {
  const message = JSON.stringify(data)

  connections.forEach((sockets, userId) => {
    if (excludeSender && userId === senderId) return
    for (const ws of sockets) {
      if (ws.readyState === WebSocket.OPEN) {
        try { ws.send(message) } catch { /* skip dead socket */ }
      }
    }
  })
}

export function broadcastToUsers(userIds: string[], data: any) {
  const message = JSON.stringify(data)
  for (const uid of userIds) {
    const sockets = connections.get(uid)
    if (!sockets) continue
    for (const ws of sockets) {
      if (ws.readyState === WebSocket.OPEN) {
        try { ws.send(message) } catch { /* skip dead socket */ }
      }
    }
  }
}

export function isUserOnline(userId: string): boolean {
  const sockets = connections.get(userId)
  return !!sockets && sockets.size > 0
}
