import { DataTypes } from 'sequelize'
import { sequelize } from '../config/db.js'
import { VALIDATION_KEYS } from '../config/constants.js'

// 1.2.2 / 1.2.3 One required document of a request: the uploaded file and the review result.
// file_stored_name is the random file name on disk and is never sent to the client.
export default sequelize.define('RequestRequirement', {
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  requestId: { type: DataTypes.STRING(20), allowNull: false },
  name: { type: DataTypes.STRING(100), allowNull: false },
  fileOriginalName: { type: DataTypes.STRING(255), allowNull: true },
  fileStoredName: { type: DataTypes.STRING(100), allowNull: true },
  fileSize: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  fileMimeType: { type: DataTypes.STRING(60), allowNull: true },
  fileUploadedAt: { type: DataTypes.DATE, allowNull: true },
  validationStatus: { type: DataTypes.ENUM(...VALIDATION_KEYS), allowNull: false, defaultValue: 'pending' },
  validationRemarks: { type: DataTypes.STRING(500), allowNull: false, defaultValue: '' },
  validatedAt: { type: DataTypes.DATE, allowNull: true },
  validatedBy: { type: DataTypes.STRING(100), allowNull: true },
}, { tableName: 'request_requirements', timestamps: false, indexes: [{ unique: true, fields: ['request_id', 'name'] }] })
