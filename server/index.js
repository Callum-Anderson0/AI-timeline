require('dotenv').config({ path:'../.env'});

const text = "Mark Zuckerberg’s Meta has won the backing of a judge in a copyright lawsuit brought by a group of authors, in the second legal victory for the US artificial intelligence industry this week. The writers, who included Sarah Silverman and Ta-Nehisi Coates, had argued that the Facebook owner had breached copyright law by using their books without permission to train its AI system. The ruling follows a decision on Monday that Anthropic, another major player in the AI field, had not infringed authors’ copyright."
const express = require('express')
const cors = require('cors')
const db = require('./db/db')
const fetchAndStoreNews = require('./utils/fetchnews.js');
const fetchNewsFromGNews = require('./utils/Fetchgnews.js');
//const { runNER } = require('./utils/huggingface.js');


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
  //runNER(text);
  //fetchAndStoreNews();  // fetch news and store in DB on startup
  const articles = fetchNewsFromGNews("technology startups");

})
