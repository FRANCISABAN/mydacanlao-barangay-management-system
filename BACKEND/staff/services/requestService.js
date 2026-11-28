import fs from 'node:fs'
import path from 'node:path'
import { Op } from 'sequelize'
import { sequelize, CertificationRequest, RequestRequirement, RequestRemark, Resident, Household } from '../models/index.js'
import { env } from '../config/index.js'
import {
  CERT_TYPES, CIVIL_MAP, MOBILE_REGEX, PUROKS, REMARK_MAX, REMARK_REQUIRED, REVIEW_RESULTS, STATUS_KEYS, TRANSITIONS,
} from '../config/constants.js'
import { ApiError } from '../utils/ApiError.js'
import { dayEnd, dayStart, fullName, isIsoDate, likePattern, norm } from '../utils/format.js'
import { hasValidSignature, removeFiles } from '../utils/fileCheck.js'
import { nextRequestId } from '../utils/idGenerator.js'
import { notifyStatusChange } from './notificationService.js'

export const brief = (r) => ({
  id: r.id,
  applicantName: r.applicantName,
  type: r.type,
  submittedAt: r.submittedAt,
  status: r.status,
  updatedAt: r.updatedAt,
})

// Certificate of Indigency: kailangang sabihin kung para kanino ito kukunin.
export const BENEFICIARY_RELATIONS = ['Sarili', 'Anak', 'Magulang', 'Asawa', 'Kapatid', 'Iba pa']
const isIndigency = (type) => /indigency/i.test(String(type ?? ''))

const fileUrl = (id, name) => `/api/certification-requests/${id}/requirements/${encodeURIComponent(name)}/file`

/* ---------- 1.1.1 / 1.1.2 List, search, filter ---------- */
export async function listRequests({ q, status, type, from, to } = {}) {
  const where = {}
  const rows = await CertificationRequest.findAll({ where, order: [['submittedAt', 'DESC']] })
  return rows.map(brief)
}

/* ---------- 1.1.1 / 1.2.1 / 1.2.2 Details ---------- */
// Compares what the applicant typed against the resident record, so the Secretary can see gaps quickly.
function findDiscrepancies(submitted, record) {
  if (!record) return []
  const out = []
  for (const field of ['birthDate', 'civilStatus', 'address', 'contact']) {
    const typed = norm(submitted[field])
    if (!typed) out.push({ field, issue: 'missing' })
    else if (typed !== norm(record[field])) out.push({ field, issue: 'mismatch' })
  }
  return out
}

export async function getRequest({ id }) {
  const r = await CertificationRequest.findByPk(id, {
    include: [{ model: RequestRequirement, as: 'requirements' }, { model: RequestRemark, as: 'remarks' }],
    order: [
      [{ model: RequestRequirement, as: 'requirements' }, 'id', 'ASC'],
      [{ model: RequestRemark, as: 'remarks' }, 'at', 'ASC'],
      [{ model: RequestRemark, as: 'remarks' }, 'id', 'ASC'],
    ],
  })
  if (!r) throw new ApiError('Request not found.', 404)

  const resident = r.residentId ? await Resident.findByPk(r.residentId, { raw: true }) : null
  const hh = resident ? await Household.findByPk(resident.householdId, { raw: true }) : null
  const record = resident
    ? { fullName: fullName(resident), birthDate: resident.birthDate, civilStatus: resident.civilStatus, address: hh?.address, contact: resident.contact }
    : null

  const submitted = { fullName: r.applicantName, birthDate: r.birthDate, civilStatus: r.civilStatus, address: r.address, contact: r.contact, email: r.email }

  const requirements = r.requirements.map((q) => ({
    name: q.name,
    file: q.fileOriginalName
      ? { name: q.fileOriginalName, size: q.fileSize, type: q.fileMimeType, uploadedAt: q.fileUploadedAt, url: q.fileStoredName ? fileUrl(r.id, q.name) : null }
      : null,
    validation: { status: q.validationStatus, remarks: q.validationRemarks, validatedAt: q.validatedAt, validatedBy: q.validatedBy },
  }))

  // 1.2.2 / 1.2.4 Which required documents are missing, and which failed review.
  const missing = requirements.filter((q) => !q.file).map((q) => q.name)
  const flagged = requirements.filter((q) => ['invalid', 'resubmit'].includes(q.validation.status)).map((q) => q.name)
  const allValid = requirements.every((q) => q.validation.status === 'valid')

  return {
    id: r.id,
    type: r.type,
    status: r.status,
    purpose: r.purpose,
    submittedAt: r.submittedAt,
    updatedAt: r.updatedAt,
    reviewedBy: r.reviewedBy,
    residentId: r.residentId,
    householdId: resident?.householdId ?? null,
    submitted,
    extra: { voter: r.voter, boarder: r.boarder, civilLabel: r.civilLabel },
    // Para kanino ang certificate (Certificate of Indigency lang). null para sa ibang uri.
    beneficiary: r.beneficiaryRelation
      ? {
          relation: r.beneficiaryRelation,
          isSelf: r.beneficiaryRelation === 'Sarili',
          name: r.beneficiaryRelation === 'Sarili' ? r.applicantName : r.beneficiaryName,
        }
      : null,
    record,
    discrepancies: findDiscrepancies(submitted, record),
    requirements,
    summary: { required: requirements.length, uploaded: requirements.length - missing.length, missing, flagged, allValid, incomplete: missing.length > 0 || flagged.length > 0 },
    remarks: r.remarks.map((m) => ({ id: String(m.id), text: m.text, author: m.author, at: m.at })),
  }
}

