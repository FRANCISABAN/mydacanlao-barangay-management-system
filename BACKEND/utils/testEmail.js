// npm run test-email                 -> checks the email setup step by step, then sends the 4 status emails to EMAIL_REDIRECT_TO
// npm run test-email you@mail.com    -> same, but sends them to this address
// It tells you exactly where the problem is: settings, internet, blocked port, or Gmail login.
import { env } from '../config/index.js'
import { diagnoseEmail, emailEnabled, explainEmailError, sendEmail } from '../services/emailService.js'
import { statusEmail } from '../services/emailTemplates.js'

console.log('Checking the email setup...\n')
const steps = await diagnoseEmail()
for (const s of steps) console.log(`${s.ok ? '  OK   ' : '  FAIL '} ${s.step}: ${s.detail}`)

const loggedIn = steps.some((s) => s.ok && s.step.startsWith('Log in'))
if (!emailEnabled() || !loggedIn) {
  console.log('\nThe emails cannot be sent yet. Fix the FAIL line above, then run this again.')
  process.exit(1)
}

const to = process.argv[2] || env.email.redirectTo || env.email.user
console.log(`\nSending the 4 status emails to ${to} ...\n`)

const request = { id: 'TEST-0001', type: 'Barangay Clearance', applicantName: 'Juan Dela Cruz' }
const cases = [
  { status: 'under_review' },
  { status: 'approved' },
  { status: 'rejected', remark: 'Hindi tugma ang address sa ID.' },
  { status: 'resubmission', remark: 'Pakipasa ulit ang malinaw na kopya.', issues: [{ name: 'Valid government ID', reason: 'Malabo ang litrato.' }] },
]

let failed = 0
for (const c of cases) {
  try {
    const id = await sendEmail({ to, ...statusEmail({ request, ...c }) })
    console.log(`  OK   ${c.status} -> ${to} (id ${id})`)
  } catch (err) {
    failed++
    console.error(`  FAIL ${c.status}: ${explainEmailError(err)}`)
  }
  await new Promise((r) => setTimeout(r, 500))
}
console.log(failed ? '\nSome emails failed.' : '\nDone. Open the inbox of that address. If nothing is there, check the Spam folder.')
process.exit(failed ? 1 : 0)
