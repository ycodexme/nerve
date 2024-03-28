//par #replicate
//importons le config.js pour l'api replicate  
const axios = require('axios');
const Replicate = require("replicate");
const { REPLICATE_API_TOKEN } = require('../config');

const replicate = new Replicate({
    auth: REPLICATE_API_TOKEN
});

async function runSwap(imageData) {
  try {
    // Convert the MessageMedia object to base64 encoded string
    const base64ImageData = Buffer.from(imageData).toString('base64');

    const response = await replicate.run(
      "omniedgeio/face-swap:c2d783366e8d32e6e82c40682fab6b4c23b9c6eff2692c0cf7585fc16c238cfe",
      {
        input: {
          target_image: base64ImageData,
          swap_image: "https://replicate.delivery/pbxt/JoBuzfSVFLb5lBqkf3v9xMnqx3jFCYhM5JcVInFFwab8sLg0/long-trench-coat.png",
        }
      }
    );

    // Treat the response here if necessary and return the image URL
    if (response && response.length > 0) {
      return response[0]; // Return the image URL
    } else {
      console.error("The Replicate API response doesn't contain a valid URL for the swapped image.");
      return null;
    }
  } catch (error) {
    console.error('Error running the Replicate Face Swap model:', error);
    throw error;
  }
}

// La méthode pour récupérer l'image reste la même que pour #replicate
async function downloadImage(url) {
  try {
    const response = await axios.get(url, {
      responseType: 'arraybuffer'
    });

    console.log('Image téléchargée avec succès');
    return response.data;
  } catch (error) {
    console.error('Erreur lors du téléchargement de l\'image :', error);
    throw error;
  }
}
module.exports = {
  runSwap,
  downloadImage
};