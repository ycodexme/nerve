require('dotenv').config();
const OpenAI = require('openai');
const { API_KEY_OPEN_AI } = require('../config');
const path = require('path');

const openai = new OpenAI({ apiKey: API_KEY_OPEN_AI }); // Initialisez OpenAI avec votre clé API

// Initialisation de la base de données fictive des utilisateurs
const users = {};

async function generatePersonalityResponse(message, number) {
    // Récupérer l'utilisateur correspondant au numéro ou initialiser s'il n'existe pas
    const user = users[number] || { messages: [] };

    // Vérification de la structure de user.messages et mise à jour
    if (!Array.isArray(user.messages)) {
        user.messages = [];
    }

    // Mise à jour de user.messages avec les nouveaux messages
    user.messages.push({ role: 'user', content: message });

    // Générer une réponse AI en fonction des messages précédents de l'utilisateur
    const completion = await openai.createChatCompletion({
        model: "gpt-3.5-turbo",
        messages: user.messages,
        max_tokens: 2000
    });

    const aiResponse = completion.data.choices[0].message.content;
    user.messages.push({ role: 'assistant', content: aiResponse });

    // Assurer que la liste des messages est correctement mise à jour pour l'utilisateur
    users[number] = user;

    return aiResponse;
}

module.exports = generatePersonalityResponse; // Exportation de la fonction generatePersonalityResponse