import * as dashboard from '../services/dashboardService.js'
import { asyncHandler } from '../utils/asyncHandler.js'

export const summary = asyncHandler(async (req, res) => res.json(await dashboard.getSummary()))
