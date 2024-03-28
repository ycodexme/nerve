// index.js
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

// Importez les fichiers pour les différentes fonctionnalités
const successfulPaymentRoutes = require('./successful_payment');
const failedPaymentRoutes = require('./failed_payment');
const paymentNotificationRoutes = require('./payment_notification');

// Utilisez les routes dans l'application
app.use('/successful-payment', successfulPaymentRoutes);
app.use('/failed-payment', failedPaymentRoutes);
app.use('/payment-notification', paymentNotificationRoutes);

// Route principale
app.get('/', (req, res) => {
  res.send('Bienvenue sur le serveur Heroku. Utilisez les endpoints spécifiques pour gérer les redirections et les notifications de paiement.');
});

// Écoute du serveur sur le port spécifié
app.listen(port, () => {
  console.log(`Serveur en cours d'écoute sur le port ${port}`);
});
