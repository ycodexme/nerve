const axios = require('axios');

const paymentData = {
  service: "C4lG89s7UyMLNSomUEOtCBslcERuOOVH",
  phonenumber: "+243819649316",
  amount: "300", // Assurez-vous de remplacer "AMOUNT_TO_BE_PAID" par le montant réel à payer
  currency: "CDF",
  notify_url: "https://your.server.com/monetbil/notifications",
};

// Utilisez axios pour effectuer la requête POST
axios.post("https://api.monetbil.com/payment/v1/placePayment", paymentData)
  .then(response => {
    // Gérez la réponse ici
    console.log("Réponse de l'API Monetbil :", response.data);
  })
  .catch(error => {
    // Gérez les erreurs ici
    console.error("Erreur lors de la requête à l'API Monetbil :", error);
  });
