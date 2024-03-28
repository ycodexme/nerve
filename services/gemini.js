// gemini.js

const { GoogleGenerativeAI } = require("@google/generative-ai");
const readline = require("readline");
const fs = require('fs');


let conversationHistory = [];

const genAI = new GoogleGenerativeAI(process.env.API_KEY);

async function runGeminiChatBot(userInput) {
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });

  const chat = model.startChat({
    generationConfig: {
      maxOutputTokens: 1000,
    },
  });

  // Utiliser l'historique pour informer le modèle
  const inputWithHistory = `${userInput}\n\nHistorique de la discussion:\n${JSON.stringify(conversationHistory)}`;
  
  const result = await chat.sendMessage(inputWithHistory);
  const response = await result.response;
  const text = response.text();

  // Enregistrer la question de l'utilisateur et la réponse du chatbot dans l'historique
  conversationHistory.push({ question: userInput, answer: text });

  return text;
}

function loadConversationHistoryFromFile() {
  if (fs.existsSync('conversationHistory.json')) {
    const data = fs.readFileSync('conversationHistory.json', 'utf8');
    return JSON.parse(data);
  }
  return [];
}

function saveConversationHistoryToFile() {
  fs.writeFileSync('conversationHistory.json', JSON.stringify(conversationHistory));
}

conversationHistory = loadConversationHistoryFromFile();

module.exports = { runGeminiChatBot, saveConversationHistoryToFile };
