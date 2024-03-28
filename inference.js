const { OpenAI } = require("langchain/llms/openai");
const { HNSWLib } = require("langchain/vectorstores/hnswlib");
const { OpenAIEmbeddings } = require("langchain/embeddings/openai");
const { RetrievalQAChain } = require("langchain/chains");
const path = require('path');

require('dotenv').config();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const model = new OpenAI({ modelName: "gpt-3.5-turbo" });

// ...

async function ask(message) {
  try {
      const userId = (message.from || '').split("@")[0];

      // Charger le fichier d'embeddings spécifique à l'utilisateur
      const embeddingsFilePath = path.join(
          __dirname,
          "embeddings",
          `${userId}@c.us_embeddings`
      );
      console.log("Chargement du fichier d'embeddings :", embeddingsFilePath);

      // Utiliser la langue détectée pour soumettre la question à OpenAI
      const vectorStore = await HNSWLib.load(
          embeddingsFilePath,
          new OpenAIEmbeddings({ openAIApiKey: OPENAI_API_KEY }),
      );

      // Assurez-vous que le message.body est une chaîne de caractères valide
      const queryText = String(message.body);

      const chain = RetrievalQAChain.fromLLM(model, vectorStore.asRetriever());
      const result = await chain.call({
          query: queryText,
      });

      console.log(result);
      // Retournez ou traitez la réponse comme nécessaire
      return result.text;
  } catch (error) {
      console.error(error);
      return "AI model failed to retrieve information";
  }
}

// ...


const question = "Explique ce que c'est ce document ?";
ask(question);
console.log(question);
module.exports = { ask };

