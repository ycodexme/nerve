const fs = require('fs');
const OpenAI = require('openai');
const path = require('path');
const { API_KEY_OPEN_AI } = require('../config');

const openai = new OpenAI({ apiKey: API_KEY_OPEN_AI });

const audioFolderPath = path.resolve('./audio');

// Vérifier si le dossier audio existe, sinon le créer
if (!fs.existsSync(audioFolderPath)) {
    fs.mkdirSync(audioFolderPath);
}

async function transcribeAudio(audioData, client, recipient) {
    try {
        // Sauvegarder le fichier audio localement pour traitement
        const audioFilePath = path.join(__dirname, 'audio', 'speech.mp3');
        fs.writeFileSync(audioFilePath, audioData.data);
        console.log('Fichier audio sauvegardé localement :', audioFilePath); // Log pour indiquer que le fichier audio a été sauvegardé

        // 1. Convertir le fichier audio en texte
        const audioFile = fs.readFileSync(audioFilePath);
        const audioFileBuffer = Buffer.from(audioFile); // Convertir le fichier audio en tampon
        const audioFileBase64 = audioFileBuffer.toString('base64'); // Convertir le fichier audio en base64
        const audioFileBase64Length = audioFileBase64.length; // Récupérer la longueur du fichier audio en base64
        const audioFileBase64Offset = 0; // Définir l'offset du fichier audio en base64

        console.log('Début de la transcription audio...'); // Log pour indiquer le début de la transcription

        const transcription = await openai.files.transcribe.create({
            file: audioFileBase64,
            length: audioFileBase64Length,
            offset: audioFileBase64Offset,
            model: 'ft-1',
            engine: 'davinci',
            content_type: 'audio/mp3',
            object_name: 'speech.mp3',
        });

        console.log('Transcription terminée :', transcription); // Log pour afficher la transcription complétée
        

        // Enregistrer le texte transcrit dans un fichier .txt
        const transcriptionFilePath = path.join(__dirname, 'transcriptions', 'transcription.txt');
        fs.writeFileSync(transcriptionFilePath, transcription);
        console.log('Fichier de transcription sauvegardé :', transcriptionFilePath);

        // Envoi de la transcription en tant que fichier texte
        const transcriptionMedia = MessageMedia.fromFilePath(transcriptionFilePath);
        await client.sendMessage(recipient, transcriptionMedia, { sendMediaAsDocument: true });

        return 'Transcription audio envoyée au format texte.';
    } catch (error) {
        console.error('Erreur lors de la transcription audio :', error);
        throw new Error('Une erreur s\'est produite lors de la transcription du fichier audio.');
    }
}

module.exports = { transcribeAudio };