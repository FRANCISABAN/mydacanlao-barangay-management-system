import { sequelize } from '../config/db.js'
import Counter from './Counter.js'
import User from './User.js'
import Household from './Household.js'
import Resident from './Resident.js'
import ResidentAudit from './ResidentAudit.js'
import CertificationRequest from './CertificationRequest.js'
import RequestRequirement from './RequestRequirement.js'
import RequestRemark from './RequestRemark.js'

Household.hasMany(Resident, { foreignKey: { name: 'householdId', allowNull: false }, as: 'members' })
Resident.belongsTo(Household, { foreignKey: 'householdId' })

Resident.hasMany(CertificationRequest, { foreignKey: { name: 'residentId', allowNull: true }, onDelete: 'SET NULL' })
CertificationRequest.belongsTo(Resident, { foreignKey: 'residentId' })

CertificationRequest.hasMany(RequestRequirement, { foreignKey: { name: 'requestId', allowNull: false }, as: 'requirements', onDelete: 'CASCADE' })
RequestRequirement.belongsTo(CertificationRequest, { foreignKey: 'requestId' })

CertificationRequest.hasMany(RequestRemark, { foreignKey: { name: 'requestId', allowNull: false }, as: 'remarks', onDelete: 'CASCADE' })
RequestRemark.belongsTo(CertificationRequest, { foreignKey: 'requestId' })

export { sequelize, Counter, User, Household, Resident, ResidentAudit, CertificationRequest, RequestRequirement, RequestRemark }
