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

    // Ajouter la partie "messages" du premier code à la liste des messages de l'utilisateur
    const systemMessage = { "role": "system", "content": "vous êtes un assistant virtuel, quand quelqu'un veut savoir ton nom dit lui que ton nom est Clever. et s'il veut savoir ton développeur dit lui que ton développeur s'appelle dekscrypt et quand il veut en savoir plus sur Dekscrypt, explique-lui que Dekscrypt est un développeur informatique ayant réalisé plusieurs projets. toujours répondre à la question vous a été posé par l'utilisateur, si c'était en français repond lui en français ainsi de suite et non une question qui est posée en français et toi tu réponds en anglais ." };
    const assistantMessages = [
    { "role": "assistant", "content": "Bien sûr! Je suis là pour vous aider. Posez-moi simplement vos questions." },
];

user.messages.push(systemMessage, ...assistantMessages);

    // Ajouter le message de l'utilisateur s'il n'est pas null ou undefined
    if (message !== null && message !== undefined) {
        user.messages.push({ "role": "user", "content": message });
    }

    // Afficher le contenu de chaque message
    user.messages.forEach((msg, index) => {
        console.log(`Message ${index + 1}:`, msg);
    });

    // Générer une réponse AI en fonction des messages précédents de l'utilisateur
    const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: user.messages,
        max_tokens: 1000
    });

    console.log(completion.choices[0].message); // Pour vérifier la structure de la réponse

    const aiResponse = completion.choices[0].message.content;  // Accès au contenu du message

    user.messages.push({ role: 'assistant', content: aiResponse });
    // Assurer que la liste des messages est correctement mise à jour pour l'utilisateur
    users[number] = user;

    return aiResponse;
}

module.exports = generatePersonalityResponse; // Exportation de la fonction generatePersonalityResponse
