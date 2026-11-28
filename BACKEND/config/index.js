import 'dotenv/config'
import path from 'node:path'

const isProd = process.env.NODE_ENV === 'production'
if (isProd && !process.env.JWT_SECRET) throw new Error('JWT_SECRET is required in production.')

if (!/^[A-Za-z0-9_]+$/.test(process.env.DB_NAME || 'mydacanlao')) throw new Error('DB_NAME may only contain letters, numbers, and underscores.')

export const env = {
  isProd,
  port: Number(process.env.PORT) || 5000,
  db: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD ?? '',
    name: process.env.DB_NAME || 'mydacanlao',
  },
  jwtSecret: process.env.JWT_SECRET || 'dev-only-secret-change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '8h',
  clientOrigins: (process.env.CLIENT_ORIGIN || 'http://localhost:5173').split(',').map((s) => s.trim()),
  uploadDir: path.resolve(process.env.UPLOAD_DIR || 'uploads'),
  // Emails to residents, sent through a Gmail account (SMTP). Without SMTP_USER/SMTP_PASS the system works as before and just skips the emails.
  email: {
    user: (process.env.SMTP_USER || '').trim(),
    // Gmail App password. Google shows it with spaces, so spaces are removed.
    pass: (process.env.SMTP_PASS || '').replace(/\s+/g, ''),
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    // Ports to try, in order. 465 is SSL, 587 is STARTTLS. If one is blocked by the network, the next is used.
    ports: (process.env.SMTP_PORT || '465,587').split(',').map((x) => Number(x.trim())).filter(Boolean),
    // Test mode: when set, EVERY email goes to this one address instead of the resident.
    redirectTo: (process.env.EMAIL_REDIRECT_TO || '').trim(),
  },
  seed: {
    username: process.env.SEED_USERNAME || 'secretary',
    password: process.env.SEED_PASSWORD || 'ChangeMe123!',
    name: 'Maria L. Santos',
  },
  // Barangay Health Worker account (2.3.2). Created by `npm run seed` or `npm run add-bhw`.
  seedBhw: {
    username: (process.env.SEED_BHW_USERNAME || 'bhw').trim().toLowerCase(),
    password: process.env.SEED_BHW_PASSWORD || 'ChangeMe123!',
    name: 'Juana R. Cruz',
  },
}
