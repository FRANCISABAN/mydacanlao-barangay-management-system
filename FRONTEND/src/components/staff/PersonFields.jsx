import { CIVIL_STATUS, SEX } from '../../lib/staff/constants.js'
import { todayISO } from '../../lib/staff/format.js'
import { Field } from './ui.jsx'

export const emptyPerson = () => ({ firstName: '', middleName: '', lastName: '', sex: '', birthDate: '', civilStatus: '', occupation: '', contact: '' })

// The personal details of a resident. Used by resident registration/editing and by household registration
// (for the new household head, where `prefix` is "head." so the error keys line up with the backend's).
export function PersonFields({ form, onChange, errors = {}, prefix = '', hideContact = false }) {
  const err = (k) => errors[prefix + k]
  const set = (k) => (e) => onChange(k, e.target.value)
  return (
    <>
      <div className="form-row three">
        <Field label="First name" error={err('firstName')}>
          <input value={form.firstName} onChange={set('firstName')} autoComplete="off" />
        </Field>
        <Field label="Middle name" error={err('middleName')} hint="Optional">
          <input value={form.middleName} onChange={set('middleName')} autoComplete="off" />
        </Field>
        <Field label="Last name" error={err('lastName')}>
          <input value={form.lastName} onChange={set('lastName')} autoComplete="off" />
        </Field>
      </div>
      <div className="form-row three">
        <Field label="Sex" error={err('sex')}>
          <select value={form.sex} onChange={set('sex')}>
            <option value="">Select</option>
            {SEX.map((x) => <option key={x}>{x}</option>)}
          </select>
        </Field>
        <Field label="Birth date" error={err('birthDate')}>
          <input type="date" max={todayISO()} value={form.birthDate} onChange={set('birthDate')} />
        </Field>
        <Field label="Civil status" error={err('civilStatus')}>
          <select value={form.civilStatus} onChange={set('civilStatus')}>
            <option value="">Select</option>
            {CIVIL_STATUS.map((x) => <option key={x}>{x}</option>)}
          </select>
        </Field>
      </div>
      {hideContact ? (
        <Field label="Occupation" error={err('occupation')} hint="Optional">
          <input value={form.occupation} onChange={set('occupation')} autoComplete="off" />
        </Field>
      ) : (
        <div className="form-row">
          <Field label="Occupation" error={err('occupation')} hint="Optional">
            <input value={form.occupation} onChange={set('occupation')} autoComplete="off" />
          </Field>
          <Field label="Contact number" error={err('contact')} hint="Optional. Example: 09171234567">
            <input inputMode="tel" value={form.contact} onChange={set('contact')} autoComplete="off" />
          </Field>
        </div>
      )}
    </>
  )
}
