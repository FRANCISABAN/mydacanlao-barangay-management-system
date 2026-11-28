import { DataTypes } from 'sequelize'
import { sequelize } from '../config/db.js'

// 1.1.4 A remark tied to the request and the reviewer who wrote it.
export default sequelize.define('RequestRemark', {
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  requestId: { type: DataTypes.STRING(20), allowNull: false },
  text: { type: DataTypes.STRING(500), allowNull: false },
  author: { type: DataTypes.STRING(100), allowNull: false },
  authorId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
}, { tableName: 'request_remarks', timestamps: false, indexes: [{ fields: ['request_id'] }] })
