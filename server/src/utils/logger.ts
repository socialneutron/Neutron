import pino from 'pino'

export const logger = pino({
  transport: process.env.NODE_ENV !== 'production'
    ? { target: 'pino-pretty', options: { colorize: true } }
    : undefined,
  level: process.env.LOG_LEVEL || 'info',
  redact: {
    paths: ['req.headers.authorization', 'req.body.password', 'req.body.confirmPassword'],
    censor: '[REDACTED]',
  },
})
