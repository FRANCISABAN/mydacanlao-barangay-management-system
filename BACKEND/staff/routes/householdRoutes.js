import { Router } from 'express'
import * as ctrl from '../controllers/householdController.js'
import { authenticate, authorize, forbid } from '../utils/authMiddleware.js'

const router = Router()
router.use(authenticate)


router.delete('/:id', forbid('Household records cannot be deleted.'))

export default router
