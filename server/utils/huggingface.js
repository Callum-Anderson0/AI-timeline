const { merge } = require("2048/lib/table_calc");

const API_TOKEN = process.env.HF_API_KEY;  // store token in .env file

/**
 * Processes the raw NER output to concatenate multi-word entities.
 * @param {Array<Object>} nerResults - The array of NER results from Hugging Face.
 * @returns {Array<Object>} An array of processed entities with concatenated names.
 */

function cleanAndDeduplicateEntities(entityNames) {
    if (!entityNames || !Array.isArray(entityNames)) {
        console.warn("Input is not a valid array.");
        return [];
    }

    // Step 1: Trim whitespace from each entity name
    const trimmedNames = entityNames.map(name => {
        if (typeof name === 'string') {
            return name.trim();
        }
        // Handle non-string entries gracefully, e.g., convert to string or filter out
        console.warn(`Skipping non-string entity: ${name}`);
        return String(name).trim(); // Convert to string and then trim
    });

    // Step 2: Use a Set to automatically filter out duplicates
    const uniqueNamesSet = new Set(trimmedNames);

    // Step 3: Convert the Set back to an array
    const deduplicatedNames = Array.from(uniqueNamesSet);

    return deduplicatedNames;
}


function concatenateEntities(nerResults) {
    if (!nerResults || !Array.isArray(nerResults) || nerResults.length === 0) {
        return [];
    }

    const concatenatedNames = [];
    let currentEntityInfo = null; // Stores { name: string, lastCharIndex: number, semanticType: string }

    for (const entity of nerResults) {
        // --- Defensive checks for required properties and types ---
        if (!entity || typeof entity.word !== 'string' || typeof entity.start !== 'number' || typeof entity.end !== 'number') {
            console.warn("Skipping malformed entity:", entity);
            continue; // Skip this entity if it's not well-formed
        }
        // --- End Defensive checks ---

        // 1. Clean the word: remove "##" prefix for subwords
        const cleanedWord = entity.word.startsWith("##") ? entity.word.substring(2) : entity.word;

        // 2. Determine the semantic type (e.g., 'PER', 'ORG').
        const entitySemanticType = entity.entity_group || entity.type;

        let shouldAppend = false;
        // Declare these variables here so they are accessible throughout the loop iteration
        let isDirectlyContiguous = false;
        let isSpaceSeparated = false;

        if (currentEntityInfo) {
            // Assign values to the variables declared above
            isDirectlyContiguous = entity.start === currentEntityInfo.lastCharIndex;
            isSpaceSeparated = entity.start === currentEntityInfo.lastCharIndex + 1;

            // Decision Logic for Appending:
            if (entity.word.startsWith("##") && isDirectlyContiguous) {
                shouldAppend = true;
            }
            else if (currentEntityInfo.semanticType === entitySemanticType &&
                     (isDirectlyContiguous || isSpaceSeparated)) {
                shouldAppend = true;
            }
        }

        if (shouldAppend) {
            // isSpaceSeparated is now correctly in scope here
            currentEntityInfo.name += (isSpaceSeparated ? " " : "") + cleanedWord;
            currentEntityInfo.lastCharIndex = entity.end;
        } else {
            if (currentEntityInfo) {
                concatenatedNames.push(currentEntityInfo.name);
            }
            currentEntityInfo = {
                name: cleanedWord,
                lastCharIndex: entity.end,
                semanticType: entitySemanticType,
            };
        }
    }

    if (currentEntityInfo) {
        concatenatedNames.push(currentEntityInfo.name);
    }
    const deduplicatedNames = cleanAndDeduplicateEntities(concatenatedNames);
    return deduplicatedNames;
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
