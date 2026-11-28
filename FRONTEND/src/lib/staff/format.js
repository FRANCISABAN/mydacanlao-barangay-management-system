const d = new Intl.DateTimeFormat('en-PH', { dateStyle: 'medium' })
const dt = new Intl.DateTimeFormat('en-PH', { dateStyle: 'medium', timeStyle: 'short' })

export const fmtDate = (iso) => (iso ? d.format(new Date(iso)) : '—')
export const fmtDateTime = (iso) => (iso ? dt.format(new Date(iso)) : '—')

export const fullName = (p) =>
  [p.firstName, p.middleName && `${p.middleName[0]}.`, p.lastName].filter(Boolean).join(' ')

// File size in bytes -> "320 KB" / "1.4 MB". Leaves an already formatted string untouched.
export const fmtSize = (bytes) => {
  const n = Number(bytes)
  if (!Number.isFinite(n)) return String(bytes ?? '')
  return n > 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`
}

export const todayISO = () => {
  const n = new Date()
  const p = (x) => String(x).padStart(2, '0')
  return `${n.getFullYear()}-${p(n.getMonth() + 1)}-${p(n.getDate())}`
}

// Age in whole years from a YYYY-MM-DD birth date. Returns null for an invalid or future date.
export const ageFrom = (birth) => {
  const b = new Date(birth)
  if (!birth || Number.isNaN(b.getTime())) return null
  const n = new Date()
  let a = n.getFullYear() - b.getFullYear()
  if (n < new Date(n.getFullYear(), b.getMonth(), b.getDate())) a--
  return a < 0 ? null : a
}
