import { clearSession, getToken } from '../../lib/staff/session.js'

export class ApiError extends Error {
  // data: the whole error body, so callers can read { conflict } or { duplicate } when the server sends them.
  constructor(message, status = 400, fields, data) {
    super(message)
    this.status = status
    this.fields = fields
    this.data = data
  }
}

// In development "/api" goes through the Vite proxy (see vite.config.js), so there is no CORS to worry about.
// When the frontend and backend are hosted separately, set VITE_API_URL, e.g. https://api.example.com/api
const BASE = (import.meta.env.VITE_API_URL || '/api').replace(/\/+$/, '')

// Builds "?a=1&b=2" and leaves out empty values, so filters that are not set are not sent.
export function qs(params = {}) {
  const p = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    const s = String(v ?? '').trim()
    if (s) p.set(k, s)
  }
  const s = p.toString()
  return s ? `?${s}` : ''
}

async function send(path, { method = 'GET', body, auth = true } = {}) {
  const headers = {}
  const token = auth ? getToken() : null
  if (token) headers.Authorization = `Bearer ${token}`

  const init = { method, headers }
  if (body instanceof FormData) {
    init.body = body // the browser sets the multipart boundary itself
  } else if (body !== undefined) {
    headers['Content-Type'] = 'application/json'
    init.body = JSON.stringify(body)
  }

  let res
  try {
    res = await fetch(BASE + path, init)
  } catch {
    throw new ApiError('Cannot reach the server. Make sure the backend is running, then try again.', 0)
  }

  if (!res.ok) {
    const data = await res.json().catch(() => null)
    if (res.status === 401 && token) clearSession() // expired or invalid token: App sends the user back to /login
    throw new ApiError(data?.message || `Request failed (${res.status}).`, res.status, data?.fields, data ?? undefined)
  }
  return res
}

export const http = async (path, opts) => (await send(path, opts)).json()
export const httpBlob = async (path, opts) => (await send(path, opts)).blob()
