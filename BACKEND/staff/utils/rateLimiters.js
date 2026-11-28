import rateLimit from 'express-rate-limit'

const make = (windowMs, limit, message) =>
  rateLimit({ windowMs, limit, standardHeaders: true, legacyHeaders: false, message: { message } })

export const loginLimiter = make(15 * 60 * 1000, 10, 'Too many login attempts. Try again in a few minutes.')
export const submitLimiter = make(60 * 60 * 1000, 20, 'Masyadong maraming request. Subukan muli mamaya.')
