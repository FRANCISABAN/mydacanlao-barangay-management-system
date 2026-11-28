import { Router } from 'express'
import * as ctrl from '../controllers/residentController.js'
import { authenticate, authorize, forbid } from '../utils/authMiddleware.js'

const router = Router()
router.use(authenticate)

// Each route names the permission it needs (config/roles.js). The Secretary only has resident:view,
// so every write below answers 403 for the Secretary (1.4.2). The BHW can do all of them (2.3.2).

router.delete('/:id', forbid('Resident records cannot be deleted.'))

export default router
