const axios = require('axios');
const { API_KEY_RM_BG } = require('../config');

// Fonction de gestion de l'édition de photo
const EditPhotoHandler = async (text, message) => {
    const cmd = text.split('/');
    if (cmd.length < 2) {
        return message.reply('Format incorrect. Veuillez taper *edit_bg/couleur*');
    }

    if (message.hasMedia) {
        if (message.type != 'image') {
            return message.reply('Édition possible uniquement avec le format image.');
        }

        message.reply('En cours de traitement, veuillez patienter.');

        const media = await message.downloadMedia();

        if (media) {
            const couleur = cmd[1];
            const nouvellePhoto = await EditPhotoRequest(media.data, couleur);

            if (!nouvellePhoto.success) {
                return message.reply('Une erreur s\'est produite.');
            }

            const chat = await message.getChat();
            media.data = nouvellePhoto.base64;
            chat.sendMessage(media, { caption: 'Voici le résultat.' });
        }
    }
}

// Fonction de requête d'édition de photo
const EditPhotoRequest = async (base64, bg_color) => {
    const result = {
        success: false,
        base64: null,
        message: "",
    }

    return await axios({
        method: 'post',
        url: 'https://api.remove.bg/v1.0/removebg',
        data: {
            image_file_b64: base64,
            bg_color: bg_color
        },
        headers: {
            "accept": "application/json",
            "Content-Type": "application/json",
            "X-Api-Key": API_KEY_RM_BG,
        },
    })
        .then((response) => {
            if (response.status == 200) {
                result.success = true;
                result.base64 = response.data.data.result_b64;
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
    EditPhotoHandler
}
