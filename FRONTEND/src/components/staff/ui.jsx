import { useEffect, useRef, useSyncExternalStore } from 'react'
import { STATUS, VERIFICATION } from '../../lib/staff/constants.js'
import { dismiss, getToasts, subscribe } from '../../lib/staff/toast.js'

const ICONS = {
  dashboard: 'M3 3h7v9H3zM14 3h7v5h-7zM14 12h7v9h-7zM3 16h7v5H3z',
  file: 'M6 3h8l4 4v14H6zM14 3v4h4M9 12h6M9 16h6',
  users: 'M16 19v-1a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v1M10 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM20 19v-1a3 3 0 0 0-2.5-2.9M15.5 4.2a3.5 3.5 0 0 1 0 6.6',
  home: 'M3 11l9-8 9 8M5 10v10h5v-6h4v6h5V10',
  search: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-4-4',
  x: 'M6 6l12 12M18 6L6 18',
  lock: 'M6 11h12v9H6zM8 11V8a4 4 0 0 1 8 0v3',
  back: 'M19 12H5M11 6l-6 6 6 6',
  plus: 'M12 5v14M5 12h14',
  edit: 'M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4',
}

export function Icon({ name, size = 18 }) {
  return (
    <svg className="icon" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={ICONS[name]} />
    </svg>
  )
}

export function Link({ to, ...props }) {
  return <a href={'#' + to} {...props} />
}

export function StatusBadge({ status }) {
  const s = STATUS[status]
  return <span className={`badge tone-${s.tone}`}>{s.label}</span>
}

// 2.1.2 Verification result of a resident.
export function VerificationBadge({ status }) {
  const v = VERIFICATION[status] ?? VERIFICATION.unverified
  return <span className={`badge tone-${v.tone}`}>{v.label}</span>
}

// 2.1.3 / 2.2.3 Previous / Next controls for a paginated list.
export function Pagination({ page, totalPages, total, pageSize, onPage, noun = 'records' }) {
  if (!total) return null
  const from = (page - 1) * pageSize + 1
  const to = Math.min(total, page * pageSize)
  return (
    <nav className="pager" aria-label="Pagination">
      <p className="muted small" aria-live="polite">Showing {from}–{to} of {total} {noun}</p>
      <div className="pager-btns">
        <button type="button" className="btn small" disabled={page <= 1} onClick={() => onPage(1)} aria-label="First page">First</button>
        <button type="button" className="btn small" disabled={page <= 1} onClick={() => onPage(page - 1)}>Previous</button>
        <span className="pager-page">Page {page} of {totalPages}</span>
        <button type="button" className="btn small" disabled={page >= totalPages} onClick={() => onPage(page + 1)}>Next</button>
        <button type="button" className="btn small" disabled={page >= totalPages} onClick={() => onPage(totalPages)} aria-label="Last page">Last</button>
      </div>
    </nav>
  )
}

export function PageHeader({ title, sub, actions, back }) {
  return (
    <header className="page-head">
      {back && (
        <Link to={back.to} className="back">
          <Icon name="back" size={16} /> {back.label}
        </Link>
      )}
      <div className="page-head-row">
        <div>
          <h1>{title}</h1>
          {sub && <p className="sub">{sub}</p>}
        </div>
        {actions && <div className="actions">{actions}</div>}
      </div>
    </header>
  )
}

export function SearchBox({ value, onChange, placeholder, label }) {
  return (
    <label className="search">
      <span className="sr-only">{label}</span>
      <Icon name="search" size={16} />
      <input type="search" value={value} onChange={onChange} placeholder={placeholder} />
    </label>
  )
}

export function Field({ label, error, hint, children }) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      {children}
      {hint && !error && <span className="field-hint">{hint}</span>}
      {error && <span className="field-error" role="alert">{error}</span>}
    </label>
  )
}

export function Empty({ title, children }) {
  return (
    <div className="empty">
      <strong>{title}</strong>
      {children && <p>{children}</p>}
    </div>
  )
}

export function Loading({ label = 'Loading…' }) {
  return <p className="loading" role="status">{label}</p>
}

export function ErrorState({ error, onRetry, back }) {
  const denied = error?.status === 403
  return (
    <div className="empty error-state" role="alert">
      <strong>{denied ? 'Access restricted' : error?.status === 404 ? 'Record not found' : 'Something went wrong'}</strong>
      <p>{error?.message || 'Try again in a moment.'}</p>
      <div className="row">
        {onRetry && !denied && <button className="btn" onClick={onRetry}>Try again</button>}
        {back && <Link to={back} className="btn">Go back</Link>}
      </div>
    </div>
  )
}

export function Modal({ title, onClose, children, footer, wide }) {
  const ref = useRef(null)
  useEffect(() => {
    const d = ref.current
    d.showModal()
    return () => d.close()
  }, [])
  return (
    <dialog
      ref={ref}
      className={wide ? 'modal wide' : 'modal'}
      onCancel={(e) => {
        e.preventDefault()
        onClose()
      }}
      onClick={(e) => e.target === ref.current && onClose()}
    >
      <div className="modal-head">
        <h2>{title}</h2>
        <button className="icon-btn" aria-label="Close" onClick={onClose}><Icon name="x" /></button>
      </div>
      <div className="modal-body">{children}</div>
      {footer && <div className="modal-foot">{footer}</div>}
    </dialog>
  )
}

export function Toaster() {
  const items = useSyncExternalStore(subscribe, getToasts)
  return (
    <div className="toasts" aria-live="polite">
      {items.map((t) => (
        <div key={t.id} className={`toast ${t.type}`}>
          <span>{t.message}</span>
          <button className="icon-btn" aria-label="Dismiss message" onClick={() => dismiss(t.id)}><Icon name="x" size={14} /></button>
        </div>
      ))}
    </div>
  )
}
