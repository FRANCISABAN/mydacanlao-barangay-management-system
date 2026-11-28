import { useSyncExternalStore } from 'react'

const subscribe = (cb) => {
  window.addEventListener('hashchange', cb)
  return () => window.removeEventListener('hashchange', cb)
}
const snapshot = () => window.location.hash.slice(1) || '/'

export const useHash = () => useSyncExternalStore(subscribe, snapshot)
export const go = (path) => {
  window.location.hash = path
}
export const parseHash = () => {
  const u = new URL(snapshot(), 'http://local')
  return { path: u.pathname, params: u.searchParams }
}
