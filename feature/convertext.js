const fs = require('fs').promises;
const path = require('path');
const OpenAI = require('openai');
const { API_KEY_OPEN_AI } = require('../config');

const openai = new OpenAI({ apiKey: API_KEY_OPEN_AI });

const speechFile = path.resolve("./speech.mp3");

async function generateSpeech(text) {
    try {
        const mp3 = await openai.audio.speech.create({
            model: "tts-1",
            voice: "alloy",
            input: text,
        });

        const buffer = Buffer.from(await mp3.arrayBuffer());
        await fs.writeFile(speechFile, buffer);
        console.log(`Fichier audio généré : ${speechFile}`);
    } catch (error) {
        console.error("Erreur lors de la génération du fichier audio :", error);
    }
}

module.exports = { generateSpeech };
