const { dbClient, dbName } = require('../../config/mongo');
const ObjectId = require('mongodb').ObjectId;

var _ = require('lodash');

const getProducts = async (root, args, context, info) => {
    const productRef = dbClient.db(dbName).collection("products");
    let products = [];
    if ( args.productIds ){
        let productIds = [];
        for ( let productId of args.productIds ){
            productIds.push(new ObjectId(productId));
        }

        products = await productRef.find({ _id: { $in: productIds } } ).toArray();
    } else {
        products = await productRef.find({}).toArray();
    }


    return products;
}

/* MUTATIONS */
const addProduct =  async (parent, args) => {
    try {
        let photo = {
            brandId: null,
            categoryId: null,
            memberId: new ObjectId(args.uploadPhoto.userId),
            productName: args.uploadPhoto.productName,
            productUrl: args.uploadPhoto.productUrl,
            brandName: args.uploadPhoto.brand.name,
            categoryName: args.uploadPhoto.category.name,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        //Brands
        let brands = await dbClient.db(dbName).collection('brands').aggregate(
            [
                {
                    $project:
                        {
                            name: { $toLower: "$name" },
                        }
                },
                { $match : { name : args.uploadPhoto.brand.name.toLowerCase() } }
            ]
        ).toArray();

        if (brands.length > 0){
            photo.brandId = new ObjectId(brands[0]._id);
            await dbClient.db(dbName).collection('brands').updateOne(
                { _id: new ObjectId(brands[0]._id) },
                {
                    $set: {verified: false, name: args.uploadPhoto.brand.name},
                    $currentDate: { updatedAt: true }
                }
            );
        } else {
            let brand = await dbClient.db(dbName).collection('brands').insertOne(
                { name: args.uploadPhoto.brand.name, verified: false, createdAt: new Date(), updatedAt: new Date() });
            photo.brandId = brand.insertedId;
        }

        //Categories
        let categories = await dbClient.db(dbName).collection('categories').aggregate(
            [
                {
                    $project:
                        {
                            name: { $toLower: "$name" },
                        }
                },
                { $match : { name : args.uploadPhoto.category.name.toLowerCase() } }
            ]
        ).toArray();

        if (categories.length > 0){
            photo.categoryId = new ObjectId(categories[0]._id);
            await dbClient.db(dbName).collection('categories').updateOne(
                { _id: new ObjectId(categories[0]._id) },
                {
                    $set: {verified: false, name: args.uploadPhoto.category.name},
                    $currentDate: { updatedAt: true }
                }
            );
        } else {
            let category = await dbClient.db(dbName).collection('categories').insertOne(
                {name: args.uploadPhoto.category.name, verified: false, createdAt: new Date(), updatedAt: new Date()} );
            photo.categoryId = category.insertedId;
        }

        let upload = await dbClient.db(dbName).collection('uploads').insertOne(photo);

        return upload.insertedId.toString();
    } catch (e) {
        return e;
    }
}

module.exports = {
    queries: {
        getProducts,
    },
    mutations: {
        addProduct,
    }
}