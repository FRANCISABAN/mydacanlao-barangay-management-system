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
