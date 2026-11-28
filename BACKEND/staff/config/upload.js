import fs from 'node:fs'
import { randomUUID } from 'node:crypto'
import multer from 'multer'
import { env } from './index.js'
import { ApiError } from '../utils/ApiError.js'

export const ALLOWED_TYPES = { 'image/jpeg': '.jpg', 'image/png': '.png', 'application/pdf': '.pdf' }
export const MAX_FILE_BYTES = 5 * 1024 * 1024

fs.mkdirSync(env.uploadDir, { recursive: true })

// Files are stored outside any public folder with a random name. They are only served
// through the authenticated endpoint (1.2.2).
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, env.uploadDir),
  filename: (req, file, cb) => cb(null, `${randomUUID()}${ALLOWED_TYPES[file.mimetype]}`),
})

export const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_BYTES, files: 10, fields: 30 },
  fileFilter: (req, file, cb) =>
    ALLOWED_TYPES[file.mimetype] ? cb(null, true) : cb(new ApiError('JPG, PNG, o PDF lamang ang tinatanggap na file.', 422)),
})
