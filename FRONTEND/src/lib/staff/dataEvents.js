// 2.3.1 Tells the rest of the app (and other open tabs) that a resident or household record was
// created or changed, so the dashboard summary can refresh itself right away.
const KEY = 'mydacanlao.records-changed'
const EVENT = 'mydacanlao:records-changed'

export function announceChange() {
  window.dispatchEvent(new Event(EVENT))
  try {
    localStorage.setItem(KEY, String(Date.now())) // fires a "storage" event in the other tabs
  } catch {
    /* storage blocked: this tab still refreshes */
  }
}

export function onRecordsChanged(cb) {
  const fromStorage = (e) => e.key === KEY && cb()
  window.addEventListener(EVENT, cb)
  window.addEventListener('storage', fromStorage)
  return () => {
    window.removeEventListener(EVENT, cb)
    window.removeEventListener('storage', fromStorage)
  }
}
