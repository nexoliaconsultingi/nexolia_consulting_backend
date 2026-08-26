const { GoogleGenerativeAI } = require("@google/generative-ai");
const Groq = require("groq-sdk");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

let _groq = null;
function getGroq() {
  if (!_groq) _groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  return _groq;
}

async function askAI(prompt) {

  try {

    console.log("✅ Réponse générée par Gemini");

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
    });

    const result = await model.generateContent(prompt);

    return await result.response.text();

  } catch (geminiError) {

    console.error("❌ Gemini indisponible :", geminiError.message);

    console.log("🔄 Basculement vers Groq...");

    const completion = await getGroq().chat.completions.create({
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.5,
    });

    console.log("✅ Réponse générée par Groq");

    return completion.choices[0].message.content;
  }
}

module.exports = askAI;