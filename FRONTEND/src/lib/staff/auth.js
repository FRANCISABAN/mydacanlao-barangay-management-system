import { useSyncExternalStore } from 'react'
import { http } from '../../api/staff/http.js'
import { clearSession, getSession, setSession, subscribe } from './session.js'

/* 1.4.2 Permissions come from the backend (POST /api/auth/login). The UI only uses them to hide
   what the Secretary cannot do; the backend still checks every request. */

// POST /api/auth/login  ->  { token, user: { id, username, name, role, label, perms } }
export async function login({ username, password }) {
  const { token, user } = await http('/auth/login', { method: 'POST', body: { username, password }, auth: false })
  setSession({ token, user })
  return user
}

export const logout = () => clearSession()
export const can = (perm) => !!getSession()?.user.perms.includes(perm)
export const currentName = () => getSession()?.user.name ?? ''

export function useAuth() {
  const session = useSyncExternalStore(subscribe, getSession)
  const user = session?.user
  return {
    key: user?.role,
    signedIn: !!session,
    label: user?.label ?? '',
    name: user?.name ?? '',
    can: (perm) => !!user?.perms.includes(perm),
  }
}
