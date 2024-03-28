const fetch = require('node-fetch');
const Replicate = require("replicate");
const { REPLICATE_API_TOKEN } = require('../config');

const replicate = new Replicate({
  auth: REPLICATE_API_TOKEN
});

async function convertImage(imageData) {
  try {
    const base64ImageData = Buffer.from(imageData.data, 'base64').toString('base64');
    const webhookUrl = 'https://morning-shore-70765-2224201083d1.herokuapp.com/replicate-webhook';

    console.log("Step 2: Running Replicate API request");
    const output = await replicate.run(
      'tencentarc/gfpgan:9283608cc6b7be6b65a8e44983db012355fde4132009bf99d976b2f0896856a3',
      {
        input: {
          img: `data:image/jpeg;base64,${base64ImageData}`,
          scale: 2,
          version: "v1.4",
        },
        webhook: webhookUrl,
        webhook_events_filter: ['start', 'completed'],
      }
    );

    console.log('Réponse de l\'API de swap:', output);

    // Download the modified image from the URL provided by the Replicate API using node-fetch
    const response = await fetch(output);
    const modifiedImageBuffer = await response.buffer();

    // Send the modified image to the user or handle it as needed
    return modifiedImageBuffer;
  } catch (error) {
    console.error('Error running the Face Swap model:', error);
    throw error;
  }
}

module.exports = {
  convertImage
};
