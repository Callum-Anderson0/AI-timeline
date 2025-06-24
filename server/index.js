const express = require('express')
const cors = require('cors')
const db = require('./db/db')

const app = express()
app.use(cors())
app.use(express.json())

// Sample endpoint
app.get('/events', (req, res) => {
  db.all('SELECT * FROM events', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message })
    }
    res.json(rows)
  })
})

const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
