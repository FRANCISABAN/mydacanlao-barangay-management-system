import { useQuery } from '../../lib/staff/useQuery.js'
import { fmtDate } from '../../lib/staff/format.js'
import { go } from '../../lib/staff/router.js'
import { Empty, ErrorState, Link, Loading, PageHeader, StatusBadge } from '../../components/staff/ui.jsx'

/* 1.1.1 Request listing */
export default function Requests() {
  const { data, error, loading, reload } = useQuery('listRequests', {})

  return (
    <>
      <PageHeader title="Certification requests" sub="Open a request to review the applicant, check documents, and update its status." />

      {error ? (
        <ErrorState error={error} onRetry={reload} />
      ) : !data ? (
        <Loading />
      ) : data.length === 0 ? (
        <Empty title="No requests found">Submitted requests will appear here.</Empty>
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
