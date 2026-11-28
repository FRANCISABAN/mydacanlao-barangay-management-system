// Mirrors frontend/src/lib/constants.js. The backend is the source of truth for the workflow rules.

export const STATUS_KEYS = ['pending', 'under_review', 'resubmission', 'approved', 'rejected']

// 1.1.3 Allowed status changes.
export const TRANSITIONS = {
  pending: ['under_review'],
  under_review: ['approved', 'rejected', 'resubmission'],
  resubmission: ['under_review'],
  approved: [],
  rejected: [],
}
export const REMARK_REQUIRED = ['rejected', 'resubmission']

// 1.2.3 Validation result of one requirement.
export const VALIDATION_KEYS = ['pending', 'valid', 'invalid', 'resubmit']
export const REVIEW_RESULTS = ['valid', 'invalid', 'resubmit']

// Certificates offered by the barangay. The required documents are placeholders.
// Confirm them with the Secretary.
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
export const CIVIL_MAP = { 'May asawa': 'Married', Binata: 'Single', Dalaga: 'Single', Balo: 'Widowed' }

export const MOBILE_REGEX = /^(09|\+639)\d{9}$/
export const REMARK_MAX = 500

// ---- BHW module (2.1 / 2.2): resident and household records ----
export const SEX = ['Male', 'Female']
export const CIVIL_STATUS = ['Single', 'Married', 'Widowed', 'Separated']
// Relationship to the household head. 'Head' is not listed: the head is set when a household is
// registered, or by choosing a new head when editing the household.
export const RELATIONSHIPS = ['Spouse', 'Child', 'Parent', 'Sibling', 'Grandchild', 'Grandparent', 'Son-in-law', 'Daughter-in-law', 'Relative', 'Boarder', 'Other']

// 2.1.2 Verification of resident information.
export const VERIFICATION_KEYS = ['unverified', 'verified', 'needs_correction']
export const VERIFY_RESULTS = ['verified', 'needs_correction']
export const VERIFY_REMARK_MAX = 500

export const PAGE_SIZE_DEFAULT = 10
export const PAGE_SIZE_MAX = 50
