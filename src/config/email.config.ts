import { registerAs } from '@nestjs/config';

export default registerAs('email', () => ({
  // Email Provider Configuration
  provider: process.env.EMAIL_PROVIDER || 'smtp', // 'smtp' | 'sendgrid' | 'mailgun'

  // SMTP Configuration (Gmail, Outlook, etc.)
  smtp: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT, 10) || 587,
    secure: process.env.SMTP_SECURE === 'true' || false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || '', // App password for Gmail
    },
  },

  // SendGrid Configuration
  sendgrid: {
    apiKey: process.env.SENDGRID_API_KEY || '',
  },

  // Default sender information
  from: {
    name: process.env.EMAIL_FROM_NAME || 'Xynexa',
    address: process.env.EMAIL_FROM_ADDRESS || 'noreply@xynexa.com',
  },

  // OTP Configuration
  otp: {
    length: parseInt(process.env.OTP_LENGTH, 10) || 6,
    expiryMinutes: parseInt(process.env.OTP_EXPIRY_MINUTES, 10) || 10,
    maxAttempts: parseInt(process.env.OTP_MAX_ATTEMPTS, 10) || 5,
  },

  // Template Configuration
  templates: {
    path: process.env.EMAIL_TEMPLATES_PATH || './src/modules/email/templates',
  },
}));