/* ---------- 1.2.2 Secure access to an uploaded document ---------- */
export async function getRequirementFile({ id, name }) {
  const q = await RequestRequirement.findOne({ where: { requestId: id, name } })
  if (!q) throw new ApiError('Requirement not found.', 404)
  if (!q.fileStoredName) throw new ApiError('This file is not available.', 404)

  const full = path.resolve(env.uploadDir, q.fileStoredName)
  if (!full.startsWith(env.uploadDir + path.sep)) throw new ApiError('This file is not available.', 404)
  try {
    await fs.promises.access(full)
  } catch {
    throw new ApiError('This file is not available.', 404)
  }
  return { path: full, name: q.fileOriginalName, mimeType: q.fileMimeType }
}

/* ---------- 1.1.3 / 1.2.4 Status management ---------- */
export async function updateRequestStatus({ id, status, remark }, user) {
  if (!STATUS_KEYS.includes(status)) throw new ApiError('Unknown status.', 422)
  const text = String(remark ?? '').trim()

  // The request row is locked inside the transaction, so two Secretaries cannot apply conflicting changes at once.
  const result = await sequelize.transaction(async (t) => {
    const r = await CertificationRequest.findByPk(id, { transaction: t, lock: t.LOCK.UPDATE })
    if (!r) throw new ApiError('Request not found.', 404)
    if (!TRANSITIONS[r.status].includes(status)) throw new ApiError('That status change is not allowed from the current status.', 409)
    if (REMARK_REQUIRED.includes(status) && !text) throw new ApiError('Enter a remark explaining the reason.', 422)
    if (text.length > REMARK_MAX) throw new ApiError(`Remarks can be up to ${REMARK_MAX} characters.`, 422)
    if (status === 'approved') {
      const reqs = await RequestRequirement.findAll({ where: { requestId: id }, transaction: t })
      if (!reqs.every((q) => q.validationStatus === 'valid')) throw new ApiError('Mark every requirement as valid before approving.', 422)
    }

    const now = new Date()
    await r.update({ status, reviewedBy: user.name, reviewedById: user.id, updatedAt: now }, { transaction: t })
    if (text) await RequestRemark.create({ requestId: id, text, author: user.name, authorId: user.id, at: now }, { transaction: t })
    return { ok: true, status, updatedAt: now }
  })

  // Only after the change is saved. Never throws: a failed email does not undo the status change.
  // email: 'sent' | 'failed' | 'skipped'; emailReason / emailDetail: why it was skipped or failed (the frontend shows it to the Secretary).
  const { result: email, reason: emailReason, detail: emailDetail } = await notifyStatusChange({ id, status, remark: text })
  return { ...result, email, emailReason, emailDetail }
}

/* ---------- 1.1.4 Remarks ---------- */
export async function addRemark({ id, text }, user) {
  const clean = String(text ?? '').trim()
  if (!clean) throw new ApiError('Enter a remark before saving.', 422)
  if (clean.length > REMARK_MAX) throw new ApiError(`Remarks can be up to ${REMARK_MAX} characters.`, 422)
  if (!(await CertificationRequest.count({ where: { id } }))) throw new ApiError('Request not found.', 404)
  await RequestRemark.create({ requestId: id, text: clean, author: user.name, authorId: user.id, at: new Date() })
  return { ok: true }
}

/* ---------- 1.2.3 Requirement validation ---------- */
export async function validateRequirement({ id, name, status, remarks }, user) {
  if (!REVIEW_RESULTS.includes(status)) throw new ApiError('Choose valid, invalid, or needs resubmission.', 422)
  const note = String(remarks ?? '').trim()

  return sequelize.transaction(async (t) => {
    const r = await CertificationRequest.findByPk(id, { transaction: t, lock: t.LOCK.UPDATE })
    if (!r) throw new ApiError('Request not found.', 404)
    if (r.status !== 'under_review') throw new ApiError('Requirements can only be validated while the request is under review.', 409)
    const item = await RequestRequirement.findOne({ where: { requestId: id, name }, transaction: t })
    if (!item) throw new ApiError('Requirement not found.', 404)
    if (status === 'valid' && !item.fileOriginalName) throw new ApiError('A missing document cannot be marked valid.', 422)
    if (status !== 'valid' && !note) throw new ApiError('Enter a remark explaining what is wrong.', 422)
    if (note.length > REMARK_MAX) throw new ApiError(`Remarks can be up to ${REMARK_MAX} characters.`, 422)

    const now = new Date()
    await item.update({ validationStatus: status, validationRemarks: status === 'valid' ? '' : note, validatedAt: now, validatedBy: user.name }, { transaction: t })
    await r.update({ updatedAt: now, reviewedBy: user.name, reviewedById: user.id }, { transaction: t })
    return { ok: true }
  })
}

