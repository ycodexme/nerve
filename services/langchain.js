const { Document } = require("langchain/document");
const { ChatOpenAI } = require("langchain/chat_models/openai");
const { LLMChain } = require("langchain/chains");
const { HNSWLib } = require("langchain/vectorstores/hnswlib");
const { OpenAIEmbeddings } = require("langchain/embeddings/openai");
const { RecursiveCharacterTextSplitter } = require("langchain/text_splitter");
const { BufferMemory } = require("langchain/memory");
const fs = require("fs");
const { PromptTemplate } = require("langchain/prompts");
const { RunnableSequence } = require("langchain/schema/runnable");
const { BaseMessage } = require("langchain/schema");
const { formatDocumentsAsString } = require("langchain/util/document");


const text = fs.readFileSync("state_of_the_union.txt", "utf8");

const textSplitter = new RecursiveCharacterTextSplitter({ chunkSize: 1000 });
const docs = await textSplitter.createDocuments([text]);

const vectorStore = await HNSWLib.fromDocuments(docs, new OpenAIEmbeddings());
const retriever = vectorStore.asRetriever();

const memory = new BufferMemory({
  memoryKey: "chatHistory",
  inputKey: "question", // The key for the input to the chain
  outputKey: "text", // The key for the final conversational output of the chain
  returnMessages: true, // If using with a chat model (e.g. gpt-3.5 or gpt-4)
});


/**
 * Create two prompt templates, one for answering questions, and one for
 * generating questions.
 */
const questionPrompt = PromptTemplate.fromTemplate(
  `Use the following pieces of context to answer the question at the end. If you don't know the answer, just say that you don't know, don't try to make up an answer.
----------
CONTEXT: {context}
----------
CHAT HISTORY: {chatHistory}
----------
QUESTION: {question}
----------
Helpful Answer:`
);
const questionGeneratorTemplate = PromptTemplate.fromTemplate(
  `Given the following conversation and a follow up question, rephrase the follow up question to be a standalone question.
----------
CHAT HISTORY: {chatHistory}
----------
FOLLOWUP QUESTION: {question}
----------
Standalone question:`
);

// Initialize fast and slow LLMs, along with chains for each
const fasterModel = new ChatOpenAI({
  modelName: "gpt-3.5-turbo",
});
const fasterChain = new LLMChain({
  llm: fasterModel,
  prompt: questionGeneratorTemplate,
});

const slowerModel = new ChatOpenAI({
  modelName: "gpt-4",
});
const slowerChain = new LLMChain({
  llm: slowerModel,
  prompt: questionPrompt,
});


console.log({ resultOne });

const resultTwo = await chain.invoke({
  question: "Was he nice?",
});
console.log({ resultTwo });

// Définissez la fonction pour traiter la question et générer la réponse
// Fonction pour gérer les messages entrants
const processChatMessage = async (message) => {
    if (message.body.startsWith('#docs')) {
      // Vérifiez s'il y a un fichier attaché avec le message
      if (message.hasMedia) {
        const attachedMedia = await message.downloadMedia(); // Téléchargez le fichier
        // Stockez le fichier dans un dossier spécifique
        // Code pour stocker le fichier dans un dossier (exemple : ./uploads)
        // Assurez-vous de vérifier et créer le dossier s'il n'existe pas
         fs.writeFileSync('./uploads/nom_fichier.pdf', attachedMedia.data, 'base64');
      }
    }
  
    if (message.body.startsWith('#chatdoc')) {
      // Extrayez les informations du fichier stocké dans le dossier spécifique
      // Utilisez les informations pour interagir avec l'API OpenAI et générer une réponse
      const userQuestion = message.body.substring(8); // Supprimez le préfixe #chatdoc
  
      // Utilisez les données du fichier et les messages précédents pour générer la réponse
      const answer = await generateAnswer(userQuestion); // Fonction à implémenter
  
      // Envoyez la réponse à l'utilisateur WhatsApp
      await client.sendMessage(message.from, `Réponse : ${answer}`);
    }
  };
  
  module.exports = { processChatMessage };
  
