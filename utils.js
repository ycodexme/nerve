function generateUniqueId() {
    // Implémentez votre logique pour générer un identifiant unique ici
    // Par exemple, vous pouvez utiliser un package comme uuid
    const { v4: uuidv4 } = require('uuid');
    return uuidv4();
}

function chunkArray(array, chunkSize) {
    // Implémentez votre logique pour diviser le tableau en morceaux ici
    // Par exemple, utilisez la méthode slice pour obtenir des morceaux de la taille spécifiée
    const result = [];
    for (let i = 0; i < array.length; i += chunkSize) {
        result.push(array.slice(i, i + chunkSize));
    }
    return result;
}

module.exports = { generateUniqueId, chunkArray };
