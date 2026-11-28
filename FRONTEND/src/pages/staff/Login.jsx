import { useState } from 'react'
import { login, useAuth } from '../../lib/staff/auth.js'
import { go } from '../../lib/staff/router.js'
import { toast } from '../../lib/staff/toast.js'
import { Field, Link } from '../../components/staff/ui.jsx'
import PublicBar from '../../components/staff/PublicBar.jsx'

export default function Login() {
  const { signedIn } = useAuth()
  const [form, setForm] = useState({ username: '', password: '' })
  const [errors, setErrors] = useState({})
  const [busy, setBusy] = useState(false)
  const [formErr, setFormErr] = useState('')
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  async function submit(e) {
    e.preventDefault()
    const next = {}
    if (!form.username.trim()) next.username = 'Enter your username.'
    if (!form.password) next.password = 'Enter your password.'
    setErrors(next)
    if (Object.keys(next).length) return
    setBusy(true)
    setFormErr('')
    try {
      const user = await login({ username: form.username.trim(), password: form.password })
      toast(`Logged in as ${user.label}.`)
      go('/requests')
    } catch (err) {
      setFormErr(err.message)
      setBusy(false)
    }
  }

  return (
    <>
      <PublicBar />
      <main className="landing narrow">
        <form className="panel form" onSubmit={submit} noValidate>
          <h1>Staff log in</h1>
          <p className="sub">For the Barangay Secretary account.</p>
          {signedIn && <p className="note">You are already logged in. <Link to="/dashboard" className="link">Open dashboard</Link></p>}
          {formErr && <p className="note error" role="alert">{formErr}</p>}
          <Field label="Username" error={errors.username}>
            <input value={form.username} onChange={set('username')} autoComplete="username" />
          </Field>
          <Field label="Password" error={errors.password}>
            <input type="password" value={form.password} onChange={set('password')} autoComplete="current-password" />
          </Field>
          <div className="row end">
            <Link to="/" className="btn ghost">Back to home</Link>
            <button className="btn primary" disabled={busy}>{busy ? 'Logging in…' : 'Log in'}</button>
          </div>
        </form>
      </main>
    </>
  )
}
