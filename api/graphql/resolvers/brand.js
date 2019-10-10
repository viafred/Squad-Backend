const firebaseAdmin = require('firebase-admin');
const database = firebaseAdmin.firestore();

const brands = (root, args, context, info) => {
    return []
}

module.exports = {
    brands: brands
}