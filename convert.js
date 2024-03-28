client.on('message', async (msg) => {
    try {
        const { body, from, type } = msg;
        const text = body.toLowerCase();

        // Log des messages des utilisateurs
        console.log(`Message reçu de ${from}: ${body}`);

        if (msg.type === 'chat') {
            if (!text.startsWith('#') && !text.startsWith('!')) {
                // Répondre uniquement aux messages qui ne commencent pas par '#' ou '!chatgpt.js'
                
                if (text.startsWith('!swap')) {
                    // Log pour indiquer le début du traitement de la commande !swap
                    console.log(`Traitement de la commande !swap pour l'utilisateur ${from}`);

                    // Envoi d'un message pour indiquer que le traitement est en cours
                    await client.sendMessage(msg.from, 'Veillez patienter, Clever Imagine travaille dur pour vous...');

                    // Téléchargement de l'image envoyée par l'utilisateur
                    const imageData = await msg.downloadMedia();
                    if (imageData.mimetype.includes('image')) {
                        // Log pour indiquer que l'image a été correctement téléchargée
                        console.log(`Image téléchargée avec succès pour l'utilisateur ${from}`);

                        // Appel à la fonction pour modifier l'image
                        const modifiedImageBuffer = await convertImageToURI(imageData);

                        // Log pour indiquer que l'image a été correctement modifiée
                        console.log(`Image modifiée avec succès pour l'utilisateur ${from}`);

                        // Enregistrement de l'image localement
                        const imagePath = path.resolve('./image.jpg');
                        fs.writeFileSync(imagePath, modifiedImageBuffer);
                        
                        // Envoyer l'image modifiée à l'utilisateur
                        const media = MessageMedia.fromFilePath(imagePath);
                        await client.sendMessage(msg.from, media, { sendMediaAsDocument: true });
                        await client.sendMessage(msg.from, 'Voici votre image modifiée !');
                    } else {
                        // Log si le média n'est pas une image
                        console.error('Le média reçu n\'est pas une image.');
                    console.error('Le média reçu n\'est pas une image.');
 }
                } else if (text.startsWith('!restore')) {
                    await client.sendMessage(msg.from, 'Veillez patienter, Clever Imagine travaille dur pour vous...');
                    const imageData = await msg.downloadMedia();
                    if (imageData.mimetype.includes('image')) {
                        const modifiedImageBuffer = await convertImageToUR(imageData);
                        // Utilisation de l'image restaurée
                    } else {
                        console.error('Le média reçu n\'est pas une image.');
                    }
                } else {
                    // Vérification de l'utilisateur dans la base de données
                    let user = await prisma.user.findUnique({
                        where: {
                            phoneNumber: from,
                        },
                    });

                    // Si l'utilisateur n'existe pas dans la base de données, l'ajouter
                    if (!user) {
                        user = await prisma.user.create({
                            data: {
                                phoneNumber: from,
                                subscriptionType: 'free', // Définir le type d'abonnement initial
                                remainingRequests: 100, // Définir le nombre initial de requêtes disponibles
                            },
                        });
                    }

                    // Si l'utilisateur a des requêtes gratuites disponibles
                    if (user && user.remainingRequests > 0) {
                        // Décrémenter le compteur de requêtes gratuites dans la base de données
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

                        // Utilisation de l'API pour générer une réponse en fonction du message de l'utilisateur
                        const response = await generatePersonalityResponse(text, from);
                        console.log('Réponse de l\'API GPT-3.5 Turbo:', response);

                        // Envoyer la réponse à l'utilisateur
                        await client.sendMessage(from, response);
                    } else {
                        // L'utilisateur a épuisé son crédit gratuit
                        if (text === '#00') {
                            // Rediriger vers le menu
                            await handleMenuInput(text, from, prisma, client);
                        } else {
                            const exhaustedCreditMessage = "Vous avez épuisé votre crédit pour la version gratuite. Veuillez vous abonner à la version payante qui est illimitée. Envoyer #00 pour accéder au menu.";
                            await client.sendMessage(from, exhaustedCreditMessage);
                        }
                    }
                }
            }
        }
    } catch (error) {
        console.error('Erreur lors du traitement du message :', error);
    }
});