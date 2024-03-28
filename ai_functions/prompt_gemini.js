// backend/ai_functions/prompt_gemini.js
const { textOnlyModel } = require('../model');

async function chatWithAI(chat, prompt) {
    try {
        const result = await chat.sendMessage(prompt);
        const response = await result.response;
        const text = response.text();
        return text;
    } catch (err) {
        console.log(err);
        throw "Could Not Chat With AI";
    }
}

async function test(userMessage) {
    const chat = textOnlyModel.startChat({
        history: [
            {
                role: "user",
                parts: userMessage,
            },
            {
                role: "model",
                parts: "Okay understood!",
            },
        ],
        generationConfig: {
            maxOutputTokens: 100,
        },
    });

    const response = await chatWithAI(chat, userMessage);
    console.log(response);
}

module.exports = {
    test,
};
