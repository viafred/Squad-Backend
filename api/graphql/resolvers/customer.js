const { dbClient, dbName } = require('../../config/mongo');
const ObjectId = require('mongodb').ObjectId;

const brandResolvers = require('../resolvers/brand');
const categoryResolvers = require('../resolvers/category');
const productResolvers = require('../resolvers/product');

const customers = async (root, args, context, info) => {
    const customersRef = dbClient.db(dbName).collection("customers");
    const customers = await customersRef.find({}).toArray();

    return customers;
}

const getCustomer = async(root, args, context, info) => {
    const customers = await dbClient.db(dbName).collection("customers").aggregate([
        {
            $lookup:{
                from: "brands",
                localField : "brandId",
                foreignField : "_id",
                as : "brand"
            }
        },
        { $match : { _id : new ObjectId(args.id) } }
    ]).limit(1).toArray();


    let customer = customers[0];
    customer.brand = customer.brand[0];

    return customer;
}

const getCustomerCategoriesAndProducts =  async (root, args, context, info) => {
    const categories = await categoryResolvers.getCustomerCategories(root, args, context, info);
    const products = await productResolvers.queries.getProducts(root, args, context, info);

    return {
        categories,
        products
    }
}

const getCustomerBrandsAndCategories =  async (root, args, context, info) => {
    const brands = await brandResolvers.queries.getCustomerBrands(root, args, context, info);
    const categories = await categoryResolvers.getCustomerCategories(root, args, context, info);

    return {
        brands,
        categories
    }
}

const getCustomerBrandsCategoriesProducts =  async (root, args, context, info) => {
    const brands = await brandResolvers.queries.getCustomerBrands(root, args, context, info);
    const categories = await categoryResolvers.getCustomerCategories(root, args, context, info);
    const products = await productResolvers.queries.getProducts(root, args, context, info);

    return {
        brands,
        categories,
        products
    }
}

const getCustomerProducts =  async (root, args, context, info) => {
    let find = {};
    if ( args.productIds ){
        let productIds = [];
        for ( let productId of args.productIds ){
            productIds.push(new ObjectId(productId));
        }

        find = { _id: { $in: productIds } };
    }

    if ( args.brandIds ){
        let brandIds = [];
        for ( let brandId of args.brandIds ){
            brandIds.push(new ObjectId(brandId));
        }

        find = { ...find, brandId: { $in: brandIds } };
    }

    if ( args.categoryIds ){
        let categoryIds = [];
        for ( let categoryId of args.categoryIds ){
            categoryIds.push(new ObjectId(categoryId));
        }

        find = { ...find, categoryId: { $in: categoryIds } };
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

const saveCustomer =  async (parent, args) => {
    let customerInput = JSON.parse(JSON.stringify(args.customer));
    let _id = args.id ? new ObjectId(args.id) : null;

    let brand = await dbClient.db(dbName).collection('brands').aggregate(
        [
            {
                $project:
                    {
                        name: { $toLower: "$name" },
                    }
            },
            { $match : { name : customerInput.companyBrand.toLowerCase() } }
        ]
    ).toArray();

    console.log(brand);

    if (brand.length > 0){
        customerInput.brandId = new ObjectId(brand[0]._id);

        await dbClient.db(dbName).collection('brands').updateOne(
            { _id: new ObjectId(brand[0]._id) },
            {
                $set: {verified: true},
                $currentDate: { updatedAt: true }
            }
        );
    } else {
        brand = await dbClient.db(dbName).collection('brands').insertOne({name: customerInput.companyBrand, verified: true});

        customerInput.brandId = brand.insertedId;
    }


    let customerBrand = await dbClient.db(dbName).collection('customer_brands').findOne({ brandId: customerInput.brandId });
    if ( !customerBrand ){
        await dbClient.db(dbName).collection('customer_brands').insertOne({customerId: _id, brandId: customerInput.brandId, name: customerInput.companyBrand  });
    }

    delete customerInput._id;

    let lastId = _id;
    if ( _id ){

        await dbClient.db(dbName).collection('customers').updateOne(
            { _id: new ObjectId(_id) },
            {
                $set: customerInput,
                $currentDate: { updatedAt: true }
            }
        );
    } else {
        customerInput.status = 'pending';
        let customer = await dbClient.db(dbName).collection('customers').insertOne(customerInput);
        lastId = customer.insertedId.toString();
    }

    return { _id: new ObjectId(lastId) };
}


module.exports = {
    queries: {
        customers,
        getCustomer,
        getCustomerCategoriesAndProducts,
        getCustomerBrandsAndCategories,
        getCustomerBrandsCategoriesProducts,
        getCustomerProducts
    },
    mutations: {
        saveCustomer
    }
}