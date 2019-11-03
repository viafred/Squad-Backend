const categoryResolvers = require('../resolvers/category')

const firebaseAdmin = require('firebase-admin');
const database = firebaseAdmin.firestore();

const getBrands = (root, args, context, info) => {
    return new Promise((resolve, reject) => {
        let collection = database.collection('brands').get();

        collection.then( collection => {
            let brands = [];
            if (collection.empty) {
                resolve([]);
            }

            collection.forEach( doc => {
                let data = doc.data();
                data.id = doc.id;
                brands.push(data);
            });

            resolve(brands)
        }).catch(err => {
                reject(err);
            });
    });
}

const getBrandsAndCategories =  async (root, args, context, info) => {
    const brands = await getBrands(root, args, context, info);
    const categories = await categoryResolvers.getCategories();

    return {
        brands,
        categories
    }
}

const subscribeToBrand =  (parent, args) => {
    return new Promise(async (resolve, reject) => {
        try {
            let brandRef = database.doc(`brands/${args.id}`);

            const brandSubscriptionsRef = database.collection('users').doc(args.userId).collection('brandSubscriptions').where('brand', '==', brandRef);
            const brandSubscriptions = await brandSubscriptionsRef.get();
            if ( brandSubscriptions.docs.length == 1 ){
                let brandSubscription = brandSubscriptions.docs[0];
                database.collection('users').doc(args.userId).collection('brandSubscriptions').doc(brandSubscription.id).delete();
            } else {
                await database.collection('users').doc(args.userId).collection('brandSubscriptions').add({brand: brandRef});
            }

            resolve(true);
        } catch (e) {
            reject(e)
        }
    })
}

module.exports = {
    queries: {
        getBrands,
        getBrandsAndCategories
    },
    mutations: {
        subscribeToBrand
    }
}