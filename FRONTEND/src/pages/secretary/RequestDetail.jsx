import { useRef, useState } from 'react'
import * as api from '../../api/staff/index.js'
import { useQuery } from '../../lib/staff/useQuery.js'
import { useAuth } from '../../lib/staff/auth.js'
import { toast } from '../../lib/staff/toast.js'
import { ACTIONS, TRANSITIONS, VALIDATION } from '../../lib/staff/constants.js'
import { fmtDate, fmtDateTime, fmtSize } from '../../lib/staff/format.js'
import { ErrorState, Field, Link, Loading, Modal, PageHeader, StatusBadge } from '../../components/staff/ui.jsx'

const FIELDS = [
  ['Full name', 'fullName'],
  ['Birth date', 'birthDate'],
  ['Civil status', 'civilStatus'],
  ['Address', 'address'],
  ['Contact number', 'contact'],
]
const norm = (s) => String(s ?? '').trim().toLowerCase()
const show = (key, v) => (!v ? '' : key === 'birthDate' ? fmtDate(v) : v)
const checkOf = (sub, rec) => (!norm(sub) ? 'missing' : !rec ? 'unverified' : norm(sub) === norm(rec) ? 'match' : 'differs')
const CHECK = { match: 'Matches', differs: 'Differs from record', missing: 'Missing', unverified: 'Not verified' }

export default function RequestDetail({ id }) {
  const { data: req, error, reload } = useQuery('getRequest', { id })
  if (error) return <ErrorState error={error} onRetry={reload} back="/requests" />
  if (!req) return <Loading />

  const problems = req.requirements.filter((q) => !q.file || ['invalid', 'resubmit'].includes(q.validation.status))
  const validCount = req.requirements.filter((q) => q.validation.status === 'valid').length

  return (
    <>
      <PageHeader
        back={{ to: '/requests', label: 'Certification requests' }}
        title={req.type}
        sub={`Request ${req.id} for ${req.beneficiary && !req.beneficiary.isSelf ? `${req.beneficiary.name} (requested by ${req.submitted.fullName})` : req.submitted.fullName}. Purpose: ${req.purpose}.`}
        actions={<StatusBadge status={req.status} />}
      />
      <div className="detail-grid">
        <div className="detail-main">
          <p>Applicant: {req.submitted.fullName} · Submitted: {fmtDate(req.submittedAt)}</p>


        </div>
        <aside className="detail-side">

        </aside>
      </div>
    </>
  )
}

/* 1.2.1 Applicant information review */
function ApplicantReview({ req }) {
  const rows = FIELDS.map(([label, key]) => ({ label, key, sub: req.submitted[key], rec: req.record?.[key], check: checkOf(req.submitted[key], req.record?.[key]) }))
  const flagged = rows.filter((r) => r.check === 'differs' || r.check === 'missing')
  return (
    <section className="panel" aria-labelledby="app-h">
      <div className="panel-head">
        <h2 id="app-h">Applicant information</h2>
        {req.householdId && <Link to={`/households/${req.householdId}`} className="link">Household {req.householdId}</Link>}
      </div>
      {req.beneficiary && (
        <div className="note">
          <strong>Para kanino ang certificate:</strong>{' '}
          {req.beneficiary.isSelf ? 'Sa mismong humihingi (sarili).' : `${req.beneficiary.name} (${req.beneficiary.relation} ng humihingi).`}
          {!req.beneficiary.isSelf && ' Tiyaking tugma ang mga dokumento sa taong pagbibigyan.'}
        </div>
      )}
      {!req.record && <p className="note warn">No resident record matches this applicant. Verify identity from the documents before approving.</p>}
      {flagged.length > 0 && (
        <p className="note warn">
          {flagged.length} {flagged.length === 1 ? 'item needs' : 'items need'} attention: {flagged.map((f) => f.label.toLowerCase()).join(', ')}.
        </p>
      )}
      <div className="table-wrap">
        <table>
          <thead><tr><th>Field</th><th>Submitted by applicant</th><th>Resident record</th><th>Check</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.key}>
                <th scope="row">{r.label}</th>
                <td>{show(r.key, r.sub) || <span className="muted">Not provided</span>}</td>
                <td>{show(r.key, r.rec) || <span className="muted">—</span>}</td>
                <td><span className={`check ${r.check}`}>{CHECK[r.check]}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {req.extra && (
        <dl className="kv wide">
          <dt>Botante ng Dacanlao</dt><dd>{req.extra.voter ? 'Oo' : 'Hindi'}</dd>
          <dt>Katayuan sa form</dt><dd>{req.extra.civilLabel}{req.extra.boarder ? ', boarder' : ''}</dd>
        </dl>
      )}
      <dl className="kv wide">
        <dt>Email address</dt>
        <dd>{req.submitted.email ? <a href={`mailto:${req.submitted.email}`}>{req.submitted.email}</a> : <span className="muted">Not provided</span>}</dd>
      </dl>
    </section>
  )
}

