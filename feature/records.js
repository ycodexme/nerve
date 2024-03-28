const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const fs = require('fs'); 
const path = require('path');
require('dotenv').config();
const OpenAI = require('openai');

const client = new Client({
  authStrategy: new LocalAuth(),
});

const speechFile = path.resolve("./speech.mp3");


const { API_KEY_OPEN_AI } = require('../config');

const openai = new OpenAI({ apiKey: API_KEY_OPEN_AI }); // Initialize OpenAI with your API key

async function transcribeAudio(mp3FilePath, recipient) {
  try {
    console.log('Transcription en cours. Fichier audio:', mp3FilePath);

    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(mp3FilePath),
      model: 'whisper-1',
    });

    console.log('Réponse de l\'API Whisper:', transcription);

    if (transcription && transcription.text) {
      console.log('Transcription réussie:', transcription.text);

      // Call the function to get the response from GPT-3.5 Turbo
      const gptResponse = await getGpt3Response(transcription.text, recipient);

      // Generate the audio file from the GPT-3.5 Turbo response
      await generateAudio(gptResponse, recipient);

    } else {
      console.error('La transcription n\'a pas réussi. Réponse de l\'API Whisper:', transcription);
      throw new Error('La transcription n\'a pas réussi.');
    }
  } catch (error) {
    console.error('Erreur lors de la transcription audio avec Whisper:', error);
    throw error;
  }
}

async function getGpt3Response(inputText, recipient) {
  try {
    const completion = await openai.chat.completions.create({
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: inputText }, // Pass user's message as content
      ],
      model: "gpt-3.5-turbo",
      max_tokens: 2000,
      
    });

    console.log('Réponse de GPT-3.5 Turbo:', completion.choices[0].message.content);

    return completion.choices[0].message.content;
  } catch (error) {
    console.error('Erreur lors de la demande à GPT-3.5 Turbo:', error);
    throw error;
  }
}

async function generateAudio(text, recipient) {
  try {
      const mp3 = await openai.audio.speech.create({
          model: "tts-1",
          voice: "alloy",
          input: text,
      });

      // Utilisation du chemin de fichier spécifié au début du script
      const buffer = Buffer.from(await mp3.arrayBuffer());
      await fs.promises.writeFile(speechFile, buffer);

      console.log(`Fichier audio généré : ${speechFile}`);

      // Envoi de la parole à l'utilisateur
      const media = MessageMedia.fromFilePath(speechFile);
      await client.sendMessage(recipient, media, { sendMediaAsDocument: true });

      return speechFile; // Retourne le chemin du fichier audio généré
  } catch (error) {
      console.error("Erreur lors de la génération du fichier audio :", error);
      throw error;
  }
}







module.exports = {
    transcribeAudio,
    generateAudio,
};

//ce code consiste a transcrire le son et a lui donner une réponse avec GPT-3.5 Turbo et a générer un fichier audio avec la réponse de GPT-3.5 Turbo.