import { CERT_TYPES } from '../lib/constants'
import { fullName } from '../lib/format'

export const HOUSEHOLDS = [
  { id: 'HH-001', headId: 'RES-001', address: 'Purok 1, Sitio Maligaya', purok: 1, tenure: 'Owned', contact: '09171234567' },
  { id: 'HH-002', headId: 'RES-005', address: 'Purok 2, Sitio Looban', purok: 2, tenure: 'Owned', contact: '09391112233' },
  { id: 'HH-003', headId: 'RES-008', address: 'Purok 3, Sitio Mabini', purok: 3, tenure: 'Rented', contact: '09176667788' },
  { id: 'HH-004', headId: 'RES-011', address: 'Purok 4, Sitio Riverside', purok: 4, tenure: 'Owned', contact: '09153334455' },
  { id: 'HH-005', headId: 'RES-013', address: 'Purok 5, Sitio Pag-asa', purok: 5, tenure: 'Rented', contact: '09175550199' },
  { id: 'HH-006', headId: 'RES-015', address: 'Purok 1, Sitio Maligaya, Lot 12', purok: 1, tenure: 'Shared with relatives', contact: '09202223344' },
]

const R = (id, firstName, middleName, lastName, sex, birthDate, civilStatus, occupation, contact, householdId, relationship) => ({
  id, firstName, middleName, lastName, sex, birthDate, civilStatus, occupation, contact, householdId, relationship,
})

export const RESIDENTS = [
  R('RES-001', 'Roberto', 'Mendoza', 'Dela Cruz', 'Male', '1971-03-14', 'Married', 'Farmer', '09171234567', 'HH-001', 'Head'),
  R('RES-002', 'Corazon', 'Santos', 'Dela Cruz', 'Female', '1974-08-02', 'Married', 'Housewife', '', 'HH-001', 'Spouse'),
  R('RES-003', 'Angelo', 'Santos', 'Dela Cruz', 'Male', '2001-11-23', 'Single', 'Student', '09285550142', 'HH-001', 'Child'),
  R('RES-004', 'Mariel', 'Santos', 'Dela Cruz', 'Female', '2006-05-19', 'Single', 'Student', '', 'HH-001', 'Child'),
  R('RES-005', 'Elena', 'Garcia', 'Macaraig', 'Female', '1966-01-30', 'Widowed', 'Sari-sari store owner', '09391112233', 'HH-002', 'Head'),
  R('RES-006', 'Paolo', 'Garcia', 'Macaraig', 'Male', '1992-09-09', 'Married', 'Tricycle driver', '09054443210', 'HH-002', 'Child'),
  R('RES-007', 'Jenny Lyn', 'Ramos', 'Macaraig', 'Female', '1994-12-12', 'Married', 'Vendor', '', 'HH-002', 'Daughter-in-law'),
  R('RES-008', 'Danilo', 'Alcantara', 'Villanueva', 'Male', '1980-06-25', 'Married', 'Construction worker', '09176667788', 'HH-003', 'Head'),
  R('RES-009', 'Rosalinda', 'Perez', 'Villanueva', 'Female', '1983-04-04', 'Married', 'Teacher', '09228889900', 'HH-003', 'Spouse'),
  R('RES-010', 'Kristoffer', 'Perez', 'Villanueva', 'Male', '2010-02-17', 'Single', 'Student', '', 'HH-003', 'Child'),
  R('RES-011', 'Lourdes', 'Manalo', 'Bautista', 'Female', '1958-10-08', 'Widowed', 'Retired', '09153334455', 'HH-004', 'Head'),
  R('RES-012', 'Marvin', 'Manalo', 'Bautista', 'Male', '1985-07-21', 'Single', 'Electrician', '09361239876', 'HH-004', 'Child'),
  R('RES-013', 'Joselito', 'Cabrera', 'Reyes', 'Male', '1989-02-11', 'Married', 'Entrepreneur', '09175550199', 'HH-005', 'Head'),
  R('RES-014', 'Anna Marie', 'Lopez', 'Reyes', 'Female', '1991-05-27', 'Married', 'Bookkeeper', '09175550120', 'HH-005', 'Spouse'),
  R('RES-015', 'Ramon', 'Tolentino', 'Aquino', 'Male', '1963-12-01', 'Married', 'Farmer', '09202223344', 'HH-006', 'Head'),
]

const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-$/, '')
const SIZES = ['1.2 MB', '840 KB', '2.1 MB', '960 KB']
let rm = 0
const remark = (text, at, author = 'Maria L. Santos') => ({ id: `rm-${++rm}`, text, author, at })

