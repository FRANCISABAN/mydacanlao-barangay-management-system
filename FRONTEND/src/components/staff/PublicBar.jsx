import { BARANGAY } from '../../lib/staff/constants.js'
import { useAuth } from '../../lib/staff/auth.js'
import { Link } from './ui.jsx'

export default function PublicBar({ landing = false }) {
  const { signedIn } = useAuth()
  return (
    <header className={`topbar${landing ? ' topbar-landing' : ''}`}>
      <Link to="/" className="brand-link">
        <span className="seal" aria-hidden="true">MD</span>
        <span>
          <strong>MyDacanlao</strong>
          <small>{BARANGAY}, Calaca, Batangas</small>
        </span>
      </Link>
      {landing && (
        <nav className="public-nav" aria-label="Landing page sections">
          <button type="button" onClick={() => document.getElementById('services')?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' })}>Services</button>
          <button type="button" onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' })}>How it works</button>
        </nav>
      )}
      <Link to={signedIn ? '/dashboard' : '/login'} className="btn">{signedIn ? 'Open dashboard' : 'Staff log in'}</Link>
    </header>
  )
}
