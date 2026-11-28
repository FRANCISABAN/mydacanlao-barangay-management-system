import { DataTypes } from 'sequelize'
import { sequelize } from '../config/db.js'

// Running number per year for request IDs (CR-2026-0042).
export default sequelize.define('Counter', {
  id: { type: DataTypes.STRING(20), primaryKey: true },
  seq: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
}, { tableName: 'counters', timestamps: false })
