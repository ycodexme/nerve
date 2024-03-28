// Importations
const qrcode = require('qrcode-terminal');
const { Client, LocalAuth, Buttons, MessageMedia } = require('whatsapp-web.js');
const { runReplicate, downloadImage } = require('./feature/replicate');

const generatePersonalityResponse = require('./feature/chatgpt.js');
const { EditPhotoHandler } = require('./feature/edit_foto');
const { generateSpeech } = require('./feature/convert');
const { convertImageToURI } = require('./feature/swap');
const { convertImageToUR } = require('./feature/restore');
const transcribeAudio = require('./feature/transcribe');
const OpenAI = require('openai');
require('dotenv').config();
const mysql = require('mysql2');
const express = require('express');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const ytdl = require('ytdl-core');

// Créer une connexion à la base de données
const connection = mysql.createConnection(process.env.DATABASE_URL);

connection.connect((err) => {
  if (err) {
    console.error('Erreur de connexion à la base de données :', err);
    return;
  }
  console.log('Connected to PlanetScale!'); // Connecté avec succès


  // Gestion des messages
  client.on('message', async (msg) => {
    try {
        const { body, from } = msg;
        const text = body.toLowerCase();

        if (msg.type === 'chat') {
            if (text.startsWith('#') || text.startsWith('!chatgpt.js')) {
                // Ne rien faire ou exécuter une action spécifique pour ces messages
                return;
            }

            // Le reste de votre logique pour gérer les autres messages
            connection.query('SELECT * FROM users WHERE phone_number = ?', [from], async (error, results) => {
                if (error) {
                    console.error('Erreur lors de la vérification de l\'utilisateur :', error);
                } else {
                    // ... (votre code pour la gestion des utilisateurs)

                    // Utilisation de l'API pour générer une réponse en fonction de la dernière question de l'utilisateur
                    const response = await generatePersonalityResponse(text, from);
                    console.log('Réponse de l\'API GPT-3.5 Turbo:', response);

                    // Envoyer la réponse à l'utilisateur
                    await client.sendMessage(from, response);
                }
            });
        }
    } catch (error) {
        console.error('Erreur lors du traitement du message :', error);
    }
})
  
  
}); // Fermeture de la fonction connection.connect


// Constantes
const { API_KEY_OPEN_AI } = require('./config');

// Initialisation
const client = new Client({
  authStrategy: new LocalAuth(),
});

const config = require('./src/config/config.json');

// QR Code
client.on('qr', (qr) => {
  qrcode.generate(qr, { small: true });
});

// Prêt !
client.on('ready', () => {
  console.log('Le client est prêt!');
});

// OpenAI
const openai = new OpenAI({ apiKey: API_KEY_OPEN_AI });

// Messagerie
client.on('message', async (msg) => {
  try {
    // Récupération des données du message
    const { body, type } = msg;
    const text = body.toLowerCase();

    if (type === 'image') {
      if (text.startsWith('#swap')) {
        // Traitement pour la commande #swap
        await client.sendMessage(msg.from, 'Veillez patienter, Clever Imagine travaille dur pour vous...');
        const imageData = await msg.downloadMedia();
        if (imageData.mimetype.includes('image')) {
          const modifiedImageBuffer = await convertImageToURI(imageData);
          
          // Enregistrement de l'image localement
          const imagePath = path.resolve('./image.jpg');
          fs.writeFileSync(imagePath, modifiedImageBuffer);
          
          // Envoyer l'image à l'utilisateur
          const media = MessageMedia.fromFilePath(imagePath);
          await client.sendMessage(msg.from, media, { sendMediaAsDocument: true });
          await client.sendMessage(msg.from, 'Voici votre image modifiée !');
        } else {
          console.error('Le média reçu n\'est pas une image.');
        }
      } else if (text.startsWith('#restore')) {
        await client.sendMessage(msg.from, 'Veillez patienter, Clever Imagine travaille dur pour vous...');
        const imageData = await msg.downloadMedia();
        if (imageData.mimetype.includes('image')) {
          const modifiedImageBuffer = await convertImageToUR(imageData);
          // Utilisation de l'image restaurée
        } else {
          console.error('Le média reçu n\'est pas une image.');
        }
      }
    } else if (text.includes("#edit_bg/")) {
      await EditPhotoHandler(text, msg);
    } else if (type === 'audio') {
      if (text.includes('#transcript')) {
        await transcribeAudio(msg);
      }
    }  else if (text.startsWith('#speech')) {
      // Traitement pour #speech
      const textToSpeech = text.replace('#speech', '').trim();
      await generateSpeech(textToSpeech);
      const speechFilePath = path.resolve('./speech.mp3');
      // Envoi de la parole à l'utilisateur
      const media = MessageMedia.fromFilePath(speechFilePath);
      await client.sendMessage(msg.from, media, { sendMediaAsDocument: true });
    } else if (text.startsWith('#imagine')) {
      const userText = text.replace('#imagine', "").trim();
      const response = await runReplicate(userText);
      // Vérifier si la réponse de l'API Replicate est valide et contient une URL
      if (response && response.length > 0) {
        const imageUrl = response[0]; // Récupérer l'URL de l'image
        const image = await downloadImage(imageUrl); // Télécharger l'image à partir de l'URL
        // Enregistrer l'image localement
        const imageFilePath = path.resolve('./image.png');
        fs.writeFileSync(imageFilePath, image);
        // Envoyer l'image à l'utilisateur
        const media = MessageMedia.fromFilePath(imageFilePath);
        await client.sendMessage(msg.from, media, { sendMediaAsDocument: true });
      } else {
        console.error('La réponse de l\'API Replicate ne contient pas de lien valide vers une image.');
      }
    } else {
      // Traitement pour les autres messages non préfixés
      if (!text.startsWith("#") && !text.startsWith("!")) {
            await generatePersonalityResponse(text, msg);
      }
    }
  } catch (error) {
    console.error('Erreur lors du traitement du message :', error);
  }
});