/* 1.2.2 / 1.2.3 Requirements and validation */
function Requirements({ req, onChanged }) {
  const { can } = useAuth()
  const editable = false
  return (
    <section className="panel" aria-labelledby="req-h">
      <div className="panel-head"><h2 id="req-h">Submitted requirements</h2></div>
      {!editable && (
        <p className="note">
          {req.status === 'pending' ? 'Start the review to validate these documents.' : req.status === 'under_review' ? 'Your account can view but not validate requirements.' : 'Validation is locked because this request is no longer under review.'}
        </p>
      )}
      <ul className="req-list">
        {req.requirements.map((item) => (
          <RequirementRow key={item.name} req={req} item={item} editable={editable} onChanged={onChanged} />
        ))}
      </ul>
    </section>
  )
}

function RequirementRow({ req, item, editable, onChanged }) {
  const [draft, setDraft] = useState(null)
  const [viewing, setViewing] = useState(false)
  const [preview, setPreview] = useState({})
  const seq = useRef(0)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const v = item.validation
  const isImage = !!item.file?.type?.startsWith('image/')
  const isPdf = item.file?.type === 'application/pdf' || /\.pdf$/i.test(item.file?.name || '')

  // 1.2.2 The document is only served to a logged-in Secretary, so it is fetched with the token
  // and shown from a temporary object URL instead of a plain link.
  async function openFile() {
    const mine = ++seq.current
    setViewing(true)
    if (!item.file.url) return setPreview({})
    setPreview({ loading: true })
    try {
      const blob = await api.getRequirementFile({ url: item.file.url })
      if (mine === seq.current) setPreview({ src: URL.createObjectURL(blob) })
    } catch (e) {
      if (mine === seq.current) setPreview({ error: e.message })
    }
  }
  function closeFile() {
    seq.current++
    if (preview.src) URL.revokeObjectURL(preview.src)
    setPreview({})
    setViewing(false)
  }

  async function save(status, remarks) {
    setBusy(true)
    setErr('')
    try {
      await api.validateRequirement({ id: req.id, name: item.name, status, remarks })
      toast(`${item.name}: marked ${VALIDATION[status].toLowerCase()}.`)
      setDraft(null)
      onChanged()
    } catch (e) {
      setErr(e.message)
    } finally {
      setBusy(false)
    }
  }
  const choose = (status) => (status === 'valid' ? save('valid', '') : setDraft({ status, remarks: v.remarks || '' }))

  return (
    <li className="req">
      <div className="req-top">
        <div>
          <strong>{item.name}</strong>
          <div className="small muted">
            {item.file ? `${item.file.name}, ${fmtSize(item.file.size)}, uploaded ${fmtDate(item.file.uploadedAt)}` : 'Not submitted'}
          </div>
        </div>
        <div className="row">
          <span className={`vtag v-${item.file ? v.status : 'missing'}`}>{item.file ? VALIDATION[v.status] : 'Missing'}</span>
          {item.file && <button className="btn small" onClick={openFile}>View file</button>}
        </div>
      </div>
      {v.remarks && !draft && <p className="req-remark"><span className="muted">Remarks:</span> {v.remarks} <span className="muted small">({fmtDate(v.validatedAt)})</span></p>}
      {editable && (
        <div className="seg-btns" role="group" aria-label={`Validate ${item.name}`}>
          <button className="btn small" aria-pressed={v.status === 'valid'} disabled={busy || !item.file} onClick={() => choose('valid')}>Valid</button>
          <button className="btn small" aria-pressed={v.status === 'invalid' || draft?.status === 'invalid'} disabled={busy || !item.file} onClick={() => choose('invalid')}>Invalid</button>
          <button className="btn small" aria-pressed={v.status === 'resubmit' || draft?.status === 'resubmit'} disabled={busy} onClick={() => choose('resubmit')}>Needs resubmission</button>
        </div>
      )}
      {draft && (
        <div className="draft">
          <Field label={`Remarks for ${VALIDATION[draft.status].toLowerCase()} (required)`} error={err}>
            <textarea rows={2} maxLength={300} value={draft.remarks} onChange={(e) => setDraft({ ...draft, remarks: e.target.value })} placeholder="Say what is missing or wrong so the applicant can fix it." />
          </Field>
          <div className="row">
            <button className="btn primary small" disabled={busy} onClick={() => save(draft.status, draft.remarks)}>{busy ? 'Saving…' : 'Save validation'}</button>
            <button className="btn ghost small" disabled={busy} onClick={() => { setDraft(null); setErr('') }}>Cancel</button>
          </div>
        </div>
      )}
      {!draft && err && <p className="field-error" role="alert">{err}</p>}
      {viewing && (
        <Modal wide title={item.file.name} onClose={closeFile}>
          <div className="preview">
            <p><strong>{item.name}</strong></p>
            {preview.loading ? (
              <p className="muted">Loading the document…</p>
            ) : preview.error ? (
              <p className="field-error" role="alert">{preview.error}</p>
            ) : preview.src && isImage ? (
              <img className="document-preview" src={preview.src} alt={item.file.name} />
            ) : preview.src && isPdf ? (
              <iframe className="document-preview pdf-preview" src={preview.src} title={`Preview of ${item.file.name}`} />
            ) : (
              <p className="muted">Walang preview para sa dokumentong ito.</p>
            )}
          </div>
        </Modal>
      )}
    </li>
  )
}

