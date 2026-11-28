import { useEffect } from 'react'
import { BARANGAY } from '../../lib/staff/constants.js'
import { logout, useAuth } from '../../lib/staff/auth.js'
import { go, parseHash, useHash } from '../../lib/staff/router.js'
import { attachDesignEffects } from '../../lib/staff/designEffects.js'
import { Icon, Link, Toaster } from '../../components/staff/ui.jsx'
import Landing from './Landing.jsx'
import Login from './Login.jsx'
import ResidentRequest from './ResidentRequest.jsx'
import Dashboard from '../secretary/Dashboard.jsx'
import BhwDashboard from '../bhw/BhwDashboard.jsx'
import Requests from '../secretary/Requests.jsx'
import RequestDetail from '../secretary/RequestDetail.jsx'
import Residents from './Residents.jsx'
import { ResidentEdit, ResidentRegister } from '../bhw/ResidentForm.jsx'
import { HouseholdDetail, HouseholdEdit, HouseholdRegister, Households } from './Households.jsx'

/* 1.4.2 / 2.3.2 Show only the navigation allowed for the signed-in account (Secretary or BHW).
   `perm` can be a list: the account needs any one of them. */
const NAV = [
  { to: '/dashboard', label: 'Dashboard', icon: 'dashboard', perm: ['cert:view', 'summary:view'] },
  { to: '/requests', label: 'Certification requests', icon: 'file', perm: 'cert:view' },
  { to: '/residents', label: 'Residents', icon: 'users', perm: 'resident:view' },
  { to: '/households', label: 'Households', icon: 'home', perm: 'household:view' },
]

// Is the account allowed? `perm` is one permission or a list (any one is enough).
const allowed = (can, perm) => [].concat(perm).some((p) => can(p))

function match(path, can) {
  const [a, b, c] = path.split('/').filter(Boolean)
  if (!a) return { open: true, el: <Landing /> }
  if (a === 'login') return { open: true, el: <Login /> }
  if (a === 'request') return { open: true, el: <ResidentRequest key={path + window.location.hash} /> }
  // The same address shows the dashboard that fits the role.
  if (a === 'dashboard') return can('cert:view') ? { perm: 'cert:view', el: <Dashboard /> } : { perm: 'summary:view', el: <BhwDashboard /> }
  if (a === 'requests') return b ? { perm: 'cert:view', el: <RequestDetail id={b} key={b} /> } : { perm: 'cert:view', el: <Requests /> }
  if (a === 'residents') {
    if (!b) return { perm: 'resident:view', el: <Residents key={window.location.hash} /> }
    if (b === 'new') return { perm: 'resident:create', el: <ResidentRegister key={window.location.hash} /> }
    if (c === 'edit') return { perm: 'resident:edit', el: <ResidentEdit id={b} key={b} /> }
    return null
  }
  if (a === 'households') {
    if (!b) return { perm: 'household:view', el: <Households /> }
    if (b === 'new') return { perm: 'household:create', el: <HouseholdRegister /> }
    if (c === 'edit') return { perm: 'household:edit', el: <HouseholdEdit id={b} key={b} /> }
    return { perm: 'household:view', el: <HouseholdDetail id={b} key={b} /> }
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

  const active = (n) => path === n.to || path.startsWith(n.to + '/')

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
      <aside className="sidebar">
        <div className="brand">
          <span className="seal" aria-hidden="true">MD</span>
          <div>
            <strong>MyDacanlao</strong>
            <span>{BARANGAY}</span>
          </div>
        </div>
        <nav aria-label="Main">
          {NAV.filter((n) => allowed(auth.can, n.perm)).map((n) => (
            <Link key={n.to} to={n.to} className="nav-link" aria-current={active(n) ? 'page' : undefined}>
              <Icon name={n.icon} /> {n.label}
            </Link>
          ))}
        </nav>
        <div className="me">
          <strong>{auth.name}</strong>
          <span>{auth.label}</span>
          <button className="btn small out" onClick={() => { logout(); go('/') }}>Log out</button>
        </div>
      </aside>
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
