import { Router } from 'express'
import * as ctrl from '../controllers/authController.js'
import { authenticate } from '../utils/authMiddleware.js'
import { loginLimiter } from '../utils/rateLimiters.js'

const router = Router()
router.post('/login', loginLimiter, ctrl.login)
router.get('/me', authenticate, ctrl.me)

export default router
