import { DataTypes } from 'sequelize'
import { sequelize } from '../config/db.js'

export default sequelize.define('User', {
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  username: { type: DataTypes.STRING(50), allowNull: false, unique: true },
  passwordHash: { type: DataTypes.STRING(100), allowNull: false },
  name: { type: DataTypes.STRING(100), allowNull: false },
  role: { type: DataTypes.STRING(30), allowNull: false, defaultValue: 'secretary' },
  active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
}, {
  tableName: 'users',
  timestamps: true,
  // The password hash is never loaded unless a query asks for User.unscoped() (login only).
  defaultScope: { attributes: { exclude: ['passwordHash'] } },
})
