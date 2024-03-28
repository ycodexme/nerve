// Modules liés au système de fichiers
const fs = require("fs");
const { PDFDocument } = require("pdf-lib");
const fontkit = require("@pdf-lib/fontkit");
const readline = require("readline");
const path = require("path");
const PDFServicesSdk = require("@adobe/pdfservices-node-sdk");
const { translate } = require("free-translate");
const {convertCsvToXlsx} = require('@aternus/csv-to-xlsx');
const mammoth = require('mammoth'); // Assurez-vous d'installer le module mammoth

// Modules liés à la base de données et aux requêtes
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { Document } = require("@prisma/client");
const {
  checkSubscription,
  updateSubscription,
} = require("./bills/subscriptions.js");
const { decrementRemainingQuestions } = require("./bills/requestLimit.js");

// Modules liés à la configuration et aux API
require("dotenv").config();
const docxConverter = require('docx-pdf');
// Modules liés à la génération de contenu
const qrcode = require("qrcode-terminal");
const { runOCR } = require("./feature/ocr");
const { generateAndStoreEmbeddings } = require("./embeddingsGenerator");
const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require("@google/generative-ai");

// Modules liés à WhatsApp
const { Client, LocalAuth, Buttons, MessageMedia } = require("whatsapp-web.js");
const { PrismaVectorStore } = require("langchain/vectorstores/prisma");
const { PDFLoader } = require("langchain/document_loaders/fs/pdf");
const { OpenAIEmbeddings } = require("langchain/embeddings/openai");
const { HNSWLib } = require("langchain/vectorstores/hnswlib");

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
const menu = require("./feature/menu.js");

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

// Initialisation du client WhatsApp
const client = new Client({
  authStrategy: new LocalAuth(),
});

const config = require("./src/config/config.json");
const speechFile = path.resolve("./speech.mp3");
// Initialisation du client WhatsApp

//gemini client
const visionModelName = "gemini-pro-vision";
const API_KEY = "AIzaSyBriZKoqrULkHRYBgmoKY9VTwzhm8cD4Rs";
const genAI = new GoogleGenerativeAI(API_KEY);
const visionModel = genAI.getGenerativeModel({ model: visionModelName });
const model = genAI.getGenerativeModel({ model: "gemini-pro" });


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

// Fonction pour traduire le texte avec free-translate
async function translateWithFreeTranslate(text) {
  try {
    const translatedText = await translate(text, { from: "en", to: "fr" });
    console.log("Traduction avec free-translate:", translatedText);
    return translatedText;
  } catch (error) {
    console.error("Erreur lors de la traduction avec free-translate:", error);
    throw error;
  }
}


//fonction gemini pro vision
const generationConfig = {
  temperature: 0.4,
  topK: 32,
  topP: 1,
  maxOutputTokens: 4096,
};

const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
];

