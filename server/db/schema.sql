CREATE TABLE entities (
    entity_id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE, -- The name of the entity (e.g., "Meta", "Mark Zuckerberg")
    type TEXT NOT NULL,        -- The type of entity (e.g., "ORG", "PERSON", "LOC")
    description TEXT,          -- A brief description of the entity (optional)
    first_mentioned_date INTEGER, -- Unix timestamp of first mention (optional)
    last_mentioned_date INTEGER,  -- Unix timestamp of last mention (optional)
    mentions_count INTEGER DEFAULT 0 -- Counter for total mentions
);

CREATE TABLE articles (
    article_id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,         -- The title of the news article
    url TEXT UNIQUE NOT NULL,    -- The URL of the original article (unique to prevent duplicates)
    content TEXT,                -- The full content of the article (optional, but requested)
    published_at INTEGER NOT NULL, -- Unix timestamp of publication date
    source_name TEXT,            -- The name of the news source (e.g., "The Guardian")
    image_url TEXT,              -- URL to the article's main image (optional)
    description TEXT             -- A short description or summary of the article (optional)
);

CREATE TABLE article_entities (
    article_entity_id INTEGER PRIMARY KEY AUTOINCREMENT,
    article_id INTEGER NOT NULL,
    entity_id INTEGER NOT NULL,
    -- Additional fields for the specific mention (optional)
    -- For example, if you want to store the exact start/end position of the entity in the article content:
    -- start_index INTEGER,
    -- end_index INTEGER,
    -- score REAL, -- Confidence score from NER

    FOREIGN KEY (article_id) REFERENCES articles(article_id) ON DELETE CASCADE,
    FOREIGN KEY (entity_id) REFERENCES entities(entity_id) ON DELETE CASCADE,
    UNIQUE (article_id, entity_id) -- Ensures an entity is linked to an article only once
);
