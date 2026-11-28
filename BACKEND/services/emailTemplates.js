// Email wording for each status the Secretary can set. Edit the text here.
// Written in Filipino, like the resident side of the system.
const BARANGAY = 'Barangay Dacanlao'

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])
const br = (s) => esc(s).replace(/\r?\n/g, '<br>')

const COPY = {
  under_review: {
    color: '#1d4ed8',
    subject: (id) => `Sinusuri na ang request mo (${id})`,
    heading: 'Sinusuri na ang request mo',
    body: (type) => `Sinimulan na ng Barangay Secretary na suriin ang iyong request para sa ${type}.`,
    next: 'Padadalhan ka namin ng email kapag may desisyon na.',
  },
  approved: {
    color: '#15803d',
    subject: (id) => `Aprubado na ang request mo (${id})`,
    heading: 'Aprubado na ang request mo',
    body: (type) => `Magandang balita! Aprubado na ang iyong request para sa ${type}.`,
    next: 'Magtanong sa Barangay Hall tungkol sa pagkuha ng iyong certificate, at ihanda ang request number na nasa ibaba.',
  },
  rejected: {
    color: '#b91c1c',
    subject: (id) => `Hindi naaprubahan ang request mo (${id})`,
    heading: 'Hindi naaprubahan ang request mo',
    body: (type) => `Pasensya na, hindi naaprubahan ang iyong request para sa ${type}.`,
    next: 'Kung may tanong ka, magtanong sa Barangay Hall.',
    reasonLabel: 'Dahilan',
  },
  resubmission: {
    color: '#c2410c',
    subject: (id) => `Kailangan ng pag-aayos ang request mo (${id})`,
    heading: 'Kailangan ng pag-aayos ang request mo',
    body: (type) => `May kailangan pang ayusin sa iyong request para sa ${type} bago ito maaprubahan.`,
    next: 'Magtanong sa Barangay Hall para sa susunod na hakbang.',
    reasonLabel: 'Paalala ng Barangay Secretary',
  },
}

// request: { id, type, applicantName }
// remark: reason typed by the Secretary (only used for rejected / resubmission)
// issues: [{ name, reason }] documents that are missing or flagged (only used for resubmission)
export function statusEmail({ request, status, remark = '', issues = [] }) {
  const c = COPY[status]
  if (!c) throw new Error(`No email template for status "${status}".`)
  const reason = c.reasonLabel ? String(remark).trim() : ''
  const greeting = `Magandang araw, ${request.applicantName}.`

  const html = `<!doctype html>
<html lang="fil"><body style="margin:0;background:#f3f4f6">
<div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;padding:24px;background:#ffffff;color:#1f2937;line-height:1.5">
  <p style="margin:0 0 4px;font-size:13px;color:#6b7280">${esc(BARANGAY)} &middot; MyDacanlao</p>
  <h1 style="margin:0 0 16px;font-size:20px;color:${c.color}">${esc(c.heading)}</h1>
  <p>${esc(greeting)}</p>
  <p>${esc(c.body(request.type))}</p>
  ${reason ? `<div style="margin:16px 0;padding:12px 16px;border-left:4px solid ${c.color};background:#f9fafb"><strong>${esc(c.reasonLabel)}:</strong><br>${br(reason)}</div>` : ''}
  ${issues.length ? `<p style="margin-bottom:4px"><strong>Mga dokumentong kailangang ayusin o ipasa:</strong></p><ul style="margin-top:0">${issues.map((i) => `<li><strong>${esc(i.name)}</strong>${i.reason ? ` &ndash; ${br(i.reason)}` : ''}</li>`).join('')}</ul>` : ''}
  <p>${esc(c.next)}</p>
  <div style="margin:16px 0;padding:12px 16px;background:#f3f4f6;border-radius:8px;font-size:14px">
    <strong>Request number:</strong> ${esc(request.id)}<br>
    <strong>Uri ng certificate:</strong> ${esc(request.type)}
  </div>
  <p style="margin-top:24px;font-size:12px;color:#6b7280">Awtomatikong email ito mula sa MyDacanlao ng ${esc(BARANGAY)}. Huwag sumagot dito.</p>
</div>
</body></html>`

  // Plain-text copy for mail apps that do not show HTML (also helps deliverability).
  const text = [
    greeting,
    c.body(request.type),
    reason ? `${c.reasonLabel}: ${reason}` : '',
    issues.length > 0 ? `Mga dokumentong kailangang ayusin o ipasa:\n${issues.map((i) => `- ${i.name}${i.reason ? `: ${i.reason}` : ''}`).join('\n')}` : '',
    c.next,
    `Request number: ${request.id}\nUri ng certificate: ${request.type}`,
    `Awtomatikong email ito mula sa MyDacanlao ng ${BARANGAY}. Huwag sumagot dito.`,
  ].filter(Boolean).join('\n\n')

  return { subject: c.subject(request.id), html, text }
}
