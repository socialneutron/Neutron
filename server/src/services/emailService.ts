import nodemailer from 'nodemailer'
import { config } from '../config'
import { logger } from '../utils/logger'

let transporter: nodemailer.Transporter | null = null

function getTransporter(): nodemailer.Transporter {
  if (!transporter) {
    if (config.smtp.host) {
      transporter = nodemailer.createTransport({
        host: config.smtp.host,
        port: config.smtp.port,
        secure: config.smtp.secure,
        auth: {
          user: config.smtp.user,
          pass: config.smtp.pass,
        },
      })
    } else {
      logger.warn('SMTP not configured. Emails will be logged to console.')
      transporter = {
        sendMail: async (mailOptions: any) => {
          logger.info({ mailOptions }, '📧 Email logged (SMTP not configured)')
          return { messageId: `mock-${Date.now()}` }
        },
      } as any
    }
  }
  return transporter!
}

export async function sendVerificationEmail(email: string, username: string, token: string): Promise<void> {
  const url = `${config.frontendUrl}/verify-email?token=${token}`
  const t = getTransporter()
  await t.sendMail({
    from: config.smtp.from,
    to: email,
    subject: 'Verify your email address',
    html: `
      <h1>Welcome to Neutron, ${username}!</h1>
      <p>Please verify your email address by clicking the link below:</p>
      <a href="${url}" style="display:inline-block;padding:12px 24px;background:#00D2FF;color:#000;text-decoration:none;border-radius:8px;font-weight:700">Verify Email</a>
      <p>This link expires in 24 hours.</p>
      <p>If you didn't create this account, ignore this email.</p>
    `,
  })
  logger.info({ email }, 'Verification email sent')
}

export async function sendPasswordResetEmail(email: string, token: string): Promise<void> {
  const url = `${config.frontendUrl}/reset-password?token=${token}`
  const t = getTransporter()
  await t.sendMail({
    from: config.smtp.from,
    to: email,
    subject: 'Reset your password',
    html: `
      <h1>Password Reset Request</h1>
      <p>Click the link below to reset your password:</p>
      <a href="${url}" style="display:inline-block;padding:12px 24px;background:#00D2FF;color:#000;text-decoration:none;border-radius:8px;font-weight:700">Reset Password</a>
      <p>This link expires in 15 minutes.</p>
      <p>If you didn't request this, ignore this email.</p>
    `,
  })
  logger.info({ email }, 'Password reset email sent')
}

export async function sendWelcomeEmail(email: string, username: string): Promise<void> {
  const t = getTransporter()
  await t.sendMail({
    from: config.smtp.from,
    to: email,
    subject: 'Welcome to Neutron!',
    html: `
      <h1>Welcome to Neutron, ${username}!</h1>
      <p>Your account has been created successfully.</p>
      <p>Start exploring posts, connecting with people, and sharing your content.</p>
    `,
  })
  logger.info({ email }, 'Welcome email sent')
}
