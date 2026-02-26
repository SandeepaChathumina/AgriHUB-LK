import fs from 'fs';
import path from 'path';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the Google Gemini API with your secret key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const askSystemAssistant = async (req, res) => {
  try {
    const { question } = req.body;

    if (!question) {
      return res.status(400).json({ message: 'Please provide a question.' });
    }

    // 1. Read the text file containing your system details
    // path.resolve helps Node find the file correctly
    const filePath = path.resolve('data/system-data.txt');
    const systemKnowledge = fs.readFileSync(filePath, 'utf8');

    // 2. Select the Gemini model (1.5-flash is fast and perfect for text)
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // 3. Construct the strict prompt
    const prompt = `
      You are the official support assistant for the AgriHUB-LK platform.
      Read the following system knowledge strictly:
      
      --- START SYSTEM KNOWLEDGE ---
      ${systemKnowledge}
      --- END SYSTEM KNOWLEDGE ---
      
      User Question: "${question}"
      
      INSTRUCTIONS:
      1. Answer the user's question ONLY using the facts from the SYSTEM KNOWLEDGE above.
      2. If the answer is not contained in the text above, do not make it up. Instead, say exactly: "I'm sorry, I don't have that information. Please contact an Administrator at support@agrihub.lk."
      3. Be polite, concise, and helpful.
    `;

    // 4. Send to Gemini and get the response
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    res.status(200).json({ 
      success: true, 
      answer: responseText 
    });

  } catch (error) {
    console.error("Gemini API Error:", error);
    res.status(500).json({ message: 'Failed to communicate with AI Assistant', error: error.message });
  }
};