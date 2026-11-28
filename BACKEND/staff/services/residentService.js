import { Op } from 'sequelize'
import { Household, Resident, ResidentAudit, sequelize } from '../models/index.js'
import { PUROKS, VERIFICATION_KEYS } from '../config/constants.js'
import { ApiError } from '../utils/ApiError.js'
import { assertFresh } from '../utils/concurrency.js'
import { ageOf, fullName, likePattern, tokens } from '../utils/format.js'
import { nextSerial } from '../utils/idGenerator.js'
import { pageResult, parsePaging } from '../utils/pagination.js'
import {
  PERSON_FIELDS, checkPerson, checkRelationship, checkVerification, clean, diffFields, readPerson,
} from '../utils/validators.js'

export const toResident = (row, hh) => {
  const r = row.get ? row.get({ plain: true }) : row
  return { ...r, fullName: fullName(r), age: ageOf(r.birthDate), purok: hh?.purok, address: hh?.address }
}

// Every word typed must match the first, middle, or last name, the resident ID, or the household ID.
export const nameWhere = (words) =>
  words.map((w) => {
    const like = { [Op.like]: likePattern(w) }
    return { [Op.or]: [{ firstName: like }, { middleName: like }, { lastName: like }, { id: like }, { householdId: like }] }
  })

// 2.1.5 One line in the audit trail. Must run inside the same transaction as the change it records.
export const writeAudit = (transaction, { residentId, action, changes, user }) =>
  ResidentAudit.create(
    { residentId, action, changes: JSON.stringify(changes), userId: user.id, performedBy: user.name, performedAt: new Date() },
    { transaction },
  )

// 2.1.2 Possible duplicate: same first name, last name, and birth date (not case sensitive).
// The middle name is left out on purpose, because it is often missing on one of the two records.
export async function assertNotDuplicate(v, excludeId, transaction) {
  const where = { firstName: v.firstName, lastName: v.lastName, birthDate: v.birthDate }
  if (excludeId) where.id = { [Op.ne]: excludeId }
  const dup = await Resident.findOne({ where, transaction })
  if (!dup) return
  throw new ApiError(
    `${fullName(dup)} (${dup.id}) is already registered with the same name and birth date. Check the existing record before adding another.`,
    409,
    { firstName: 'Possible duplicate record.', lastName: 'Possible duplicate record.', birthDate: 'Possible duplicate record.' },
    { duplicate: { id: dup.id, fullName: fullName(dup), householdId: dup.householdId } },
  )
}

const FIX = 'Fix the highlighted fields and save again.'

/* 2.1.3 / 2.1.4 Paginated list. Search by name, resident ID, or household ID; filter by purok,
   household, or verification status. */
export async function listResidents({ q, purok, householdId, verification, page, pageSize } = {}) {
  const paging = parsePaging({ page, pageSize })
  const and = []

  if (purok) {
    if (!PUROKS.includes(Number(purok))) throw new ApiError('Unknown purok.', 422)
    const ids = (await Household.findAll({ where: { purok: Number(purok) }, attributes: ['id'], raw: true })).map((h) => h.id)
    if (!ids.length) return pageResult([], 0, paging)
    and.push({ householdId: ids })
  }
  if (householdId) and.push({ householdId: clean(householdId) })
  if (verification) {
    if (!VERIFICATION_KEYS.includes(verification)) throw new ApiError('Unknown verification status.', 422)
    and.push({ verificationStatus: verification })
  }
  and.push(...nameWhere(tokens(q)))

  const { count, rows } = await Resident.findAndCountAll({
    where: and.length ? { [Op.and]: and } : {},
    order: [['lastName', 'ASC'], ['firstName', 'ASC'], ['id', 'ASC']],
    limit: paging.pageSize,
    offset: paging.offset,
  })
  const hhs = await Household.findAll({ where: { id: [...new Set(rows.map((r) => r.householdId))] }, raw: true })
  const byId = new Map(hhs.map((h) => [h.id, h]))
  return pageResult(rows.map((r) => toResident(r, byId.get(r.householdId))), count, paging)
}

/* 2.1.3 Single resident. */
export async function getResident({ id }) {
  const r = await Resident.findByPk(id)
  if (!r) throw new ApiError('Resident not found.', 404)
  const hh = await Household.findByPk(r.householdId, { raw: true })
  return { ...toResident(r, hh), isHead: hh?.headId === r.id }
}

/* 2.1.1 / 2.1.2 / 2.2.5 Register a resident in an existing household. */

/* 2.1.5 Edit an existing resident. The household is not changed here (see reassignResident). */

/* 2.1.2 Record the verification result, the remarks, and who recorded it. */

/* 2.2.5 Move a resident to another household (a transfer). */

/* 2.1.5 The audit trail of one resident, newest first. */
