const algoliasearch = require('algoliasearch');
const firebaseAdmin = require('firebase-admin');
const database = firebaseAdmin.firestore();

const client = algoliasearch('2M731BETMO', '237132a7980c930cb0ae32641d2aa5b2');
const index = client.initIndex(process.env.ALGOLIA_UPLOADS_INDEX);

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

const getBrandUploads =  async (root, args, context, info) => {
    if ( !args.brandId ){
        return []
    }

    const brandRef = database.collection('brands').doc(args.brandId);

    const customerRef = await database.collection('customers').where('brand', '==', brandRef).get();
    let companyBanner = null;
    let companyLogo = null;
    if ( customerRef.docs.length > 0 ){
        let customer = customerRef.docs[0].data();
        companyBanner = customer.companyBanner;
        companyLogo = customer.companyLogo;
    }
    let brand = await brandRef.get();
    brand = brand.data();
    brand.id = brandRef.id;
    brand.banner = companyBanner;
    brand.logo = companyLogo;

    const brandSubscriptionsRef = database.collection('users').doc(args.userId).collection('brandSubscriptions').where('brand', '==', brandRef);
    const brandSubscriptions = await brandSubscriptionsRef.get();
    let isSubscribed = brandSubscriptions && brandSubscriptions.docs.length == 1 ? true : false;

    const collection = await database.collection('uploads').where('brand', '==', brandRef).get();

    let uploads = [];
    for (const doc of collection.docs) {
        let data = doc.data();
        data.id = doc.id;

        let brandRef = await database.collection('brands').doc(data.brand.id).get();
        data.brand = brandRef.data();
        data.brand.id = brandRef.id;

        let categoryRef = await database.collection('categories').doc(data.category.id).get();
        data.category = categoryRef.data();
        data.category.id = categoryRef.id;

        let member = await database.doc(`users/${data.member.id}`).get();
        data.member = member.data();
        data.member.id = member.id;

        const userLikes = await database.collection('uploads').doc(doc.id).collection('userLikes').get();

        let userLikesList = [];
        for (const likeDoc of userLikes.docs) {
            let likeData = likeDoc.data();
            likeData.id = likeDoc.id;

            userLikesList.push(likeData);
        }

        data.userLikes = userLikesList;

        uploads.push(data);
    }

    let returnData = {};
    returnData.isSubscribed = isSubscribed;
    returnData.brand = brand;
    returnData.uploads = uploads;

    return returnData;

}

const algoliaUploadsSearch = (root, args, context, info) => {
    return new Promise((resolve, reject) => {
        index.search({ query: args.searchParam },
            (err, { hits } = {}) => {
                if (err) reject(err);

                let results = [];
                for ( let doc of hits ){
                    let result = {
                        id: doc.uploadId,
                        ...doc,
                        brand: {name: doc.brand},
                        category: {name: doc.category}
                    }

                    results.push(result);
                }

                resolve(results);
            }
        );
    });
}

/* MUTATIONS */

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

        if (args.uploadPhoto.category.id){
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

const likeUploadedPhoto =  (parent, args) => {
    return new Promise(async (resolve, reject) => {

        try {
            let userRef = database.doc(`users/${args.userId}`);

            const userLikesRef = database.collection('uploads').doc(args.id).collection('userLikes').where('member', '==', userRef);
            const userLikes = await userLikesRef.get();
            if ( userLikes.docs.length == 1 ){
                let userLike = userLikes.docs[0];
                let userLikeData = userLike.data();
                userLikeData.like = !userLikeData.like;
                database.collection('uploads').doc(args.id).collection('userLikes').doc(userLike.id).set(userLikeData, {merge: true});
            } else {
                await database.collection('uploads').doc(args.id).collection('userLikes').add({like: true, member: userRef});
            }

            resolve(true);
        } catch (e) {
            reject(e)
        }
    })
}



module.exports = {
    queries: {
        getUploadedPhotos,
        getUserUploads,
        getBrandUploads,
        algoliaUploadsSearch
    },
    mutations: {
        addUploadedPhoto,
        likeUploadedPhoto,

    }
}