/* 1.1.4 Remarks */
function Remarks({ req, onChanged }) {
  const { can } = useAuth()
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  async function save(e) {
    e.preventDefault()
    setBusy(true)
    setErr('')
    try {
      await api.addRemark({ id: req.id, text })
      toast('Remark saved.')
      setText('')
      onChanged()
    } catch (e2) {
      setErr(e2.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="panel" aria-labelledby="rem-h">
      <div className="panel-head"><h2 id="rem-h">Remarks</h2></div>
      {req.remarks.length === 0 ? (
        <p className="muted">No remarks yet.</p>
      ) : (
        <ul className="remarks">
          {req.remarks.map((r) => (
            <li key={r.id}>
              <p>{r.text}</p>
              <span className="muted small">{r.author}, {fmtDateTime(r.at)}</span>
            </li>
          ))}
        </ul>
      )}
      {can('cert:manage') && (
        <form onSubmit={save} className="remark-form">
          <Field label="Add a remark" error={err} hint={`${text.length}/500`}>
            <textarea rows={3} maxLength={500} value={text} onChange={(e) => setText(e.target.value)} placeholder="Record an observation, explanation, or reason for this request." />
          </Field>
          <button className="btn primary" disabled={busy || !text.trim()}>{busy ? 'Saving…' : 'Save remark'}</button>
        </form>
      )}
    </section>
  )
}

/* 1.1.3 / 1.2.4 Status and incomplete requirement handling */
function StatusPanel({ req, problems, validCount, onChanged }) {
  const { can } = useAuth()
  const [target, setTarget] = useState(null)
  const next = TRANSITIONS[req.status]
  const allValid = validCount === req.requirements.length

  return (
    <section className="panel" aria-labelledby="st-h">
      <h2 id="st-h">Status</h2>
      <p><StatusBadge status={req.status} /></p>
      <dl className="kv">
        <dt>Submitted</dt><dd>{fmtDateTime(req.submittedAt)}</dd>
        <dt>Last updated</dt><dd>{fmtDateTime(req.updatedAt)}</dd>
        <dt>Reviewed by</dt><dd>{req.reviewedBy || 'Not yet reviewed'}</dd>
        <dt>Requirements</dt><dd>{validCount} of {req.requirements.length} valid</dd>
      </dl>

      {problems.length > 0 && (
        <div className="issues">
          <h3>Incomplete or invalid</h3>
          <ul>
            {problems.map((q) => (
              <li key={q.name}>
                <strong>{q.name}</strong>
                <span className="small">{!q.file ? 'Not submitted' : q.validation.remarks || VALIDATION[q.validation.status]}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {!can('cert:manage') ? (
        <p className="note">Your account can view this request but not change its status.</p>
      ) : next.length === 0 ? (
        <p className="note">This request is closed. Its status can no longer be changed.</p>
      ) : (
        <div className="status-actions">
          {next.map((to) => {
            const a = ACTIONS[to]
            const label = req.status === 'resubmission' && to === 'under_review' ? 'Resume review' : a.label
            const blocked = to === 'approved' && !allValid
            return (
              <button key={to} className={`btn ${a.kind}`} disabled={blocked} onClick={() => setTarget(to)}>{label}</button>
            )
          })}
          {next.includes('approved') && !allValid && <p className="small muted">Approval unlocks when every requirement is valid.</p>}
        </div>
      )}

      {target && <StatusDialog req={req} to={target} onClose={() => setTarget(null)} onDone={() => { setTarget(null); onChanged() }} />}
    </section>
  )
}

function StatusDialog({ req, to, onClose, onDone }) {
  const a = ACTIONS[to]
  const [remark, setRemark] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const label = req.status === 'resubmission' && to === 'under_review' ? 'Resume review' : a.label

  async function confirm() {
    setBusy(true)
    setErr('')
    try {
      const res = await api.updateRequestStatus({ id: req.id, status: to, remark })
      // The backend emails the applicant and reports the result: 'sent' | 'failed' | 'skipped'.
      const skipped = {
        no_email: ' No email was sent: this request has no valid email address from the applicant.',
        no_key: ' No email was sent: the email service is not set up (SMTP_USER and SMTP_PASS are missing in the backend .env, or the backend was not restarted).',
      }[res?.emailReason] ?? ' No email was sent to the applicant.'
      const note = res?.email === 'sent' ? ' The applicant was notified by email.' : res?.email === 'skipped' ? skipped : ''
      toast(`${req.id}: ${label.toLowerCase()} done.${note}`)
      if (res?.email === 'failed') toast(`The status was saved, but the email to the applicant could not be sent. ${res.emailDetail || 'Check the backend console.'}`, 'error')
      onDone()
    } catch (e) {
      setErr(e.message)
      setBusy(false)
    }
  }

  return (
    <Modal
      title={label}
      onClose={onClose}
      footer={
        <>
          <button className="btn ghost" onClick={onClose} disabled={busy}>Cancel</button>
          <button className={`btn ${a.kind}`} onClick={confirm} disabled={busy || (a.needsRemark && !remark.trim())}>{busy ? 'Saving…' : label}</button>
        </>
      }
    >
      <p>{req.type} for {req.submitted.fullName} ({req.id}).</p>
      <Field label={a.needsRemark ? 'Remark (required)' : 'Remark (optional)'} error={err}>
        <textarea rows={3} maxLength={500} value={remark} onChange={(e) => setRemark(e.target.value)} placeholder={a.needsRemark ? 'Explain the reason. It is included in the email to the applicant.' : 'Add a note for the record. It is not emailed.'} />
      </Field>
    </Modal>
  )
}
