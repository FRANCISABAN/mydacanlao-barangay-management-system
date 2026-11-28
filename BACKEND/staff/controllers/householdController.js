import * as svc from '../services/householdService.js'
import { asyncHandler } from '../utils/asyncHandler.js'

export const list = asyncHandler(async (req, res) => res.json(await svc.listHouseholds(req.query)))
export const get = asyncHandler(async (req, res) => res.json(await svc.getHousehold({ id: req.params.id })))
export const members = asyncHandler(async (req, res) => res.json(await svc.listMembers({ id: req.params.id })))
export const update = asyncHandler(async (req, res) => res.json(await svc.updateHousehold({ id: req.params.id, ...req.body }, req.user)))
