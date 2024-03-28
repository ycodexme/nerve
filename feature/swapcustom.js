const path = require("path");
const { Client, LocalAuth, MessageMedia } = require("whatsapp-web.js");
const OpenAI = require("openai");
const ffmpeg = require("fluent-ffmpeg");
const { API_KEY_OPEN_AI } = require("../config");
const fs = require("fs");
const fsPromises = fs.promises;

// Déplacez la déclaration de client en haut du fichier
const client = new Client({
  authStrategy: new LocalAuth(),
});

const audioFolderPath = path.resolve("./audio");
const opusFilePath = path.join(audioFolderPath, "voice.opus");
const mp3FilePath = path.join(audioFolderPath, "voice.mp3");
const speechFile = path.resolve("./speech.mp3");

const openai = new OpenAI({ apiKey: API_KEY_OPEN_AI });

// ... (le reste du code)


// Déplacez la déclaration de transcriptionMessage à l'extérieur de la fonction convertAndTranscribeVoice
let transcriptionMessage;

async function convertAndTranscribeVoice(voiceData, recipient) {
  try {
    await fsPromises.access(audioFolderPath).catch(() => fsPromises.mkdir(audioFolderPath, { recursive: true }));

    if (!isValidBase64(voiceData)) {
      throw new Error("Les données Base64 ne sont pas valides.");
    }

    await fsPromises.access(opusFilePath).catch(() => fsPromises.writeFile(opusFilePath, voiceData, "base64"));

    await convertOpusToMp3(opusFilePath, mp3FilePath);

    // Mettez à jour la variable transcriptionMessage ici
    transcriptionMessage = await transcribeAudio(mp3FilePath, recipient);
    console.log("Contenu avant génération audio:", transcriptionMessage);

    const audioFilePath = await generateAudio(transcriptionMessage, recipient);
    await sendAudioToUser(recipient, audioFilePath);

    return transcriptionMessage;
  } catch (error) {
    console.error("Erreur lors de la conversion et de la transcription de la note vocale :", error);
    throw new Error("Une erreur s'est produite lors de la conversion et de la transcription de la note vocale.");
  } finally {
    // Correction de l'erreur de deprecation warning pour la fonction `fs.rmdir()`
    await fs.promises.rm(audioFolderPath, { recursive: true });
  }
}



async function sendAudioToUser(recipient, audioFilePath) {
  try {
    const media = MessageMedia.fromFilePath(audioFilePath, { document: true });
    if (!media) {
      console.error("Media is null.");
      throw new Error("Media is null.");
    }

    await client.sendMessage(recipient, { document: media }).catch((err) => console.error("Erreur lors de l'envoi du fichier audio à l'utilisateur WhatsApp :", err));
  } catch (error) {
    console.error("Erreur lors de l'envoi du fichier audio à l'utilisateur WhatsApp :", error);
    throw new Error("Une erreur s'est produite lors de l'envoi du fichier audio à l'utilisateur WhatsApp.");
  }
}




async function convertOpusToMp3(opusFilePath, mp3FilePath) {
  return new Promise((resolve, reject) => {
    ffmpeg(opusFilePath)
      .audioCodec("libmp3lame")
      .on("end", resolve)
      .on("error", reject)
      .save(mp3FilePath);
  });
}

function isValidBase64(data) {
  try {
    Buffer.from(data, "base64");
    return true;
  } catch (error) {
    return false;
  }
}

async function transcribeAudio(mp3FilePath, recipient) {
  try {
    console.log("Transcription en cours. Fichier audio:", mp3FilePath);

    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(mp3FilePath),
      model: "whisper-1",
    });

    console.log("Réponse de l'API Whisper:", transcription);

    if (transcription && transcription.text) {
      console.log("Transcription réussie:", transcription.text);

      const gptResponse = await getGpt3Response(transcription.text, recipient);
      return gptResponse;
    } else {
      console.error("La transcription n'a pas réussi. Réponse de l'API Whisper:", transcription);
      throw new Error("La transcription n'a pas réussi.");
    }
  } catch (error) {
    console.error("Erreur lors de la transcription audio avec Whisper:", error);
    throw error;
  }
}

async function getGpt3Response(inputText, recipient) {
  try {
    const completion = await openai.chat.completions.create({
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: inputText },
      ],
      model: "gpt-3.5-turbo",
      max_tokens: 2000,
      
    });

    console.log("Réponse de GPT-3.5 Turbo:", completion);
    const gptResponse = completion.choices[0].message.content;
    console.log("Contenu extrait de la réponse:", gptResponse);

    return gptResponse;
  } catch (error) {
    console.error("Erreur lors de la demande à GPT-3.5 Turbo:", error);
    throw error;
  }
}

async function generateAudio(transcriptionMessage, recipient) {
  try {
    // Début de la conversion texte en audio
    console.log("Début de la conversion texte en audio.");

    // Conversion du texte en audio
    const mp3 = await openai.audio.speech.create({
      model: "tts-1",
      voice: "alloy",
      input: transcriptionMessage, // Utilisez transcriptionMessage ici
    });
    console.log("Conversion du texte en audio réussie.");

    // Écriture du fichier audio
    const buffer = Buffer.from(await mp3.arrayBuffer());
    await fs.promises.writeFile(speechFile, buffer);
    console.log("Écriture du fichier audio réussie.");
    console.log(`Fichier audio généré : ${speechFile}`);

    // Fin de la conversion texte en audio
    console.log("Fin de la conversion texte en audio.");

    return speechFile;
  } catch (error) {
    console.error("Erreur lors de la génération du fichier audio :", error);
    throw error;
  }
}


module.exports = { convertAndTranscribeVoice, generateAudio };