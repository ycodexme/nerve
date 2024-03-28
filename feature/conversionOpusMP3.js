const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const { API_KEY_OPEN_AI } = require('../config');
const OpenAI = require('openai');
const { transcribeAudio, generateAudio } = require('./records');
const ffmpeg = require('fluent-ffmpeg');
const openai = new OpenAI({ apiKey: API_KEY_OPEN_AI });

const audioFolderPath = path.resolve('./audio');
const opusFilePath = path.join(audioFolderPath, 'voice.opus');
const mp3FilePath = path.join(audioFolderPath, 'voice.mp3');

async function convertAndTranscribeVoice(voiceData, client, recipient) {
    try {
        // Vérifier si le dossier audio existe, sinon le créer
        try {
            await fs.access(audioFolderPath);
        } catch (err) {
            await fs.mkdir(audioFolderPath);
        }

        // Valider les données Base64
        if (!isValidBase64(voiceData)) {
            throw new Error('Les données Base64 ne sont pas valides.');
        }

        // Vérifier si le fichier audio.opus existe, sinon le créer
        try {
            await fs.access(opusFilePath);
        } catch (err) {
            await fs.writeFile(opusFilePath, voiceData, 'base64');
        }

        // Convertir la note vocale de Opus à MP3 en utilisant FFmpeg
        await convertOpusToMp3(opusFilePath, mp3FilePath);

        // Transcrire le fichier MP3
        const transcriptionMessage = await transcribeAudio(mp3FilePath, recipient);

        // Générer la réponse audio à partir de la transcription
        const audioFilePath = await generateAudio(transcriptionMessage, recipient);

        // Envoyer le fichier audio à l'utilisateur WhatsApp
        await sendAudioToUser(recipient, audioFilePath);

        return transcriptionMessage;
    } catch (error) {
        console.error('Erreur lors de la conversion et de la transcription de la note vocale :', error);
        throw new Error('Une erreur s\'est produite lors de la conversion et de la transcription de la note vocale.');
    } finally {
        // Supprimer le dossier audio après la transcription
        await fs.rmdir(audioFolderPath, { recursive: true });
    }
}

async function sendAudioToUser(recipient, audioFilePath) {
    try {
        // Send the audio file to the WhatsApp user as a document
        const media = MessageMedia.fromFilePath(audioFilePath, { document: true });
        await client.sendMessage(recipient, media);
    } catch (error) {
        console.error('Erreur lors de l\'envoi du fichier audio à l\'utilisateur WhatsApp :', error);
        throw new Error('Une erreur s\'est produite lors de l\'envoi du fichier audio à l\'utilisateur WhatsApp.');
    }
}

async function convertOpusToMp3(opusFilePath, mp3FilePath) {
    return new Promise((resolve, reject) => {
        ffmpeg(opusFilePath)
            .audioCodec('libmp3lame')
            .on('end', resolve)
            .on('error', reject)
            .save(mp3FilePath);
    });
}
// Fonction pour valider les données Base64
function isValidBase64(data) {
    try {
        // Tentative de décodage des données Base64
        Buffer.from(data, 'base64');
        return true;
    } catch (error) {
        return false;
    }
}

module.exports = { convertAndTranscribeVoice };


//ce code consiste a convertir le fichier opus en mp3 