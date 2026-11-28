// Real API. Every export calls one backend endpoint (noted above each function) and keeps the same
// arguments and return shapes the pages already use, so the pages need very few changes.
import { http, httpBlob, qs, ApiError } from './http'

export { ApiError }

const enc = encodeURIComponent

/* ---------- 1.4.1 Dashboard ---------- */
// GET /api/secretary/summary
export const getSummary = () => http('/secretary/summary')

/* ---------- 1.1.1 / 1.1.2 Requests: list, search, filter ---------- */
// GET /api/certification-requests?q=&status=&type=&from=&to=
export const listRequests = ({ q, status, type, from, to } = {}) =>
  http(`/certification-requests${qs({ q, status, type, from, to })}`)

/* ---------- 1.1.1 / 1.2.1 / 1.2.2 Request details ---------- */
// GET /api/certification-requests/:id  (includes resident record, requirements, remarks)
export const getRequest = ({ id }) => http(`/certification-requests/${enc(id)}`)

// GET /api/certification-requests/:id/requirements/:name/file  (needs the login token, so it is
// fetched as a Blob; the page turns it into an object URL for the preview). `url` is file.url from getRequest.
export const getRequirementFile = ({ url }) => httpBlob(url.replace(/^\/api/, ''))

/* ---------- 1.1.3 / 1.2.4 Status management ---------- */
// PATCH /api/certification-requests/:id/status   body: { status, remark? }
export const updateRequestStatus = ({ id, status, remark }) =>
  http(`/certification-requests/${enc(id)}/status`, { method: 'PATCH', body: { status, remark } })

/* ---------- 1.1.4 Remarks ---------- */
// POST /api/certification-requests/:id/remarks   body: { text }
export const addRemark = ({ id, text }) =>
  http(`/certification-requests/${enc(id)}/remarks`, { method: 'POST', body: { text } })

/* ---------- 1.2.3 Requirement validation ---------- */
// PUT /api/certification-requests/:id/requirements/:name/validation   body: { status, remarks }
export const validateRequirement = ({ id, name, status, remarks }) =>
  http(`/certification-requests/${enc(id)}/requirements/${enc(name)}/validation`, { method: 'PUT', body: { status, remarks } })

/* ---------- 2.3.1 BHW dashboard ---------- */
// GET /api/bhw/summary  ->  { residents, households, verification: { unverified, verified, needs_correction } }
export const getBhwSummary = () => http('/bhw/summary')

/* ---------- 2.1 Residents ---------- */
// GET /api/residents?q=&purok=&householdId=&verification=&page=&pageSize=  ->  { items, total, page, pageSize, totalPages }
export const listResidents = ({ q, purok, householdId, verification, page, pageSize } = {}) =>
  http(`/residents${qs({ q, purok, householdId, verification, page, pageSize })}`)

// GET /api/residents/:id
export const getResident = ({ id }) => http(`/residents/${enc(id)}`)

// POST /api/residents   body: person fields + householdId + relationship  (BHW)
export const createResident = (body) => http('/residents', { method: 'POST', body })

// PUT /api/residents/:id   body: person fields + relationship + version  (BHW)
export const updateResident = ({ id, ...body }) => http(`/residents/${enc(id)}`, { method: 'PUT', body })

// PATCH /api/residents/:id/verification   body: { status, remarks }  (BHW)
export const verifyResident = ({ id, status, remarks }) =>
  http(`/residents/${enc(id)}/verification`, { method: 'PATCH', body: { status, remarks } })

// PATCH /api/residents/:id/household   body: { householdId, relationship, version }  (BHW)
export const reassignResident = ({ id, householdId, relationship, version }) =>
  http(`/residents/${enc(id)}/household`, { method: 'PATCH', body: { householdId, relationship, version } })

// GET /api/residents/:id/history  (BHW)  ->  audit trail, newest first
export const getResidentHistory = ({ id }) => http(`/residents/${enc(id)}/history`)

/* ---------- 2.2 Households ---------- */
// GET /api/households?q=&purok=&page=&pageSize=  ->  { items, total, page, pageSize, totalPages }
export const listHouseholds = ({ q, purok, page, pageSize } = {}) => http(`/households${qs({ q, purok, page, pageSize })}`)

// GET /api/households/:id  (includes members)
export const getHousehold = ({ id }) => http(`/households/${enc(id)}`)

// POST /api/households   body: { address, purok, tenure, contact, headId } or { ..., head: { person fields } }  (BHW)
export const createHousehold = (body) => http('/households', { method: 'POST', body })

// PUT /api/households/:id   body: { headId, address, purok, tenure, contact, version }  (BHW and Secretary)
// A 409 means somebody else saved first; the error's data.conflict says who and when.
export const updateHousehold = ({ id, ...body }) => http(`/households/${enc(id)}`, { method: 'PUT', body })

/* ---------- Resident side: submit a certificate request ---------- */
// POST /api/certification-requests   (public, no login). multipart/form-data: the form fields plus one
// file per requirement, each sent under the requirement's name. `files` is [{ requirement, file }].
export function submitRequest({ files = [], ...fields }) {
  const body = new FormData()
  for (const [k, v] of Object.entries(fields)) body.append(k, String(v ?? ''))
  for (const { requirement, file } of files) body.append(requirement, file, file.name)
  return http('/certification-requests', { method: 'POST', body, auth: false })
}
