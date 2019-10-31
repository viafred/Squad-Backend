
const firebaseAdmin = require('firebase-admin');
const database = firebaseAdmin.firestore();

const users = (root, args, context, info) => {
    return new Promise((resolve, reject) => {
        let collection = database.collection('users').get();

        collection.then( collection => {
                let users = [];
                if (collection.empty) {
                    resolve([]);
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


const getSpotlightMembers = async (root, args, context, info) => {
    let collection = await database.collection('uploads')
        .where("likes", ">=", 0)
        .orderBy("likes", "desc")
        .orderBy("createdAt", "desc")
        .limit(4)
        .get();

    if (collection.empty) {
        return [];
    }

    let uploads = [];
    for ( let upload of collection.docs ){
        let data = upload.data();
        data.id = upload.id;

        let brand = await database.doc(`brands/${data.brand.id}`).get();
        let category = await database.doc(`categories/${data.category.id}`).get();
        let member = await database.doc(`users/${data.member.id}`).get();

        data.brand = brand.data();
        data.brand.id = brand.id;

        data.category = category.data();
        data.category.id = category.id;

        data.member = member.data();
        data.member.id = member.id;

        uploads.push(data);

    }

    return uploads;
}

const updateUser =  (parent, args) => {
    return new Promise(async (resolve, reject) => {

        let userInput = JSON.parse(JSON.stringify(args.user));
        if ( userInput.dob ){
            userInput.dob = new Date(userInput.dob);
        }
        userInput.updatedAt = new Date();

        let user = database.collection('users').doc(args.id).set(userInput, {merge: true});
        user = database.collection('users').doc(args.id).get();
        user.then(doc => {
            if (!doc.exists) {
                reject('User does not exists');
            } else {
                let data = doc.data();
                data.id = doc.id;
                resolve(data)
            }
        }).catch(err => {
            reject(err);
        });
    });
}


module.exports = {
    queries: {
        users,
        user,
        getSpotlightMembers
    },
    mutations: {
        updateUser
    }
}