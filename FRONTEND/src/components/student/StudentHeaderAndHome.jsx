// STUDENT - HOME AT LAYOUT
// Magkakasama rito ang mga connected na bahagi ng page.

import { useEffect } from 'react';
import { greeting, initials, isOpen } from './studentFunctions';

import skLogo from '../../assets/sk-logo.png';

// Logo ng SK. Ginagamit lang sa landing page kapalit ng araw.
const StudentLogo = ({ className = '' }) => {
  return <img className={`stlogo ${className}`} src={skLogo} alt="Sangguniang Kabataan Barangay Dacanlao" />
}

// Malaking araw (ginagamit pa rin sa ibang page).
const RAYS = [0, 1, 2, 3, 4, 5, 6, 7];

const StudentSun = () => {
  return (
    <svg className="sun" viewBox="-320 -320 640 640" aria-hidden="true">
      {RAYS.map((i) => (
        <g key={i}>
          <path d="M0 -300 L26 -120 L-26 -120Z" transform={`rotate(${i * 45})`} fill="#fcd116" opacity=".17" />
          <path d="M0 -240 L12 -120 L-12 -120Z" transform={`rotate(${i * 45 + 22.5})`} fill="#fcd116" opacity=".12" />
        </g>
      ))}
      <circle r="90" fill="#fcd116" opacity=".2" />
      <circle r="52" fill="#fcd116" opacity=".35" />
    </svg>
  )
}

// Maliit na logo sa header.
const MINI_RAYS = [0, 1, 2, 3, 4, 5, 6, 7];

const StudentSunMini = () => {
  return (
    <svg viewBox="-50 -50 100 100" aria-hidden="true">
      {MINI_RAYS.map((i) => (
        <path key={i} d="M0 -48 L7 -24 L-7 -24Z" transform={`rotate(${i * 45})`} fill="#fcd116" />
      ))}
      <circle r="17" fill="#fcd116" />
    </svg>
  )
}

// Icon na ginagamit sa mga card.
const PATHS = {
  home: "M3 11l9-8 9 8v10h-6v-6H9v6H3z",
  star: "M12 2l3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z",
  file: "M6 2h9l5 5v15H6zM14 2v6h6",
  users: "M16 8a4 4 0 10-8 0 4 4 0 008 0M4 21c0-4 4-6 8-6s8 2 8 6",
  check: "M5 13l4 4L19 7",
  clock: "M12 7v5l3 2M21 12a9 9 0 11-18 0 9 9 0 0118 0",
  award: "M12 14a6 6 0 100-12 6 6 0 000 12zM8.5 13.5L7 22l5-3 5 3-1.5-8.5"
}

const StudentIcon = ({ name }) => {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d={PATHS[name]} />
    </svg>
  )
}

// Menu at logout ng student.
const TABS = [["home", "Home"]];

// WBS 4.1.2 [Frontend] Implement student login and logout
// WBS 4.4.1 [Frontend] Display scholarship notifications and email updates
const StudentHeader = ({ me, tab, onTab, onLogout, unread = 0 }) => {
  return (
    <header className="st-top">
      <div className="brand"><StudentSunMini /><b>SK Scholarship</b></div>
      <nav>
        {TABS.map(([key, label]) => (
          <button key={key} className={tab === key ? "on" : ""} onClick={() => onTab(key)}>
            {label}
          </button>
        ))}
      </nav>
      <span className="avs" title={me.name}>{initials(me.name)}</span>
      <button onClick={onLogout}>Log out</button>
    </header>
  )
}

// Welcome message at progress ng student.
// WBS 4.4.2 [Frontend] Track scholarship application and requirement statuses
const StudentBanner = ({ me, hasApps, valid, total }) => {
  const progress = total ? valid / total : 0;

  return (
    <div className="banner">
      <StudentSun />
      <div className="bt">
        <small>Student Account and Scholarship Submission Management</small>
        <h2>{greeting()}, {me.name.split(" ")[0]}!</h2>
        <p>{hasApps ? `${valid} of ${total} documents validated.` : "Pick a scholarship to start your application."}</p>
      </div>
      <div className="ring">
        <svg viewBox="0 0 80 80" width="96" height="96">
          <circle className="t" cx="40" cy="40" r="34" />
          <circle className="v" cx="40" cy="40" r="34" style={{ strokeDashoffset: 214 * (1 - progress) }} />
        </svg>
        <b>{Math.round(progress * 100)}%</b>
      </div>
    </div>
  )
}

