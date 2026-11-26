// STUDENT - SCHOLARSHIP AT UPLOAD
// Magkakasama rito ang mga connected na bahagi ng page.

import { ACCEPT, deadlineClass, deadlineText, isOpen, isListed, requirementsOf } from './studentFunctions';

// Icon para sa uri ng file.
// WBS 4.3.1 [Frontend] Upload and manage scholarship requirements
const StudentFileTag = ({ upload }) => {
  if (!upload) return <span className="ft none">-</span>;

  const ext = ((upload.name || "").split(".").pop() || "file").slice(0, 4);

  return (
    <span className={`ft ${/pdf/i.test(ext) ? "pdf" : ""}`}>{ext}</span>
  )
}

// Label ng document status.
const LABELS = { Valid: "Valid", Revise: "Needs revision" };

const StudentDocumentChip = ({ upload }) => {
  if (!upload) return null;

  return (
    <span className={`chip ${upload.status}`}>{LABELS[upload.status] || "Uploaded"}</span>
  )
}

// Label ng application status.
// WBS 4.3.1 [Frontend] Upload and manage scholarship requirements
// WBS 4.4.2 [Frontend] Track scholarship application and requirement statuses
const StudentRequirementBar = ({ app, reqs }) => {
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

// Button para mag-upload o magpalit ng file.
// WBS 4.3.1 [Frontend] Upload and manage scholarship requirements
const StudentRequirementUpload = ({ req, upload, canEdit, onUpload }) => {
  const needsRevision = upload?.status === "Revise";
  const locked = upload?.status === "Valid" || (!canEdit && !needsRevision);

  const handleChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    onUpload(req, file);
    e.target.value = "";
  }

  return (
    <div className={`req ${needsRevision ? "rev" : ""}`}>
      <div className="rd">
        <StudentFileTag upload={upload} />
        <div>
          <strong>{req}</strong><br />
          <span className="mut">{upload ? upload.name : "Not uploaded"}</span>
          {upload?.img && <img className="thumb" src={upload.img} alt={req} />}
          {upload?.note && <div className="cmt">SK comment: {upload.note}</div>}
          {needsRevision && (
            <div className="mut" style={{ marginTop: 6 }}>
              Choose Change file to upload a corrected copy. It goes back to the SK for review.
            </div>
          )}
        </div>
      </div>
      <div>
        <StudentDocumentChip upload={upload} />
        {!locked && (
          <label className={`drop ${needsRevision ? "hot" : ""}`}>
            {upload ? (needsRevision ? "Change file" : "Replace") : "Upload"}
            <input type="file" accept={ACCEPT} onChange={handleChange} aria-label={`Upload ${req}`} />
          </label>
        )}
      </div>
    </div>
  )
}

// Scholarship card at application form.
// WBS 4.2.1 [Frontend] View available scholarships and create applications
// WBS 4.3.2 [Frontend] Submit and resubmit scholarship applications
// WBS 4.4.2 [Frontend] Track scholarship application and requirement statuses
const StudentSubmissionCard = ({ scholarship, app, reqs, onApply, onUpload, onSubmit, onResubmit }) => {
  const head = (
    <div className="row">
      <div>
        <h3>{scholarship.title}</h3>
        <p className="mut" style={{ margin: "6px 0 0" }}>
          {scholarship.desc}<br />
          Deadline: {scholarship.deadline} <span className={`dl ${deadlineClass(scholarship)}`}>{deadlineText(scholarship)}</span>
        </p>
      </div>
      {app && <StudentStatusChip status={app.status} />}
    </div>
  );

  if (!app) {
    return (
      <div className="card sc">
        {head}
        <span className="mut" style={{ display: "block", marginTop: 12 }}>Required documents</span>
        <div className="rl">
          {scholarship.reqs.map((r) => <span key={r} className="chip">{r}</span>)}
        </div>
        {/* Isang Closed label lang ang ipakita, katabi ng deadline. */}
        {isOpen(scholarship) && (
          <div style={{ marginTop: 14 }}>
            <button className="p" onClick={() => onApply(scholarship)}>Apply now</button>
          </div>
        )}
      </div>
    )
  }

  const done = reqs.filter((r) => app.reqs[r]).length;
  const ready = done === reqs.length;
  const canEdit = app.status !== "Approved";
  const changed = Object.values(app.reqs).some((q) => (q.at || 0) > (app.rejAt || 0));

  return (
    <div className="card sc">
      {head}
      <StudentProgressSteps status={app.status} />

      {app.status === "Rejected" && (
        <>
          {app.note && <div className="cmt">SK comment: {app.note}</div>}
          <div className="mut" style={{ margin: "8px 0" }}>Your application was rejected. Upload corrected documents below, then resubmit.</div>
        </>
      )}

      <StudentRequirementBar app={app} reqs={reqs} />
      <p className="mut" style={{ margin: 0 }}>{done} of {reqs.length} documents uploaded</p>

      {reqs.map((r) => (
        <StudentRequirementUpload
          key={r}
          req={r}
          upload={app.reqs[r]}
          canEdit={canEdit}
          onUpload={(req, file) => onUpload(app, req, file)}
        />
      ))}

      {app.status === "Draft" && (
        <div className="row" style={{ marginTop: 14 }}>
          <span className="mut">{ready ? "All documents uploaded. You can submit now." : "Upload every document to enable submit."}</span>
          <button className="p" onClick={() => onSubmit(app)} disabled={!ready}>Submit for review</button>
        </div>
      )}

      {app.status === "Rejected" && (
        <div className="row" style={{ marginTop: 14 }}>
          <span className="mut">{changed ? "You changed a document. You can resubmit now." : "Change at least one document, then resubmit."}</span>
          <button className="p" onClick={() => onResubmit(app)} disabled={!changed}>Resubmit for review</button>
        </div>
      )}
    </div>
  )
}

// Listahan ng scholarships at submissions.
// WBS 4.2.1 [Frontend] View available scholarships and create applications
const StudentSubmission = ({ scholarships, apps, onApply, onUpload, onSubmit, onResubmit }) => {
  // a closed scholarship stays one more day, then it is hidden (unless the student already applied)
  const shown = scholarships.filter((x) => isListed(x) || apps.some((a) => a.sid === x.id));

  return (
    <>
      <div style={{ marginBottom: 18 }}>
        <h2 style={{ fontSize: 32, fontWeight: 800 }}>Scholarship Submission</h2>
        <p className="mut" style={{ margin: "4px 0 0" }}>Student Account and Scholarship Submission Management</p>
      </div>

      {shown.map((x) => {
        const app = apps.find((a) => a.sid === x.id);

        return (
          <StudentSubmissionCard
            key={x.id}
            scholarship={x}
            app={app}
            reqs={app ? requirementsOf(app, scholarships) : x.reqs}
            onApply={onApply}
            onUpload={onUpload}
            onSubmit={onSubmit}
            onResubmit={onResubmit}
          />
        )
      })}

      {!shown.length && <div className="card empty">No scholarships posted yet. Check back soon.</div>}
    </>
  )
}

// Ginagamit ng ibang page ang mga component na ito.
export { StudentFileTag, StudentDocumentChip, StudentStatusChip, StudentProgressSteps, StudentRequirementBar, StudentRequirementUpload, StudentSubmissionCard, StudentSubmission };
