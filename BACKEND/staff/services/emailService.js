import dns from 'node:dns/promises'
import net from 'node:net'
import nodemailer from 'nodemailer'
import { env } from '../config/index.js'

// Sends email through a Gmail account (SMTP). Needs SMTP_USER and SMTP_PASS (a Gmail App password) in .env.
export const emailEnabled = () => !!(env.email.user && env.email.pass)

const isLocal = (host) => ['127.0.0.1', 'localhost', '::1'].includes(host)

// The hostname is resolved here with the operating system's resolver (IPv4), then the connection is made to
// that address. On some Windows networks the resolver built into the mail library fails or picks an IPv6
// address that cannot be reached, which looks like a timeout. The certificate is still checked against smtp.gmail.com.
async function makeTransport(port) {
  const { host, user, pass } = env.email
  let address = host
  try {
    address = (await dns.lookup(host, { family: 4 })).address
  } catch {
    /* leave it to the mail library, which reports a clear DNS error */
  }
  return nodemailer.createTransport({
    host: address,
    port,
    secure: port === 465,
    requireTLS: port !== 465 && !isLocal(host), // never send the password without encryption
    auth: { user, pass },
    tls: { servername: host },
    connectionTimeout: 15_000,
    greetingTimeout: 15_000,
    socketTimeout: 30_000,
  })
}

// Errors that mean "could not reach or talk to the server" (so another port may work), as opposed to
// "the server answered and said no" (wrong password), which no other port can fix.
const CONNECTION_CODES = ['ETIMEDOUT', 'ECONNECTION', 'ESOCKET', 'ECONNREFUSED', 'ECONNRESET', 'EDNS', 'ENOTFOUND', 'EHOSTUNREACH', 'ENETUNREACH', 'ETLS', 'EAI_AGAIN']
const isConnectionError = (err) => CONNECTION_CODES.includes(err.code)

let goodPort = null // the port that worked last time is tried first

// Runs fn(transport) on each port until one works. Throws the last connection error if none can be reached.
async function withTransport(fn) {
  const ports = goodPort ? [goodPort, ...env.email.ports.filter((p) => p !== goodPort)] : env.email.ports
  let lastError
  for (const port of ports) {
    const transport = await makeTransport(port)
    try {
      const result = await fn(transport, port)
      goodPort = port
      return result
    } catch (err) {
      err.port = port
      lastError = err
      if (!isConnectionError(err)) throw err
    } finally {
      transport.close()
    }
  }
  throw lastError
}

// Plain-language reason for an email error, for the Secretary's screen and the backend console.
export function explainEmailError(err) {
  const { user, host } = env.email
  const text = String(err?.response || err?.message || '')
  if (err?.code === 'EAUTH' || err?.responseCode === 535 || /535|Username and Password not accepted|Invalid login/i.test(text)) {
    return `Gmail did not accept the login for ${user}. Use a 16-letter App Password from myaccount.google.com/apppasswords (not the normal Gmail password), make sure 2-Step Verification is ON for that account, and make sure SMTP_USER is that same Gmail.`
  }
  if (/534|Application-specific password required|InvalidSecondFactor/i.test(text)) {
    return `Gmail needs an App Password for ${user}. Turn on 2-Step Verification, then create an App Password at myaccount.google.com/apppasswords.`
  }
  if (/550.*5\.4\.5|Daily user sending quota|421.*4\.7\.0|rate limit/i.test(text)) {
    return 'Gmail has paused sending from this account (daily or rate limit reached). Try again later.'
  }
  if (['EDNS', 'ENOTFOUND', 'EAI_AGAIN'].includes(err?.code)) {
    return `Cannot find ${host}. The computer has no internet, or its DNS is not working.`
  }
  if (isConnectionError(err)) {
    return `Cannot connect to ${host} (ports ${env.email.ports.join(" and ")}). Check the internet connection. A firewall, antivirus, VPN, or school/office network may be blocking email (SMTP) ports 465 and 587.`
  }
  if (err?.code === 'EREJECTED') return err.message
  return err?.message || 'Unknown email error.'
}

// Sends one email to `to` (the address the resident typed in the request form).
// Returns the message id. Throws if the mail server could not be reached, refused the login, or rejected the address.
export async function sendEmail({ to, subject, html, text }) {
  const { user, redirectTo } = env.email
  const testMode = !!redirectTo // only when EMAIL_REDIRECT_TO is filled in .env
  const recipient = testMode ? redirectTo : to
  const info = await withTransport((transport) =>
    transport.sendMail({
      from: `Barangay Dacanlao - MyDacanlao <${user}>`,
      to: recipient,
      subject: testMode ? `[TEST for ${to}] ${subject}` : subject,
      html,
      text,
    }),
  )
  if (!info.accepted?.length) {
    throw Object.assign(new Error(`The mail server did not accept the address ${recipient}. Check that it is typed correctly.`), { code: 'EREJECTED' })
  }
  return info.messageId
}

// Step-by-step check used by `npm run test-email`: settings, DNS, each port, then the login.
// Returns [{ step, ok, detail }]. Sends nothing.
export async function diagnoseEmail() {
  const { host, user, pass, ports } = env.email
  const steps = []
  const add = (step, ok, detail) => steps.push({ step, ok, detail })

  add('Settings', !!(user && pass), user && pass ? `SMTP_USER = ${user}` : 'SMTP_USER or SMTP_PASS is empty in .env')
  if (pass && pass.length !== 16) {
    add('App password length', false, `The App Password has ${pass.length} characters. A Gmail App Password has exactly 16 letters (spaces are ignored). Copy it again.`)
  }

  let address
  try {
    address = (await dns.lookup(host, { family: 4 })).address
    add('Find the mail server', true, `${host} -> ${address}`)
  } catch (err) {
    add('Find the mail server', false, explainEmailError(Object.assign(err, { code: 'EDNS' })))
    return steps
  }

  const reachable = []
  for (const port of ports) {
    const ok = await new Promise((resolve) => {
      const socket = net.connect({ host: address, port, timeout: 8000 })
      socket.once('connect', () => (socket.destroy(), resolve(null)))
      socket.once('timeout', () => (socket.destroy(), resolve('timed out')))
      socket.once('error', (e) => resolve(e.code || e.message))
    })
    if (ok === null) reachable.push(port)
    add(`Connect to port ${port}`, ok === null, ok === null ? 'reachable' : `blocked or unreachable (${ok})`)
  }
  if (!reachable.length) {
    add('Result', false, `Cannot reach ${host} on any port. Check the internet connection. A firewall, antivirus, VPN, or school/office network may be blocking email (SMTP) ports.`)
    return steps
  }

  for (const port of reachable) {
    const transport = await makeTransport(port)
    try {
      await transport.verify()
      add(`Log in on port ${port}`, true, 'Gmail accepted the login')
      goodPort = port
      break
    } catch (err) {
      add(`Log in on port ${port}`, false, explainEmailError(Object.assign(err, { port })))
      if (!isConnectionError(err)) break // wrong password: the other port will say the same
    } finally {
      transport.close()
    }
  }
  return steps
}
