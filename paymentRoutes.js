// paymentRoutes.js (sur Glitch)
// paymentRoutes.js (sur Glitch)
const express = require('express');
const router = express.Router();

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

router.post('/callback', async (req, res) => {
    try {
        const paymentData = req.body; // Supposons que les données de paiement sont envoyées dans le corps de la requête POST

        // Enregistrer les détails du paiement dans votre base de données avec Prisma
        await prisma.payment.create({ data: paymentData });

        // Mise à jour de l'abonnement de l'utilisateur si le paiement est réussi
        if (paymentData.status === 'success') {
            const userPhoneNumber = paymentData.phoneNumber; // Remplacez par la clé correcte dans paymentData

            // Mettez à jour l'abonnement de l'utilisateur (exemple)
            const subscriptionType = 'payant';
            const remainingQuestions = subscriptionType === 'payant' ? 'unlimited' : 100;
            const unlimitedAccessExpiry = subscriptionType === 'payant' ? new Date(new Date().getTime() + 30 * 24 * 60 * 60 * 1000) : null;

            await prisma.subscriptions.upsert({
                where: {
                    phone_number: userPhoneNumber,
                },
                update: {
                    subscription_type: subscriptionType,
                    remaining_questions: remainingQuestions,
                    unlimited_access_expiry: unlimitedAccessExpiry,
                },
                create: {
                    phone_number: userPhoneNumber,
                    subscription_type: subscriptionType,
                    remaining_questions: remainingQuestions,
                    unlimited_access_expiry: unlimitedAccessExpiry,
                },
            });

            // Notifiez l'utilisateur du changement d'abonnement
            const subscriptionMessage = subscriptionType === 'payant'
                ? "Félicitations ! Votre plan est désormais payant. Vous avez accès à plus de fonctionnalités. Merci pour votre paiement."
                : "Merci pour votre abonnement gratuit. Vous avez actuellement 100 demandes restantes.";

            // Utilisez la méthode appropriée pour envoyer un message à l'utilisateur (ex : WhatsApp)
        }

        res.status(200).send('Callback reçu avec succès.');
    } catch (error) {
        console.error('Erreur lors de la gestion du callback :', error);
        res.status(500).send('Erreur lors du traitement du callback.');
    }
});





router.get('/success', async (req, res) => {
    try {
        const paymentId = req.query.paymentId; // Supposons que l'identifiant de paiement est envoyé en tant que paramètre dans l'URL

        // Marquer le paiement comme réussi dans votre base de données avec Prisma
        await prisma.payment.update({ where: { id: paymentId }, data: { status: 'success' } });

        res.send('Paiement réussi!');
    } catch (error) {
        console.error('Erreur lors du traitement du paiement réussi :', error);
        res.status(500).send('Erreur lors du traitement du paiement réussi.');
    }
});

router.get('/failure', async (req, res) => {
    try {
        const paymentId = req.query.paymentId;
        const errorCode = req.query.errorCode;

        await prisma.payment.update({ where: { id: paymentId }, data: { status: 'failure', errorCode: errorCode } });

        const userPhoneNumber = /* Récupérer le numéro de téléphone associé au paiement échoué depuis la base de données */ '';


        const failureMessage = "Votre paiement a échoué. Veuillez réessayer ou contacter le support.";

        // Utiliser la méthode appropriée pour envoyer un message à l'utilisateur (ex : WhatsApp)
        // Exemple fictif :
        await sendWhatsAppMessage(userPhoneNumber, failureMessage);

        res.send('Paiement échoué!');
    } catch (error) {
        console.error('Erreur lors du traitement du paiement échoué :', error);
        res.status(500).send('Erreur lors du traitement du paiement échoué.');
    }
});


module.exports = router;
