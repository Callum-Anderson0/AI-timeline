const { merge } = require("2048/lib/table_calc");

const API_TOKEN = process.env.HF_API_KEY;  // store token in .env file

/**
 * Processes the raw NER output to concatenate multi-word entities.
 * @param {Array<Object>} nerResults - The array of NER results from Hugging Face.
 * @returns {Array<Object>} An array of processed entities with concatenated names.
 */

function cleanAndDeduplicateEntities(entityNameTypeObjects) {
    if (!entityNameTypeObjects || !Array.isArray(entityNameTypeObjects)) {
        return [];
    }

    const uniqueEntitiesMap = new Map(); // Key: trimmed name (string), Value: { name: string, type: string }

    for (const entity of entityNameTypeObjects) {
        if (!entity || typeof entity.name !== 'string' || typeof entity.type !== 'string') {
            console.warn("Skipping malformed entity object in deduplication:", entity);
            continue;
        }
        const trimmedName = entity.name.trim();
        // Use the first type encountered for a given name as the canonical type
        if (!uniqueEntitiesMap.has(trimmedName)) {
            uniqueEntitiesMap.set(trimmedName, { name: trimmedName, type: entity.type });
        }
    }
    return Array.from(uniqueEntitiesMap.values()); // Return array of { name, type } objects
}


function concatenateEntities(nerResults) {
    if (!nerResults || !Array.isArray(nerResults) || nerResults.length === 0) {
        return [];
    }

    // Change to hold objects { name: string, type: string }
    const concatenatedEntityObjects = [];
    // currentEntityInfo now explicitly stores 'name', 'lastCharIndex', and 'type'
    let currentEntityInfo = null; // Stores { name: string, lastCharIndex: number, type: string }

    for (const entity of nerResults) {
        // --- Defensive checks for required properties and types ---
        if (!entity || typeof entity.word !== 'string' || typeof entity.start !== 'number' || typeof entity.end !== 'number') {
            console.warn("Skipping malformed entity:", entity);
            continue; // Skip this entity if it's not well-formed
        }
        // --- End Defensive checks ---

        // 1. Clean the word: remove "##" prefix for subwords AND trim whitespace
        const cleanedWord = (entity.word.startsWith("##") ? entity.word.substring(2) : entity.word).trim();

        // 2. Determine the semantic type (e.g., 'PER', 'ORG').
        // This is the type for the current *token*, which will become the type for the concatenated entity
        const currentTokenType = entity.entity_group || entity.type;

        let shouldAppend = false;
        let isDirectlyContiguous = false;
        let isSpaceSeparated = false;

        if (currentEntityInfo) {
            // Assign values to the variables declared above
            isDirectlyContiguous = entity.start === currentEntityInfo.lastCharIndex;
            isSpaceSeparated = entity.start === currentEntityInfo.lastCharIndex + 1;

            // Decision Logic for Appending:
            // Rule A: Subword token (starts with ##) AND is directly contiguous -> ALWAYS append.
            if (entity.word.startsWith("##") && isDirectlyContiguous) {
                shouldAppend = true;
            }
            // Rule B: Not a subword, AND type matches current entity's type, AND it's contiguous.
            // We compare against the type stored in currentEntityInfo (from its first token).
            else if (currentEntityInfo.type === currentTokenType &&
                     (isDirectlyContiguous || isSpaceSeparated)) {
                shouldAppend = true;
            }
        }

        if (shouldAppend) {
            currentEntityInfo.name += (isSpaceSeparated ? " " : "") + cleanedWord;
            currentEntityInfo.lastCharIndex = entity.end;
            // The 'type' of currentEntityInfo remains the type set by its *first* token.
        } else {
            if (currentEntityInfo) {
                // Push the complete entity object (name and type)
                concatenatedEntityObjects.push({
                    name: currentEntityInfo.name,
                    type: currentEntityInfo.type
                });
            }
            // Start a new entity
            currentEntityInfo = {
                name: cleanedWord,
                lastCharIndex: entity.end,
                type: currentTokenType, // Store the type for this new entity
            };
        }
    }

    // After the loop, push the very last entity if one was being built
    if (currentEntityInfo) {
        concatenatedEntityObjects.push({
            name: currentEntityInfo.name,
            type: currentEntityInfo.type
        });
    }

    // Finally, clean and deduplicate the list of entity objects
    const deduplicatedEntities = cleanAndDeduplicateEntities(concatenatedEntityObjects);
    console.log(deduplicatedEntities)
    return deduplicatedEntities; // Returns an array of { name, type } objects
}

async function runNER(text) {
  const response = await fetch('https://api-inference.huggingface.co/models/dslim/bert-base-NER', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ inputs: text }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Hugging Face API error: ${response.status} ${err}`);
  }

  const result = await response.json();
  const mergedResult = concatenateEntities(result);
  console.log("NER Result:", mergedResult);
  return new Set(mergedResult);

}

module.exports = { runNER };
