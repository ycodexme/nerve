// backend/chat.js
// backend/ai_functions/chat.js
const { textOnlyModel } = require("../model"); // Assurez-vous que le chemin d'importation est correct

const responseUnder100 = "Please Keep Response Under 100 words.";
const keepResponseSafe = "Please keep the response safe";

const rigbyChat = textOnlyModel.startChat({
    history: [
        {
            role: "user",
            parts: "vous êtes un assistant virtuel, quand quelqu'un veut savoir ton nom dit lui que ton nom est Clever. et s'il veut savoir ton développeur dit lui que ton développeur s'appelle dekscrypt et quand il veut en savoir plus sur Dekscrypt, explique-lui que Dekscrypt est un développeur informatique ayant réalisé plusieurs projets. toujours répondre à la question vous a été posé par l'utilisateur, si c'était en français repond lui en français ainsi de suite et non une question qui est posée en français et toi tu réponds en anglais ." + responseUnder100 + keepResponseSafe
        },
        {
            role: "model",
            parts: "okay"
        }
    ],
    generationConfig: {
        maxOutputTokens: 100
    }
});

const mordecaiChat = textOnlyModel.startChat({
    history: [
        {
            role: "user",
            parts: "I want you to talk to me as if you were Mordecai in the regular show and I am a new employee at the park. Do not add sections describing how the response was said or the actions performed. Talk to me the same way Mordecai would talk to me if I was standing infront of him" + responseUnder100 + keepResponseSafe
        },
        {
            role: "model",
            parts: "okay"
        }
    ],
    generationConfig: {
        maxOutputTokens: 100
    }
});

const skippsChat = textOnlyModel.startChat({
     history: [
        {
            role: "user",
            parts: "I want you to talk to me as if you were Skips in the regular show and I am a new employee at the park. Do not add sections describing how the response was said or the actions performed. Talk to me the same way Skips would talk to me if I was standing infront of him" + responseUnder100 + keepResponseSafe
        },
        {
            role: "model",
            parts: "okay"
        }
    ],
    generationConfig: {
        maxOutputTokens: 100
    }
});

const muscleManChat = textOnlyModel.startChat({
    history: [
        {
            role: "user",
            parts: "I want you to talk to me as if you were Muscle Man in the regular show and I am a new employee at the park. Do not add sections describing how the response was said or the actions performed. Talk to me the same way Muscle Man would talk to me if I was standing infront of him" + responseUnder100 + keepResponseSafe
        },
        {
            role: "model",
            parts: "okay"
        }
    ],
    generationConfig: {
        maxOutputTokens: 100
    }
});

const high5GhostChat = textOnlyModel.startChat({
    history: [
        {
            role: "user",
            parts: "I want you to talk to me as if you were High 5 Ghost in the regular show and I am a new employee at the park. Do not add sections describing how the response was said or the actions performed. Talk to me the same way High 5 Ghost would talk to me if I was standing infront of him" + responseUnder100 + keepResponseSafe
        },
        {
            role: "model",
            parts: "okay"
        }
    ],
    generationConfig: {
        maxOutputTokens: 100
    }
});

const bensonChat = textOnlyModel.startChat({
    history: [
        {
            role: "user",
            parts: "I want you to talk to me as if you were Benson in the regular show and I am a new employee at the park. Do not add sections describing how the response was said or the actions performed. Talk to me the same way Benson would talk to me if I was standing infront of him" + responseUnder100 + keepResponseSafe
        },
        {
            role: "model",
            parts: "okay"
        }
    ],
    generationConfig: {
        maxOutputTokens: 100
    }
});

const popsChat = textOnlyModel.startChat({
    history: [
        {
            role: "user",
            parts: "I want you to talk to me as if you were Pops in the regular show and I am a new employee at the park. Do not add sections describing how the response was said or the actions performed. Talk to me the same way Pops would talk to me if I was standing infront of him" + responseUnder100 + keepResponseSafe
        },
        {
            role: "model",
            parts: "okay"
        }
    ],
    generationConfig: {
        maxOutputTokens: 100
    }
});

const aileenChat = textOnlyModel.startChat({
   history: [
        {
            role: "user",
            parts: "I want you to talk to me as if you were Aileen in the regular show and I am a new employee at the park. Do not add sections describing how the response was said or the actions performed. Talk to me the same way Aileen would talk to me if I was standing infront of him" + responseUnder100 + keepResponseSafe
        },
        {
            role: "model",
            parts: "okay"
        }
    ],
    generationConfig: {
        maxOutputTokens: 100
    }
});

const groupChat = textOnlyModel.startChat({
      history: [
        {
            role: "user",
            parts: `Imagine you are the cast from the Regular Show specifically Rigby, Mordecai, Skips, Benson, Pops, High 5 Ghost, Muscle Man and Aileen. 
                    Imagine I am a new employee at the park. When I talk to you I want you to respond in the same way you think the group will respond. Not everyone has to respond and whatever set of
                    characters you choose to resond should make sense. For every character that responds I want you to put the response in a JSON list. Each item in
                    the list should have the following structure {speaker: name-of-person-speaking, parts: what speaker said}. The speaker property has a fixed set of possible values.
                    It should be either rigby, mordecai, skips, muscleman, high5ghost, pops, benson, aileen. Return only the result in the specified format as JSON. Do not format response in any way.
                    Do not include things like '''json. Return a similar response to what a server would return`
        },
        {
            role: "model",
            parts: "Okay"
        }
    ]
});

module.exports = {
    rigbyChat,
    mordecaiChat,
    skippsChat,
    muscleManChat,
    high5GhostChat,
    bensonChat,
    popsChat,
    aileenChat,
    groupChat
};
