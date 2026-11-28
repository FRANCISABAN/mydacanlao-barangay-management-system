import multer from 'multer'
import { ApiError } from './ApiError.js'

export const notFound = (req, res, next) => next(new ApiError('Endpoint not found.', 404))

// Every error leaves as { message, fields? } so the frontend ApiError can read it directly.
export function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err)
  if (err instanceof ApiError) {
    return res.status(err.status).json({ message: err.message, ...(err.fields && { fields: err.fields }), ...err.extra })
  }
  if (err instanceof multer.MulterError) {
    const message = err.code === 'LIMIT_FILE_SIZE' ? 'Masyadong malaki ang file. Hanggang 5 MB lamang.' : 'Hindi matanggap ang mga na-upload na file.'
    return res.status(422).json({ message })
  }
  if (err.type === 'entity.parse.failed') return res.status(400).json({ message: 'The request body is not valid JSON.' })
  if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
    return res.status(422).json({ message: 'Some values are not valid.' })
  }
  if (err.name === 'SequelizeForeignKeyConstraintError') {
    return res.status(409).json({ message: 'A record this one depends on no longer exists. Reload the page and try again.' })
  }
  if (/^Sequelize(Connection|ConnectionRefused|HostNotFound|AccessDenied)/.test(err.name)) {
    console.error(err.message)
    return res.status(503).json({ message: 'Cannot reach the database. Make sure MySQL is running in XAMPP.' })
  }
  console.error(err)
  res.status(500).json({ message: 'Something went wrong on the server. Try again in a moment.' })
}
