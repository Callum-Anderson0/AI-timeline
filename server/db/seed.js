const db = require('./db')

db.serialize(() => {
  db.run('DROP TABLE IF EXISTS events')
  db.run(`
    CREATE TABLE events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      date TEXT NOT NULL,
      company TEXT,
      summary TEXT
    )
  `)
  const stmt = db.prepare('INSERT INTO events (title, date, company, summary) VALUES (?, ?, ?, ?)')
  stmt.run('OpenAI launches GPT-4', '2023-03-14', 'OpenAI', 'A major leap in generative AI.')
  stmt.run('Anthropic releases Claude', '2023-07-11', 'Anthropic', 'Anthropic joins the AI race.')
  stmt.finalize()
})
