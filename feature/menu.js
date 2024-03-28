// menu.js

const menu = `
*Menu principal:*

*!ping:* Vérifier si Clever est actif.

* *Clever Assistant:*
  * Commencez une conversation en tapant ce que vous voulez.
  * Obtenez des réponses informatives à vos questions et à vos invites.

* *Clever Imagine:*
  * !imagine [description de l'image] : Génère une image à partir de votre description.

* *Clever Vision:*
  * !vision [image] : Décrire le contenu d'une image.

* *Clever Transcribe:*
  * !transcribe [fichier audio] : Transcrire un fichier audio en texte.

* *Clever Speak:*
  * !speech [texte] : Convertit le texte en parole.

* *Clever Edit:*
  * !edit/[couleur] : Appliquer des effets d'édition de l'arrière-plan de votre image (par exemple, !edit/white, !edit/blue).

* *Clever Convert:*
  * !pdf [fichier PDF] : Convertissez un PDF en Word en envoyant un fichier PDF à Clever avec le tag !pdf.
  * !excel [fichier CSV] : Convertissez un CSV en Excel.
  * !docs [fichier PDF] : Stocker un PDF pour référence future et pour le chat.
  * !dchat [question] : Chat avec Clever sur la base d'un PDF précédemment stocké.

* *Restauration Clever:*
  * !restore [image] : Envoyez une image à clever avec message simple que !restore

* *Clever Download:*
  * !MP4 [lien YouTube] : Téléchargez des vidéos YouTube.
  * !MP3 [lien YouTube] : Téléchargez des audios YouTube.

*Fonctionnalités supplémentaires:*

* *Discuter en message vocal avec Clever, il suffit d'envoyer une note vocale. Assurez-vous que votre note vocale soit claire.*

* *Gestion des abonnements:*
  * #00 : Accédez aux options d'abonnement et gérez votre plan.
`;

module.exports = menu;
