// convert.js - Contient le code pour générer un fichier audio à partir du texte
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();
const OpenAI = require('openai');
const { API_KEY_OPEN_AI } = require('../config');

const openai = new OpenAI({ apiKey: API_KEY_OPEN_AI }); // Initialisez OpenAI avec votre clé API

const speechFile = path.resolve("./speech.mp3");

async function generateSpeech(text) {
    try {
        const mp3 = await openai.audio.speech.create({
            model: "tts-1",
            voice: "alloy",
            input: text, // Utilisation du champ input avec le texte à convertir
        });

        const buffer = Buffer.from(await mp3.arrayBuffer());
        await fs.writeFile(speechFile, buffer);
        console.log(`Fichier audio généré : ${speechFile}`);
    } catch (error) {
        console.error("Erreur lors de la génération du fichier audio :", error);
    }
}

module.exports = {
    generateSpeech
};
