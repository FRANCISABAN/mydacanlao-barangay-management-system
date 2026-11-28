import * as svc from '../services/residentService.js'
import { asyncHandler } from '../utils/asyncHandler.js'

export const list = asyncHandler(async (req, res) => res.json(await svc.listResidents(req.query)))
export const get = asyncHandler(async (req, res) => res.json(await svc.getResident({ id: req.params.id })))
