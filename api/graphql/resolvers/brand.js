const { dbClient, dbName } = require('../../config/mongo');
const ObjectId = require('mongodb').ObjectId;

const categoryResolvers = require('../resolvers/category')
const productResolvers = require('../resolvers/product')

const getBrands = async (root, args, context, info) => {
    const brandsRef = dbClient.db(dbName).collection("customer_brands");
    let find = {}
    if ( args.brandIds ){
        let brandIds = [];
        for ( let brandId of args.brandIds ){
            brandIds.push(new ObjectId(brandId));
        }

        find = { brandId: { $in: brandIds }, 'brands.verified': true, 'customer.companyLogo': {$ne: null}, 'customer.companyBanner': {$ne: null} };
    } else {
        find =  { 'brands.verified': true, 'customer.companyLogo': {$ne: null}, 'customer.companyBanner': {$ne: null}  } ;
    }

    const brands = await brandsRef.aggregate([
        {
            $lookup:{
                from: 'customers',
                localField: 'customerId',
                foreignField: '_id',
                as: 'customer'
            },
        },
        {
            $lookup:{
                from: 'brands',
                localField: 'brandId',
                foreignField: '_id',
                as: 'brands'
            },
        },
        { $match :  find }
    ]).toArray();

    if ( brands.length > 0 ){
        for ( let brand of brands ){
            brand._id = brand.brandId;
            brand.banner = brand.customer && brand.customer.length > 0 ? brand.customer[0].companyBanner : '';
            brand.logo = brand.customer && brand.customer.length > 0 ? brand.customer[0].companyLogo : '';
        }
    }

    return brands;
}

const getCustomerBrands =  async (root, args, context, info) => {
    let find = {};
    let brands = [];

    if ( args.brandIds ){
        let brandIds = [];
        for ( let brandId of args.brandIds ){
            brandIds.push(new ObjectId(brandId));
        }

        find = { _id: { $in: brandIds } };
    }

    if ( args.customerId ){
        find.customerId =  new ObjectId(args.customerId);
    }

    const brandsRef = dbClient.db(dbName).collection("customer_brands").aggregate([
        {
            $lookup:{
                from: 'brands',
                localField: 'brandId',
                foreignField: '_id',
                as: 'brands'
            },
        },
        { $match : find }
    ]);

    brands = await brandsRef.toArray();
    for ( let brand of brands ){
        brand.name = brand.brands[0].name;
        brand._id = brand.brandId;
    }

    return brands;
}

const getBrandsAndCategories =  async (root, args, context, info) => {
    const brands = await getBrands(root, args, context, info);
    const categories = await categoryResolvers.getCategories(root, args, context, info);

    return {
        brands,
        categories
    }
}

const getBrandsAndProducts =  async (root, args, context, info) => {
    const brands = await getBrands(root, args, context, info);
    const products = await productResolvers.queries.getProducts(root, args, context, info);

    return {
        brands,
        products
    }
}

const getSubscribedBrands =  async (root, args, context, info) => {
    const brandSubscriptions = await dbClient.db(dbName).collection("brand_subscriptions").aggregate([
        {
            $lookup:{
                from: 'customer_brands',
                localField: 'brandId',
                foreignField: 'brandId',
                as: 'cb'
            },
        },
        {
            $lookup:{
                from: 'customers',
                localField: 'cb.customerId',
                foreignField: '_id',
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
        getBrandsAndProducts,
        getSubscribedBrands,
        getCustomerBrands
    },
    mutations: {
        subscribeToBrand
    }
}