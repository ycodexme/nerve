// menu.js

async function handleMenuInput(text, from, prisma, client) {
    if (text === '#00') {
        const menuOptions = `Pour savoir les modes de paiement, envoyez #01.\nPour connaître le prix de l'abonnement et la durée, envoyez #002.`;
        await client.sendMessage(from, menuOptions);
    } else if (text === '#002') {
        const subscriptionDetails = `Le prix de l'abonnement est fixé à 3,99$ pour 30 jours.\nPour revenir au menu principal, envoyez #00.`;
        await client.sendMessage(from, subscriptionDetails);
    } else if (text === '#01') {
        const paymentOptions = `Les types de paiement sont :\n\n1. Paiement par Crypto\n2. Paiement par moyen mobile\nPour payer par Crypto, envoyez #01, et #02 pour moyen mobile.`;
        await client.sendMessage(from, paymentOptions);
    } else if (text === '#02') {
        const cryptoMessage = `Veuillez patienter, nous créons votre facture.`;
        await client.sendMessage(from, cryptoMessage);

        // Code pour la création de la facture pour l'abonnement illimité en crypto
        // (à implémenter)
    } else {
        // Si le texte ne correspond à aucune option du menu
        const defaultMessage = `Option non reconnue. Envoyez #00 pour revenir au menu principal.`;
        await client.sendMessage(from, defaultMessage);
    }
}

module.exports = {
    handleMenuInput
};
