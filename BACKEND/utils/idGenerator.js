import { Counter } from '../models/index.js'
import { manilaYear } from './format.js'

// CR-2026-0042. Must run inside a transaction: the counter row is locked, so two
// simultaneous submissions never get the same number.
export async function nextRequestId(transaction) {
  const key = `CR-${manilaYear()}`
  await Counter.findOrCreate({ where: { id: key }, defaults: { seq: 0 }, transaction })
  const c = await Counter.findByPk(key, { transaction, lock: transaction.LOCK.UPDATE })
  c.seq += 1
  await c.save({ transaction })
  return `${key}-${String(c.seq).padStart(4, '0')}`
}

// RES-016 / HH-007. Same idea as above, for residents and households created by the BHW.
// The counter is also kept at or above the highest number already in the table, so a database that
// was seeded before this feature existed never hands out an ID that is already taken.
export async function nextSerial(prefix, Model, transaction, width = 3) {
  await Counter.findOrCreate({ where: { id: prefix }, defaults: { seq: 0 }, transaction })
  const c = await Counter.findByPk(prefix, { transaction, lock: transaction.LOCK.UPDATE })
  const rows = await Model.findAll({ attributes: ['id'], raw: true, transaction })
  const highest = rows.reduce((max, r) => Math.max(max, Number(String(r.id).replace(/\D/g, '')) || 0), 0)
  c.seq = Math.max(c.seq, highest) + 1
  await c.save({ transaction })
  return `${prefix}-${String(c.seq).padStart(width, '0')}`
}
