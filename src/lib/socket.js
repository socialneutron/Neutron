import { io } from 'socket.io-client'

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000'

let socket = null

export function getSocket() {
  if (socket?.connected) return socket
  return null
}

export function connectSocket(userId) {
  if (socket?.connected) return socket

  socket = io(SOCKET_URL, {
    auth: { token: getAccessToken() },
    withCredentials: true,
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
  })

  socket.on('connect', () => {
    console.log('[Socket] Connected:', socket.id)
  })

  socket.on('disconnect', (reason) => {
    console.log('[Socket] Disconnected:', reason)
  })

  socket.on('connect_error', (err) => {
    console.warn('[Socket] Connection error:', err.message)
  })

  return socket
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}

export function emitSocket(event, data) {
  const s = getSocket()
  if (s) s.emit(event, data)
}

export function onSocket(event, callback) {
  const s = getSocket()
  if (s) s.on(event, callback)
  return () => { s?.off(event, callback) }
}

function getAccessToken() {
  const match = document.cookie.match(/accessToken=([^;]+)/)
  return match ? match[1] : null
}
