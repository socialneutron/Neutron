/**
 * config/socket.js
 * Socket.IO server initialisation.
 * Attaches to the existing HTTP server and configures CORS + auth middleware.
 */

const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User.model');

// Global map: userId (string) → Set of socket IDs
// Allows a user to have multiple active tabs/devices
const onlineUsers = new Map();

/**
 * Initialise Socket.IO on the given HTTP server.
 * @param {http.Server} httpServer
 * @returns {Server} io
 */
const initSocket = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      credentials: true,
    },
    // Ping clients every 25s; disconnect if no pong in 5s
    pingInterval: 25000,
    pingTimeout: 5000,
  });

  // ── Auth middleware ───────────────────────────────────────────────
  // Every socket must present a valid access token in the handshake
  io.use(async (socket, next) => {
    try {
      // Token can come from auth.token or query.token
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.query?.token;

      if (!token) {
        return next(new Error('Authentication required'));
      }

      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
      const user = await User.findById(decoded.id)
        .select('_id username profilePicture isOnline')
        .lean();

      if (!user) return next(new Error('User not found'));

      socket.user = user;           // Attach user to socket for later use
      socket.userId = user._id.toString();
      next();
    } catch (err) {
      next(new Error('Invalid or expired token'));
    }
  });

  // ── Connection handler ────────────────────────────────────────────
  io.on('connection', (socket) => {
    const userId = socket.userId;
    console.log(`🔌  Socket connected: ${userId} (${socket.id})`);

    // Track this socket in the online map
    if (!onlineUsers.has(userId)) {
      onlineUsers.set(userId, new Set());
    }
    onlineUsers.get(userId).add(socket.id);

    // Mark user online in DB (non-blocking)
    User.findByIdAndUpdate(userId, { isOnline: true, lastSeen: new Date() })
      .exec()
      .catch(() => {});

    // Tell everyone who follows this user that they are online
    socket.broadcast.emit('user:online', { userId });

    // ── Join personal room for targeted notifications ──────────────
    socket.join(`user:${userId}`);

    // ── Register domain socket handlers ───────────────────────────
    require('../sockets/message.socket')(io, socket, onlineUsers);
    require('../sockets/notification.socket')(io, socket);
    require('../sockets/presence.socket')(io, socket, onlineUsers);

    // ── Disconnection ─────────────────────────────────────────────
    socket.on('disconnect', () => {
      const sockets = onlineUsers.get(userId);
      if (sockets) {
        sockets.delete(socket.id);
        if (sockets.size === 0) {
          // No more open connections for this user → mark offline
          onlineUsers.delete(userId);
          User.findByIdAndUpdate(userId, { isOnline: false, lastSeen: new Date() })
            .exec()
            .catch(() => {});
          socket.broadcast.emit('user:offline', { userId });
        }
      }
      console.log(`🔌  Socket disconnected: ${userId} (${socket.id})`);
    });
  });

  return io;
};

/**
 * Emit an event to a specific user (all their active sockets).
 * @param {Server} io
 * @param {string} userId
 * @param {string} event
 * @param {any}    data
 */
const emitToUser = (io, userId, event, data) => {
  io.to(`user:${userId}`).emit(event, data);
};

/**
 * Check if a user is currently online.
 * @param {string} userId
 * @returns {boolean}
 */
const isUserOnline = (userId) => onlineUsers.has(userId.toString());

module.exports = { initSocket, emitToUser, isUserOnline };
