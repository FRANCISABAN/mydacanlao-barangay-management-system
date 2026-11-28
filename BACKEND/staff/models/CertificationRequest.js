import { DataTypes } from 'sequelize'
import { sequelize } from '../config/db.js'
import { CERT_TYPES, STATUS_KEYS } from '../config/constants.js'

// The applicant's own answers (1.2.1) are stored in the same row as the request.
export default sequelize.define('CertificationRequest', {
  id: { type: DataTypes.STRING(20), primaryKey: true }, // CR-2026-0041
  residentId: { type: DataTypes.STRING(20), allowNull: true }, // null when no resident record matched
  type: { type: DataTypes.STRING(60), allowNull: false, validate: { isIn: [Object.keys(CERT_TYPES)] } },
  status: { type: DataTypes.ENUM(...STATUS_KEYS), allowNull: false, defaultValue: 'pending' },
  purpose: { type: DataTypes.TEXT, allowNull: false },
  submittedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  reviewedBy: { type: DataTypes.STRING(100), allowNull: true }, // 1.1.3 responsible reviewer
  reviewedById: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  applicantName: { type: DataTypes.STRING(150), allowNull: false },
  birthDate: { type: DataTypes.DATEONLY, allowNull: true },
  civilStatus: { type: DataTypes.STRING(30), allowNull: true },
  address: { type: DataTypes.STRING(255), allowNull: true },
  contact: { type: DataTypes.STRING(20), allowNull: false, defaultValue: '' },
  email: { type: DataTypes.STRING(150), allowNull: false, defaultValue: '' },
  voter: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  boarder: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  civilLabel: { type: DataTypes.STRING(30), allowNull: true },
}, {
  tableName: 'certification_requests',
  timestamps: false,
  indexes: [{ fields: ['status'] }, { fields: ['type'] }, { fields: ['submitted_at'] }, { fields: ['applicant_name'] }, { fields: ['resident_id'] }],
})
