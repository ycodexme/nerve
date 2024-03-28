const { HfInference } = require("@huggingface/inference");
const { HfAgent } = require("@huggingface/agents");
const { RepoId, Credentials } = require("@huggingface/hub");

const HF_ACCESS_TOKEN = "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"; // Remplacez par votre token Hugging Face

const inference = new HfInference(HF_ACCESS_TOKEN);

const runHuggingFaceModel = async (userText) => {
    try {
        const response = await inference.textToImage({
            model: 'stabilityai/stable-diffusion-2-1',
            inputs: userText, // Utilisez le texte de l'utilisateur comme entrée
            parameters: {
                negative_prompt: 'blurry',
            }
        });

        // Log de la réponse de l'API
        console.log('Réponse de l\'API Hugging Face:', response);
        return response; // Retourner la réponse de l'API
    } catch (error) {
        console.error('Erreur lors de l\'exécution du modèle Hugging Face :', error);
        // Gérer les erreurs si nécessaire
        throw error;
    }
};

module.exports = {
    runHuggingFaceModel
};