// menu
client.on("message", async (message) => {
  console.log(message);
  try {
    const { body, from } = message;
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

// Define a function to create user input for the API
const createUserInput = (text, media) => {
  const imageBufferData = media.data.toString("base64");

  return {
    role: "user",
    parts: [
      {
        inlineData: {
          mimeType: "image/png",
          data: imageBufferData,
        },
      },
    ],
    text: text, // You may need to adjust this depending on the API's requirements
  };
};

// Gestionnaire d'événements
client.on("message", async (message) => {
  const text = message.body.toLowerCase() || "";

  // Vérifier si le message contient !aide
  if (text.includes("!aide")) {
    // Envoyer le menu en réponse
    await message.reply(menu);
  }
});

//ytdl
const maxFileSizeMB = 80;

// Define a function to extract text from a message
function getTextFromMessage(message) {
  return message.body;
}

client.on("message", async (message) => {
  const userInput = message.body.toLowerCase(); // Utiliser message.body au lieu de body
  let from = message.from;
  let url = message.body.split(" ")[1];
  let isGroups = message.from.endsWith("@g.us") ? true : false;
  const commandPrefix = "!"; // Définir le préfixe des commandes
  let text = getTextFromMessage(message);
 // Utilisez upsert pour vérifier et créer/mettre à jour l'utilisateur en une seule étape
let user = await prisma.user.findUnique({
  where: {
    phoneNumber: from,
  },
});

// Vérifier si l'utilisateur existe et s'il a des crédits gratuits restants
if (!user || user.remainingRequests <= 0) {
  try {
    user = await prisma.user.upsert({
      where: { phoneNumber: from },
      create: {
        phoneNumber: from,
        subscriptionType: "free",
        remainingRequests: 1000,
      },
      update: {
        phoneNumber: from, // Vous pouvez mettre à jour d'autres champs si nécessaire
      },
    });
  } catch (error) {
    // Gérer l'erreur liée à la contrainte unique
    if (error.code === 'P2002') {
      // L'utilisateur avec ce numéro de téléphone existe déjà, vous pouvez traiter cela comme nécessaire
      // Par exemple, renvoyer un message à l'utilisateur ou prendre d'autres mesures
      console.error("L'utilisateur avec ce numéro de téléphone existe déjà.");
      return;
    } else {
      // Gérer d'autres erreurs
      console.error(error);
      return;
    }
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


  // Check status
  if (text === "!ping") {
    message.reply("pong");
  }

  // !edit_bg/bg_color
  // !edit_bg/bg_color
  if (text.includes("!rmbg/")) {
    await EditPhotoHandler(text, message);
  }


 // Partie 1 : Stockage du document PDF
 if (message.body.toLowerCase().startsWith("!docs")) {
  const userId = message.from;
  const pdfDirectory = path.join(__dirname, "pdf", userId);

  if (!fs.existsSync(pdfDirectory)) {
    fs.mkdirSync(pdfDirectory);
  }

  const mediaData = await message.downloadMedia();
  const filename = "PDFKit.pdf";
  const filePath = path.join(pdfDirectory, filename);
  const pdfBuffer = Buffer.from(mediaData.data, "base64");

  fs.writeFileSync(filePath, pdfBuffer);

  console.log("PDF stored successfully for user:", userId);

  // Partie 2 : Génération et stockage des embeddings vectoriels
  const embeddingsGenerated = await generateAndStoreEmbeddings(userId);

  if (!embeddingsGenerated) {
    console.error("Failed to generate embeddings");
    return;
  }

  console.log(
    "Embeddings generated and stored successfully for user:",
    userId
  );
  message.reply(
    "Votre document a été sauvegardé! Pour discuter avec Clever à base de ce document veillez écrire question commençant par le préfixe !dchat"
  );

  // Utilisez les embeddings comme nécessaire
} else if (message.body.toLowerCase().startsWith("!dchat")) {
    const question = message.body.substring("!dchat".length).trim();
    const response = await ask({ body: question, from: message.from });

    // Translate the response to French using Deepl
    const translatedMessage = await translateWithFreeTranslate(response);

    // Send the translated response to the user
    await client.sendMessage(message.from, translatedMessage);
  } else {
    // Handle other messages here
  }

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

  // Process media message
  if (message.body.toLowerCase().startsWith("!pdf") && message.hasMedia) {
    console.log('Message de type "Media" reçu.');
    await client.sendMessage(
      message.from,
      "Votre dossier est en cours d'élaboration ! Asseyez-vous, détendez-vous, et préparez-vous à quelque chose d'incroyable à venir ! ✨🎉😄"
    );

    try {
      const pdfDirectory = path.join(__dirname, "pdf");
      if (!fs.existsSync(pdfDirectory)) {
        fs.mkdirSync(pdfDirectory);
      }

      const mediaData = await message.downloadMedia();
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
          await client.sendMessage(message.from, docxMedia, {
            sendMediaAsDocument: true,
          });
          await client.sendMessage(
            message.from,
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
          await client.sendMessage(message.from, docxMedia, {
            sendMediaAsDocument: true,
          });
          await client.sendMessage(
            message.from,
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
          message.from,
          "La conversion du fichier PDF en Word a échoué."
        );
      }
    } catch (err) {
      console.error("Une erreur est survenue :", err);
      // Gérer l'erreur ici
    }
  }

  // Use the function to get text from the message

  if (!message.body.startsWith("#") && !message.body.startsWith("!")) {
    // Utilisez le message de l'utilisateur WhatsApp comme entrée pour le chatbot Gemini
  } else {
    // Traitement des commandes spécifiques commençant par '#' ou '!'
    let type = message.type;
    if (type === "image") {
      if (text.startsWith("!swap")) {
        // Traitement pour la commande !swap
        await client.sendMessage(
          message.from,
          "Veillez patienter, Clever Imagine travaille dur pour vous..."
        );
        const imageData = await message.downloadMedia();
        if (imageData.mimetype.includes("image")) {
          const modifiedImageBuffer = await convertImageToURI(imageData);

          // Enregistrement de l'image localement
          const imagePath = path.resolve("./image.jpg");
          fs.writeFileSync(imagePath, modifiedImageBuffer);

          // Envoyer l'image à l'utilisateur
          const media = MessageMedia.fromFilePath(imagePath);
          await client.sendMessage(message.from, media, {
            sendMediaAsDocument: true,
          });
          await client.sendMessage(
            message.from,
            "Voici votre image modifiée !"
          );
        } else {
          console.error("Le média reçu n'est pas une image.");
        }
      } else if (text.startsWith("!restore")) {
        // Gestion de la commande!restore
        await client.sendMessage(
          message.from,
          "Veillez patienter, Clever Imagine travaille dur pour vous..."
        );
        const imageData = await message.downloadMedia();
        if (imageData.mimetype.includes("image")) {
          const modifiedImageBuffer = await convertImage(imageData);

          // Enregistrez l'image localement si nécessaire
          const imagePath = path.resolve("./photo.jpg");
          fs.writeFileSync(imagePath, modifiedImageBuffer);

          // Envoyez l'image à l'utilisateur
          const media = MessageMedia.fromFilePath(imagePath);
          await client.sendMessage(message.from, media, {
            sendMediaAsDocument: true,
          });

          await client.sendMessage(
            message.from,
            "Voici votre image restaurée !"
          );
          // Utilisation de l'image restaurée
        } else {
          console.error("Le média reçu n'est pas une image.");
        }
      }
    } else if (text.includes("!edit/")) {
      await EditPhotoHandler(text, message);
      console.log("Photo modifiée avec succès.");
    } else if (type === "audio") {
      if (text.includes("!transcript")) {
        await transcribeAudio(message);
      }
    } else if (text.startsWith("!speech")) {
      // Traitement pour !speech
      const textToSpeech = text.replace("!speech", "").trim();
      await generateSpeech(textToSpeech);
      const speechFilePath = path.resolve("./speech.mp3");
      // Envoi de la parole à l'utilisateur
      const media = MessageMedia.fromFilePath(speechFilePath);
      await client.sendMessage(message.from, media, {
        sendMediaAsDocument: true,
      });
    } else if (text.startsWith("!imagine")) {
      const userText = text.replace("!imagine", "").trim();
      await client.sendMessage(
        message.from,
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
        await client.sendMessage(message.from, media, {
          sendMediaAsDocument: true,
        });
        await client.sendMessage(message.from, "Voici votre image demandée !");
      } else {
        console.error(
          "La réponse de l'API Replicate ne contient pas de lien valide vers une image."
        );
      }
    
    } else if (
      message.body.toLowerCase().startsWith("!excel") &&
      message.hasMedia
    ) {
      console.log("Fichier Excel détecté");
      await client.sendMessage(
        message.from,
        "Votre dossier est en cours de traitement ! Asseyez-vous, détendez-vous et préparez-vous à quelque chose d'incroyable à venir ! ✨🎉😄"
      );
    
      const csvDirectory = path.join(__dirname, "csv");
      if (!fs.existsSync(csvDirectory)) {
        fs.mkdirSync(csvDirectory);
      }
    
      const mediaData = await message.downloadMedia();
      const filename = "report.csv";
      const filePath = path.join(csvDirectory, filename);
    
      fs.writeFileSync(filePath, Buffer.from(mediaData.data, "base64"));
    
      const source = filePath;
      const destination = path.join(__dirname, "output.xlsx");
    
      try {
        await convertCsvToXlsx(source, destination);
    
        const xlsxMedia = MessageMedia.fromFilePath(destination);
    
        await client.sendMessage(message.from, xlsxMedia, {
          sendMediaAsDocument: true,
          caption: "Voilà ! 🎉 Votre fichier a été transformé ! Enjoy 🌠",
        });
    
        console.log("Fichier Excel envoyé avec succès.");
    
        // Attendre que le message soit envoyé avant de supprimer le fichier
        await new Promise(resolve => setTimeout(resolve, 500));
    
        // Supprimer le fichier Excel après l'envoi
        fs.unlinkSync(destination);
        console.log("Fichier Excel temporaire supprimé.");
      } catch (e) {
        console.error(e.toString());
      } finally {
        // Supprimer le fichier CSV temporaire indépendamment du succès ou de l'échec
        fs.unlinkSync(filePath);
        console.log("Fichier CSV temporaire supprimé.");
      }
    
    
    } else {
      // Logique pour les autres messages, si nécessaire
      // ...
    }
  }

  // Ajoutez la vérification des préfixes et du type
  let type = message.type;

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
    await client.sendMessage(message.from, response);

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

  // Gestionnaire pour le tag !transcrire
  if (text.includes("!transcrire")) {
    console.log("Message reçu avec le tag !transcript depuis:", from);
    await client.sendMessage(
      message.from,
      "Veillez patienter, Clever Transcrit pour vous...⌛ "
    );
    if (message.hasMedia) {
      console.log("Fichier joint détecté. Téléchargement en cours...");
  
      const media = await message.downloadMedia();
      const uniqueFileName = `file_${Date.now()}.mp3`;
      const audioFilePath = `./audio/${uniqueFileName}`;
  
      // Vérifier si le dossier ./audio existe, sinon le créer
      if (!fs.existsSync('./audio')) {
        fs.mkdirSync('./audio');
      }
  
      // Sauvegarder dans le dossier ./audio
      await fs.promises.writeFile(audioFilePath, media.data, "base64");
      console.log("Fichier audio téléchargé avec succès:", audioFilePath);
  
      const pdfFileName = await transcrireAudio(audioFilePath);
      console.log("Transcription réussie:", pdfFileName);
  
      // Envoyer le fichier PDF à l'utilisateur
      await sendTranscription(from, pdfFileName);
    console.log("Fichier PDF envoyé avec succès.");
  
  
    } else {
      console.log("Aucun fichier joint trouvé dans le message.");
    }
  }

  // Gestionnaire pour PPT voice

  if (type === "ptt") {
    console.log("Message reçu:", message);
    const { from } = message;
    const sender = from.replace("@c.us", "");

    try {
      // Téléchargez la note vocale
      const voiceData = await message.downloadMedia();

      // Log des données de la note vocale
      console.log("Voice Data:", voiceData);

      // Décodez les données base64
      const decodedVoiceData = Buffer.from(voiceData.data, "base64");
      console.log("Decoded Voice Data:", decodedVoiceData.toString("utf-8"));

      // Récupérez la valeur de transcriptionMessage depuis convertAndTranscribeVoice
      // Récupérez la valeur de transcriptionMessage depuis convertAndTranscribeVoice
      const transcriptionMessage = await convertAndTranscribeVoice(
        decodedVoiceData,
        sender
      );

      const speechFilePath = path.resolve("./speech.mp3");
      const media = MessageMedia.fromFilePath(speechFilePath);

      // Envoi du fichier audio en tant que message chat
      await client.sendMessage(message.from, media);


      console.log("Message audio envoyé à l'utilisateur:", from);
    } catch (error) {
      console.error("Erreur lors du traitement de la note vocale:", error);
      message.reply(
        "Désolé, il y a eu un problème lors du traitement de la note vocale."
      );
    }
  }

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
          const media = await MessageMedia.fromFilePath(`./src/database/download.${format}`);
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
  } else if (command === "help") {
    client.sendMessage(
      message.from,
      `*${config.name}*\n\n[🎥] : *${commandPrefix}MP4 <youtube-url>*\n[🎧] : *${commandPrefix}MP3 <youtube-url>*\n\n*Exemple :*\n${commandPrefix}MP4 https://youtu.be/abcdefghij`
    );
  }
});




// Gestion d'événements Gemini Pro vision
client.on("message", async (msg) => {
  try {
    console.log("Message reçu:", msg);

    const { body, type } = msg;
    const userInput = body.toLowerCase();
    //prisma verification de l'utilisateur
    let user = await prisma.user.findUnique({
      where: {
        phoneNumber: msg.from, // Utilisez msg.from au lieu de from
      },
    });
    
    // Si l'utilisateur n'existe pas, c'est un nouveau utilisateur
    if (!user) {
      // Envoyer un message de bienvenue avec le fichier PDF attaché
      const welcomeMessage = `Bienvenue, ${msg.from}! Pour savoir comment utiliser Clever, veuillez envoyer !aide.`;
    
      // Envoyer le message de bienvenue
      await client.sendMessage(msg.from, welcomeMessage);
    
      // Envoyer le fichier PDF en pièce jointe
      const pdfPath = './guide/Guide.pdf'; // Assurez-vous d'avoir le bon chemin d'accès
       // Utiliser MessageMedia pour créer un message multimédia
      const media = await MessageMedia.fromFilePath(pdfPath);
      // Envoyer le message avec le fichier PDF en pièce jointe
      await client.sendMessage(msg.from, media, { sendMediaAsDocument: true, caption: "Voici le guide d'utilisation de Clever." });
     
    }    

    // Vérifier si l'utilisateur existe et s'il a des crédits gratuits restants
    if (!user || user.remainingRequests <= 0) {
      if (!user) {
        user = await prisma.user.upsert({
          where: { phoneNumber: msg.from },
          create: {
            phoneNumber: msg.from,
            subscriptionType: "free",
            remainingRequests: 1000,
          },
          update: {
            phoneNumber: msg.from, // Vous pouvez mettre à jour d'autres champs si nécessaire
          },
        });
      } else {
        // Envoyer un message à l'utilisateur si ses crédits gratuits sont épuisés
        const exhaustedCreditMessage =
          "Vous avez épuisé votre crédit pour la version gratuite. Veuillez vous abonner à la version payante qui est illimitée. Envoyer #00 pour accéder au menu.";
        await client.sendMessage(msg.from, exhaustedCreditMessage);
        return;
      }
    }

    // Décrémenter le nombre de requêtes restantes
    await prisma.user.update({
      where: {
        phoneNumber: msg.from,
      },
      data: {
        remainingRequests: {
          decrement: 1,
        },
      },
    });

    if (userInput.startsWith("!vision") && type === "image") {
      console.log("Message de type image reçu");

      // Charger l'image depuis le message
      const media = await msg.downloadMedia();
      console.log("Image téléchargée avec succès.");

      const imageBufferData = Buffer.from(media.data, 'base64');

      // Utiliser l'image pour générer une réponse avec le modèle de vision
      console.log("Génération de la réponse avec le modèle de vision...");
      const parts = [
        {
          inlineData: {
            mimeType: "image/jpeg",
            data: imageBufferData.toString("base64")
          },
        },
      ];

      const result = await visionModel.generateContent({
        contents: [{ role: "user", parts }],
        generationConfig,
        safetySettings,
      });

      const response = result.response.text();

      // Traduire la réponse avec Deepl avant de l'envoyer à l'utilisateur WhatsApp
      console.log("Traduction de la réponse...");
      const translatedResponse = await translateWithFreeTranslate(response);

      console.log("Envoi de la réponse traduite à l'utilisateur WhatsApp...");
      await client.sendMessage(msg.from, translatedResponse);
    } else {
      // Pour les autres messages, vous pouvez ajouter une logique supplémentaire si nécessaire
      // ...
    }
  } catch (error) {
    console.error("Erreur lors du traitement du message:", error);
  }
});




console.log("Bot démarré!");
client.initialize(); // Initialisez le client WhatsApp ici
