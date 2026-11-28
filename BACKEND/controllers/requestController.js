import * as svc from '../services/requestService.js'
import { asyncHandler } from '../utils/asyncHandler.js'

export const list = asyncHandler(async (req, res) => res.json(await svc.listRequests(req.query)))
export const get = asyncHandler(async (req, res) => res.json(await svc.getRequest({ id: req.params.id })))

export const updateStatus = asyncHandler(async (req, res) =>
  res.json(await svc.updateRequestStatus({ id: req.params.id, status: req.body.status, remark: req.body.remark }, req.user)))

export const addRemark = asyncHandler(async (req, res) =>
  res.status(201).json(await svc.addRemark({ id: req.params.id, text: req.body.text }, req.user)))

export const validateRequirement = asyncHandler(async (req, res) =>
  res.json(await svc.validateRequirement({ id: req.params.id, name: req.params.name, status: req.body.status, remarks: req.body.remarks }, req.user)))

// 1.2.2 Streams an uploaded document to a logged-in Secretary only.
export const file = asyncHandler(async (req, res) => {
  const f = await svc.getRequirementFile(req.params)
  res.set({
    'Content-Type': f.mimeType,
    'Content-Disposition': `inline; filename*=UTF-8''${encodeURIComponent(f.name)}`,
    'X-Content-Type-Options': 'nosniff',
    'Cache-Control': 'private, no-store',
  })
  res.sendFile(f.path)
})

// Public: resident submits a request.
export const submit = asyncHandler(async (req, res) => res.status(201).json(await svc.submitRequest(req.body, req.files)))
