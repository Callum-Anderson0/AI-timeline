const db = require('./db')

db.serialize(() => {
  // Drop existing tables
  db.run('DROP TABLE IF EXISTS article_entities');
  db.run('DROP TABLE IF EXISTS articles');
  db.run('DROP TABLE IF EXISTS entities');

  // Create entities table
  db.run(`
    CREATE TABLE entities (
      entity_id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      type TEXT NOT NULL,
      description TEXT,
      first_mentioned_date INTEGER,
      last_mentioned_date INTEGER,
      mentions_count INTEGER DEFAULT 0
    )
  `);

  // Create articles table
  db.run(`
    CREATE TABLE articles (
      article_id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      url TEXT UNIQUE NOT NULL,
      content TEXT,
      published_at INTEGER NOT NULL,
      source_name TEXT,
      image_url TEXT,
      description TEXT
    )
  `);

  // Create article_entities table
  db.run(`
    CREATE TABLE article_entities (
      article_entity_id INTEGER PRIMARY KEY AUTOINCREMENT,
      article_id INTEGER NOT NULL,
      entity_id INTEGER NOT NULL,
      FOREIGN KEY (article_id) REFERENCES articles(article_id) ON DELETE CASCADE,
      FOREIGN KEY (entity_id) REFERENCES entities(entity_id) ON DELETE CASCADE,
      UNIQUE (article_id, entity_id)
    )
  `);

  // Seed entities
  const insertEntity = db.prepare(`
    INSERT INTO entities (name, type, description, first_mentioned_date, last_mentioned_date, mentions_count)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  insertEntity.run("OpenAI", "ORG", "An AI research and deployment company", 1678752000, 1700000000, 1);
  insertEntity.run("Sam Altman", "PERSON", "CEO of OpenAI", 1678752000, 1700000000, 1);
  insertEntity.finalize();

  // Seed articles
  const insertArticle = db.prepare(`
    INSERT INTO articles (title, url, content, published_at, source_name, image_url, description)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  insertArticle.run(
    "OpenAI launches GPT-4",
    "https://example.com/openai-gpt4",
    "Full content of the GPT-4 release article.",
    1678752000,
    "TechCrunch",
    "https://example.com/image1.jpg",
    "A major leap in generative AI."
  );
  insertArticle.run(
    "Sam Altman speaks at AI summit",
    "https://example.com/altman-ai-summit",
    "Full content of the AI summit keynote.",
    1681353600,
    "The Verge",
    "https://example.com/image2.jpg",
    "OpenAI's CEO discusses AI policy."
  );
  insertArticle.finalize();

  // Link entities to articles (assuming IDs 1 and 2 from above inserts)
  const insertArticleEntity = db.prepare(`
    INSERT INTO article_entities (article_id, entity_id)
    VALUES (?, ?)
  `);
  insertArticleEntity.run(1, 1); // OpenAI in GPT-4 article
  insertArticleEntity.run(2, 2); // Sam Altman in Summit article
  insertArticleEntity.run(2, 1); // OpenAI also mentioned in Summit article
  insertArticleEntity.finalize();
});


db.all("SELECT * FROM entities", (err, rows) => {
  if (err) throw err;
  console.log("Entities:", rows);
});
db.close();

