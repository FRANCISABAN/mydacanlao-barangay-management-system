// SK - SIDEBAR AT BASIC UI
// Magkakasama rito ang mga connected na bahagi ng page.

import { useEffect } from 'react';
import { initials, greeting } from './skFunctions';
import skLogo from '../../assets/sk-logo.png';

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