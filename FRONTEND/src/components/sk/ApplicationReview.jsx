// SK - PAGREVIEW NG APPLICATION AT STUDENT
// Magkakasama rito ang mga connected na bahagi ng page.

import { useState } from 'react';
import { SKStatusChip, SKStatCard } from './SKSidebarAndUI';
import { initials, requirementsOf, studentOf } from './skFunctions';

// Icon para sa uri ng file.
const SKFileTag = ({ upload }) => {
  if (!upload) return <span className="ft none">-</span>;

  const ext = ((upload.name || "").split(".").pop() || "file").slice(0, 4);

  return (
    <span className={`ft ${/pdf/i.test(ext) ? "pdf" : ""}`}>{ext}</span>
  )
}

// Label ng document status.
const LABELS = { Valid: "Valid", Revise: "Needs revision" };

const SKDocumentChip = ({ upload }) => {
  if (!upload) return null;

  return (
    <span className={`chip ${upload.status}`}>{LABELS[upload.status] || "Uploaded"}</span>
  )
}

// Bilang ng validated documents.
// WBS 3.1.2 [Frontend] Review and validate scholarship requirements
const SKRequirementBar = ({ app, reqs }) => {
  return (
    <div className="seggy">
      {reqs.map((r) => {
        const upload = app.reqs[r];
        const state = upload ? (upload.status === "Valid" ? "v" : upload.status === "Revise" ? "r" : "up") : "";

        return <span key={r} className={state} title={r}></span>
      })}
    </div>
  )
}

