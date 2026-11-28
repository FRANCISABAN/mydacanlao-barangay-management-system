import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import { env } from './config/index.js'
import { connectDB } from './config/db.js'
import './models/index.js' // registers every model before connectDB() creates the tables
import routes from './routes/index.js'
import { emailEnabled } from './services/emailService.js'
import { errorHandler, notFound } from './utils/errorHandler.js'

const app = express()
app.use(helmet())
app.use(cors({ origin: env.clientOrigins }))
app.use(express.json({ limit: '100kb' }))
if (!env.isProd) app.use(morgan('dev'))

app.get('/api/health', (req, res) => res.json({ ok: true }))
app.use('/api', routes)
app.use(notFound)
app.use(errorHandler)

try {
  await connectDB()
} catch (err) {
  console.error(`Cannot connect to MySQL (${err.code || err.message}). Open the XAMPP Control Panel, start MySQL, and check the DB_* values in .env.`)
  process.exit(1)
}
app.listen(env.port, () => {
  console.log(`MyDacanlao API running on http://localhost:${env.port}`)
  console.log(emailEnabled()
    ? `[email] Gmail is ON (${env.email.user}). ${env.email.redirectTo ? `TEST MODE: all emails go to ${env.email.redirectTo}` : "Emails go to each resident's own address."}`
    : '[email] OFF: SMTP_USER / SMTP_PASS were not found. Check that Backend_MyDacanlao/.env exists (not .env.example), fill them in, and restart.')
})
