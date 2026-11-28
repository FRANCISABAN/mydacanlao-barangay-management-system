import { DataTypes } from 'sequelize'
import { sequelize } from '../config/db.js'
import { VERIFICATION_KEYS } from '../config/constants.js'

// Records are created by the BHW (2.1.1), by the seed script, or through household registration (2.2.1).
// The Secretary can only read them (1.4.2).
export default sequelize.define('Resident', {
  id: { type: DataTypes.STRING(20), primaryKey: true }, // RES-001
  firstName: { type: DataTypes.STRING(80), allowNull: false },
  middleName: { type: DataTypes.STRING(80), allowNull: false, defaultValue: '' },
  lastName: { type: DataTypes.STRING(80), allowNull: false },
  sex: { type: DataTypes.ENUM('Male', 'Female'), allowNull: false },
  birthDate: { type: DataTypes.DATEONLY, allowNull: false }, // returned as YYYY-MM-DD
  civilStatus: { type: DataTypes.STRING(30), allowNull: false },
  occupation: { type: DataTypes.STRING(100), allowNull: false, defaultValue: '' },
  contact: { type: DataTypes.STRING(20), allowNull: false, defaultValue: '' },
  householdId: { type: DataTypes.STRING(20), allowNull: false },
  relationship: { type: DataTypes.STRING(50), allowNull: false }, // relationship to the household head

  // 2.1.2 Verification result, remarks, and who recorded it.
  verificationStatus: { type: DataTypes.ENUM(...VERIFICATION_KEYS), allowNull: false, defaultValue: 'unverified' },
  verificationRemarks: { type: DataTypes.STRING(500), allowNull: false, defaultValue: '' },
  verifiedBy: { type: DataTypes.STRING(100), allowNull: true },
  verifiedAt: { type: DataTypes.DATE, allowNull: true },

  // 2.1.5 Who registered / last changed the record. `version` goes up by 1 on every save (conflict detection).
  version: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 1 },
  createdBy: { type: DataTypes.STRING(100), allowNull: true },
  createdAt: { type: DataTypes.DATE, allowNull: true },
  updatedBy: { type: DataTypes.STRING(100), allowNull: true },
  updatedAt: { type: DataTypes.DATE, allowNull: true },
}, { tableName: 'residents', timestamps: false, indexes: [{ fields: ['household_id'] }, { fields: ['last_name', 'first_name'] }] })
