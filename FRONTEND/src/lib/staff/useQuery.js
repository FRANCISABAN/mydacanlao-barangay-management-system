import { useEffect, useState } from 'react'
import * as api from '../../api/staff/index.js'

// useQuery('listRequests', { q: 'ana' }) calls api.listRequests({ q: 'ana' }).
// Keeps the previous result on screen while refetching the same query.
export function useQuery(name, params = {}) {
  const [version, setVersion] = useState(0)
  const [state, setState] = useState({ key: null })
  const base = JSON.stringify([name, params])
  const key = base + version

  useEffect(() => {
    let live = true
    const [n, p] = JSON.parse(base)
    api[n](p).then(
      (data) => live && setState({ key, base, data }),
      (error) => live && setState({ key, base, error }),
    )
    return () => {
      live = false
    }
  }, [key, base])

  const same = state.base === base
  return {
    data: same ? state.data : undefined,
    error: same ? state.error : undefined,
    loading: state.key !== key,
    reload: () => setVersion((v) => v + 1),
  }
}
