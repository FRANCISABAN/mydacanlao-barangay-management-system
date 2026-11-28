// npm run seed  ->  recreates ALL tables, then loads the sample data and the Secretary and BHW logins.
// WARNING: this deletes everything in the database named in DB_NAME.
import bcrypt from 'bcryptjs'
import { env } from '../config/index.js'
import { connectDB } from '../config/db.js'
import {
  sequelize, Counter, User, Household, Resident, CertificationRequest, RequestRequirement, RequestRemark,
} from '../models/index.js'
import { HOUSEHOLDS, REQUESTS, RESIDENTS } from './seedData.js'

if (env.isProd && (!process.env.SEED_PASSWORD || !process.env.SEED_BHW_PASSWORD)) {
  console.error('Set SEED_PASSWORD and SEED_BHW_PASSWORD before seeding in production.')
  process.exit(1)
}

await connectDB() // creates the database if needed
await sequelize.sync({ force: true }) // drop and recreate every table

await Household.bulkCreate(HOUSEHOLDS)
await Resident.bulkCreate(RESIDENTS)

// Sample verification results, so the BHW dashboard and the Residents page show every state.
const bhwName = env.seedBhw.name
await Resident.update(
  { verificationStatus: 'verified', verificationRemarks: 'Checked against the barangay household masterlist.', verifiedBy: bhwName, verifiedAt: new Date() },
  { where: { id: ['RES-001', 'RES-002', 'RES-003', 'RES-004', 'RES-005', 'RES-008', 'RES-009', 'RES-011'] } },
)
await Resident.update(
  { verificationStatus: 'needs_correction', verificationRemarks: 'Birth date does not match the ID shown. Confirm with the resident.', verifiedBy: bhwName, verifiedAt: new Date() },
  { where: { id: 'RES-012' } },
)

for (const r of REQUESTS) {
  await CertificationRequest.create({
    id: r._id,
    residentId: r.residentId,
    type: r.type,
    status: r.status,
    purpose: r.purpose,
    submittedAt: r.submittedAt,
    updatedAt: r.updatedAt,
    reviewedBy: r.reviewedBy,
    applicantName: r.submitted.fullName,
    birthDate: r.submitted.birthDate,
    civilStatus: r.submitted.civilStatus,
    address: r.submitted.address,
    contact: r.submitted.contact ?? '',
    email: r.submitted.email ?? '',
  })
  await RequestRequirement.bulkCreate(r.requirements.map((q) => ({
    requestId: r._id,
    name: q.name,
    fileOriginalName: q.file?.originalName ?? null,
    fileStoredName: null, // seeded files are metadata only
    fileSize: q.file?.size ?? null,
    fileMimeType: q.file?.mimeType ?? null,
    fileUploadedAt: q.file?.uploadedAt ?? null,
    validationStatus: q.validation.status,
    validationRemarks: q.validation.remarks,
    validatedAt: q.validation.validatedAt,
    validatedBy: q.validation.validatedBy,
  })))
  await RequestRemark.bulkCreate(r.remarks.map((m) => ({ requestId: r._id, text: m.text, author: m.author, at: m.at })))
}
await Counter.create({ id: 'CR-2026', seq: 41 }) // the next new request becomes CR-2026-0042
await Counter.create({ id: 'RES', seq: RESIDENTS.length }) // the next new resident becomes RES-016
await Counter.create({ id: 'HH', seq: HOUSEHOLDS.length }) // the next new household becomes HH-007

await User.create({
  username: env.seed.username,
  name: env.seed.name,
  role: 'secretary',
  passwordHash: await bcrypt.hash(env.seed.password, 10),
})

await User.create({
  username: env.seedBhw.username,
  name: env.seedBhw.name,
  role: 'bhw',
  passwordHash: await bcrypt.hash(env.seedBhw.password, 10),
})

console.log(`Seeded ${HOUSEHOLDS.length} households, ${RESIDENTS.length} residents, ${REQUESTS.length} requests.`)
console.log(`Secretary login: ${env.seed.username} / ${env.isProd ? '(from SEED_PASSWORD)' : env.seed.password}`)
console.log(`BHW login:       ${env.seedBhw.username} / ${env.isProd ? '(from SEED_BHW_PASSWORD)' : env.seedBhw.password}`)
await sequelize.close()
