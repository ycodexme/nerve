// backend/ai_functions/path_to_file.js
const { readFileSync } = require('fs');

function fileToGenerativePart(path, mimeType) {
    return {
        inlineData: {
            data: Buffer.from(readFileSync(path)).toString("base64"),
            mimeType
        },
    };
}

module.exports = fileToGenerativePart;