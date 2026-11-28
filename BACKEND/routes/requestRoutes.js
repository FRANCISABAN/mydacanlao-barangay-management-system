import { Router } from 'express'
import * as ctrl from '../controllers/requestController.js'
import { upload } from '../config/upload.js'
import { authenticate, authorize } from '../utils/authMiddleware.js'
import { submitLimiter } from '../utils/rateLimiters.js'

const router = Router()

// Public: resident submits a request (multipart form with the uploaded requirements)
router.post('/', submitLimiter, upload.any(), ctrl.submit)

// Everything below needs a logged-in Secretary (1.4.2)
router.use(authenticate)
router.get('/', authorize('cert:view'), ctrl.list) // 1.1.1 / 1.1.2
router.get('/:id', authorize('cert:view'), ctrl.get) // 1.1.1 / 1.2.1
router.get('/:id/requirements/:name/file', authorize('cert:view'), ctrl.file) // 1.2.2
router.patch('/:id/status', authorize('cert:manage'), ctrl.updateStatus) // 1.1.3 / 1.2.4
router.post('/:id/remarks', authorize('cert:manage'), ctrl.addRemark) // 1.1.4
router.put('/:id/requirements/:name/validation', authorize('cert:manage'), ctrl.validateRequirement) // 1.2.3

export default router
