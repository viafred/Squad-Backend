const { dbClient, dbName } = require('../../config/mongo');
const ObjectId = require('mongodb').ObjectId;

const categoryResolvers = require('../resolvers/category')

const getBrands = async (root, args, context, info) => {
    const brandsRef = dbClient.db(dbName).collection("brands");
    const brands = await brandsRef.find({}).toArray();

    return brands;
}

const getBrandsAndCategories =  async (root, args, context, info) => {
    const brands = await getBrands(root, args, context, info);
    const categories = await categoryResolvers.getCategories();

    return {
        brands,
        categories
    }
}

const getSubscribedBrands =  async (root, args, context, info) => {
    const brandSubscriptions = await dbClient.db(dbName).collection("brand_subscriptions").aggregate([
        {
            $lookup:{
                from: 'customers',
                localField: 'brandId',
                foreignField: 'brandId',
                as: 'customer'
            },
        },
        { $match : { userId : new ObjectId(args.userId) } }
        ]).toArray();


    if ( brandSubscriptions.length > 0 ){
        for ( let brand of brandSubscriptions ){
            brand.banner = brand.customer[0].companyBanner;
            brand.logo = brand.customer[0].companyLogo;
        }
    }

    return brandSubscriptions;
}


/* MUTATIONS */
const subscribeToBrand =  async (parent, args) => {

    await dbClient.db(dbName).collection('brand_subscriptions').insertOne(
        {userId: new ObjectId(args.userId), brandId: new ObjectId(args.id)}
        );

    return true;
}

module.exports = {
    queries: {
        getBrands,
        getBrandsAndCategories,
        getSubscribedBrands
    },
    mutations: {
        subscribeToBrand
    }
}