// Compact request builder. `v` = validation results, `missing` = requirements with no upload,
// `tweak` = values on the applicant's form that differ from the resident record.
function mk(id, residentId, type, submittedAt, status, purpose, o = {}) {
  const r = RESIDENTS.find((x) => x.id === residentId)
  const hh = HOUSEHOLDS.find((h) => h.id === r.householdId)
  const updatedAt = o.updatedAt || submittedAt
  return {
    id, residentId, type, submittedAt, status, purpose, updatedAt,
    reviewedBy: o.reviewedBy || null,
    submitted: {
      fullName: fullName(r), birthDate: r.birthDate, civilStatus: r.civilStatus,
      address: hh.address, contact: r.contact, ...(o.tweak || {}),
    },
    requirements: CERT_TYPES[type].map((name, i) => {
      const [vs = 'pending', remarks = ''] = (o.v || {})[name] || []
      const missing = (o.missing || []).includes(name)
      return {
        name,
        file: missing ? null : { name: `${slug(name)}.${/registration/i.test(name) ? 'pdf' : 'jpg'}`, size: SIZES[i % 4], uploadedAt: submittedAt },
        validation: { status: vs, remarks, validatedAt: vs === 'pending' ? null : updatedAt },
      }
    }),
    remarks: o.remarks || [],
  }
}

const ID = 'Valid government ID'
const RES = 'Proof of residency'
const CTC = 'Community tax certificate (cedula)'
const t = (d, h) => `${d}T${h}:00+08:00`
const S = 'Maria L. Santos'

export const REQUESTS = [
  mk('CR-2026-0041', 'RES-014', 'Certificate of Residency', t('2026-11-18', '10:42'), 'pending', 'Bank account opening', { tweak: { contact: '09175559999' } }),
  mk('CR-2026-0040', 'RES-008', 'Barangay Clearance', t('2026-11-18', '08:15'), 'pending', 'Job application', { tweak: { contact: '' } }),
  mk('CR-2026-0039', 'RES-003', 'Barangay Clearance', t('2026-11-17', '15:30'), 'pending', 'Employment requirements'),
  mk('CR-2026-0038', 'RES-009', 'Certificate of Residency', t('2026-11-16', '09:05'), 'under_review', 'School enrollment of child', {
    tweak: { address: 'Purok 3, Sitio Ilaya' }, reviewedBy: S, updatedAt: t('2026-11-17', '11:20'),
    v: { [ID]: ['valid'] },
    remarks: [remark('Address on the form differs from the household record. Checking the proof of residency.', t('2026-11-17', '11:20'))],
  }),
  mk('CR-2026-0037', 'RES-005', 'Certificate of Indigency', t('2026-11-14', '13:10'), 'under_review', 'Medical assistance', {
    reviewedBy: S, updatedAt: t('2026-11-15', '10:00'),
    v: { [ID]: ['valid'] },
  }),
  mk('CR-2026-0036', 'RES-013', 'Business Clearance', t('2026-11-12', '10:25'), 'resubmission', 'New sari-sari store permit', {
    reviewedBy: S, updatedAt: t('2026-11-13', '14:45'),
    v: {
      [ID]: ['valid'], [CTC]: ['valid'],
      'DTI or SEC registration': ['invalid', 'Registration expired on June 30, 2026. Upload the renewed certificate.'],
      'Proof of business address': ['resubmit', 'The utility bill is blurred. Upload a clear copy.'],
    },
    remarks: [remark('Asked the applicant to resubmit two documents.', t('2026-11-13', '14:45'))],
  }),
  mk('CR-2026-0035', 'RES-006', 'Barangay Clearance', t('2026-11-10', '09:40'), 'approved', 'Tricycle franchise renewal', {
    reviewedBy: S, updatedAt: t('2026-11-11', '09:15'), v: { [ID]: ['valid'], [RES]: ['valid'], [CTC]: ['valid'] },
    remarks: [remark('All requirements complete.', t('2026-11-11', '09:15'))],
  }),
  mk('CR-2026-0034', 'RES-011', 'Certificate of Indigency', t('2026-11-05', '11:00'), 'approved', 'Senior citizen benefits', {
    reviewedBy: S, updatedAt: t('2026-11-06', '10:30'), v: { [ID]: ['valid'] },
  }),
  mk('CR-2026-0033', 'RES-012', 'First Time Job Seeker Certificate', t('2026-11-03', '16:20'), 'rejected', 'First job application', {
    reviewedBy: S, updatedAt: t('2026-11-04', '09:50'), v: { [ID]: ['invalid', 'The ID belongs to a different person.'], [RES]: ['valid'] },
    remarks: [remark('Rejected. The submitted ID does not match the applicant.', t('2026-11-04', '09:50'))],
  }),
  mk('CR-2026-0032', 'RES-015', 'Certificate of Residency', t('2026-10-29', '08:55'), 'approved', 'Voter registration', {
    reviewedBy: S, updatedAt: t('2026-10-30', '13:00'), v: { [ID]: ['valid'], [RES]: ['valid'] },
  }),
  mk('CR-2026-0031', 'RES-001', 'Barangay Clearance', t('2026-10-27', '10:10'), 'under_review', 'Firearm license', {
    reviewedBy: S, updatedAt: t('2026-10-28', '09:00'),
  }),
]
