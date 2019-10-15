const firebaseAdmin = require('firebase-admin');
const database = firebaseAdmin.firestore();

const getCategories = (root, args, context, info) => {
    return new Promise((resolve, reject) => {
        let collection = database.collection('categories').get();

        collection.then( collection => {
            let categories = [];
            if (collection.empty) {
                resolve([]);
            }

            collection.forEach( doc => {
                let data = doc.data();
                data.id = doc.id;
                categories.push(data);
            });

            resolve(categories)
        }).catch(err => {
            reject(err);
        });
    });
}


module.exports = {
    getCategories
}