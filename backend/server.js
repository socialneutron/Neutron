require('dotenv').config();

const express  = require('express');
const http     = require('http');
const cors     = require('cors');
const helmet   = require('helmet');
const compression = require('compression');
const morgan   = require('morgan');
const cookieParser = require('cookie-parser');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit = require('express-rate-limit');

const { connectDB, closeDB }       = require('./config/db');
const { connectRedis, getRedis }   = require('./config/redis');
const { initSocket }               = require('./config/socket');
require('./config/cloudinary');

const { setIo }                    = require('./services/notification.service');

const authRoutes           = require('./routes/auth');
const usersRoutes          = require('./routes/users');
const postsRoutes          = require('./routes/posts');
const commentsRoutes       = require('./routes/comments');
const messagesRoutes       = require('./routes/messages');
const notificationsRoutes  = require('./routes/notifications');
const searchRoutes         = require('./routes/search');
const feedRoutes           = require('./routes/feed');
const exploreRoutes        = require('./routes/explore');
const eventsRoutes         = require('./routes/events');

const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');

// ── Express app & HTTP server ──────────────────────────────────────
const app  = express();
const server = http.createServer(app);

// ── Middleware ──────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));

app.use(helmet());
app.use(compression());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(mongoSanitize());

app.use(rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
  max:      parseInt(process.env.RATE_LIMIT_MAX, 10)       || 100,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { success: false, message: 'Too many requests, please try again later.' },
}));

// ── Routes ─────────────────────────────────────────────────────────
app.use('/api/auth',           authRoutes);
app.use('/api/users',          usersRoutes);
app.use('/api/posts',          postsRoutes);
app.use('/api/comments',       commentsRoutes);
app.use('/api/messages',       messagesRoutes);
app.use('/api/notifications',  notificationsRoutes);
app.use('/api/search',         searchRoutes);
app.use('/api/feed',           feedRoutes);
app.use('/api/explore',        exploreRoutes);
app.use('/api/events',         eventsRoutes);

// ── Error handling (must be after routes) ──────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

// ── Bootstrap ──────────────────────────────────────────────────────
const PORT = parseInt(process.env.PORT, 10) || 5000;

const start = async () => {
  await connectDB();
  connectRedis();
  const io = initSocket(server);
  setIo(io);

  server.listen(PORT, () => {
    console.log(`🚀  Neutron API running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
  });
};

start();

// ── Graceful shutdown ──────────────────────────────────────────────
const shutdown = async (signal) => {
  console.log(`\n🛑  ${signal} received — shutting down gracefully…`);
  server.close(async () => {
    const redis = getRedis();
    if (redis) {
      await redis.quit();
      console.log('🔌  Redis connection closed.');
    }
    await closeDB();
    process.exit(0);
  });

  // Force exit if graceful shutdown stalls
  setTimeout(() => {
    console.error('⚠️   Forced shutdown after timeout.');
    process.exit(1);
  }, 10000);
};

process.on('SIGINT',  () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
