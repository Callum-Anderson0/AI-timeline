const sqlite3 = require('sqlite3').verbose()
const path = require('path')

const db = new sqlite3.Database(path.resolve(__dirname, 'events.db'), err => {
  if (err) console.error('DB connection error:', err)
  else console.log('Connected to SQLite database')
})

module.exports = db
