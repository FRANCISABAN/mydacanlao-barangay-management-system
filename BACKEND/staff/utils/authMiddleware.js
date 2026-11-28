import jwt from 'jsonwebtoken'
import { env } from '../config/index.js'
import { permsOf } from '../config/roles.js'
import { User } from '../models/index.js'
import { ApiError } from './ApiError.js'
import { asyncHandler } from './asyncHandler.js'

// Reads "Authorization: Bearer <token>" and attaches req.user.
export const authenticate = asyncHandler(async (req, res, next) => {
  const [scheme, token] = (req.headers.authorization || '').split(' ')
  if (scheme !== 'Bearer' || !token) throw new ApiError('Please log in to continue.', 401)

  let payload
  try {
    payload = jwt.verify(token, env.jwtSecret)
  } catch {
    throw new ApiError('Your session has expired. Please log in again.', 401)
  }

  const user = await User.findByPk(payload.sub)
  if (!user || !user.active) throw new ApiError('Your session has expired. Please log in again.', 401)
  req.user = { id: user.id, name: user.name, role: user.role, perms: permsOf(user.role) }
  next()
})

// 1.4.2 Permission check, same permission names the frontend uses.
export const authorize = (perm) => (req, res, next) => {
  if (!req.user?.perms.includes(perm)) {
    return next(new ApiError('Your account does not have permission to do this.', 403))
  }
  next()
}

// Used to block operations the Secretary is not allowed to do (writes on residents, create/delete on households).
export const forbid = (message) => (req, res, next) => next(new ApiError(message, 403))
