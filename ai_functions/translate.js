const { translate } = require('free-translate');

// Fonction pour traduire le texte avec free-translate
async function translateWithFreeTranslate(text) {
  try {
    const translatedText = await translate(text, { from: 'en', to: 'fr' });
    console.log('Traduction avec free-translate:', translatedText);
    return translatedText;
  } catch (error) {
    console.error('Erreur lors de la traduction avec free-translate:', error);
    throw error;
  }
}

// Exemple d'utilisation
(async () => {
  try {
    const englishText = 'Your English text here'; // Remplacez par votre texte en anglais provenant de l'API OpenAI
    const translatedText = await translateWithFreeTranslate(englishText);
    console.log('Texte traduit:', translatedText);
  } catch (error) {
    // Gérer les erreurs ici
    console.error('Erreur générale:', error);
  }
})();