client.on('message', async (message) => {
  let url = message.body.split(' ')[1];
  let isGroups = message.from.endsWith('@g.us') ? true : false;
  const commandPrefix = '!'; // Définir le préfixe des commandes

  // Définition des fonctions detailYouTube et downloadYouTube
  
      async function detailYouTube(url) {
  client.sendMessage(message.from, '[⏳] Veillez patienter, Clever télécharge la vidéo pour vous...');
  try {
      let info = await ytdl.getInfo(url);
      let data = {
          "channel": {
              "name": info.videoDetails.author.name,
              "user": info.videoDetails.author.user,
              "channelUrl": info.videoDetails.author.channel_url,
              "userUrl": info.videoDetails.author.user_url,
              "verified": info.videoDetails.author.verified,
              "subscriber": info.videoDetails.author.subscriber_count
          },
          "video": {
              "title": info.videoDetails.title,
              "description": info.videoDetails.description,
              "lengthSeconds": info.videoDetails.lengthSeconds,
              "videoUrl": info.videoDetails.video_url,
              "publishDate": info.videoDetails.publishDate,
              "viewCount": info.videoDetails.viewCount
          }
      }
      client.sendMessage(message.from, `*CHANNEL DETAILS*\n• Name : *${data.channel.name}*\n• User : *${data.channel.user}*\n• Verified : *${data.channel.verified}*\n• Channel : *${data.channel.channelUrl}*\n• Subscriber : *${data.channel.subscriber}*`);
      client.sendMessage(message.from, `*VIDEO DETAILS*\n• Title : *${data.video.title}*\n• Seconds : *${data.video.lengthSeconds}*\n• VideoURL : *${data.video.videoUrl}*\n• Publish : *${data.video.publishDate}*\n• Viewers : *${data.video.viewCount}*`)
      client.sendMessage(message.from, '*[✅]* Votre vidéo à été téléchargé avec succès!');
  } catch (err) {
      console.log(err);
      client.sendMessage(message.from, '*[❎]* Failed!');
  }
}

async function downloadYouTube(url, format, filter) {
  client.sendMessage(message.from, '[⏳] Veillez patienter, Clever télécharge pour vous...');
  let timeStart = Date.now();
  try {
      let info = await ytdl.getInfo(url);
      let data = {
          "channel": {
              "name": info.videoDetails.author.name,
              "user": info.videoDetails.author.user,
              "channelUrl": info.videoDetails.author.channel_url,
              "userUrl": info.videoDetails.author.user_url,
              "verified": info.videoDetails.author.verified,
              "subscriber": info.videoDetails.author.subscriber_count
          },
          "video": {
              "title": info.videoDetails.title,
              "description": info.videoDetails.description,
              "lengthSeconds": info.videoDetails.lengthSeconds,
              "videoUrl": info.videoDetails.video_url,
              "publishDate": info.videoDetails.publishDate,
              "viewCount": info.videoDetails.viewCount
          }
      }
      ytdl(url, { filter: filter, format: format, quality: 'highest' }).pipe(fs.createWriteStream(`./src/database/download.${format}`)).on('finish', async () => {
          const media = await MessageMedia.fromFilePath(`./src/database/download.${format}`);
          let timestamp = Date.now() - timeStart;
          media.filename = `${config.filename.mp3}.${format}`;
          await client.sendMessage(message.from, media, { sendMediaAsDocument: true });
          client.sendMessage(message.from, `• Title : *${data.video.title}*\n• Channel : *${data.channel.user}*\n• View Count : *${data.video.viewCount}*\n• TimeStamp : *${timestamp}*`);
          client.sendMessage(message.from, '*[✅]* Votre audio à été téléchargé avec succès!');
      });
  } catch (err) {
      console.log(err);
      client.sendMessage(message.from, '*[❎]* Failed!');
  }
}
  if ((isGroups && config.groups) || isGroups) return;
  if (!message.body.startsWith(commandPrefix)) return; // Si le message ne commence pas par le préfixe, ne rien faire

  const command = message.body.split(' ')[0].slice(commandPrefix.length);
  const args = message.body.split(' ').slice(1);

  if (command === 'audio') {
      downloadYouTube(url, 'mp3', 'audioonly');
  } else if (command === 'video') {
      downloadYouTube(url, 'mp4', 'audioandvideo');
  } else if (command === 'detail') {
      detailYouTube(url);
  } else if (command === 'help') {
      client.sendMessage(message.from, `*${config.name}*\n\n[🎥] : *${commandPrefix}video <youtube-url>*\n[🎧] : *${commandPrefix}audio <youtube-url>*\n\n*Example :*\n${commandPrefix}audio https://youtu.be/abcdefghij`);
  } else {
      // Traitement pour les autres messages non préfixés
      if (!message.body.startsWith("!")) {
          await ChatAIHandler(message.body, message);
      }
  }
});






client.initialize();
