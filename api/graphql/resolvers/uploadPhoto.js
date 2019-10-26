const firebaseAdmin = require('firebase-admin');
const database = firebaseAdmin.firestore();

const getUploadedPhotos = (root, args, context, info) => {
    return new Promise((resolve, reject) => {
        let collection = database.collection('uploads').get();

        collection.then( collection => {
            let uploads = [];
            if (collection.empty) {
                reject('No matching documents.');
            }

            collection.forEach( doc => {
                let data = doc.data();
                data.id = doc.id;
                uploads.push(data);
            });

            resolve(uploads)
        }).catch(err => {
                reject(err);
            });
    });
}

const getUserUploads =  async (root, args, context, info) => {
    const userRef = database.collection('users').doc(args.userId);
    const collection = await database.collection('uploads').where('member', '==', userRef).get();

    let uploads = [];
    for (const doc of collection.docs) {
        let data = doc.data();
        data.id = doc.id;

        let brandRef = await database.collection('brands').doc(data.brand.id).get();
        data.brand = brandRef.data();
        data.brand.id = data.brand.id;

        let categoryRef = await database.collection('categories').doc(data.category.id).get();
        data.category = categoryRef.data();
        data.category.id = data.category.id;

        uploads.push(data);
    }

    return uploads;
}

const addUploadedPhoto =  (parent, args) => {
    return new Promise(async (resolve, reject) => {
        let userRef = database.doc(`users/${args.uploadPhoto.userId}`);

        let brandRef = null;
        let categoryRef = null;
        let createdAt = new Date();
        let updatedAt = new Date();

        if (args.uploadPhoto.brand.id){
            brandRef = database.doc(`brands/${args.uploadPhoto.brand.id}`);
        } else {
            brandRef = await database.collection('brands').add({name: args.uploadPhoto.brand.name, verified: false});
        }

        if (args.uploadPhoto.brand.id){
            categoryRef = database.doc(`categories/${args.uploadPhoto.category.id}`);
        } else {
            categoryRef = await database.collection('categories').add({name: args.uploadPhoto.category.name, verified: false});
        }

        const photo = {
            brand: brandRef,
            category: categoryRef,
            member: userRef,
            productName: args.uploadPhoto.productName,
            productUrl: args.uploadPhoto.productUrl,
            likes: 0,
            createdAt: createdAt,
            updatedAt: updatedAt
        };

        let uploadPhoto = database.collection('uploads').add(photo).then(async ref => {
            const userSnapshot =  await userRef.get();
            const userData = userSnapshot.data();

            userRef.set({...userData, hasUploads: true });

            resolve(args.uploadPhoto)
        }).catch(err => {
            reject(err);
        });
    });
}

module.exports = {
    queries: {
        getUploadedPhotos,
        getUserUploads
    },
    mutations: {
        addUploadedPhoto
    }
}