// Isang document para sa pag-review.
// WBS 3.1.2 [Frontend] Review and validate scholarship requirements
// WBS 3.1.3 [Frontend] Manage scholarship requirement resubmissions
const SKReviewRow = ({ req, upload, rejecting, note, onNote, onZoom, onValid, onOpenReject, onCancelReject, onSendReject }) => {
  if (!upload) {
    return (
      <div className="req">
        <div><strong>{req}</strong><br /><span className="mut">Not uploaded yet</span></div>
        <div><SKStatusChip status="Missing" /></div>
      </div>
    )
  }

  return (
    <div className="req">
      <div className="rd">
        <SKFileTag upload={upload} />
        <div>
          <strong>{req}</strong><br />
          <span className="mut">{upload.name}</span>
          {upload.note && <div className="cmt">SK comment: {upload.note}</div>}
        </div>
      </div>
      <div><SKDocumentChip upload={upload} /></div>

      <div className="acts">
        <button className="sm" onClick={onZoom}>View</button>
        <button className="ok sm" onClick={onValid}>Mark valid</button>
        <button className="no sm" onClick={onOpenReject}>Reject</button>
      </div>

      {rejecting && (
        <div className="rjbox">
          <label htmlFor="note-req">Why is it rejected?</label>
          <textarea
            id="note-req"
            rows="2"
            autoFocus
            value={note}
            onChange={(e) => onNote(e.target.value)}
            placeholder="Example: The photo is blurry, please upload a clearer copy."
          />
          <div className="acts">
            <button className="no sm" onClick={onSendReject}>Send rejection</button>
            <button className="sm" onClick={onCancelReject}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  )
}

// Buttons para i-check, approve o reject.
// rejecting = null (nothing open) | "app" (reject the whole application) | the name of one document
// WBS 3.1.2 [Frontend] Review and validate scholarship requirements
// WBS 3.1.3 [Frontend] Manage scholarship requirement resubmissions
// WBS 3.1.4 [Frontend] Manage scholarship application statuses and decisions
const SKReviewPanel = ({ app, student, scholarshipTitle, reqs, showToast, onClose, onZoom, onValid, onRevise, onReject, onApprove }) => {
  const [rejecting, setRejecting] = useState(null);
  const [note, setNote] = useState('');

  const openReject = (target) => {
    setRejecting(target);
    setNote('');
  }

  const sendReject = (target) => {
    if (!note.trim()) {
      showToast('Write a comment first so the student knows why.');
      return;
    }
    if (target === 'app') onReject(note.trim());
    else onRevise(target, note.trim());
    setRejecting(null);
  }

  return (
    <>
      <div className="row">
        <div className="who2">
          <span className="av lg">{initials(student.name)}</span>
          <div>
            <h2 style={{ fontSize: 26 }}>{student.name}</h2>
            <span className="mut">
              {student.email}
              {student.address && <><br />{student.address}</>}
              <br />{scholarshipTitle}
            </span>
          </div>
        </div>
        <SKStatusChip status={app.status} />
      </div>

      <SKRequirementBar app={app} reqs={reqs} />

      <div className="card" style={{ marginTop: 12 }}>
        {reqs.map((r) => (
          <SKReviewRow
            key={r}
            req={r}
            upload={app.reqs[r]}
            rejecting={rejecting === r}
            note={note}
            onNote={setNote}
            onZoom={() => onZoom(r)}
            onValid={() => onValid(r)}
            onOpenReject={() => openReject(r)}
            onCancelReject={() => setRejecting(null)}
            onSendReject={() => sendReject(r)}
          />
        ))}
      </div>

      {rejecting === 'app' && (
        <div className="rjbox card">
          <label htmlFor="note-app">Why is the application rejected?</label>
          <textarea
            id="note-app"
            rows="2"
            autoFocus
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Example: Incomplete documents. Please submit all requirements."
          />
          <div className="acts">
            <button className="no sm" onClick={() => sendReject('app')}>Send rejection</button>
            <button className="sm" onClick={() => setRejecting(null)}>Cancel</button>
          </div>
        </div>
      )}

      <div className="row">
        <button onClick={onClose}>Close</button>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="no" onClick={() => openReject('app')}>Reject</button>
          <button className="ok" onClick={onApprove}>Approve application</button>
        </div>
      </div>
    </>
  )
}

// Side panel para sa review.
// WBS 3.1.1 [Frontend] Display, search, and view scholarship applications
const SKReviewDrawer = ({ onClose, children }) => {
  return (
    <>
      <div className="scrim" onClick={onClose}></div>
      <aside className="drawer" role="dialog" aria-label="Review application">
        {children}
      </aside>
    </>
  )
}

// Malaking preview ng document.
// WBS 3.1.2 [Frontend] Review and validate scholarship requirements
const SKLightbox = ({ req, upload, studentName, onClose }) => {
  return (
    <>
      <div className="scrim" style={{ zIndex: 40 }} onClick={onClose}></div>
      <div className="lbx" role="dialog" aria-label={req}>
        <img src={upload.img} alt={`${req} from ${studentName}`} />
        <div className="row" style={{ color: "#fff" }}>
          <span>
            <strong>{req}</strong> · {studentName}
            {upload.note && <><br /><span style={{ color: "#ff9aa5" }}>SK comment: {upload.note}</span></>}
          </span>
          <button onClick={onClose}>Close</button>
        </div>
      </div>
    </>
  )
}

// Listahan at search ng applications.
const STATUSES = ["All", "Pending", "Under Review", "Approved", "Rejected"];

// WBS 3.1.1 [Frontend] Display, search, and view scholarship applications
const SKApplicationList = ({ apps, scholarships, students, schFilter, status, query, onStatus, onQuery, onClearSch, onReview }) => {
  const inScholarship = apps.filter((a) => !schFilter || a.sid === schFilter);
  const filtered = inScholarship.filter((a) => {
    const student = studentOf(students, a.uid);
    return (status === "All" || a.status === status) && (student.name + student.email).toLowerCase().includes(query.toLowerCase());
  });
  const selected = schFilter ? scholarships.find((x) => x.id === schFilter) : null;
  const count = (s) => s === "All" ? inScholarship.length : inScholarship.filter((a) => a.status === s).length;

  return (
    <>
      {selected && (
        <div className="card row">
          <span>Applications for <strong>{selected.title}</strong></span>
          <button className="sm" onClick={onClearSch}>Show all scholarships</button>
        </div>
      )}

      <div className="pills">
        {STATUSES.map((s) => (
          <button key={s} className={`pill ${status === s ? "on" : ""}`} onClick={() => onStatus(s)}>
            {s}<b>{count(s)}</b>
          </button>
        ))}
      </div>

      <div className="filters">
        <input value={query} onChange={(e) => onQuery(e.target.value)} placeholder="Search student name or email" aria-label="Search" />
      </div>

      <div className="card tbl">
        <table>
          <thead>
            <tr><th>Student</th><th>Scholarship</th><th>Documents</th><th>Status</th><th></th></tr>
          </thead>
          <tbody>
            {filtered.map((a, i) => {
              const student = studentOf(students, a.uid);
              const reqs = requirementsOf(a, scholarships);
              const uploaded = reqs.filter((r) => a.reqs[r]).length;

              return (
                <tr key={a.id} style={{ '--i': i }}>
                  <td>
                    <div className="who2">
                      <span className="av">{initials(student.name)}</span>
                      <div><strong>{student.name}</strong><br /><span className="mut">{student.email}</span></div>
                    </div>
                  </td>
                  <td>{scholarships.find((x) => x.id === a.sid)?.title}</td>
                  <td>
                    <div className="mini"><u style={{ width: `${uploaded / reqs.length * 100}%` }}></u></div>
                    <span className="mut">{uploaded} of {reqs.length} uploaded</span>
                  </td>
                  <td><SKStatusChip status={a.status} /></td>
                  <td><button className="p sm" onClick={() => onReview(a.id)}>Review</button></td>
                </tr>
              )
            })}
            {!filtered.length && <tr><td colSpan="5" className="empty">No applications match.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  )
}

// Listahan at search ng students.
// SK monitor: every registered student and where their applications stand.
// WBS 3.1.1 [Frontend] Display, search, and view scholarship applications
const SKStudentList = ({ students, apps, scholarships, query, onQuery }) => {
  const appsOf = (student) => apps.filter((a) => String(a.uid).toLowerCase() === String(student.email).toLowerCase());

  const rows = students.filter((s) => (s.name + s.email + s.address).toLowerCase().includes(query.toLowerCase()));
  const withApps = students.filter((s) => appsOf(s).length > 0).length;
  const approved = students.filter((s) => appsOf(s).some((a) => a.status === "Approved")).length;

  return (
    <>
      <div className="stats">
        <SKStatCard value={students.length} label="Registered students" color="#fcd116" icon="users" />
        <SKStatCard value={withApps} label="With applications" color="#1769ff" icon="file" />
        <SKStatCard value={approved} label="Approved students" color="#12b07a" icon="award" />
      </div>

      <div className="filters">
        <input value={query} onChange={(e) => onQuery(e.target.value)} placeholder="Search student name, email or address" aria-label="Search students" />
      </div>

      <div className="card tbl">
        <table>
          <thead>
            <tr><th>Student</th><th>Address</th><th>Applications</th></tr>
          </thead>
          <tbody>
            {rows.map((s) => {
              const list = appsOf(s);

              return (
                <tr key={s.id}>
                  <td>
                    <div className="who2">
                      <span className="av">{initials(s.name)}</span>
                      <div><strong>{s.name}</strong><br /><span className="mut">{s.email}</span></div>
                    </div>
                  </td>
                  <td>{s.address}</td>
                  <td>
                    {list.length ? (
                      <div className="chips">
                        {list.map((a) => (
                          <span key={a.id} title={scholarships.find((x) => x.id === a.sid)?.title}>
                            <SKStatusChip status={a.status} />
                          </span>
                        ))}
                      </div>
                    ) : <span className="mut">No application yet</span>}
                  </td>
                </tr>
              )
            })}
            {!rows.length && <tr><td colSpan="3" className="empty">No students found.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  )
}

// Ginagamit ng ibang page ang mga component na ito.
export { SKFileTag, SKDocumentChip, SKRequirementBar, SKReviewRow, SKReviewPanel, SKReviewDrawer, SKLightbox, SKApplicationList, SKStudentList };
