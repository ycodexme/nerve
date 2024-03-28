// Modules liés au système de fichiers
const fs = require("fs");
const { PDFDocument } = require("pdf-lib");
const fontkit = require("@pdf-lib/fontkit");
const readline = require("readline");
const path = require("path");
const PDFServicesSdk = require("@adobe/pdfservices-node-sdk");

// Modules liés à la base de données et aux requêtes
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const {
  checkSubscription,
  updateSubscription,
} = require("./bills/subscriptions.js");
const { decrementRemainingQuestions } = require("./bills/requestLimit.js");

// Modules liés à la configuration et aux API
require("dotenv").config();

// Modules liés à la génération de contenu
const qrcode = require("qrcode-terminal");
const { runOCR } = require("./feature/ocr");
const { generateAndStoreEmbeddings } = require("./embeddingsGenerator");
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Modules liés à WhatsApp
const { Client, LocalAuth, Buttons, MessageMedia } = require("whatsapp-web.js");

// Modules liés au téléchargement de médias
const { ndown } = require("nayan-media-downloader");
const ytdl = require("ytdl-core");
const downloadPath = "./documents/";
const { EditPhotoHandler } = require("./feature/edit_foto");
const { generateSpeech } = require("./feature/convert");
const { convertImageToURI, convertImageToUR } = require("./feature/swap");
const { runReplicate, downloadImage } = require("./feature/replicate");
const { convertImage } = require("./feature/restore");
const { transcrireAudio } = require("./feature/transcribe");
const {
  convertAndTranscribeVoice,
  generateAudio,
} = require("./feature/swapcustom");
const { translateWithDeepl } = require("./ai_functions/deeplTranslation");
const ffmpeg = require("fluent-ffmpeg");
// Modules liés aux requêtes HTTP
const fetch = require("node-fetch");
const axios = require("axios");
const express = require("express");
const bodyParser = require("body-parser");
const paymentRoutes = require("./paymentRoutes");

// Autres modules
const { ask } = require("./inference");
const audioFolder = "./audio";
const tempDocsFolder = "./temps_docs";
const extName = require("ext-name");

// URL de retour pour les paiements
const url = "https://dekscrypt-aa4fae2749fd.herokuapp.com/callback";
const returnUrl = "https://dekscrypt-aa4fae2749fd.herokuapp.com/success";

const app = express();

app.use(bodyParser.json());

// Montage des routes de paiement
app.use("/", paymentRoutes);

const port = process.env.PORT || 15779; // Utilisez le port fourni par Heroku ou utilisez 42875 par défaut
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

const pdfDirectory = path.join(__dirname, "pdf");
// Connexion à la base de données supprimée car Prisma gère cela automatiquement


const config = require("./src/config/config.json");
const speechFile = path.resolve("./speech.mp3");
const visionModelName = "gemini-pro-vision";
const API_KEY = "AIzaSyBriZKoqrULkHRYBgmoKY9VTwzhm8cD4Rs";

const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-pro" });
const visionModel = genAI.getGenerativeModel({ model: visionModelName });

// Stockage de l'historique
let chatHistory = [];

// QR Code
client.on("qr", (qr) => {
  qrcode.generate(qr, { small: true });
});

// Prêt !
client.on("ready", () => {
  console.log("Le client est prêt!");
});

