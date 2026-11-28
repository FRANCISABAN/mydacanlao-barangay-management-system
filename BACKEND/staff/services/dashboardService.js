import { fn, col } from 'sequelize'
import { CertificationRequest, Household, Resident } from '../models/index.js'
import { STATUS_KEYS, VERIFICATION_KEYS } from '../config/constants.js'
import { brief } from './requestService.js'

/* 1.4.1 Summary counts per status + the oldest requests that still need action. */
export async function getSummary() {
  const rows = await CertificationRequest.findAll({ attributes: ['status', [fn('COUNT', col('id')), 'n']], group: ['status'], raw: true })
  const counts = Object.fromEntries(STATUS_KEYS.map((k) => [k, 0]))
  rows.forEach((r) => { counts[r.status] = Number(r.n) })
  const total = Object.values(counts).reduce((a, b) => a + b, 0)

  const attention = await CertificationRequest.findAll({
    where: { status: ['pending', 'under_review'] },
    order: [['submittedAt', 'ASC']],
    limit: 5,
  })
  return { total, counts, attention: attention.map(brief) }
}

/* 2.3.1 BHW dashboard: total residents and households, plus how many residents are in each verification state.
   Always counted from the database, so the numbers are current right after a record is created or changed. */
