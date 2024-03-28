const axios = require('axios');
const { API_KEY_OPEN_AI } = require('../config');

// Fonction de gestion du Chat AI
const ChatAIHandler = async (text, msg) => {

    const response = await ChatGPTRequest(text);

    if (!response.success) {
        return msg.reply(response.message);
    }

    return msg.reply(response.data);
}

// Le reste du code demeure inchangé...


const ChatGPTRequest = async (text) => {

    const result = {
        success: false,
        data: "Je ne sais pas",
        message: "",
    }

    return await axios({
        method: 'post',
        url: 'https://api.openai.com/v1/completions',
        data: {
            model: "text-davinci-003",
            prompt: text,
            max_tokens: 1000,
            temperature: 0
        },
        headers: {
            "accept": "application/json",
            "Content-Type": "application/json",
            "Accept-Language": "fr-FR",
            "Authorization": `Bearer ${API_KEY_OPEN_AI}`,
        },
    })
        .then((response) => {
            if (response.status == 200) {

                const { choices } = response.data;

                if (choices && choices.length) {
                    result.success = true;
                    result.data = choices[0].text;
                }

            } else {
                result.message = "Échec de la réponse";
            }

            return result;
        })
        .catch((error) => {
            result.message = "Erreur : " + error.message;
            return result;
        });
}

module.exports = {
    ChatAIHandler
}
