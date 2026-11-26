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
const TABS = [["home", "Home"], ["sub", "Scholarship Submission"]];

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
      {/* bell icon: opens the notifications, the red number is the unread count */}
      <button className={"bell" + (tab === "notif" ? " on" : "")} onClick={() => onTab("notif")} title="Notifications" aria-label="Notifications">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0" /></svg>
        {unread > 0 && <span className="nbadge">{unread}</span>}
      </button>
      <span className="avs" title={me.name}>{initials(me.name)}</span>
      <button onClick={onLogout}>Log out</button>
    </header>
  )
}

// Welcome message at progress ng student.