/* ---------- Resident side: submit a certificate request (public) ---------- */
// Multipart form. Each uploaded file uses the requirement name as its field name.
export async function submitRequest(f = {}, files = []) {
  try {
    return await create(f, files)
  } catch (e) {
    await removeFiles(files) // never leave orphan uploads behind
    throw e
  }
}

const str = (v) => (Array.isArray(v) ? String(v[0] ?? '') : String(v ?? ''))

async function create(body, files) {
  const f = Object.fromEntries(Object.entries(body).map(([k, v]) => [k, str(v)]))
  const errors = {}
  if (f.name.trim().length < 3) errors.name = 'Isulat ang buong pangalan.'
  if (f.address.trim().length < 3) errors.address = 'Isulat ang tirahan.'
  if (!PUROKS.includes(Number(f.purok))) errors.purok = 'Pumili ng purok.'
  if (!isIsoDate(f.birthDate) || new Date(f.birthDate) > new Date()) errors.birthDate = 'Ilagay ang wastong birthdate.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim())) errors.email = 'Maglagay ng wastong email address.'
  if (!['yes', 'no'].includes(f.voter)) errors.voter = 'Pumili ng Oo o Hindi.'
  if (!CIVIL_MAP[f.civil]) errors.civil = 'Lagyan ng check ang tamang sagot.'
  if (!CERT_TYPES[f.type]) errors.type = 'Pumili ng kukunin.'
  if (f.purpose.trim().length < 3) errors.purpose = 'Isulat ang dahilan ng pagkuha.'
  if (f.contact && !MOBILE_REGEX.test(f.contact.trim())) errors.contact = 'Gamitin ang format na 09171234567.'
  // Certificate of Indigency: dapat malinaw kung para kanino ito.
  const forIndigency = isIndigency(f.type)
  const relation = (f.beneficiaryRelation ?? '').trim()
  const beneficiaryName = (f.beneficiaryName ?? '').trim()
  if (forIndigency) {
    if (!BENEFICIARY_RELATIONS.includes(relation)) errors.beneficiaryRelation = 'Pumili kung para kanino ang certificate.'
    else if (relation !== 'Sarili') {
      if (beneficiaryName.length < 3) errors.beneficiaryName = 'Isulat ang buong pangalan ng pagbibigyan ng certificate.'
      else if (beneficiaryName.length > 150) errors.beneficiaryName = 'Masyadong mahaba ang pangalan.'
    }
  }
  // Column limits, so a long entry gives a clear message instead of a database error.
  if (f.name.length > 150) errors.name = 'Masyadong mahaba ang pangalan.'
  if (f.address.length > 200) errors.address = 'Masyadong mahaba ang tirahan.'
  if (f.email.length > 150) errors.email = 'Masyadong mahaba ang email address.'

  // Only files for this certificate's requirements are kept, and their real content must match the declared type.
  const required = CERT_TYPES[f.type] ?? []
  const kept = files.filter((x) => required.includes(x.fieldname))
  for (const file of kept) {
    if (!(await hasValidSignature(file))) errors.files = `Hindi wastong file ang "${file.originalname}". Gumamit ng JPG, PNG, o PDF.`
  }
  if (Object.keys(errors).length) throw new ApiError('Kumpletuhin ang mga naka-highlight na bahagi.', 422, errors)
  await removeFiles(files.filter((x) => !kept.includes(x)))

  const now = new Date()
  const typed = norm(f.name)
  const sameBirth = await Resident.findAll({ where: { birthDate: f.birthDate } })
  const match = sameBirth.find((r) => typed.includes(norm(r.firstName)) && typed.includes(norm(r.lastName)))

  return sequelize.transaction(async (t) => {
    const id = await nextRequestId(t)
    await CertificationRequest.create({
      id,
      residentId: match?.id ?? null,
      type: f.type,
      status: 'pending',
      purpose: f.purpose.trim(),
      submittedAt: now,
      updatedAt: now,
      applicantName: f.name.trim(),
      birthDate: f.birthDate,
      civilStatus: CIVIL_MAP[f.civil],
      address: `Purok ${f.purok}, ${f.address.trim()}`,
      contact: f.contact.trim(),
      email: f.email.trim(),
      voter: f.voter === 'yes',
      boarder: ['true', 'on', '1', 'yes'].includes(f.boarder),
      civilLabel: f.civil,
      beneficiaryRelation: forIndigency ? relation : null,
      beneficiaryName: forIndigency && relation !== 'Sarili' ? beneficiaryName : null,
    }, { transaction: t })

    await RequestRequirement.bulkCreate(required.map((name) => {
      const file = kept.find((x) => x.fieldname === name)
      return {
        requestId: id,
        name,
        fileOriginalName: file?.originalname ?? null,
        fileStoredName: file?.filename ?? null,
        fileSize: file?.size ?? null,
        fileMimeType: file?.mimetype ?? null,
        fileUploadedAt: file ? now : null,
        validationStatus: 'pending',
      }
    }), { transaction: t })
    return { id }
  })
}
