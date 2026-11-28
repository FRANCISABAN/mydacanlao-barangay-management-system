import { DataTypes } from 'sequelize'
import { sequelize } from '../config/db.js'
import { PUROKS, TENURE } from '../config/constants.js'

// head_id points to a resident but has no foreign key, because residents also point back to households.
export default sequelize.define('Household', {
  id: { type: DataTypes.STRING(20), primaryKey: true }, // HH-001
  headId: { type: DataTypes.STRING(20), allowNull: false },
  address: { type: DataTypes.STRING(255), allowNull: false },
  purok: { type: DataTypes.TINYINT.UNSIGNED, allowNull: false, validate: { isIn: [PUROKS] } },
  tenure: { type: DataTypes.ENUM(...TENURE), allowNull: false },
  contact: { type: DataTypes.STRING(20), allowNull: false, defaultValue: '' },
  // 2.2.6 Who last edited the record, and `version` for update conflict detection (goes up by 1 on every save).
  version: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 1 },
  createdBy: { type: DataTypes.STRING(100), allowNull: true },
  createdAt: { type: DataTypes.DATE, allowNull: true },
  updatedBy: { type: DataTypes.STRING(100), allowNull: true },
  updatedAt: { type: DataTypes.DATE, allowNull: true },
}, { tableName: 'households', timestamps: false, indexes: [{ fields: ['purok'] }] })
