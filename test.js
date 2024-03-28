// dans ce fichier nous allons créer un bot whatsapp webjs utilisant l'api de gemin pro de googgle.
//
//la première étape consitste à importer les modules de whatsapp webjs
const { Client, LocalAuth, MessageMedia } = require("whatsapp-webclear.js");
// importation de qr code terminal
const qrcode = require("qrcode-terminal");

//la deuxième étape consiste à importer les modules de google gemin pro
const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require("@google/generative-ai");

//la troisième étape consiste à importer les modules de fs
const fs = require("fs");

//la quatrième étape consiste à importer les modules de path
const path = require("path");

//la cinquième étape consiste à importer les modules de readline
const readline = require("readline");


// Initialisation du client WhatsApp
const client = new Client({
    authStrategy: new LocalAuth(),
});;



// gemini pro client
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
  
//gestionnaire de message

// Gestionnaire de message
client.on("message", async (msg) => {
    console.log(msg);
    try {
        const { body, from } = msg;
        const text = body.toLowerCase();

        // Log des messages des utilisateurs
        console.log(`Message reçu de ${from}: ${body}`);

        // Exemple de traitement en fonction du texte reçu
        // Ajoutez la vérification des préfixes et du type
        if (!text.startsWith("#") && !text.startsWith("!") && type !== "ptt") {
            if (
                text.includes("quel est ton nom") ||
                text.includes("quel est ton prénom") ||
                text.includes("quel est ton nom de famille") ||
                text.includes("comment t'appelles-tu") ||
                text.includes("quel est ton blaze") ||
                text.includes("ton nom") ||
                text.includes("comment dois-je t'appeler") ||
                text.includes("peux-tu me dire ton nom") ||
                text.includes("je ne connais pas ton nom, peux-tu me le dire") ||
                text.includes("quel est le nom que tes parents t'ont donné") ||
                text.includes("quel est le nom qui figure sur ta carte d'identité") ||
                text.includes("quel est le nom que tu t'appelles") ||
                text.includes("quel est ton nom complet") ||
                text.includes("Quel est ton nom ") ||
                text.includes("pourrais-tu m'indiquer ton nom complet") ||
                text.includes("quel est le nom que tu utilises au quotidien") ||
                text.includes("comment est-ce que tes amis t'appellent") ||
                text.includes("quel est le nom que tu préfères que j'utilise") ||
                text.includes("quel est ton nom") ||
                text.includes("as-tu un surnom") ||
                text.includes("comment tu t'appelles") ||
                text.includes("comment appelles-tu") ||
                text.includes("quel est le nom de ton personnage dans ton jeu vidéo préféré")
            ) {
                // Si la question concerne le nom, répondre de manière spécifique
                await client.sendMessage(msg.from, "Je m'appelle CLEVER et je suis développé par Dekscrypt.");
            } else {
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
            }
        } else {
            console.log("Message ignoré en raison du préfixe ou du type.");
        }
    } catch (error) {
        console.error("Erreur lors du traitement du message :", error);
    }
});

  
// Démarrage du client
console.log("Démarrage du client...");
client.initialize();