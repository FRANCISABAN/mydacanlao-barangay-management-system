import { Op, col, fn } from 'sequelize'
import { Household, Resident, sequelize } from '../models/index.js'
import { PUROKS } from '../config/constants.js'
import { ApiError } from '../utils/ApiError.js'
import { assertFresh } from '../utils/concurrency.js'
import { fullName, likePattern, tokens } from '../utils/format.js'
import { nextSerial } from '../utils/idGenerator.js'
import { pageResult, parsePaging } from '../utils/pagination.js'
import { PERSON_FIELDS, checkHousehold, checkPerson, clean, readHousehold, readPerson } from '../utils/validators.js'
import { assertNotDuplicate, nameWhere, toResident, writeAudit } from './residentService.js'

const FIX = 'Fix the highlighted fields and save again.'

// 2.2.2 Possible duplicate household: same purok and same address (not case sensitive).
async function assertNoDuplicateHousehold(v, excludeId, transaction) {
  const where = { purok: v.purok, address: v.address }
  if (excludeId) where.id = { [Op.ne]: excludeId }
  const dup = await Household.findOne({ where, transaction })
  if (dup) {
    throw new ApiError(
      `Household ${dup.id} is already registered at this address in Purok ${dup.purok}. Open that record instead of adding a new one.`,
      409,
      { address: 'Possible duplicate household.' },
      { duplicate: { id: dup.id } },
    )
  }
}

/* 2.2.3 / 2.2.4 Paginated list. Search by household ID, head name, or address; filter by purok. */
export async function listHouseholds({ q, purok, page, pageSize } = {}) {
  const paging = parsePaging({ page, pageSize })
  if (purok && !PUROKS.includes(Number(purok))) throw new ApiError('Unknown purok.', 422)

  const and = []
  if (purok) and.push({ purok: Number(purok) })

  const needle = String(q ?? '').trim()
  if (needle) {
    const or = [{ id: { [Op.like]: likePattern(needle) } }, { address: { [Op.like]: likePattern(needle) } }]
    // Head name: look only among the residents who head a household.
    const headIds = (await Household.findAll({ attributes: ['headId'], raw: true })).map((h) => h.headId)
    if (headIds.length) {
      const heads = await Resident.findAll({ attributes: ['id'], where: { [Op.and]: [{ id: headIds }, ...nameWhere(tokens(needle))] }, raw: true })
      if (heads.length) or.push({ headId: heads.map((h) => h.id) })
    }
    and.push({ [Op.or]: or })
  }

  const { count, rows } = await Household.findAndCountAll({
    where: and.length ? { [Op.and]: and } : {},
    order: [[fn('LENGTH', col('id')), 'ASC'], ['id', 'ASC']], // HH-999 comes before HH-1000
    limit: paging.pageSize,
    offset: paging.offset,
    raw: true,
  })

  const heads = await Resident.findAll({ where: { id: rows.map((h) => h.headId) }, raw: true })
  const names = new Map(heads.map((m) => [m.id, fullName(m)]))
  const counts = await Resident.findAll({
    attributes: ['householdId', [fn('COUNT', col('id')), 'n']],
    where: { householdId: rows.map((h) => h.id) },
    group: ['householdId'],
    raw: true,
  })
  const countOf = new Map(counts.map((c) => [c.householdId, Number(c.n)]))

  return pageResult(rows.map((h) => ({ ...h, headName: names.get(h.headId) ?? '—', memberCount: countOf.get(h.id) ?? 0 })), count, paging)
}

/* 2.2.3 Household with its members. */
export async function getHousehold({ id }) {
  const row = await Household.findByPk(id)
  if (!row) throw new ApiError('Household not found.', 404)
  const h = row.get({ plain: true })
  const members = await Resident.findAll({ where: { householdId: id }, order: [['id', 'ASC']] })
  const head = members.find((m) => m.id === h.headId)
  return { ...h, headName: head ? fullName(head) : '—', members: members.map((m) => toResident(m, h)) }
}

/* 2.2.3 The residents who belong to a household. */
export async function listMembers({ id }) {
  const h = await getHousehold({ id })
  return { householdId: h.id, headId: h.headId, members: h.members }
}

/* 2.2.1 / 2.2.2 Register a household together with its head. The head is either a new resident
   (`head`: the personal details) or a resident who is already registered (`headId`). */

/* 2.2.6 Edit an existing household. There is no delete (1.4.2).
   If the head changes, the old head becomes "Relative" and the new head becomes "Head", so the members'
   roles stay consistent with the household record. */
export async function updateHousehold({ id, version, headId, address, purok, tenure, contact }, user) {
  const v = readHousehold({ address, purok, tenure, contact })
  const errors = checkHousehold(v)
  const newHeadId = clean(headId)

  return sequelize.transaction(async (transaction) => {
    const h = await Household.findByPk(id, { transaction, lock: transaction.LOCK.UPDATE })
    if (!h) throw new ApiError('Household not found.', 404)
    assertFresh(h, version, 'This household record')

    const newHead = newHeadId ? await Resident.findOne({ where: { id: newHeadId, householdId: id }, transaction, lock: transaction.LOCK.UPDATE }) : null
    if (!newHead) errors.headId = 'Choose the household head from the members.'
    if (Object.keys(errors).length) throw new ApiError(FIX, 422, errors)
    await assertNoDuplicateHousehold(v, id, transaction)

    const unchanged = h.headId === newHeadId && h.address === v.address && h.purok === v.purok && h.tenure === v.tenure && h.contact === v.contact
    if (unchanged) return { ok: true, changed: false, version: h.version }

    const now = new Date()
    if (h.headId !== newHeadId) {
      const oldHead = await Resident.findOne({ where: { id: h.headId, householdId: id }, transaction, lock: transaction.LOCK.UPDATE })
      if (oldHead) {
        await writeAudit(transaction, { residentId: oldHead.id, action: 'update', changes: { relationship: { from: oldHead.relationship, to: 'Relative' } }, user })
        await oldHead.update({ relationship: 'Relative', version: oldHead.version + 1, updatedBy: user.name, updatedAt: now }, { transaction })
      }
      await writeAudit(transaction, { residentId: newHead.id, action: 'update', changes: { relationship: { from: newHead.relationship, to: 'Head' } }, user })
      await newHead.update({ relationship: 'Head', version: newHead.version + 1, updatedBy: user.name, updatedAt: now }, { transaction })
    }

    await h.update({ headId: newHeadId, ...v, version: h.version + 1, updatedBy: user.name, updatedAt: now }, { transaction })
    return { ok: true, changed: true, version: h.version }
  })
}
