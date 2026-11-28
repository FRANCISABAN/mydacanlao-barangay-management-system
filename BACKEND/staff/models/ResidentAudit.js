import { DataTypes } from 'sequelize'
import { sequelize } from '../config/db.js'

// 2.1.5 Audit trail of resident records: what changed (previous and new values), who did it, and when.
// `changes` holds JSON text: { fieldName: { from, to } }.
export default sequelize.define('ResidentAudit', {
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  residentId: { type: DataTypes.STRING(20), allowNull: false },
  action: { type: DataTypes.STRING(20), allowNull: false }, // create | update | verify | reassign
  changes: { type: DataTypes.TEXT, allowNull: false },
  userId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  performedBy: { type: DataTypes.STRING(100), allowNull: true },
  performedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
}, { tableName: 'resident_audits', timestamps: false, indexes: [{ fields: ['resident_id'] }] })