// menu
client.on("message", async (msg) => {
  console.log(msg);
  try {
    const { body, from } = msg;
    const text = body.toLowerCase();

    // Log des messages des utilisateurs
    console.log(`Message reçu de ${from}: ${body}`);

    // Exemple de traitement en fonction du texte reçu
    if (text === "#00") {
      const menuOptions = `Pour savoir les modes de paiement, envoyez #01.\nPour connaître le prix de l'abonnement et la durée, envoyez #002.`;
      await client.sendMessage(from, menuOptions);
    } else if (text === "#002") {
      const subscriptionDetails = `Le prix de l'abonnement est fixé à 3,99$ pour 30 jours.\nPour revenir au menu principal, envoyez #00.`;
      await client.sendMessage(from, subscriptionDetails);
    } else if (text === "#01") {
      const paymentOptions = `Les types de paiement sont :\n\n1. Paiement par Crypto\n2. Paiement par moyen mobile\nPour payer par Crypto, envoyez #001, et #02 pour moyen mobile.`;
      await client.sendMessage(from, paymentOptions);
    } else if (text === "#001") {
      const cryptoMessage = `Veuillez patienter, nous créons votre facture.`;
      await client.sendMessage(from, cryptoMessage);

      const data = {
        merchant: "VB44N2-SDYLYV-5LZ0YU-MWW6GT",
        amount: 1,
        currency: "TRX",
        lifeTime: 30,
        feePaidByPayer: 0,
        underPaidCover: 3.5,
        callbackUrl: url,
        returnUrl: returnUrl,
        description: "Commande #12345",
        orderId: "ORD-12345",
        email: "customer@example.com",
      };

      try {
        // Validation des données entrantes
        if (!isValidData(data)) {
          throw new Error("Données de facturation invalides.");
        }

        const response = await axios.post(
          "https://api.oxapay.com/merchants/request",
          data
        );

        console.log("Réponse de l'API de paiement :", response.data);

        const paymentLink = response.data.payLink;
        const trackId = response.data.trackId;

        // Obtenez l'utilisateur en fonction du numéro de téléphone
        const user = await prisma.user.findUnique({
          where: {
            phoneNumber: from, // Utilisez le numéro de téléphone pour identifier l'utilisateur
          },
        });

        // Vérifiez si l'utilisateur existe
        if (user) {
          // Obtenez l'ID de l'utilisateur
          const userId = user.id;
          // Vérifiez si une facture existe déjà pour cet utilisateur avec le même trackId
          const existingInvoice = await prisma.payment.findFirst({
            where: {
              userId: userId,
              trackId: response.data.trackId,
            },
          });

          if (existingInvoice) {
            // Obtenez les informations de la facture existante
            const existingInvoiceData = existingInvoice.data;

            // Créez un objet avec les informations mises à jour
            const updatedInvoiceData = {
              ...existingInvoiceData,
              amount: response.data.amount,
              currency: response.data.currency,
              description: response.data.description,
              status: response.data.message,
              timestamp: new Date(),
            };

            // Mettez à jour la facture existante avec les informations mises à jour
            await prisma.payment.update({
              where: {
                id: existingInvoice.id,
              },
              data: updatedInvoiceData,
            });

            // Envoyez le lien de paiement à l'utilisateur
            await client.sendMessage(
              from,
              `Voici le lien de paiement : ${paymentLink}`
            );
          } else {
            // Créez une nouvelle entrée si aucune facture n'existe encore
            await prisma.payment.create({
              data: {
                trackId: response.data.trackId,
                amount: 1,
                currency: "TRX",
                description: "Commande #12345",
                status: response.data.message,
                timestamp: new Date(),
                phoneNumber: from,
                userId: userId,
              },
            });

            // Envoyez le lien de paiement à l'utilisateur
            await client.sendMessage(
              from,
              `Voici le lien de paiement : ${paymentLink}`
            );
          }

          // Reste du code...
        } else {
          // Gérez le cas où l'utilisateur n'existe pas
          console.error(
            "Utilisateur non trouvé pour le numéro de téléphone :",
            from
          );
          await client.sendMessage(
            from,
            "Utilisateur non trouvé. Veuillez vous inscrire."
          );
        }
      } catch (error) {
        console.error("Erreur lors de la création de la facture :", error);
        // Gestion détaillée des erreurs
        const errorMessage =
          error.message ||
          "Une erreur s'est produite lors de la création de la facture.";
        await client.sendMessage(from, errorMessage);
      }
    }

    // Fonction pour valider les données de facturation
    function isValidData(data) {
      // Ajoutez ici la logique de validation des données
      return (
        data &&
        data.amount > 0 &&
        data.currency &&
        data.description &&
        data.email
      );
    }
  } catch (err) {
    console.error("Erreur de traitement du message :", err);
  }
});

