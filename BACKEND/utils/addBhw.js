// npm run add-bhw  ->  creates the Barangay Health Worker login WITHOUT touching any other data.
// Use this on a database that already has records. (`npm run seed` wipes everything.)
//
//   npm run add-bhw                                   uses SEED_BHW_USERNAME / SEED_BHW_PASSWORD from .env
//   npm run add-bhw -- juana MyPassword123 "Juana R. Cruz"
//
// If the username already exists, its password and name are reset and it becomes a BHW account.
import bcrypt from 'bcryptjs'
import { env } from '../config/index.js'
import { connectDB } from '../config/db.js'
import { User, sequelize } from '../models/index.js'

const [username = env.seedBhw.username, password = env.seedBhw.password, name = env.seedBhw.name] = process.argv.slice(2)
const login = String(username).trim().toLowerCase()

if (password.length < 8) {
  console.error('The password must have at least 8 characters.')
  process.exit(1)
}

await connectDB()
const passwordHash = await bcrypt.hash(password, 10)
const existing = await User.unscoped().findOne({ where: { username: login } })
if (existing) {
  await existing.update({ passwordHash, name, role: 'bhw', active: true })
  console.log(`Updated the account "${login}" (Barangay Health Worker).`)
} else {
  await User.create({ username: login, passwordHash, name, role: 'bhw' })
  console.log(`Created the Barangay Health Worker account "${login}".`)
}
console.log(`Log in with: ${login} / ${env.isProd ? '(the password you set)' : password}`)
await sequelize.close()
