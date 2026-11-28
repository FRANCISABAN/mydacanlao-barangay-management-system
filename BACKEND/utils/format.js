export const norm = (s) => String(s ?? '').trim().toLowerCase()
// Safe pattern for SQL LIKE. MySQL's default collation already ignores upper/lower case.
export const likePattern = (s) => `%${String(s).replace(/[\\%_]/g, '\\$&')}%`

export const fullName = (p) =>
  [p.firstName, p.middleName && `${p.middleName[0]}.`, p.lastName].filter(Boolean).join(' ')

export const ageOf = (birth) => {
  const b = new Date(birth)
  const n = new Date()
  const a = n.getFullYear() - b.getFullYear()
  return n < new Date(n.getFullYear(), b.getMonth(), b.getDate()) ? a - 1 : a
}

// Mongo documents use _id (a readable string such as RES-001). The API exposes it as id.
export const withId = ({ _id, __v, ...rest }) => ({ id: _id, ...rest })

export const isIsoDate = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(new Date(s).getTime())

// Barangay dates follow Philippine time (UTC+8).
export const dayStart = (d) => new Date(`${d}T00:00:00.000+08:00`)
export const dayEnd = (d) => new Date(`${d}T23:59:59.999+08:00`)
export const manilaYear = (date = new Date()) =>
  Number(new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Manila', year: 'numeric' }).format(date))

export const tokens = (q) => String(q ?? '').trim().split(/\s+/).filter(Boolean)
