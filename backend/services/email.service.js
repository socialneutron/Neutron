/**
 * services/email.service.js
 * Nodemailer wrapper for transactional emails.
 * Sends: email verification, password reset, welcome.
 */

const nodemailer = require('nodemailer');

// ── Transport ─────────────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  host:   process.env.SMTP_HOST   || 'smtp.gmail.com',
  port:   parseInt(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === 'true', // true = 465, false = STARTTLS
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Verify SMTP connection on startup (non-blocking)
if (process.env.NODE_ENV !== 'test') {
  transporter.verify((err) => {
    if (err) console.warn('⚠️   SMTP connection failed:', err.message);
    else     console.log('✅  SMTP transport ready.');
  });
}

// ── Base send helper ──────────────────────────────────────────────────
const sendMail = async ({ to, subject, html }) => {
  const info = await transporter.sendMail({
    from:    process.env.EMAIL_FROM || '"Neutron" <noreply@neutron.app>',
    to,
    subject,
    html,
  });
  return info;
};

// ── Email templates ───────────────────────────────────────────────────

const baseTemplate = (content) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
           background: #0d1117; color: #e5e7eb; margin: 0; padding: 0; }
    .container { max-width: 500px; margin: 40px auto; background: #161b27;
                 border-radius: 12px; overflow: hidden;
                 border: 1px solid rgba(255,255,255,0.08); }
    .header { background: linear-gradient(135deg, #1e3a8a, #2563eb);
              padding: 28px; text-align: center; }
    .header h1 { margin: 0; color: #fff; font-size: 22px; letter-spacing: 0.05em; }
    .body { padding: 28px; }
    .body p { line-height: 1.7; color: #d1d5db; margin: 0 0 16px; }
    .btn { display: inline-block; margin: 16px 0;
           padding: 13px 28px; background: #2563eb;
           color: #fff !important; border-radius: 8px; text-decoration: none;
           font-weight: 700; font-size: 15px; }
    .footer { padding: 16px 28px; font-size: 12px; color: #6b7280;
              border-top: 1px solid rgba(255,255,255,0.06); text-align: center; }
    .code { background: #0d1117; border: 1px solid rgba(255,255,255,0.1);
            border-radius: 8px; padding: 14px 20px; font-family: monospace;
            font-size: 20px; letter-spacing: 0.2em; text-align: center;
            color: #60a5fa; margin: 16px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header"><h1>⚡ Neutron</h1></div>
    <div class="body">${content}</div>
    <div class="footer">
      This email was sent by Neutron. If you did not request this, ignore it.
    </div>
  </div>
</body>
</html>`;

/**
 * Send email verification link.
 */
const sendVerificationEmail = async (user, verifyUrl) => {
  await sendMail({
    to:      user.email,
    subject: 'Verify your Neutron account',
    html: baseTemplate(`
      <p>Hi <strong>${user.username}</strong>,</p>
      <p>Click the button below to verify your email address.
         This link expires in <strong>24 hours</strong>.</p>
      <a href="${verifyUrl}" class="btn">Verify Email</a>
      <p>Or copy this link:</p>
      <div class="code" style="font-size:12px;letter-spacing:0">${verifyUrl}</div>
    `),
  });
};

/**
 * Send password reset link.
 */
const sendPasswordResetEmail = async (user, resetUrl) => {
  await sendMail({
    to:      user.email,
    subject: 'Reset your Neutron password',
    html: baseTemplate(`
      <p>Hi <strong>${user.username}</strong>,</p>
      <p>We received a request to reset your password.
         Click the button below — this link expires in <strong>1 hour</strong>.</p>
      <a href="${resetUrl}" class="btn">Reset Password</a>
      <p>If you didn't request this, your account is safe — just ignore this email.</p>
    `),
  });
};

/**
 * Send welcome email after successful verification.
 */
const sendWelcomeEmail = async (user) => {
  await sendMail({
    to:      user.email,
    subject: 'Welcome to Neutron!',
    html: baseTemplate(`
      <p>Hi <strong>${user.username}</strong> 👋</p>
      <p>Your email has been verified. You're all set on <strong>Neutron</strong>!</p>
      <p>Start by setting up your profile, following people, and sharing your first post.</p>
      <a href="${process.env.FRONTEND_URL}" class="btn">Open Neutron</a>
    `),
  });
};

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
};
