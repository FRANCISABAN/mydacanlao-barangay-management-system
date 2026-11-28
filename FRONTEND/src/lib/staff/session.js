// Stores the login token and user returned by POST /api/auth/login.
// Kept in localStorage so a page refresh does not log the Secretary out.
const KEY = 'mydacanlao.session'
const subs = new Set()

const expired = (token) => {
  try {
    const { exp } = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')))
    return typeof exp === 'number' && exp * 1000 <= Date.now()
  } catch {
    return true
  }
}

function read() {
  try {
    const s = JSON.parse(localStorage.getItem(KEY))
    return s?.token && s?.user && !expired(s.token) ? s : null
  } catch {
    return null
  }
}

let session = read()
const emit = () => subs.forEach((f) => f())

export const getSession = () => session
export const getToken = () => session?.token ?? null
export const subscribe = (cb) => {
  subs.add(cb)
  return () => subs.delete(cb)
}

export function setSession(next) {
  session = next
  try {
    localStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    /* storage blocked: the session still works until the tab is closed */
  }
  emit()
}

export function clearSession() {
  if (!session) return
  session = null
  try {
    localStorage.removeItem(KEY)
  } catch {
    /* ignore */
  }
  emit()
}

// Keeps several open tabs in sync (log in or out in one, the others follow).
window.addEventListener('storage', (e) => {
  if (e.key !== KEY) return
  session = read()
  emit()
})
