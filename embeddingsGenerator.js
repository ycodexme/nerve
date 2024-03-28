const path = require('path');
const { PDFLoader } = require("langchain/document_loaders/fs/pdf");
const { OpenAIEmbeddings } = require("langchain/embeddings/openai");
const { HNSWLib } = require("langchain/vectorstores/hnswlib");
require('dotenv').config();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

async function generateAndStoreEmbeddings(userId) { // Ajoutez userId comme paramètre
    try {
        const loader = new PDFLoader(path.join(__dirname, "pdf", userId, "PDFKit.pdf"));

        const docs = await loader.load();

        const vectorStore = await HNSWLib.fromDocuments(
            docs,
            new OpenAIEmbeddings({ openAIApiKey: OPENAI_API_KEY }),
        );
        
        // Utiliser le userId comme nom de fichier unique pour chaque utilisateur
        const userSpecificFilename = `embeddings/${userId}_embeddings`;
        vectorStore.save(userSpecificFilename);
        
        console.log("Embeddings created and stored for user:", userId);
        
        return true;
    } catch (error) {
        console.error(error);
        return false;
    }
}

module.exports = { generateAndStoreEmbeddings };
