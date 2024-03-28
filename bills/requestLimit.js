async function decrementRemainingQuestions(phoneNumber) {
  try {
      const subscription = await prisma.subscriptions.findUnique({
          where: {
              phone_number: phoneNumber,
          },
      });

      if (subscription) {
          const newRemainingQuestions = subscription.remaining_questions > 0 ? subscription.remaining_questions - 1 : 0;
          await prisma.subscriptions.update({
              where: {
                  phone_number: phoneNumber,
              },
              data: {
                  remaining_questions: newRemainingQuestions,
              },
          });
          return true;
      }
      return false;
  } catch (error) {
      console.error('Erreur lors de la gestion des limites de requêtes :', error);
      return false;
  }
}

module.exports = { decrementRemainingQuestions };