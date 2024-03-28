const axios = require('axios');
const Replicate = require("replicate");
const { REPLICATE_API_TOKEN } = require('../config');
const { Client } = require('whatsapp-web.js');
const fs = require('fs');
const path = require('path');


const replicate = new Replicate({
    auth: REPLICATE_API_TOKEN
});

async function convertImageToURI(imageData) {
  try {
      // ... (traitement de l'image avec l'API de swap)
      const base64ImageData = Buffer.from(imageData.data, 'base64').toString('base64');

        const output = await replicate.run(
          "yan-ops/face_swap:034b2af6027558c94fdd7a028400cb68d7f049ad3351ab7b7cfc09fdaeb96d46",
          {
              input: {
                  det_thresh: 0.5,
                  request_id: "aa6a2aad-90ec-4c00-b90b-89f4d62e6b84",
                  source_image: `data:image/jpeg;base64,${base64ImageData}`,
                  target_image: "https://img.freepik.com/photos-premium/portrait-homme-pilote-fond-photo-occupation-pilote-avion_622818-1213.jpg?w=740"
                }
           }
        );

      console.log('Réponse de l\'API de swap:', output);

      const imageUrl = output.image;
      const modifiedImageBuffer = await axios.get(imageUrl, {
          responseType: 'arraybuffer'
      });

      // Retourner les données de l'image modifiée
      return modifiedImageBuffer.data;
  } catch (error) {
      console.error('Error running the Face Swap model:', error);
      throw error;
  }
}

module.exports = {
  convertImageToURI
};