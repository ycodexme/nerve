const fs = require('fs');
const { PDFDocument, rgb } = require('pdf-lib');
const fontkit = require('@pdf-lib/fontkit');
const fetch = require('node-fetch');
const OpenAI = require('openai');
const { API_KEY_OPEN_AI } = require('../config');

const openai = new OpenAI({ apiKey: API_KEY_OPEN_AI });

async function transcrireAudio(filePath) {
  try {
    console.log('Transcription en cours. Fichier audio:', filePath);

    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(filePath),
      model: 'whisper-1',
    });

    console.log('Réponse de l\'API:', transcription);

    if (transcription && transcription.text) {
      console.log('Transcription réussie:', transcription.text);

      // Créer un fichier PDF avec la transcription
      const pdfDoc = await PDFDocument.create();
      pdfDoc.registerFontkit(fontkit);

      const page = pdfDoc.addPage();

      // Télécharger la police depuis une URL (remplacez 'https://pdf-lib.js.org/assets/ubuntu/Ubuntu-R.ttf' par votre URL)
      const fontUrl = 'https://pdf-lib.js.org/assets/ubuntu/Ubuntu-R.ttf';
      const fontBytes = await fetch(fontUrl).then((res) => res.arrayBuffer());

      const customFont = await pdfDoc.embedFont(fontBytes);

      // Paramètres pour le texte
      const fontSize = 12;

      // Configuration des marges et du retrait
      const margin = 50;
      const indent = 20;

      // Ajouter le texte à la page avec la mise en forme
      page.drawText(transcription.text, {
        font: customFont,
        fontSize,
        color: rgb(0, 0, 0), // Couleur du texte en noir
        x: margin,
        y: page.getHeight() - margin,
        maxWidth: page.getWidth() - 2 * margin,
        lineHeight: fontSize * 2, // Espacement des lignes
        indent: indent,
      });

      // Enregistrer le fichier PDF
      const pdfBytes = await pdfDoc.save();
      const pdfFileName = `./temps_docs/transcription.pdf`;
      await fs.promises.writeFile(pdfFileName, pdfBytes);
      console.log('Fichier PDF créé avec succès:', pdfFileName);

      return pdfFileName;

      // renvoyer le fichier pdfFileName à l'utilisateur WhatsApp
      await client.sendMessage(msg.from, pdfFileName, { sendMediaAsDocument: true });
      console.log('Fichier PDF envoyé à WhatsApp avec succès.');
      
    } else {
      console.error('La transcription n\'a pas réussi. Réponse de l\'API:', transcription);
      throw new Error('La transcription n\'a pas réussi.');
    }
  } catch (error) {
    console.error('Erreur lors de la transcription audio:', error);
    throw error;
  }
}

module.exports = { transcrireAudio };