// Réception d'un message langchain
function sanitizeFilename(filename) {
  return filename.replace(/[/\\?%*:|"<>]/g, "_");
}

// ... (le reste de votre code langchain)

client.on("message", async (msg) => {
  console.log(msg);
  const { body, from, type } = msg;
  const sender = from.replace("@c.us", "");

  if (
    (body.toLowerCase().startsWith("#") ||
      body.toLowerCase().startsWith("!")) &&
    type === "text"
  ) {
    // Ignore messages starting with '#' or '!' for GPT-3.5
    return;
  }

  if (body.toLowerCase().startsWith("#docs") && msg.hasMedia) {
    try {
      const pdfDirectory = path.join(__dirname, "pdf");
      if (!fs.existsSync(pdfDirectory)) {
        fs.mkdirSync(pdfDirectory);
      }

      const mediaData = await msg.downloadMedia();
      const filename = "PDFKit.pdf";
      const filePath = path.join(pdfDirectory, filename);
      const pdfBuffer = Buffer.from(mediaData.data, "base64");

      // Optional: Modify the PDF content
      const pdfDoc = await PDFDocument.load(pdfBuffer);
      const page = pdfDoc.getPage(0);
      const { width, height } = page.getSize();
      page.drawText("PDFKit", { x: width / 2 - 50, y: height / 2 });
      const modifiedPdfBuffer = await pdfDoc.save();

      // Save the modified PDF (optional)
      fs.writeFileSync(filePath, modifiedPdfBuffer);

      // Generate and store embeddings
      const wasEmbeddingsGenerated = await generateAndStoreEmbeddings(filePath);

      if (!wasEmbeddingsGenerated) {
        msg.reply("Les embeddings du document n'ont pas été générés");
        return;
      }

      msg.reply(
        "Votre document est désormais disponible. Vous pouvez me poser une question à son sujet. Je vous répondrai uniquement à propos de ce document si votre question commence par #chatpdf."
      );
    } catch (error) {
      console.error("Error handling document:", error);
      msg.reply(
        "Désolé, il y a eu un problème lors du traitement du document."
      );
    }
  } else if (body.toLowerCase().startsWith("#chatpdf")) {
    const question = body.substring("#chatpdf".length).trim();
    const message = await ask(question);

    // Translate the response to French using Deepl
    const translatedMessage = await translateWithDeepl(message);

    // Send the translated response to the user
    await client.sendMessage(msg.from, translatedMessage);
  } else {
    // Handle other messages here
  }
});

// Fonction pour envoyer la transcription
async function sendTranscription(recipient, pdfFileName) {
  try {
    const media = MessageMedia.fromFilePath(pdfFileName);
    await client.sendMessage(recipient, media, { sendMediaAsDocument: true });
    await client.sendMessage(
      recipient,
      "Transcription traitée avec succès 😍."
    );
    console.log("Fichier PDF envoyé à WhatsApp avec succès 😍.");
  } catch (error) {
    console.error("Erreur lors de l'envoi du fichier PDF à WhatsApp:", error);
  }
}

//edit background et adobe converter docs
client.on("message", async (msg) => {
  const text = msg.body.toLowerCase() || "";
  const { body, from, type } = msg;
  const sender = from.replace("@c.us", "");

  // Check status
  if (text === "!ping") {
    msg.reply("pong");
  }

  // #edit_bg/bg_color
  if (text.includes("#edit/")) {
    await EditPhotoHandler(text, msg);
  }

  // Process media message
  if (body.toLowerCase().startsWith("#pdf") && msg.hasMedia) {
    console.log('Message de type "Media" reçu.');
    await client.sendMessage(
      msg.from,
      "Votre dossier est en cours d'élaboration ! Asseyez-vous, détendez-vous, et préparez-vous à quelque chose d'incroyable à venir ! ✨🎉😄"
    );

    try {
      const pdfDirectory = path.join(__dirname, "pdf");
      if (!fs.existsSync(pdfDirectory)) {
        fs.mkdirSync(pdfDirectory);
      }

      const mediaData = await msg.downloadMedia();
      const filename = "OCRPDF.pdf";
      const filePath = path.join(pdfDirectory, filename);
      const pdfBuffer = Buffer.from(mediaData.data, "base64");

      fs.writeFileSync(filePath, pdfBuffer);
      console.log("Fichier PDF sauvegardé avec succès dans le dossier local.");

      // Code Adobe pour convertir le PDF en Word
      console.log("Conversion du PDF en Word avec l'API Adobe...");
      const credentials =
        PDFServicesSdk.Credentials.servicePrincipalCredentialsBuilder()
          .withClientId("ac2c28d95a074d58b1214b9150d16a1c")
          .withClientSecret("p8e-mRN1aWo9TglTqZlbsbUkT-VIJg7Z8uVH")
          .build();

      const executionContext =
          PDFServicesSdk.ExecutionContext.create(credentials),
        exportPDF = PDFServicesSdk.ExportPDF,
        exportPdfOperation = exportPDF.Operation.createNew(
          exportPDF.SupportedTargetFormats.DOCX
        );

      const input = PDFServicesSdk.FileRef.createFromLocalFile(filePath);
      exportPdfOperation.setInput(input);

      const options = new exportPDF.options.ExportPDFOptions(
        exportPDF.options.ExportPDFOptions.OCRSupportedLocale.EN_US
      );
      exportPdfOperation.setOptions(options);

      // ...

      const result = await exportPdfOperation.execute(executionContext);

      console.log("Réponse de l'API Adobe :", result);

      // Check if the result is a FileRef and has a valid mediaType
      if (
        result instanceof PDFServicesSdk.FileRef &&
        result.mediaType ===
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      ) {
        // Handle successful conversion
        const docxFilePath = path.join(__dirname, "output.docx");

        // Check if the output.docx file already exists
        if (fs.existsSync(docxFilePath)) {
          // If it exists, generate a unique filename
          const timestamp = new Date().getTime();
          const uniqueDocxFilePath = path.join(
            __dirname,
            `output_${timestamp}.docx`
          );
          console.log(
            `Le fichier ${docxFilePath} existe déjà. Renommer en ${uniqueDocxFilePath}.`
          );

          // Save the FileRef to the unique local file
          await result.saveAsFile(uniqueDocxFilePath);
          console.log("Conversion réussie du PDF en Word.");

          // Send the unique DOCX file to the WhatsApp user
          console.log(
            "Envoi du fichier Word converti à l'utilisateur WhatsApp..."
          );

          // Use MessageMedia to create a media message
          const docxMedia = MessageMedia.fromFilePath(uniqueDocxFilePath);

          // Send the media message
          await client.sendMessage(msg.from, docxMedia, {
            sendMediaAsDocument: true,
          });
          await client.sendMessage(
            msg.from,
            "Voila ! 🎉 Votre fichier a été transformé ! Enjoy  🌠 "
          );

          console.log("Fichier Word envoyé avec succès.");

          // Clean up temporary files
          fs.unlinkSync(filePath);
          console.log("Fichier PDF temporaire supprimé.");
        } else {
          // If it doesn't exist, save the FileRef to the regular local file
          await result.saveAsFile(docxFilePath);
          console.log("Conversion réussie du PDF en Word.");

          // Send the DOCX file to the WhatsApp user
          console.log(
            "Envoi du fichier Word converti à l'utilisateur WhatsApp..."
          );

          // Use MessageMedia to create a media message
          const docxMedia = MessageMedia.fromFilePath(docxFilePath);

          // Send the media message
          await client.sendMessage(msg.from, docxMedia, {
            sendMediaAsDocument: true,
          });
          await client.sendMessage(
            msg.from,
            "Voila ! 🎉 Votre fichier a été transformé ! Enjoy  🌠 "
          );

          console.log("Fichier Word envoyé avec succès.");

          // Clean up temporary files
          fs.unlinkSync(filePath);
          console.log("Fichier PDF temporaire supprimé.");
        }
      } else {
        // Handle the case where the conversion is not successful
        console.error(
          "Erreur lors de la conversion PDF en Word: Statut de l'opération non réussi. Détails :",
          result
        );
        client.sendMessage(
          msg.from,
          "La conversion du fichier PDF en Word a échoué."
        );
      }
    } catch (err) {
      console.error("Une erreur est survenue :", err);
      // Gérer l'erreur ici
    }
  }
});

// Fusion des gestionnaires d'événements pour les tags #transcript et PPT voice

client.on("message", async (msg) => {
  console.log("message recu:", msg);
  try {
    const { body, from, type } = msg;
    const text = body.toLowerCase();

    // Gestionnaire pour le tag #transcrire
    if (text.includes("#transcrire")) {
      console.log("Message reçu avec le tag #transcript depuis:", from);
      await client.sendMessage(
        msg.from,
        "Veillez patienter, Clever Transcrit pour vous...⌛ "
      );
      if (msg.hasMedia) {
        console.log("Fichier joint détecté. Téléchargement en cours...");

        const media = await msg.downloadMedia();
        const uniqueFileName = `file_${Date.now()}.mp3`;
        const audioFilePath = `./audio/${uniqueFileName}`;

        // Sauvegarder dans le dossier ./audio
        await fs.promises.writeFile(audioFilePath, media.data, "base64");
        console.log("Fichier audio téléchargé avec succès:", audioFilePath);

        const pdfFileName = await transcrireAudio(audioFilePath);
        console.log("Transcription réussie:", pdfFileName);

        // Envoyer le fichier PDF à l'utilisateur
        await sendTranscription(from, pdfFileName);
      } else {
        console.log("Aucun fichier joint trouvé dans le message.");
      }
    }

    // Gestionnaire pour PPT voice
    if (type === "ptt") {
      console.log("Message reçu:", msg);
      const { from } = msg;
      const sender = from.replace("@c.us", "");

      try {
        // Téléchargez la note vocale
        const voiceData = await msg.downloadMedia();

        // Log des données de la note vocale
        console.log("Voice Data:", voiceData);

        // Décodez les données base64
        const decodedVoiceData = Buffer.from(voiceData.data, "base64");
        console.log("Decoded Voice Data:", decodedVoiceData.toString("utf-8"));

        // Récupérez la valeur de transcriptionMessage depuis convertAndTranscribeVoice
        const transcriptionMessage = await convertAndTranscribeVoice(
          decodedVoiceData,
          sender
        );

        const speechFilePath = path.resolve("./speech.mp3");
        // Envoi de la parole à l'utilisateur
        const media = MessageMedia.fromFilePath(speechFilePath);
        await client.sendMessage(msg.from, media, {
          sendMediaAsDocument: true,
        });

        console.log("Message audio envoyé à l'utilisateur:", from);
      } catch (error) {
        console.error("Erreur lors du traitement de la note vocale:", error);
        msg.reply(
          "Désolé, il y a eu un problème lors du traitement de la note vocale."
        );
      }
    }

    // ... (autres gestionnaires d'événements)

    // ... (autres gestionnaires d'événements)
  } catch (error) {
    console.error("Erreur lors du traitement du message:", error);
  }
});

// Gestionnaire d'événements pour Transcription et Facebook downloader
client.on("message", async (msg) => {
  console.log(msg);
  try {
    const { body, from } = msg;
    const text = body.toLowerCase();

    // Gestionnaire pour le tag #transcript
    if (text.includes("#sentence")) {
      console.log("Message reçu avec le tag #transcript depuis:", from);

      if (msg.hasMedia) {
        console.log("Fichier joint détecté. Téléchargement en cours...");

        const media = await msg.downloadMedia();
        const uniqueFileName = `file_${Date.now()}.mp3`;
        const audioFilePath = `./audio/${uniqueFileName}`;

        // Sauvegarder dans le dossier ./audio
        await fs.promises.writeFile(audioFilePath, media.data, "base64");
        console.log("Fichier audio téléchargé avec succès:", audioFilePath);

        const txtFileName = await transcrireAudio(audioFilePath);
        console.log("Transcription réussie:", txtFileName);

        // Envoyer le fichier texte à l'utilisateur
        await sendTranscription(from, txtFileName);
      } else {
        console.log("Aucun fichier joint trouvé dans le message.");
      }
    }

    // Gestionnaire pour le tag !fb
    if (text.startsWith("!fb")) {
      console.log("Message reçu avec le tag !fb depuis:", from);
      await client.sendMessage(
        from,
        "Veillez patienter, Clever télécharge pour vous...cela peut prendre jusqu'à 2 minutes "
      );
      await downloadAndSave(msg); // Passer l'objet message à la fonction de téléchargement
    }
  } catch (error) {
    console.error("Erreur lors du traitement du message:", error);
  }
});

//ytdl
const maxFileSizeMB = 100;

client.on("message", async (message) => {
  let from = message.from;
  let url = message.body.split(" ")[1];
  let isGroups = message.from.endsWith("@g.us") ? true : false;
  const commandPrefix = "!"; // Définir le préfixe des commandes
  // Utilisez upsert pour vérifier et créer/mettre à jour l'utilisateur en une seule étape
  let user = await prisma.user.findUnique({
    where: {
      phoneNumber: from,
    },
  });

  // Vérifier si l'utilisateur existe et s'il a des crédits gratuits restants
  if (!user || user.remainingRequests <= 0) {
    if (!user) {
      user = await prisma.user.create({
        data: {
          phoneNumber: from,
          subscriptionType: "free",
          remainingRequests: 100,
        },
      });
    } else {
      // Envoyer un message à l'utilisateur si ses crédits gratuits sont épuisés
      const exhaustedCreditMessage =
        "Vous avez épuisé votre crédit pour la version gratuite. Veuillez vous abonner à la version payante qui est illimitée. Envoyer #00 pour accéder au menu.";
      await client.sendMessage(from, exhaustedCreditMessage);
      return;
    }
  }

  // Décrémenter le nombre de requêtes restantes
  await prisma.user.update({
    where: {
      phoneNumber: from,
    },
    data: {
      remainingRequests: {
        decrement: 1,
      },
    },
  });

  // Définition des fonctions detailYouTube et downloadYouTube

  async function detailYouTube(url) {
    client.sendMessage(
      message.from,
      "[⏳] Veillez patienter, Clever télécharge la vidéo pour vous..."
    );
    try {
      let info = await ytdl.getInfo(url);
      let data = {
        channel: {
          name: info.videoDetails.author.name,
          user: info.videoDetails.author.user,
          channelUrl: info.videoDetails.author.channel_url,
          userUrl: info.videoDetails.author.user_url,
          verified: info.videoDetails.author.verified,
          subscriber: info.videoDetails.author.subscriber_count,
        },
        video: {
          title: info.videoDetails.title,
          description: info.videoDetails.description,
          lengthSeconds: info.videoDetails.lengthSeconds,
          videoUrl: info.videoDetails.video_url,
          publishDate: info.videoDetails.publishDate,
          viewCount: info.videoDetails.viewCount,
        },
      };
      client.sendMessage(
        message.from,
        `*CHANNEL DETAILS*\n• Name : *${data.channel.name}*\n• User : *${data.channel.user}*\n• Verified : *${data.channel.verified}*\n• Channel : *${data.channel.channelUrl}*\n• Subscriber : *${data.channel.subscriber}*`
      );
      client.sendMessage(
        message.from,
        `*VIDEO DETAILS*\n• Title : *${data.video.title}*\n• Seconds : *${data.video.lengthSeconds}*\n• VideoURL : *${data.video.videoUrl}*\n• Publish : *${data.video.publishDate}*\n• Viewers : *${data.video.viewCount}*`
      );
      client.sendMessage(
        message.from,
        "*[✅]* Votre vidéo à été téléchargé avec succès!"
      );
    } catch (err) {
      console.log(err);
      client.sendMessage(message.from, "*[❎]* Failed!");
    }
  }

  async function downloadYouTube(url, format, filter, from) {
    client.sendMessage(
      message.from,
      "[⏳] Veillez patienter, Clever télécharge pour vous..."
    );
    let timeStart = Date.now();
    try {
      let info = await ytdl.getInfo(url);
      let data = {
        channel: {
          name: info.videoDetails.author.name,
          user: info.videoDetails.author.user,
          channelUrl: info.videoDetails.author.channel_url,
          userUrl: info.videoDetails.author.user_url,
          verified: info.videoDetails.author.verified,
          subscriber: info.videoDetails.author.subscriber_count,
        },
        video: {
          title: info.videoDetails.title,
          description: info.videoDetails.description,
          lengthSeconds: info.videoDetails.lengthSeconds,
          videoUrl: info.videoDetails.video_url,
          publishDate: info.videoDetails.publishDate,
          viewCount: info.videoDetails.viewCount,
        },
      };
      ytdl(url, { filter: filter, format: format, quality: "highest" })
        .pipe(fs.createWriteStream(`./src/database/download.${format}`))
        .on("finish", async () => {
          const fileSizeMB =
            fs.statSync(`./src/database/download.${format}`).size / 1024 / 1024;

          if (fileSizeMB > maxFileSizeMB) {
            // Supprimer le fichier si la taille est trop grande
            fs.unlinkSync(`./src/database/download.${format}`);
            client.sendMessage(
              message.from,
              `[❌] La taille de la vidéo dépasse la limite de ${maxFileSizeMB} Mo. Veuillez télécharger une vidéo plus courte.`
            );
            return;
          }
          let timestamp = Date.now() - timeStart;
          media.filename = `${config.filename.mp3}.${format}`;
          await client.sendMessage(message.from, media, {
            sendMediaAsDocument: true,
          });
          client.sendMessage(
            message.from,
            `• Title : *${data.video.title}*\n• Channel : *${data.channel.user}*\n• View Count : *${data.video.viewCount}*\n• TimeStamp : *${timestamp}*`
          );
          client.sendMessage(
            message.from,
            "*[✅]* Votre Vidéo  à été téléchargé avec succès!"
          );
        });
    } catch (err) {
      console.log(err);
      client.sendMessage(message.from, "*[❎]* Failed!");
    }
  }
  if ((isGroups && config.groups) || isGroups) {
    return;
  }

  if (!message.body.startsWith(commandPrefix)) {
    return; // Si le message ne commence pas par le préfixe, ne rien faire
  }

  const command = message.body.split(" ")[0].slice(commandPrefix.length);
  const args = message.body.split(" ").slice(1);

  if (command === "MP3") {
    downloadYouTube(url, "mp3", "audioonly", from); // Passer 'from' à la fonction downloadYouTube
  } else if (command === "MP4") {
    downloadYouTube(url, "mp4", "audioandvideo", from); // Passer 'from' à la fonction downloadYouTube
  } else if (command === "detail") {
    detailYouTube(url);
  } else if (command === "aide") {
    client.sendMessage(
      message.from,
      `*${config.name}*\n\n[🎥] : *${commandPrefix}MP4 <youtube-url>*\n[🎧] : *${commandPrefix}MP3 <youtube-url>*\n\n*Exemple :*\n${commandPrefix}audio https://youtu.be/abcdefghij`
    );
  }
});

//Gestionnaires d'événements Replicate et Gemini Pro

client.on("message", async (msg) => {
  console.log("Message reçu:", msg);
  try {
    const { body, type } = msg;
    const text = body.toLowerCase();
    const from = msg.from;

    if (!text.startsWith("#") && !text.startsWith("!")) {
      // Utilisez le message de l'utilisateur WhatsApp comme entrée pour le chatbot Gemini
    } else {
      // Traitement des commandes spécifiques commençant par '#' ou '!'
      if (type === "image") {
        if (text.startsWith("!swap")) {
          // Traitement pour la commande !swap
          await client.sendMessage(
            msg.from,
            "Veillez patienter, Clever Imagine travaille dur pour vous..."
          );
          const imageData = await msg.downloadMedia();
          if (imageData.mimetype.includes("image")) {
            const modifiedImageBuffer = await convertImageToURI(imageData);

            // Enregistrement de l'image localement
            const imagePath = path.resolve("./image.jpg");
            fs.writeFileSync(imagePath, modifiedImageBuffer);

            // Envoyer l'image à l'utilisateur
            const media = MessageMedia.fromFilePath(imagePath);
            await client.sendMessage(msg.from, media, {
              sendMediaAsDocument: true,
            });
            await client.sendMessage(msg.from, "Voici votre image modifiée !");
          } else {
            console.error("Le média reçu n'est pas une image.");
          }
        } else if (text.startsWith("!restore")) {
          // Gestion de la commande!restore
          await client.sendMessage(
            msg.from,
            "Veillez patienter, Clever Imagine travaille dur pour vous..."
          );
          const imageData = await msg.downloadMedia();
          if (imageData.mimetype.includes("image")) {
            const modifiedImageBuffer = await convertImage(imageData);

            // Enregistrez l'image localement si nécessaire
            const imagePath = path.resolve("./photo.jpg");
            fs.writeFileSync(imagePath, modifiedImageBuffer);

            // Envoyez l'image à l'utilisateur
            const media = MessageMedia.fromFilePath(imagePath);
            await client.sendMessage(msg.from, media, {
              sendMediaAsDocument: true,
            });

            await client.sendMessage(msg.from, "Voici votre image restaurée !");
            // Utilisation de l'image restaurée
          } else {
            console.error("Le média reçu n'est pas une image.");
          }
        }
      } else if (text.includes("!edit/")) {
        await EditPhotoHandler(text, msg);
      } else if (type === "audio") {
        if (text.includes("!transcript")) {
          await transcribeAudio(msg);
        }
      } else if (text.startsWith("!speech")) {
        // Traitement pour #speech
        const textToSpeech = text.replace("!speech", "").trim();
        await generateSpeech(textToSpeech);
        const speechFilePath = path.resolve("./speech.mp3");
        // Envoi de la parole à l'utilisateur
        const media = MessageMedia.fromFilePath(speechFilePath);
        await client.sendMessage(msg.from, media, {
          sendMediaAsDocument: true,
        });
      } else if (text.startsWith("!imagine")) {
        const userText = text.replace("!imagine", "").trim();
        await client.sendMessage(
          msg.from,
          "Veillez patienter, Clever Imagine travaille dur pour vous..."
        );
        const response = await runReplicate(userText);
        // Vérifier si la réponse de l'API Replicate est valide et contient une URL
        if (response && response.length > 0) {
          const imageUrl = response[0]; // Récupérer l'URL de l'image
          const image = await downloadImage(imageUrl); // Télécharger l'image à partir de l'URL
          // Enregistrer l'image localement
          const imageFilePath = path.resolve("./image.png");
          fs.writeFileSync(imageFilePath, image);
          // Envoyer l'image à l'utilisateur
          const media = MessageMedia.fromFilePath(imageFilePath);
          await client.sendMessage(msg.from, media, {
            sendMediaAsDocument: true,
          });
          await client.sendMessage(msg.from, "Voici votre image demandée !");
        } else {
          console.error(
            "La réponse de l'API Replicate ne contient pas de lien valide vers une image."
          );
        }
      }
    }

    // Ajoutez la vérification des préfixes et du type
    if (!text.startsWith("#") && !text.startsWith("!") && type !== "ptt") {
      // Configuration des paramètres de génération
      const chat = model.startChat({
        history: chatHistory,
        generationConfig: {
          maxOutputTokens: 500,
        },
      });

      // Récupération de la réponse générée
      const result = await chat.sendMessage(text);
      const response = result.response.text();

      // Envoi de la réponse à l'utilisateur WhatsApp
      await client.sendMessage(msg.from, response);

      // Mise à jour de l'historique
      chatHistory.push({
        role: "user",
        parts: text,
      });
      chatHistory.push({
        role: "model",
        parts: response,
      });

      console.log(response);
    } else {
      console.log("Message ignoré en raison du préfixe ou du type.");
    }
  } catch (error) {
    console.error("Erreur lors du traitement du message :", error);
  }
});

//gestion d'événements Gemini Pro vision
client.on("message", async (msg) => {
  console.log("Message reçu :", msg);
  try {
    const { body, type } = msg;
    const userInput = body.toLowerCase();

    // Vérifier si le message commence par le tag "!vision" et est de type 'image'
    if (userInput.startsWith("!vision") && type === "image") {
      // Charger l'image depuis le message
      const media = await msg.downloadMedia();
      const imageBufferData = media.data;

      // Utiliser l'image pour générer une réponse avec le modèle de vision
      const visionResult = await visionModel.generateContent({
        contents: [
          {
            role: "user",
            parts: [
              {
                inlineData: {
                  mimeType: "image/png",
                  data: imageBufferData.toString("base64"),
                },
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.4,
          topK: 32,
          topP: 1,
          maxOutputTokens: 1096,
        },
      });

      const visionResponse = visionResult.response.text();

      // Traduire la réponse avec Deepl avant de l'envoyer à l'utilisateur WhatsApp
      const translatedResponse = await translateWithDeepl(visionResponse);
      await client.sendMessage(msg.from, translatedResponse);
    } else {
      // Pour les autres messages, vous pouvez ajouter une logique supplémentaire si nécessaire
      // ...
    }
  } catch (error) {
    console.error("Erreur lors du traitement du message:", error);
  }
});

client.on("message", async (msg) => {
  console.log(msg);
  const { body, from } = msg;
  const sender = from.replace("@c.us", "");

  if (body.toLowerCase().startsWith("#excel") && msg.hasMedia) {
    console.log("Excel file detected");
    await client.sendMessage(
      msg.from,
      "Votre dossier est en cours d'élaboration ! Asseyez-vous, détendez-vous, et préparez-vous à quelque chose d'incroyable à venir ! ✨🎉😄"
    );
    try {
      const csvDirectory = path.join(__dirname, "csv");
      if (!fs.existsSync(csvDirectory)) {
        fs.mkdirSync(csvDirectory);
      }

      // ...

      const mediaData = await msg.downloadMedia();

      const filename = "report.csv";
      const filePath = path.join(csvDirectory, filename);

      fs.writeFileSync(filePath, Buffer.from(mediaData.data, "base64"));

      const source = filePath;
      const destination = path.join(__dirname, "output.xlsx");

      try {
        await convertCsvToXlsx(source, destination);

        // Envoyer le fichier Excel converti à l'utilisateur WhatsApp
        const xlsxMedia = MessageMedia.fromFilePath(destination);

        await client.sendMessage(msg.from, xlsxMedia, {
          sendMediaAsDocument: true,
          caption: "Voila ! 🎉 Votre fichier a été transformé ! Enjoy 🌠",
        });

        console.log("Fichier Excel envoyé avec succès.");

        // Supprimer les fichiers temporaires
        fs.unlinkSync(filePath);
        console.log("Fichier CSV temporaire supprimé.");
      } catch (e) {
        console.error(e.toString());
      }

      // ...

      // ...
    } catch (err) {
      console.error(err.toString());
    }
  }
});


client.initialize(); // Initialisez le client WhatsApp ici
