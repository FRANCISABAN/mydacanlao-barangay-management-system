import { Router } from 'express'
import authRoutes from './authRoutes.js'
import dashboardRoutes, { bhwRouter } from './dashboardRoutes.js'
import requestRoutes from './requestRoutes.js'
import residentRoutes from './residentRoutes.js'
import householdRoutes from './householdRoutes.js'

const router = Router()
router.use('/auth', authRoutes)
router.use('/secretary', dashboardRoutes)
router.use('/bhw', bhwRouter)
router.use('/certification-requests', requestRoutes)
router.use('/residents', residentRoutes)
router.use('/households', householdRoutes)

export default router
