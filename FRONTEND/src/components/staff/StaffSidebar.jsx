import { BARANGAY } from '../../lib/staff/constants.js'
import { logout } from '../../lib/staff/auth.js'
import { go } from '../../lib/staff/router.js'
import { Icon, Link } from './ui.jsx'

// The original staff sidebar, shared unchanged by Secretary and BHW.
// Navigation remains filtered by the existing permissions.
export default function StaffSidebar({ auth, path, nav, allowed }) {
  const NAV = nav
  const active = (n) => path === n.to || path.startsWith(n.to + '/')
  return (
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
  )
}
