const firebaseAdmin = require('firebase-admin');
const database = firebaseAdmin.firestore();

const users = (root, args, context, info) => {
    return new Promise((resolve, reject) => {
        let collection = database.collection('users').get();

        collection.then( collection => {
                let users = [];
                if (collection.empty) {
                    reject('No matching documents.');
                }

                collection.forEach( doc => {
                    let data = doc.data();
                    data.id = doc.id;
                    users.push(data);
                });

                resolve(users)
            })
            .catch(err => {
                reject(err);
            });
    });
}

const user = (root, { id }, context, info) => {
    return new Promise((resolve, reject) => {
        let user = database.collection('users').doc(id).get();
        user.then(doc => {
                if (!doc.exists) {
                    reject('User does not exists');
                } else {
                    let data = doc.data();
                    data.id = doc.id;
                    resolve(data)
                }
            })
            .catch(err => {
                reject(err);
            });
    });
}


module.exports = {
    users: users,
    user: user
}