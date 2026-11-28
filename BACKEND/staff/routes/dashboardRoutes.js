import { Router } from 'express'
import * as ctrl from '../controllers/dashboardController.js'
import { authenticate, authorize } from '../utils/authMiddleware.js'

const router = Router()


export default router
