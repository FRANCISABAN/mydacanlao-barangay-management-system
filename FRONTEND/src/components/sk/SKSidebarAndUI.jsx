// SK - SIDEBAR AT BASIC UI
// Magkakasama rito ang mga connected na bahagi ng page.

import { useEffect } from 'react';
import { initials, greeting } from './skFunctions';
import skLogo from '../../assets/sk-logo.png';

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