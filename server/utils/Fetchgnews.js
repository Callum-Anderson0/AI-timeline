const path = require('path');
const db = require('../db/db'); // assumes db.js exports a connected SQLite instance

require('dotenv').config({ path: path.resolve(__dirname, '../../.env') }); // Adjust path as needed for your project structure
const { runNER } = require('./huggingface');

const GNEWS_API_KEY = process.env.GNEWS_API_KEY;

/**
 * Fetches news articles from GNews.io with optional full content.
 * @param {string} query The search query (e.g., "artificial intelligence").
 * @param {string} lang The language of the articles (e.g., "en" for English).
 * @param {string} country The country of the news source (e.g., "us" for United States).
 * @param {number} max The maximum number of articles to return (max 10 for free plan, higher for paid).
 * @returns {Promise<Array|null>} An array of article objects, or null if an error occurs.
 */

async function handleArticleSQL(articles) {
    const insertStmt = db.prepare(`
        INSERT OR IGNORE INTO articles (title, url, content, published_at, source_name, image_url, description)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    for (const article of articles) {
        // Await the async runNER call
        const entities = await runNER(article.title + ' ' + (article.content || ''));
        handleEntitiesSQL(entities); // if this is async, await it too

        const title = article.title || 'No title';
        const url = article.url || 'No URL';
        const content = article.content || null;
        const published_at = article.publishedAt
            ? Math.floor(new Date(article.publishedAt).getTime() / 1000)
            : Math.floor(Date.now() / 1000);
        const source_name = article.source?.name || 'Unknown';
        const image_url = article.image || null;
        const description = article.description || null;

        insertStmt.run(title, url, content, published_at, source_name, image_url, description);
    }

    insertStmt.finalize();
}

function handleEntitiesSQL(entities){
    const insertEntityStmt = db.prepare(`
        INSERT OR IGNORE INTO entities (
            name,
            type,
            description,
            first_mentioned_date,
            last_mentioned_date,
            mentions_count
        ) VALUES (?, ?, ?, ?, ?, ?)
    `);

    for (const entity of entities) {
            const name = entity.name;
            const type = entity.type;
            const desc = null; // No description available in your data
            const firstMentioned = 0;
            const lastMentioned = 0;
            const mentionsCount = 1;

            insertEntityStmt.run(name, type, desc, firstMentioned, lastMentioned, mentionsCount);
        }
}

async function fetchNewsFromGNews(query, lang = 'en', country = 'us', max = 10) {
    if (!GNEWS_API_KEY) {
        console.error("GNews API Key (GNEWS_API_KEY) is not set in environment variables.");
        return null;
    }

    // Base URL for the search endpoint
    const baseUrl = 'https://gnews.io/api/v4/search';

    // Constructing query parameters
    const params = new URLSearchParams({
        q: query,
        lang: lang,
        country: country,
        max: max.toString(),
        token: GNEWS_API_KEY,
        expand: 'content' // Request full content - requires paid subscription for full effect
    });

    const url = `${baseUrl}?${params.toString()}`;

    console.log(`Fetching news from: ${url}`); // For debugging: see the full URL being called

    try {
        const response = await fetch(url);

        // Check if the request was successful (status code 2xx)
        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`GNews API error: ${response.status} - ${errorBody}`);
        }

        const data = await response.json(); // Parse the JSON response
        console.log("GNews API raw response (first 2 articles for brevity):", data.articles ? data.articles.slice(0,2) : data);
        const articles = data.articles || []; // Extract articles, default to empty array if not present
        handleArticleSQL(articles); // Store articles in the database

       
    } catch (error) {
        console.error("Failed to fetch or store news:", error);
    }
}
module.exports = fetchNewsFromGNews;