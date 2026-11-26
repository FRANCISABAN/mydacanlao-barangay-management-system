// SK - SIDEBAR AT BASIC UI
// Magkakasama rito ang mga connected na bahagi ng page.

import { useEffect } from 'react';
import { initials, greeting } from './skFunctions';
import skLogo from '../../assets/sk-logo.png';

// Logo ng Sangguniang Kabataan (Barangay Dacanlao). Ito ang pumalit sa araw.
// Ginagamit sa sidebar (maliit) at sa login (malaki).
const SKLogo = ({ className = '' }) => {
  return (
    <img className={`sklogo ${className}`} src={skLogo} alt="Sangguniang Kabataan Barangay Dacanlao" />
  )
}

// Icon para sa SK menu.
const PATHS = {
  home: "M3 11l9-8 9 8v10h-6v-6H9v6H3z",
  star: "M12 2l3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z",
  file: "M6 2h9l5 5v15H6zM14 2v6h6",
  users: "M16 8a4 4 0 10-8 0 4 4 0 008 0M4 21c0-4 4-6 8-6s8 2 8 6",
  check: "M5 13l4 4L19 7",
  clock: "M12 7v5l3 2M21 12a9 9 0 11-18 0 9 9 0 0118 0",
  award: "M12 14a6 6 0 100-12 6 6 0 000 12zM8.5 13.5L7 22l5-3 5 3-1.5-8.5"
}

const SKIcon = ({ name }) => {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d={PATHS[name]} />
    </svg>
  )
}

// Label ng application status.
// WBS 3.1.4 [Frontend] Manage scholarship application statuses and decisions
const SKStatusChip = ({ status }) => {
  return (
    <span className={`chip ${status}`}>{status}</span>
  )
}

// Card para sa bilang ng records.
// WBS 3.1.1 [Frontend] Display, search, and view scholarship applications
const SKStatCard = ({ value, label, color, icon }) => {
  return (
    <div className="stat" style={{ '--c': color }}>
      <i className="si"><SKIcon name={icon} /></i>
      <b>{value}</b>
      <span>{label}</span>
    </div>
  )
}

// Blue banner sa taas ng dashboard (bati lang, walang araw).
const SKBanner = ({ me }) => {
  return (
    <div className="skbanner">
      <div className="bt">
        <small>SK Console - Scholarship Management</small>
        <h2>{greeting()}, {String(me.name).split(' ')[0]}!</h2>
      </div>
    </div>
  )
}

// Menu at logout ng SK.
const SKSidebar = ({ me, tabs, tab, onTab, onLogout }) => {
  return (
    <aside className="sk-side">
      <div className="brand">
        <SKLogo />
        <div><b>SK Console</b><small>Scholarship Management</small></div>
      </div>

      <div className="sknav">
        {tabs.map(([key, label, icon]) => (
          <button key={key} className={`nav ${tab === key ? "on" : ""}`} onClick={() => onTab(key)} aria-label={label}>
            <SKIcon name={icon} />
            <span>{label}</span>
          </button>
        ))}
      </div>

      <div className="who">
        <span className="av">{initials(me.name)}</span>
        <b>{me.name}</b>
        <span className="mut">{me.email}</span>
        <button onClick={onLogout}>Log out</button>
      </div>
    </aside>
  )
}

// Maliit na message na kusang nawawala.
// WBS 3.1.5 [Frontend] Manage in-system and email notifications
const SKToast = ({ message, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, Math.max(2600, message.text.length * 60));
    return () => clearTimeout(timer);
  }, [message, onClose]);

  return (
    <div className="toast" role="status">{message.text}</div>
  )
}

// Ginagamit ng ibang page ang mga component na ito.
export { SKLogo, SKBanner, SKIcon, SKStatusChip, SKStatCard, SKSidebar, SKToast };
