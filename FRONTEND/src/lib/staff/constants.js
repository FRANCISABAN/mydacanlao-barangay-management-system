export const BARANGAY = 'Barangay Dacanlao'

// Request workflow. The backend will own the final rules; this mirrors the agreed flow.
export const STATUS = {
  pending: { label: 'Pending', tone: 'amber' },
  under_review: { label: 'Under review', tone: 'blue' },
  resubmission: { label: 'Needs resubmission', tone: 'orange' },
  approved: { label: 'Approved', tone: 'green' },
  rejected: { label: 'Rejected', tone: 'red' },
}
export const STATUS_KEYS = Object.keys(STATUS)

export const TRANSITIONS = {
  pending: ['under_review'],
  under_review: ['approved', 'rejected', 'resubmission'],
  resubmission: ['under_review'],
  approved: [],
  rejected: [],
}

export const ACTIONS = {
  under_review: { label: 'Start review', kind: 'primary' },
  approved: { label: 'Approve request', kind: 'primary' },
  resubmission: { label: 'Request resubmission', kind: 'secondary', needsRemark: true },
  rejected: { label: 'Reject request', kind: 'danger', needsRemark: true },
}

export const VALIDATION = {
  pending: 'Not yet reviewed',
  valid: 'Valid',
  invalid: 'Invalid',
  resubmit: 'Needs resubmission',
}

// Certificates offered by the barangay (from the poster at the barangay hall).
// The required documents are placeholders. Confirm them with the Secretary.
const ID = 'Valid government ID'
const RES = 'Proof of residency'
export const CERT_TYPES = {
  'Barangay Clearance': [ID, RES, 'Community tax certificate (cedula)'],
  'Certificate of Indigency': [ID],
  'Business Clearance': [ID, 'DTI or SEC registration', 'Proof of business address', 'Community tax certificate (cedula)'],
  'Barangay Permit': [ID, RES, 'Details of the permit requested'],
  'Certificate of Residency': [ID, RES],
  'First Time Job Seeker Certificate': [ID, RES],
  'Certificate of Relationship': [ID, RES, 'Document that proves the relationship'],
}

export const PUROKS = [1, 2, 3, 4, 5]
export const TENURE = ['Owned', 'Rented', 'Shared with relatives', 'Informal settler']

// ---- BHW module: residents and households (mirrors backend/config/constants.js) ----
export const SEX = ['Male', 'Female']
export const CIVIL_STATUS = ['Single', 'Married', 'Widowed', 'Separated']
export const RELATIONSHIPS = ['Spouse', 'Child', 'Parent', 'Sibling', 'Grandchild', 'Grandparent', 'Son-in-law', 'Daughter-in-law', 'Relative', 'Boarder', 'Other']
export const MOBILE_REGEX = /^(09|\+639)\d{9}$/
export const VERIFY_REMARK_MAX = 500
export const PAGE_SIZE = 10

export const VERIFICATION = {
  unverified: { label: 'Unverified', tone: 'amber' },
  verified: { label: 'Verified', tone: 'green' },
  needs_correction: { label: 'Needs correction', tone: 'orange' },
}
export const VERIFICATION_KEYS = Object.keys(VERIFICATION)
export const VERIFY_RESULTS = ['verified', 'needs_correction']
