import { ApiError } from './ApiError.js'

// 2.2.6 Update conflict detection. Every editable record has a `version` that goes up by one on each
// save. The edit form sends the version it loaded; if the record has changed since, nothing is saved.
// Call this after loading the row with a lock (SELECT ... FOR UPDATE), so two saves cannot both pass.
export function assertFresh(record, version, label) {
  const v = Number(version)
  if (!Number.isInteger(v)) throw new ApiError('This form is out of date. Reload the record and try again.', 400)
  if (v !== record.version) {
    throw new ApiError(
      `${label} was changed by ${record.updatedBy || 'another user'} after you opened it. Load the latest version, then make your changes again.`,
      409,
      undefined,
      { conflict: { updatedBy: record.updatedBy ?? null, updatedAt: record.updatedAt ?? null, version: record.version } },
    )
  }
}
