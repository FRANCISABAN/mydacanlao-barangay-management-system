import * as auth from '../services/authService.js'
import { asyncHandler } from '../utils/asyncHandler.js'

export const login = asyncHandler(async (req, res) => res.json(await auth.login(req.body)))
export const me = asyncHandler(async (req, res) => res.json(await auth.me(req.user.id)))
