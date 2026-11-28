import { useState } from 'react'
import { useQuery } from '../../lib/staff/useQuery.js'
import { CERT_TYPES, STATUS, STATUS_KEYS } from '../../lib/staff/constants.js'
import { fmtDate } from '../../lib/staff/format.js'
import { go, parseHash } from '../../lib/staff/router.js'
import { Empty, ErrorState, Link, Loading, PageHeader, SearchBox, StatusBadge } from '../../components/staff/ui.jsx'

const BLANK = { q: '', status: '', type: '', from: '', to: '' }

/* 1.1.1 / 1.1.2 Request listing, search, and filtering */
export default function Requests() {
  const [filters, setFilters] = useState(() => ({ ...BLANK, status: parseHash().params.get('status') || '' }))
  const { data, error, loading, reload } = useQuery('listRequests', filters)
  const set = (k) => (e) => setFilters((f) => ({ ...f, [k]: e.target.value }))
  const active = Object.values(filters).some(Boolean)

  return (
    <>
      <PageHeader title="Certification requests" sub="Open a request to review the applicant, check documents, and update its status." />

      <div className="toolbar">
        <SearchBox label="Search requests" placeholder="Search by applicant name or request number" value={filters.q} onChange={set('q')} />
        <label className="field compact">
          <span className="field-label">Status</span>
          <select value={filters.status} onChange={set('status')}>
            <option value="">All statuses</option>
            {STATUS_KEYS.map((k) => <option key={k} value={k}>{STATUS[k].label}</option>)}
          </select>
        </label>
        <label className="field compact">
          <span className="field-label">Certification</span>
          <select value={filters.type} onChange={set('type')}>
            <option value="">All types</option>
            {Object.keys(CERT_TYPES).map((t) => <option key={t}>{t}</option>)}
          </select>
        </label>
        <label className="field compact">
          <span className="field-label">Submitted from</span>
          <input type="date" value={filters.from} max={filters.to || undefined} onChange={set('from')} />
        </label>
        <label className="field compact">
          <span className="field-label">Submitted to</span>
          <input type="date" value={filters.to} min={filters.from || undefined} onChange={set('to')} />
        </label>
        {active && <button className="btn ghost" onClick={() => setFilters(BLANK)}>Clear filters</button>}
      </div>

      {error ? (
        <ErrorState error={error} onRetry={reload} />
      ) : !data ? (
        <Loading />
      ) : data.length === 0 ? (
        <Empty title="No requests found">{active ? 'Try a different name or clear the filters.' : 'Submitted requests will appear here.'}</Empty>
      ) : (
        <div className={`table-wrap card ${loading ? 'dim' : ''}`}>
          <table className="clickable">
            <caption className="sr-only">Certification requests</caption>
            <thead><tr><th>Applicant</th><th>Certification</th><th>Submitted</th><th>Status</th><th>Last updated</th></tr></thead>
            <tbody>
              {data.map((r) => (
                <tr key={r.id} onClick={() => go(`/requests/${r.id}`)}>
                  <td>
                    <Link to={`/requests/${r.id}`} className="link strong" onClick={(e) => e.stopPropagation()}>{r.applicantName}</Link>
                    <div className="muted small">{r.id}</div>
                  </td>
                  <td>{r.type}</td>
                  <td>{fmtDate(r.submittedAt)}</td>
                  <td><StatusBadge status={r.status} /></td>
                  <td>{fmtDate(r.updatedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {data && data.length > 0 && <p className="muted small count" aria-live="polite">{data.length} {data.length === 1 ? 'request' : 'requests'}</p>}
    </>
  )
}
