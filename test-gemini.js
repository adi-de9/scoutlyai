require("dotenv").config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

async function runTest() {
  const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) {
    console.error("No API key found in .env");
    process.exit(1);
  }
  
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  
  const sampleText = "All students must submit the internship application before 20 July 2026. Required documents include Aadhaar card, previous semester marksheet, passport-size photograph, and NOC from college. Late applications will not be accepted.";
  
  const prompt = `Extract deadline information from this document. Respond strictly with a JSON object matching this TypeScript type:
{
  "title": "string",
  "mainDeadline": "string (ISO date)",
  "priority": "low" | "medium" | "high",
  "documents": ["required document strings"],
  "instructions": ["specific instruction strings"],
  "unclear": ["anything unclear strings"],
  "rawText": "a brief plain text summary of the notice"
}`;

  console.log("Running Gemini API test case...");
  try {
    const result = await model.generateContent([
      prompt,
      sampleText
    ]);
    
    let responseText = result.response.text();
    responseText = responseText.replace(/^```json/m, "").replace(/```$/m, "").trim();
    
    const parsed = JSON.parse(responseText);
    console.log("Extraction Successful!");
    console.log(JSON.stringify(parsed, null, 2));
    
    if (parsed.title && parsed.mainDeadline && parsed.documents) {
      console.log("Test Passed: All required fields extracted properly.");
    } else {
      console.error("Test Failed: Missing fields in the output.");
      process.exit(1);
    }
  } catch (error) {
    console.error("Gemini API Error:", error);
    process.exit(1);
  }
}

runTest();
