import { useEffect, useRef } from 'react'

// 2.3.1 Calls `reload` again every `ms`, and whenever the tab becomes visible or gets focus again,
// so numbers on screen do not go stale while the page stays open.
export function useAutoRefresh(reload, ms = 30000) {
  const latest = useRef(reload)
  useEffect(() => {
    latest.current = reload
  })
  useEffect(() => {
    const tick = () => {
      if (document.visibilityState === 'visible') latest.current()
    }
    const timer = setInterval(tick, ms)
    window.addEventListener('focus', tick)
    document.addEventListener('visibilitychange', tick)
    return () => {
      clearInterval(timer)
      window.removeEventListener('focus', tick)
      document.removeEventListener('visibilitychange', tick)
    }
  }, [ms])
}
