const deepl = require('deepl-node');

const authKey = "fc10c08b-7fbb-504c-bd68-a3ed5cd63878:fx"; // Remplacez par votre clé Deepl
const translator = new deepl.Translator(authKey);

// Fonction pour traduire le texte de l'API Gemini Pro Vision avec Deepl
async function translateWithDeepl(text) {
  try {
    const result = await translator.translateText(text, null, 'fr');
    console.log('Traduction avec Deepl:', result);
    return result.text;
  } catch (error) {
    console.error('Erreur lors de la traduction avec Deepl:', error);
    throw error;
  }
}

module.exports = { translateWithDeepl };
