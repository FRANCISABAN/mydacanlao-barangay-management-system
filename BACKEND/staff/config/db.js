import mysql from 'mysql2/promise'
import { Sequelize } from 'sequelize'
import { env } from './index.js'

const { host, port, user, password, name } = env.db

export const sequelize = new Sequelize(name, user, password, {
  host,
  port,
  dialect: 'mysql',
  logging: false,
  timezone: '+08:00', // Philippine time
  define: { underscored: true, charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci' },
})

// XAMPP starts with no database of ours, so create it on first run.
async function ensureDatabase() {
  const conn = await mysql.createConnection({ host, port, user, password })
  await conn.query(`CREATE DATABASE IF NOT EXISTS \`${name}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`)
  await conn.end()
}

// sync() creates missing tables but never adds columns to a table that already exists. When a model gains a
// new field (for example the verification fields on residents), this adds the missing columns, so a database
// created by an earlier version keeps its data and keeps working. It only adds. It never changes or drops anything.
async function addMissingColumns() {
  const qi = sequelize.getQueryInterface()
  for (const model of Object.values(sequelize.models)) {
    const table = model.getTableName()
    const existing = await qi.describeTable(table)
    for (const attr of Object.values(model.rawAttributes)) {
      if (attr.primaryKey || attr.autoIncrement || existing[attr.field]) continue
      await qi.addColumn(table, attr.field, { type: attr.type, allowNull: attr.allowNull !== false, defaultValue: attr.defaultValue })
      console.log(`Database updated: added column ${table}.${attr.field}`)
    }
  }
}

// Call after the models are imported, so sync() creates every table that does not exist yet.
export async function connectDB() {
  await ensureDatabase()
  await sequelize.authenticate()
  await sequelize.sync()
  await addMissingColumns()
  console.log(`MySQL connected: ${name}@${host}:${port}`)
}
