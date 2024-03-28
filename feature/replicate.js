//par #replicate
//importons le config.js pour l'api replicate  
const axios = require('axios');
const Replicate = require("replicate");
const { REPLICATE_API_TOKEN } = require('../config');

const replicate = new Replicate({
    auth: REPLICATE_API_TOKEN
});


const runReplicate = async (userText) => {
    try {
        const response = await replicate.run(
            "fofr/sdxl-barbie:657c074cdd0e0098e39dae981194c4e852ad5bc88c7fbbeb0682afae714a6b0e",
            {
                input: {
                    prompt: userText
                }
            }
        );

        // Log de la réponse de l'API
        console.log('Réponse de l\'API Replicate:', response);
        return response; // Retourner la réponse de l'API
    } catch (error) {
        console.error('Erreur lors de l\'exécution du modèle Replicate :', error);
        // Gérer les erreurs si nécessaire
        throw error;
    }
};

//nous allons définir la manière dont nous allons exporter l'image générée par le modèle replicate
//en utilisant la fonction downloadImage
const downloadImage = async (url) => {
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
};

// nous allons exporter la fonction runReplicate dans le fichier index.js
module.exports = {
    runReplicate,
    downloadImage
};