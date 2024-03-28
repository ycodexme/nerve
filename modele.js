// index.js
const qrcode = require('qrcode-terminal');
const { Client, LocalAuth, Buttons, MessageMedia } = require("whatsapp-web.js");

// Initialisation du client WhatsApp
const client = new Client({
  authStrategy: new LocalAuth(),
});

client.on('qr', qr => {
    qrcode.generate(qr, {small: true});
});

client.on('ready', () => {
    console.log('Client is ready!');
});

// Utilisez les fonctions dans la gestion des messages
client.on('message', async (message) => {
    if (message.body === '!ping') {
      message.reply('pong');
    } else {
      try {
        // Importez dynamiquement les fonctions de mistral.mjs
        const { callMistralAPIWithMemory, processUserInput } = await import('./mistral.mjs');
        
        // Appeler la fonction callMistralAPIWithMemory de mistral.m.js
        const mistralResponse = await callMistralAPIWithMemory(message.body);
  
        // Répondre au message avec la réponse de Mistral
        message.reply(mistralResponse.content);
      } catch (error) {
        console.error('Error importing functions from mistral.mjs:', error.message);
      }
    }
  });
  
// Initializez le client WhatsApp
client.initialize();