// Maliit na card para sa bilang.
const StudentStatCard = ({ value, label, color, icon }) => {
  return (
    <div className="stat" style={{ '--c': color }}>
      <i className="si"><StudentIcon name={icon} /></i>
      <b>{value}</b>
      <span>{label}</span>
    </div>
  )
}

// Buod at susunod na gagawin ng student.
const nextStep = (apps, scholarships) => {
  const rejected = apps.some((a) => a.status === "Rejected");
  const needsFix = apps.some((a) => Object.values(a.reqs).some((q) => q.status === "Revise"));
  const draft = apps.some((a) => a.status === "Draft");

  if (rejected) return ["Your application was rejected", "Upload corrected documents, then resubmit for review.", "Fix now"];
  if (needsFix) return ["Fix the documents that need revision", "The SK left a comment. Change the file and it goes back for review.", "Fix now"];
  // Kapag walang open scholarship, closed muna ang application.
  if (!apps.length && !scholarships.some(isOpen)) return ["Scholarship applications are closed", "Wait for the SK to post a new scholarship.", "Closed"];
  if (!apps.length) return ["Choose a scholarship", "Open Scholarship Submission and apply.", "Apply now"];
  if (draft) return ["Finish your submission", "Upload every document, then submit for review.", "Continue"];
  return ["Track your submissions", "Check the status of your documents.", "View submissions"];
}

// WBS 4.2.1 [Frontend] View available scholarships and create applications
// WBS 4.4.2 [Frontend] Track scholarship application and requirement statuses
const StudentHome = ({ me, apps, valid, scholarships, onTab }) => {
  const [title, text, button] = nextStep(apps, scholarships);

  return (
    <>
      <div className="stats">
        <StudentStatCard value={apps.length} label="Submissions" color="#fcd116" icon="file" />
        <StudentStatCard value={valid} label="Validated documents" color="#12b07a" icon="check" />
        <StudentStatCard value={apps.filter((a) => a.status === "Pending" || a.status === "Under Review").length} label="Under review" color="#1769ff" icon="clock" />
        <StudentStatCard value={apps.filter((a) => a.status === "Approved").length} label="Approved" color="#ce1126" icon="award" />
      </div>

      <div className="card row">
        <div>
          <span className="chip">Next step</span>
          <h3 style={{ marginTop: 8 }}>{title}</h3>
          <p className="mut" style={{ margin: "4px 0 0" }}>{text}</p>
        </div>
        <button className="p" disabled={button === "Closed"} onClick={() => onTab("sub")}>{button}</button>
      </div>

      <div className="card">
        <span className="chip">Updates by email</span>
        <h3 style={{ marginTop: 8 }}>Check your Gmail</h3>
        <p className="mut" style={{ margin: "4px 0 0" }}>
          Validation results and the final decision on your application are sent to <strong>{me.email}</strong>.
        </p>
      </div>
    </>
  )
}

// Maliit na message na kusang nawawala.
const StudentToast = ({ message, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, Math.max(2600, message.text.length * 60));
    return () => clearTimeout(timer);
  }, [message, onClose]);

  return (
    <div className="toast" role="status">{message.text}</div>
  )
}

// Ginagamit ng ibang page ang mga component na ito.
// In-system notifications: the same messages that are sent to the Gmail of the student.
// WBS 4.4.1 [Frontend] Display scholarship notifications and email updates
const StudentNotifications = ({ notifications }) => (
  <section className="notifs">
    <h2>Notifications</h2>
    {notifications.length === 0 && <p className="empty">No notifications yet. Updates about your application will show here.</p>}
    {notifications.map((n) => (
      <article key={n.id} className={"notif" + (n.read ? "" : " new")}>
        <div className="notif-top">
          <b>{n.subject}</b>
          {!n.read && <span className="nnew">New</span>}
          <small>{new Date(n.at).toLocaleString()}</small>
        </div>
        <p>{n.text}</p>
      </article>
    ))}
  </section>
)

export { StudentNotifications, StudentLogo, StudentSun, StudentSunMini, StudentIcon, StudentHeader, StudentBanner, StudentStatCard, StudentHome, StudentToast };
