import {
  CIVIL_STATUS, MOBILE_REGEX, PUROKS, SEX, TENURE, VERIFY_REMARK_MAX, VERIFY_RESULTS,
} from '../config/constants.js'

// 2.1.2 / 2.2.2 Validation rules. These functions have no database access, so the same rules can be
// tested on their own. frontend/src/lib/validators.js mirrors them to show the same messages while typing.
// Each check returns { fieldName: 'message' }, an empty object when everything is valid.

export const clean = (v) => String(v ?? '').replace(/\s+/g, ' ').trim()

const NAME = /^\p{L}[\p{L}\p{M} .'’-]*$/u

export function isRealDate(s) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s)
  if (!m) return false
  const [y, mo, d] = m.slice(1).map(Number)
  const dt = new Date(Date.UTC(y, mo - 1, d))
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === mo - 1 && dt.getUTCDate() === d
}

// Today in Philippine time, as YYYY-MM-DD.
export const todayManila = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Manila' }).format(new Date())

export const PERSON_FIELDS = ['firstName', 'middleName', 'lastName', 'sex', 'birthDate', 'civilStatus', 'occupation', 'contact']

/* ---------- Resident ---------- */

// Trims and tidies what was typed. Spaces and dashes inside a phone number are removed (0917 123-4567).
export function readPerson(input = {}) {
  return {
    firstName: clean(input.firstName),
    middleName: clean(input.middleName),
    lastName: clean(input.lastName),
    sex: clean(input.sex),
    birthDate: clean(input.birthDate),
    civilStatus: clean(input.civilStatus),
    occupation: clean(input.occupation),
    contact: clean(input.contact).replace(/[\s-]/g, ''),
  }
}

function checkName(value, label, required) {
  if (!value) return required ? `Enter the ${label}.` : undefined
  if (value.length > 80) return `The ${label} can have at most 80 characters.`
  if (!NAME.test(value)) return `The ${label} can only have letters, spaces, and . ' -`
  return undefined
}

export function checkPerson(v, today = todayManila()) {
  const e = {}
  const first = checkName(v.firstName, 'first name', true)
  const middle = checkName(v.middleName, 'middle name', false)
  const last = checkName(v.lastName, 'last name', true)
  if (first) e.firstName = first
  if (middle) e.middleName = middle
  if (last) e.lastName = last

  if (!SEX.includes(v.sex)) e.sex = 'Select the sex.'

  if (!v.birthDate) e.birthDate = 'Enter the birth date.'
  else if (!isRealDate(v.birthDate)) e.birthDate = 'Enter a real date.'
  else if (v.birthDate > today) e.birthDate = 'The birth date cannot be in the future.'
  else if (Number(v.birthDate.slice(0, 4)) < Number(today.slice(0, 4)) - 120) e.birthDate = 'Check the year. This would make the resident over 120 years old.'

  if (!CIVIL_STATUS.includes(v.civilStatus)) e.civilStatus = 'Select the civil status.'
  if (v.occupation.length > 100) e.occupation = 'The occupation can have at most 100 characters.'
  if (v.contact && !MOBILE_REGEX.test(v.contact)) e.contact = 'Use a mobile number such as 09171234567.'
  return e
}

// Relationship to the household head, for residents who are not the head.
export function checkRelationship(value) {
  const rel = clean(value)
  if (!rel) return 'Select how this resident is related to the household head.'
  if (/^head$/i.test(rel)) return 'The household head is set when registering the household, or by editing the household.'
  if (rel.length > 50 || !NAME.test(rel)) return 'Use letters only for the relationship (up to 50 characters).'
  return undefined
}

/* ---------- Household ---------- */

export function readHousehold(input = {}) {
  const purok = clean(input.purok)
  return {
    address: clean(input.address),
    purok: purok === '' ? NaN : Number(purok),
    tenure: clean(input.tenure),
    contact: clean(input.contact).replace(/[\s-]/g, ''),
  }
}

export function checkHousehold(v) {
  const e = {}
  if (v.address.length < 5) e.address = 'Enter the household address (at least 5 characters).'
  else if (v.address.length > 255) e.address = 'The address can have at most 255 characters.'
  if (!PUROKS.includes(v.purok)) e.purok = 'Select a purok.'
  if (!TENURE.includes(v.tenure)) e.tenure = 'Select a housing tenure.'
  if (v.contact && !MOBILE_REGEX.test(v.contact)) e.contact = 'Use a mobile number such as 09171234567.'
  return e
}

/* ---------- Verification ---------- */

export function checkVerification({ status, remarks }) {
  const e = {}
  if (!VERIFY_RESULTS.includes(status)) e.status = 'Choose a verification result.'
  if (status === 'needs_correction' && !remarks) e.remarks = 'Write what needs to be corrected.'
  if (remarks.length > VERIFY_REMARK_MAX) e.remarks = `Use at most ${VERIFY_REMARK_MAX} characters.`
  return e
}

/* ---------- Audit trail ---------- */

// { field: { from, to } } for the fields whose value changed. Empty when nothing changed.
export function diffFields(before, after, fields) {
  const out = {}
  for (const f of fields) {
    const from = before[f] ?? ''
    const to = after[f] ?? ''
    if (String(from) !== String(to)) out[f] = { from, to }
  }
  return out
}
