import { CertificationRequest, RequestRequirement } from '../models/index.js'
import { emailEnabled, explainEmailError, sendEmail } from './emailService.js'
import { statusEmail } from './emailTemplates.js'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const NOTIFY = ['under_review', 'approved', 'rejected', 'resubmission']

// Emails the applicant after the Secretary changes the status of a request:
// review started, approved, rejected, or needs resubmission.
// Never throws, so an email problem cannot fail or undo the status change.
// Returns { result: 'sent' | 'failed' | 'skipped', reason?: 'no_key' | 'no_email', detail?: why it failed, in plain words }.
export async function notifyStatusChange({ id, status, remark }) {
  if (!NOTIFY.includes(status)) return { result: 'skipped' }
  if (!emailEnabled()) {
    console.warn(`[email] ${id}: SMTP_USER / SMTP_PASS are not set in .env, so no email was sent.`)
    return { result: 'skipped', reason: 'no_key' }
  }

  try {
    const r = await CertificationRequest.findByPk(id)
    const to = String(r?.email ?? '').trim()
    if (!r || !EMAIL_RE.test(to)) {
      console.warn(`[email] ${id}: the applicant has no valid email address, so no email was sent.`)
      return { result: 'skipped', reason: 'no_email' }
    }

    // For "needs resubmission", tell the applicant which documents are missing or were marked wrong.
    let issues = []
    if (status === 'resubmission') {
      const reqs = await RequestRequirement.findAll({ where: { requestId: id }, order: [['id', 'ASC']] })
      issues = reqs
        .filter((q) => !q.fileOriginalName || ['invalid', 'resubmit'].includes(q.validationStatus))
        .map((q) => ({ name: q.name, reason: q.fileOriginalName ? q.validationRemarks : 'Wala pang naipasang dokumento.' }))
    }

    // Remarks on other statuses are internal notes ("note for the record"), so only the reasons for
    // rejecting or asking for resubmission are sent to the applicant.
    const mail = statusEmail({
      request: { id: r.id, type: r.type, applicantName: r.applicantName },
      status,
      remark: status === 'rejected' || status === 'resubmission' ? remark : '',
      issues,
    })
    const emailId = await sendEmail({ to, ...mail })
    console.log(`[email] ${id}: "${status}" email sent to ${to} (id ${emailId}).`)
    return { result: 'sent' }
  } catch (err) {
    const detail = explainEmailError(err)
    console.error(`[email] ${id}: could not send the "${status}" email.\n        Reason: ${detail}\n        Technical: ${err.code ?? ''} ${err.response ?? err.message}\n        Run "npm run test-email" in Backend_MyDacanlao for a step-by-step check.`)
    return { result: 'failed', detail }
  }
}
