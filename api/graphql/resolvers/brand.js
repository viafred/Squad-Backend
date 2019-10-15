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

module.exports = {
    getBrands,
    getBrandsAndCategories
}