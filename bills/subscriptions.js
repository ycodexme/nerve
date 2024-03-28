async function checkSubscription(phoneNumber) {
  try {
      const subscription = await prisma.subscriptions.findUnique({
          where: { phone_number: phoneNumber }
      });
      return subscription;
  } catch (error) {
      console.error('Erreur lors de la vérification de l\'abonnement :', error);
  }
}

async function updateSubscription(phoneNumber, subscriptionType, remainingQuestions, isUnlimitedAccess) {
  try {
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

      await prisma.subscriptions.upsert({
          where: { phone_number: phoneNumber },
          update: { subscription_type: subscriptionType, remaining_questions: remainingQuestions, unlimited_access_expiry: isUnlimitedAccess ? thirtyDaysFromNow : null },
          create: { phone_number: phoneNumber, subscription_type: subscriptionType, remaining_questions: remainingQuestions, unlimited_access_expiry: isUnlimitedAccess ? thirtyDaysFromNow : null }
      });
  } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'abonnement :', error);
  }
}

module.exports = { checkSubscription, updateSubscription };