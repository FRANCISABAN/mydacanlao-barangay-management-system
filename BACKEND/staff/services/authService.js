import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { env } from '../config/index.js'
import { labelOf, permsOf } from '../config/roles.js'
import { User } from '../models/index.js'
import { ApiError } from '../utils/ApiError.js'

const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', 10) // keeps timing similar when the username does not exist

const publicUser = (u) => ({
  id: u.id,
  username: u.username,
  name: u.name,
  role: u.role,
  label: labelOf(u.role),
  perms: permsOf(u.role),
})

export async function login({ username, password } = {}) {
  const user = await User.unscoped().findOne({ where: { username: String(username ?? '').trim().toLowerCase() } })
  const ok = await bcrypt.compare(String(password ?? ''), user?.passwordHash ?? DUMMY_HASH)
  if (!user || !user.active || !ok) throw new ApiError('Incorrect username or password.', 401)
  const token = jwt.sign({ sub: user.id, role: user.role }, env.jwtSecret, { expiresIn: env.jwtExpiresIn })
  return { token, user: publicUser(user) }
}

export async function me(userId) {
  const user = await User.findByPk(userId)
  if (!user || !user.active) throw new ApiError('Your session has expired. Please log in again.', 401)
  return publicUser(user)
}
