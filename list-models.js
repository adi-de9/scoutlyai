require("dotenv").config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

async function runList() {
  const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
  const genAI = new GoogleGenerativeAI(apiKey);
  // Wait, there is no genAI.listModels() ? We can just fetch via REST.
  const response = await fetch(\`https://generativelanguage.googleapis.com/v1beta/models?key=\${apiKey}\`);
  const data = await response.json();
  console.log(data);
}

runList();
