import { useEffect } from 'react'
import { useAuth } from '../../lib/staff/auth.js'
import { go, parseHash, useHash } from '../../lib/staff/router.js'
import { attachDesignEffects } from '../../lib/staff/designEffects.js'
import { Icon, Link, Toaster } from '../../components/staff/ui.jsx'
import SecretarySidebar from '../../components/staff/secretary/SecretarySidebar.jsx'
import Landing from './Landing.jsx'
import Login from './Login.jsx'
import ResidentRequest from './ResidentRequest.jsx'
import Requests from '../secretary/Requests.jsx'
import RequestDetail from '../secretary/RequestDetail.jsx'

/* 1.4.2 / 2.3.2 Show only the navigation allowed for the signed-in account (Secretary or BHW).
   `perm` can be a list: the account needs any one of them. */
const NAV = [
  { to: '/requests', label: 'Certification requests', icon: 'file', perm: 'cert:view' },
]

// Is the account allowed? `perm` is one permission or a list (any one is enough).
const allowed = (can, perm) => [].concat(perm).some((p) => can(p))

function match(path, can) {
  const [a, b, c] = path.split('/').filter(Boolean)
  if (!a) return { open: true, el: <Landing /> }
  if (a === 'login') return { open: true, el: <Login /> }
  if (a === 'request') return { open: true, el: <ResidentRequest key={path + window.location.hash} /> }
  // The same address shows the dashboard that fits the role.
  if (a === 'requests') return b ? { perm: 'cert:view', el: <RequestDetail id={b} key={b} /> } : { perm: 'cert:view', el: <Requests /> }
  if (a === 'residents') {
    return null
  }
  if (a === 'households') {
  }
  return null
}

function Redirect({ to }) {
  useEffect(() => {
    go(to)
  }, [to])
  return null
}

function Restricted({ title, text }) {
  const { can } = useAuth()
  const home = NAV.find((n) => allowed(can, n.perm))
  return (
    <div className="empty error-state" role="alert">
      <Icon name="lock" size={24} />
      <strong>{title}</strong>
      <p>{text}</p>
      {home && <Link to={home.to} className="btn">Go to {home.label.toLowerCase()}</Link>}
    </div>
  )
}

export default function App() {
  const hash = useHash()
  const auth = useAuth()
  const { path } = parseHash()
  const route = match(path, auth.can)

  useEffect(() => {
    const root = document.getElementById('root')
    return root ? attachDesignEffects(root) : undefined
  }, [])

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [hash])

  if (route?.open) {
    return (
      <>
        {route.el}
        <Toaster />
      </>
    )
  }
  if (route && !auth.signedIn) return <Redirect to="/login" />

  return (
    <div className="shell">
      <SecretarySidebar auth={auth} path={path} nav={NAV} allowed={allowed} />
      <main className="main">
        {!route ? (
          <Restricted title="Page not found" text="This page does not exist." />
        ) : !allowed(auth.can, route.perm) ? (
          <Restricted title="You can’t open this page" text={`Your ${auth.label} account does not have access to this part of the system. Use the menu to open the pages that are available to you.`} />
        ) : (
          route.el
        )}
      </main>
      <Toaster />
    </div>
  )
}
