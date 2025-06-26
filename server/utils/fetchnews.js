const db = require('../db/db'); // assumes db.js exports a connected SQLite instance

const API_KEY = process.env.NEWS_API_KEY;
const NEWS_API_URL = `https://newsapi.org/v2/everything?q=startups&sortBy=publishedAt&pageSize=10&apiKey=${API_KEY}`;


async function fetchAndStoreNews() {

  try {
    const response = await fetch(NEWS_API_URL);
    if (!response.ok) throw new Error(`News API error: ${response.status}`);

    const data = await response.json();
    const articles = data.articles;

    const insertStmt = db.prepare(`
      INSERT INTO events (title, date, company, summary)
      VALUES (?, ?, ?, ?)
    `);


    db.serialize(async () => {
      for (const article of articles) {
        const title = article.title || 'No title';
        const date = article.publishedAt || new Date().toISOString();
        const company = article.source?.name || 'Unknown';
        const summary = article.description || 'No summary available.';


        insertStmt.run(title, date, company, summary);
      }
      insertStmt.finalize();
    });

    console.log(`✅ Stored ${articles.length} articles in the database.`);
  } catch (err) {
    console.error('❌ Failed to fetch or store news:', err.message);
  }
}

module.exports = fetchAndStoreNews;
