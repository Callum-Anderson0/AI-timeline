const API_TOKEN = process.env.HF_API_KEY;  // store token in .env file

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
  console.log(result,"hello")
  return result;
}

module.exports = { runNER };
