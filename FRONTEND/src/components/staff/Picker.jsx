import { useEffect, useState } from 'react'
import { useQuery } from '../../lib/staff/useQuery.js'
import { Loading } from './ui.jsx'

// Pick one existing record (a household or a resident) by searching, instead of scrolling a long list.
// `query` is the name of an api function that returns { items }, e.g. 'listHouseholds'.
// `describe(record)` returns [title, subtitle] for one option.
export function RecordPicker({ label, query, value, onChange, describe, placeholder, error, hint, exclude = [] }) {
  return (
    <div className="field picker">
      <span className="field-label" id={`pk-${query}`}>{label}</span>
      {value ? (
        <div className="picker-chosen">
          <span>
            <strong>{describe(value)[0]}</strong>
            <span className="muted small"> {describe(value)[1]}</span>
          </span>
          <button type="button" className="btn small" onClick={() => onChange(null)}>Change</button>
        </div>
      ) : (
        <PickerSearch labelId={`pk-${query}`} query={query} onPick={onChange} describe={describe} placeholder={placeholder} exclude={exclude} />
      )}
      {hint && !error && <span className="field-hint">{hint}</span>}
      {error && <span className="field-error" role="alert">{error}</span>}
    </div>
  )
}

function PickerSearch({ labelId, query, onPick, describe, placeholder, exclude }) {
  const [text, setText] = useState('')
  const [q, setQ] = useState('')
  useEffect(() => {
    const t = setTimeout(() => setQ(text.trim()), 250)
    return () => clearTimeout(t)
  }, [text])
  const { data, error } = useQuery(query, { q, pageSize: 5 })
  const items = (data?.items ?? []).filter((x) => !exclude.includes(x.id))

  return (
    <>
      <input type="search" aria-labelledby={labelId} value={text} onChange={(e) => setText(e.target.value)} placeholder={placeholder} autoComplete="off" />
      {error ? (
        <p className="field-error" role="alert">{error.message}</p>
      ) : !data ? (
        <Loading label="Searching…" />
      ) : items.length === 0 ? (
        <p className="muted small">No match. Check the spelling.</p>
      ) : (
        <ul className="picker-list">
          {items.map((x) => (
            <li key={x.id}>
              <button type="button" onClick={() => onPick(x)}>
                <strong>{describe(x)[0]}</strong>
                <span className="muted small">{describe(x)[1]}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
