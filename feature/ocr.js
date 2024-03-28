// ocr.js
const Replicate = require("replicate");
const axios = require('axios');
const { REPLICATE_API_TOKEN } = require('../config');


const replicate = new Replicate({
    auth: REPLICATE_API_TOKEN
});

async function runOCR(imageData, prompt) {
  try {
      // Convertir l'image en base64
      const base64ImageData = Buffer.from(imageData.data, 'base64').toString('base64');

      // Appeler l'API Replicate pour l'OCR
      const output = await replicate.run(
          "yorickvp/llava-13b:e272157381e2a3bf12df3a8edd1f38d1dbd736bbb7437277c8b34175f8fce358",
          {
              input: {
                  image: `data:image/jpeg;base64,${base64ImageData}`,
                  top_p: 1,
                  prompt: prompt,
                  max_tokens: 1024,
                  temperature: 0.2,
              },
          }
      );

      console.log('Réponse de l\'API Replicate pour OCR:', output);

      // Renvoyer le texte résultant de l'OCR
      return output;
  } catch (error) {
      console.error('Erreur lors de l\'exécution de l\'OCR avec Replicate:', error);
      throw error;
  }
}

module.exports = { runOCR };
