const askAI = require("../services/aiService");
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

    const knowledge = getKnowledge();

    const prompt = `
Tu es l'assistant Nexolia Consulting.

Documentation :
${knowledge}

Client: ${message}

Réponse:
`;

    // Utilise Gemini puis Groq en fallback automatique
    const response = await askAI(prompt);

    res.json({ reply: response });

  } catch (err) {
    console.error("Chat error:", err);
    res.status(500).json({ error: "Erreur serveur chatbot" });
  }
};

module.exports = { chatWithAI };