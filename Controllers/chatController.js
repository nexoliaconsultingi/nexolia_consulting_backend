const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require("fs");
const path = require("path");

let knowledge = null;

function getKnowledge() {
  if (knowledge) return knowledge;

  const filePath = path.join(__dirname, "../lib/nexolia-knowledge.txt");

  if (!fs.existsSync(filePath)) {
    throw new Error("Knowledge file missing");
  }

  knowledge = fs.readFileSync(filePath, "utf-8");
  return knowledge;
}

const chatWithAI = async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message requis" });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
    });

    const knowledge = getKnowledge();

    const prompt = `
Tu es l'assistant Nexolia Consulting.

Documentation :
${knowledge}

Client: ${message}
Réponse:
`;

    const result = await model.generateContent(prompt);
    const response = await result.response.text();

    res.json({ reply: response });

  } catch (err) {
    console.error("Chat error:", err);
    res.status(500).json({ error: "Erreur serveur chatbot" });
  }
};

module.exports = { chatWithAI };