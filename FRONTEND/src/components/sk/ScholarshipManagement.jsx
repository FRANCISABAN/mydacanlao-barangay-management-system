// SK - PAGGAWA AT EDIT NG SCHOLARSHIP
// Magkakasama rito ang mga connected na bahagi ng page.

import { useState } from 'react';
import { DEFAULT_REQS, cleanList, nextSuggestion } from './skFunctions';

// Dagdag o bawas ng requirements.
// Required documents: one input per document. "+" adds a new document, "x" removes one.
// WBS 3.1.7 [Frontend] Create and publish scholarship programs
const SKRequirementsEditor = ({ value, onChange }) => {
  const change = (i, text) => onChange(value.map((r, k) => (k === i ? text : r)));
  const remove = (i) => onChange(value.filter((r, k) => k !== i));
  const add = () => onChange([...value, nextSuggestion(value)]);

  return (
    <div className="reqedit">
      <label>Required documents</label>

      {value.map((r, i) => (
        <div key={i} className="reqrow">
          <input
            value={r}
            onChange={(e) => change(i, e.target.value)}
            placeholder="Example: Barangay Indigency"
            aria-label={`Required document ${i + 1}`}
          />
          <button type="button" className="no sm" onClick={() => remove(i)} aria-label={`Remove ${r || "document"}`}>&times;</button>
        </div>
      ))}

      <button type="button" className="addreq" onClick={add} aria-label="Add a required document">
        <span>+</span> Add document
      </button>
    </div>
  )
}

// Form para gumawa o mag-edit ng scholarship.
const EMPTY = { title: "", desc: "", deadline: "", reqs: DEFAULT_REQS };

// Used twice: "Post a scholarship" (no initial) and "Edit scholarship" (initial + onCancel).
// WBS 3.1.7 [Frontend] Create and publish scholarship programs
const SKScholarshipForm = ({ idPrefix, heading, intro, initial = EMPTY, submitLabel, onSubmit, onCancel }) => {
  const [title, setTitle] = useState(initial.title);
  const [desc, setDesc] = useState(initial.desc);
  const [deadline, setDeadline] = useState(initial.deadline);
  const [reqs, setReqs] = useState(initial.reqs);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const saved = await onSubmit({ title: title.trim(), desc: desc.trim(), deadline, reqs: cleanList(reqs) });

    if (saved && !onCancel) {
      setTitle(EMPTY.title);
      setDesc(EMPTY.desc);
      setDeadline(EMPTY.deadline);
      setReqs(EMPTY.reqs);
    }
  }

  return (
    <form className="card" onSubmit={handleSubmit}>
      <h3>{heading}</h3>
      {intro && <p className="mut">{intro}</p>}

      <label htmlFor={`${idPrefix}-title`}>Title</label>
      <input id={`${idPrefix}-title`} value={title} onChange={(e) => setTitle(e.target.value)} />

      <label htmlFor={`${idPrefix}-desc`}>Description</label>
      <textarea id={`${idPrefix}-desc`} rows="2" value={desc} onChange={(e) => setDesc(e.target.value)} />

      <label htmlFor={`${idPrefix}-deadline`}>Deadline</label>
      <input id={`${idPrefix}-deadline`} type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />

      <SKRequirementsEditor value={reqs} onChange={setReqs} />

      <div className="acts" style={{ marginTop: 14 }}>
        <button className="p" type="submit">{submitLabel}</button>
        {onCancel && <button type="button" onClick={onCancel}>Cancel</button>}
      </div>
    </form>
  )
}

// Listahan at controls ng scholarships.
// WBS 3.1.7 [Frontend] Create and publish scholarship programs
const SKScholarshipManager = ({ scholarships, apps, editId, onCreate, onOpen, onEdit, onSaveEdit, onCancelEdit, onDelete }) => {
  return (
    <>
      <SKScholarshipForm
        idPrefix="new"
        heading="Post a scholarship"
        intro="Students are emailed at their Gmail."
        submitLabel="Post and notify students"
        onSubmit={onCreate}
      />

      {scholarships.map((x) => editId === x.id ? (
        <SKScholarshipForm
          key={x.id}
          idPrefix="edit"
          heading="Edit scholarship"
          initial={x}
          submitLabel="Save changes"
          onSubmit={(values) => onSaveEdit(x.id, values)}
          onCancel={onCancelEdit}
        />
      ) : (
        <div key={x.id} className="card clk" onClick={() => onOpen(x.id)} title="Open the applications for this scholarship">
          <div className="row">
            <div>
              <h3>{x.title}</h3>
              <p className="mut" style={{ margin: "6px 0 0" }}>
                {x.desc}<br />
                Deadline {x.deadline} · {apps.filter((a) => a.sid === x.id).length} applicants
              </p>
            </div>
            <div className="acts" style={{ gridColumn: "auto" }}>
              <button className="sm" onClick={(e) => { e.stopPropagation(); onEdit(x.id); }}>Edit</button>
              <button className="no sm" onClick={(e) => { e.stopPropagation(); onDelete(x.id); }}>Delete</button>
            </div>
          </div>
          <div className="rl">
            {x.reqs.map((r) => <span key={r} className="chip">{r}</span>)}
          </div>
        </div>
      ))}
    </>
  )
}

// Ginagamit ng ibang page ang mga component na ito.
export { SKRequirementsEditor, SKScholarshipForm, SKScholarshipManager };
