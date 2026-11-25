// SK - PAGREVIEW NG APPLICATION AT STUDENT
// Magkakasama rito ang mga connected na bahagi ng page.

import { useState } from 'react';
import { SKStatusChip, SKStatCard } from './SKSidebarAndUI';
import { initials, requirementsOf, studentOf } from './skFunctions';

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