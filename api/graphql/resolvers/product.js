const { dbClient, dbName } = require('../../config/mongo');
const ObjectId = require('mongodb').ObjectId;

var _ = require('lodash');

const getProducts = async (root, args, context, info) => {
    let find = {};
    if ( args.productIds ){
        let productIds = [];
        for ( let productId of args.productIds ){
            productIds.push(new ObjectId(productId));
        }

        find = { _id: { $in: productIds } };
    }

    if ( args.customerId ){
        find.customerId =  new ObjectId(args.customerId);
    }

    const products = await dbClient.db(dbName).collection("products").aggregate([
        {
            $lookup:{
                from: "brands",
                localField : "brandId",
                foreignField : "_id",
                as : "brand",
            }
        },
        {
            $lookup:{
                from: "categories",
                localField : "categoryId",
                foreignField : "_id",
                as : "category"
            }
        },
        { $match : find }
    ]).toArray();

    for ( let product of products ){
        product.brand = product.brand[0];
        product.category = product.category[0];
    }

    return products;
}

const productSearch = async (root, args, context, info) => {
    const products = await dbClient.db(dbName).collection("products").aggregate([
        { $match : { $text : { $search : args.searchParam }, customerId: new ObjectId(args.customerId) }  },
        { $sort: { score: { $meta: "textScore" } } },
        {
            $lookup:{
                from: "brands",
                localField : "brandId",
                foreignField : "_id",
                as : "brand",
            }
        },
        {
            $lookup:{
                from: "categories",
                localField : "categoryId",
                foreignField : "_id",
                as : "category"
            }
        },

    ]).toArray();

    for ( let product of products ){
        product.brand = product.brand[0];
        product.category = product.category[0];
    }

    return products;
}

/* MUTATIONS */
const addProduct =  async (parent, args) => {
    try {
        return saveProduct(parent, args);
    } catch (e) {
        return e;
    }
}

const updateProduct =  async (parent, args) => {
    try {
        return saveProduct(parent, args);
    } catch (e) {
        return e;
    }
}

const saveProduct =  async (parent, args) => {
    try {
        let photo = {
            _id: args.product._id ? new ObjectId(args.product._id) : null,
            brandId: args.product.brand && args.product.brand._id ? new ObjectId(args.product.brand._id): null,
            categoryId: args.product.category && args.product.category._id ? new ObjectId(args.product.category._id) : null,
            customerId: new ObjectId(args.product.customerId),
            productName: args.product.productName,
            productUrl: args.product.productUrl,
            productTags: args.product.productTags,
            brandName: args.product.brand.name,
            categoryName: args.product.category.name,
            createdAt: new Date(),
            updatedAt: new Date()
        };
       
        if ( !photo.brandId ){
            //Brands
            let find = { name : args.product.brand.name.toLowerCase(), customerId: photo.customerId };
            let brand = await dbClient.db(dbName).collection('customer_brands').findOne(find).toArray();

            if (!brand){
                let brand = await dbClient.db(dbName).collection('brands').insertOne({ name: args.product.brand.name, verified: true, createdAt: new Date(), updatedAt: new Date() });
                photo.brandId = brand.insertedId;

                await dbClient.db(dbName).collection('customer_brands').insertOne({ customerId: photo.customerId, brandId: photo.brandId, name: args.product.brand.name.toLowerCase() });
            }
        }

        if ( !photo.categoryId ){
            //Categories
            let find = { name : args.product.category.name.toLowerCase(), customerId: photo.customerId };
            let category = await dbClient.db(dbName).collection('customer_categories').findOne(find);

            if (!category){
                let category = await dbClient.db(dbName).collection('categories').insertOne({name: args.product.category.name, verified: true, createdAt: new Date(), updatedAt: new Date()} );
                photo.categoryId = category.insertedId;

                await dbClient.db(dbName).collection('customer_categories').insertOne({customerId: photo.customerId, categoryId: photo.categoryId, name:  args.product.category.name.toLowerCase() });
            }
        }


        let result = null;
        if ( photo._id ){
            delete photo.updatedAt;
            delete photo.createdAt;
            await dbClient.db(dbName).collection('products').updateOne(
                { _id: photo._id },
                {
                    $set: photo,
                    $currentDate: { updatedAt: true }
                }
            );
            result = photo._id.toString();
        } else {
            let upload = await dbClient.db(dbName).collection('products').insertOne(photo);
            result = upload.insertedId.toString();
        }

        return result;
    } catch (e) {
        return e;
    }
}

const removeProduct =  async (parent, args) => {
    try {
        const response = await dbClient.db(dbName).collection('products').deleteOne({_id: new ObjectId(args.id)});
        return args.id;
    } catch (e) {
        return e;
    }
}

module.exports = {
    queries: {
        getProducts,
        productSearch
    },
    mutations: {
        addProduct,
        updateProduct,
        removeProduct
    }
}