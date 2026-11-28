import { useState } from 'react'
import * as api from '../../api/staff/index.js'
import { CERT_TYPES, PUROKS } from '../../lib/staff/constants.js'
import { ageFrom, fmtDate, fmtDateTime, todayISO } from '../../lib/staff/format.js'
import { parseHash } from '../../lib/staff/router.js'
import { toast } from '../../lib/staff/toast.js'
import { Field, Link } from '../../components/staff/ui.jsx'
import PublicBar from '../../components/staff/PublicBar.jsx'

const CIVIL = ['May asawa', 'Binata', 'Dalaga', 'Balo']
const MAX_MB = 5
const size = (b) => (b > 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`)

// Mirrors the barangay's paper request slip.
export default function ResidentRequest() {
  const initial = parseHash().params.get('type')
  const [form, setForm] = useState(() => ({
    date: todayISO(), name: '', address: '', purok: '', birthDate: '', contact: '', email: '',
    voter: '', civil: '', boarder: false,
    type: CERT_TYPES[initial] ? initial : '', purpose: '',
  }))
  const [files, setFiles] = useState({})
  const [errors, setErrors] = useState({})
  const [formErr, setFormErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(null)

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))
  const age = ageFrom(form.birthDate)
  const reqs = CERT_TYPES[form.type] || []

  function pick(name, e) {
    const file = e.target.files[0]
    if (file && file.size > MAX_MB * 1024 * 1024) {
      setErrors((x) => ({ ...x, [`file:${name}`]: `Hanggang ${MAX_MB} MB lang ang file.` }))
      e.target.value = ''
      return
    }
    setErrors((x) => ({ ...x, [`file:${name}`]: undefined }))
    setFiles((f) => ({ ...f, [name]: file || null }))
  }

  async function submit(e) {
    e.preventDefault()
    setBusy(true)
    setErrors({})
    setFormErr('')
    try {
      const attached = reqs.filter((n) => files[n]).map((n) => ({ requirement: n, file: files[n] }))
      const res = await api.submitRequest({ ...form, files: attached })
      toast('Naisumite na ang request.')
      // Snapshot of exactly what was sent, so the resident can review it after submitting.
      setDone({
        id: res.id,
        type: form.type,
        email: form.email.trim(),
        submittedAt: new Date().toISOString(),
        data: { ...form },
        docs: reqs.map((n) => ({ name: n, file: files[n] ? { name: files[n].name, size: files[n].size } : null })),
      })
    } catch (err) {
      setErrors(err.fields || {})
      setFormErr(err.fields?.files || err.message)
      setBusy(false)
    }
  }

  if (done) {
    const d = done.data
    const years = ageFrom(d.birthDate)
    const rows = [
      ['Petsa', fmtDate(d.date)],
      ['Pangalan', d.name],
      ['Tirahan', `${d.address}${d.purok ? `, Purok ${d.purok}` : ''}`],
      ['Petsa ng kapanganakan', `${fmtDate(d.birthDate)}${years != null ? ` (${years} taong gulang)` : ''}`],
      ['Contact number', d.contact || '—'],
      ['Email address', d.email],
      ['Botante ng Dacanlao', d.voter === 'yes' ? 'Oo' : d.voter === 'no' ? 'Hindi' : '—'],
      ['Katayuan', `${d.civil || '—'}${d.boarder ? ' (Boarder)' : ''}`],
      ['Certificate', done.type],
      ['Dahilan ng pagkuha', d.purpose || '—'],
    ]
    return (
      <>
        <PublicBar />
        <main className="landing narrow wide-form">
          <div className="panel receipt" role="status">
            <h1>Naisumite na ang request</h1>
            <p className="sub">{done.type}</p>
            <p className="gap">Request number mo: <strong>{done.id}</strong></p>
            <p className="small muted">Naisumite noong {fmtDateTime(done.submittedAt)}</p>

            <h2 className="receipt-title">Ito ang isinumite mo</h2>
            <dl className="kv wide">
              {rows.map(([k, v]) => (
                <div key={k} className="kv-row"><dt>{k}</dt><dd>{v}</dd></div>
              ))}
            </dl>

            <h2 className="receipt-title">Mga dokumento</h2>
            <ul className="receipt-docs">
              {done.docs.map((x) => (
                <li key={x.name}>
                  <strong>{x.name}</strong>
                  <span className={x.file ? 'receipt-ok' : 'muted'}>
                    {x.file ? `Na-upload: ${x.file.name} (${size(x.file.size)})` : 'Hindi na-upload. Dalhin sa Barangay Hall.'}
                  </span>
                </li>
              ))}
            </ul>

            <p className="note no-print">Padadalhan ka ng email sa <strong>{done.email}</strong> sa bawat update ng request mo. Silipin din ang Spam folder.</p>
            <p className="note no-print">Isulat, i-screenshot o i-print ang request number. Susuriin ito ng Barangay Secretary. Magtanong sa Barangay Hall kung may kailangan.</p>
            <div className="row end no-print">
              <Link to="/" className="btn">Bumalik sa home</Link>
              <button type="button" className="btn" onClick={() => window.print()}>I-print o i-save bilang PDF</button>
              <button className="btn primary" onClick={() => { setDone(null); setBusy(false); setFiles({}); setForm((f) => ({ ...f, type: '', purpose: '' })) }}>Mag-request ulit</button>
            </div>
          </div>
        </main>
      </>
    )
  }

  return (
    <>
      <PublicBar />
      <main className="landing narrow wide-form">
        <form className="panel form" onSubmit={submit} noValidate>
          <h1>Request ng certificate</h1>
          <p className="sub">Punan ang form na ito gaya ng papel sa Barangay Hall.</p>
          {formErr && <p className="note error" role="alert">{formErr}</p>}

          <Field label="Petsa">
            <input readOnly value={fmtDate(form.date)} />
          </Field>
          <Field label="Buong Pangalan" error={errors.name}>
            <input value={form.name} onChange={set('name')} autoComplete="name" />
          </Field>
          <div className="form-row">
            <Field label="Tirahan" error={errors.address} hint="Sitio, kalye, o numero ng bahay">
              <input value={form.address} onChange={set('address')} autoComplete="street-address" />
            </Field>
            <Field label="Purok" error={errors.purok}>
              <select value={form.purok} onChange={set('purok')}>
                <option value="">Pumili</option>
                {PUROKS.map((p) => <option key={p} value={p}>Purok {p}</option>)}
              </select>
            </Field>
          </div>
          <div className="form-row">
            <Field label="Birthdate" error={errors.birthDate}>
              <input type="date" max={form.date} value={form.birthDate} onChange={set('birthDate')} />
            </Field>
            <Field label="Edad">
              <input readOnly value={age ?? ''} placeholder="Kusang lalabas" />
            </Field>
          </div>
          <Field label="Contact number (opsyonal)" error={errors.contact} hint="Para matawagan ka kung may kulang sa request. Halimbawa: 09171234567">
            <input inputMode="tel" value={form.contact} onChange={set('contact')} autoComplete="tel" />
          </Field>
          <Field label="Email address" error={errors.email} hint="Dito namin ipapadala ang update sa request mo: sinusuri na, aprubado, hindi naaprubahan, o kailangan ng pag-aayos. Siguraduhing tama ang email.">
            <input type="email" value={form.email} onChange={set('email')} autoComplete="email" required />
          </Field>

          <fieldset className="choice-set">
            <legend>Botante ng DACANLAO?</legend>
            <div className="choices">
              {[['yes', 'Oo'], ['no', 'Hindi']].map(([v, l]) => (
                <label key={v} className="choice"><input type="radio" name="voter" checked={form.voter === v} onChange={() => setForm((f) => ({ ...f, voter: v }))} /> {l}</label>
              ))}
            </div>
            {errors.voter && <span className="field-error" role="alert">{errors.voter}</span>}
          </fieldset>

          <fieldset className="choice-set">
            <legend>Katayuan</legend>
            <div className="choices">
              {CIVIL.map((c) => (
                <label key={c} className="choice"><input type="radio" name="civil" checked={form.civil === c} onChange={() => setForm((f) => ({ ...f, civil: c }))} /> {c}</label>
              ))}
            </div>
            {errors.civil && <span className="field-error" role="alert">{errors.civil}</span>}
            <label className="choice"><input type="checkbox" checked={form.boarder} onChange={(e) => setForm((f) => ({ ...f, boarder: e.target.checked }))} /> Boarders</label>
          </fieldset>

          <hr className="rule" />

          <Field label="Ano ang kukunin?" error={errors.type}>
            <select value={form.type} onChange={set('type')}>
              <option value="">Pumili ng certificate</option>
              {Object.keys(CERT_TYPES).map((t) => <option key={t}>{t}</option>)}
            </select>
          </Field>

          {reqs.length > 0 && (
            <div className="uploads">
              <h2>Mga dokumentong ihahanda</h2>
              <p className="small muted">I-upload ang larawan o PDF ng bawat dokumento (hanggang {MAX_MB} MB). Puwede mo ring dalhin ang mga ito sa Barangay Hall.</p>
              {reqs.map((n) => (
                <Field key={n} label={n} error={errors[`file:${n}`]}>
                  <input type="file" accept="image/*,.pdf" onChange={(e) => pick(n, e)} />
                  {files[n] && <span className="field-hint">Napili: {files[n].name} ({size(files[n].size)})</span>}
                </Field>
              ))}
            </div>
          )}

          <Field label="Dahilan ng Pagkuha?" error={errors.purpose}>
            <textarea rows={2} maxLength={200} value={form.purpose} onChange={set('purpose')} placeholder="Halimbawa: Trabaho, paaralan, bank account" />
          </Field>

          <div className="row end">
            <Link to="/" className="btn ghost">Kanselahin</Link>
            <button className="btn primary" disabled={busy}>{busy ? 'Isinusumite…' : 'Isumite ang request'}</button>
          </div>
        </form>
      </main>
    </>
  )
}
