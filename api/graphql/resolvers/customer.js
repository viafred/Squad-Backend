const { dbClient, dbName } = require('../../config/mongo');
const ObjectId = require('mongodb').ObjectId;

const brandResolvers = require('../resolvers/brand');
const categoryResolvers = require('../resolvers/category');
const productResolvers = require('../resolvers/product');

const { Stitch, UserPasswordAuthProviderClient, UserPasswordCredential } = require('mongodb-stitch-server-sdk');
const stitchClient = Stitch.initializeDefaultAppClient('squad-rpgkc');
const emailPasswordClient = stitchClient.auth.getProviderClient(UserPasswordAuthProviderClient.factory);

const customers = async (root, args, context, info) => {
    const customersRef = dbClient.db(dbName).collection("customers");
    const customers = await customersRef.find({}).toArray();

    return customers;
}

const getPendingCustomers = async(root, args, context, info) => {
    const customers = await dbClient.db(dbName).collection("customers").aggregate([
        {
            $lookup:{
                from: "brands",
                localField : "brandId",
                foreignField : "_id",
                as : "brand"
            }
        },
        { $match : {$or: [{status: "pending"}, {status: "provisioned"}]}}
    ]).toArray();


    for ( let customer of customers ){
        customer.brand = customer.brand[0];
    }

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

    if ( customers.length > 0 ){
        let customer = customers[0];
        customer.brand = customer.brand[0];

        return customer;
    }

    return {}
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

const getGroups = async (customerId) => {
    const customerGroups = await dbClient.db(dbName).collection("customer_groups").aggregate([
        {
            $lookup:{
                from: "uploads",
                localField : "uploadIds",
                foreignField : "_id",
                as : "uploads"
            }
        },
        { $match : { customerId : new ObjectId(customerId) } }
    ]).toArray();

    return customerGroups
}

const getCustomerGroups = async (root, args, context, info) => {
    return getGroups(args.customerId)
}

const getCustomerFeedbacks = async (root, args, context, info) => {
    let customerFeedbacks = await dbClient.db(dbName).collection("customer_feedbacks").aggregate([
        {
            $lookup:{
                from: "customer_groups",
                localField : "groupId",
                foreignField : "_id",
                as : "group"
            }
        },
        { $match : { customerId : new ObjectId(args.customerId) } }
    ]).toArray();

    customerFeedbacks = customerFeedbacks.map(f => ({...f, group: f.group[0]}))
    return customerFeedbacks
}

const saveCustomer =  async (parent, args) => {
    try {
        let customerInput = JSON.parse(JSON.stringify(args.customer));
        let _id = args.id ? new ObjectId(args.id) : null;

        let match = {}
        if ( !customerInput.brandId ){
            match = { name : customerInput.companyBrand.toLowerCase() }
        } else {
            match = { _id : new ObjectId(customerInput.brandId) }
        }

        let brand = await dbClient.db(dbName).collection('brands').aggregate(
            [
                {
                    $project:
                        {
                            name: { $toLower: "$name" },
                        }
                },
                { $match : match }
            ]
        ).toArray();

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
            brand = await dbClient.db(dbName).collection('brands').insertOne({name: customerInput.companyBrand, verified: false});
            customerInput.brandId = brand.insertedId;
        }

        delete customerInput._id;

        //Now if NO userId, we need to create one so the customer can login
        if ( !customerInput.userId ){
            await emailPasswordClient.registerWithEmail(customerInput.username, customerInput.password)
            const credential = new UserPasswordCredential(customerInput.username, customerInput.password)
            await stitchClient.auth.loginWithCredential(credential)
            const userAuth = stitchClient.auth.user;

            const createdAt = new Date();
            const updatedAt = new Date();

            const data = {
                displayName: customerInput.companyName,
                stitchId: userAuth.id,
                email: customerInput.email,
                firstName: customerInput.firstName,
                lastName: customerInput.firstName,
                name: customerInput.title,
                createdAt,
                updatedAt,
                role: 'customer',
            };

            let userRef = await dbClient.db(dbName).collection('users').insertOne(data);
            user = await dbClient.db(dbName).collection('users').findOne({_id: userRef.insertedId});

            customerInput.userId = new Object(user._id);

            stitchClient.auth.logoutUserWithId(userAuth.id);
        }

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
            customerInput.status = customerInput.status ? customerInput.status : 'pending'
            customerInput.createdAt = new Date()
            customerInput.updatedAt = new Date()

            let customer = await dbClient.db(dbName).collection('customers').insertOne(customerInput);
            lastId = customer.insertedId.toString();
        }

        let customerBrand = await dbClient.db(dbName).collection('customer_brands').findOne({ brandId: customerInput.brandId });
        if ( !customerBrand ){
            await dbClient.db(dbName).collection('customer_brands').insertOne({customerId: new ObjectId(lastId), brandId: customerInput.brandId, name: customerInput.companyBrand  });
        }

        return { _id: new ObjectId(lastId) };
    } catch (e) {
        return e;
    }
}

const verifyCustomer =  async (parent, args) => {
    try {
        let _id = args.id ? new ObjectId(args.id) : null;

        const customer = await dbClient.db(dbName).collection("customers").findOne({ _id : new ObjectId(args.id) });

        //Verify Brand
        await dbClient.db(dbName).collection('brands').updateOne(
            { _id: new ObjectId(customer.brandId) },
            {
                $set: { verified: true },
                $currentDate: { updatedAt: true }
            }
        );

        //Verify Customer Categories
        const customerCategories = await dbClient.db(dbName).collection("customer_categories").find({ customerId : new ObjectId(args.id) }).toArray();
        let categoryIds = customerCategories.map(c => new ObjectId(c.categoryId) )

        await dbClient.db(dbName).collection('categories').updateMany(
            { _id: { $in: categoryIds } },
            {
                $set: {status: 'verified'},
                $currentDate: { updatedAt: true }
            }
        );

        //Verify Customer
        await dbClient.db(dbName).collection('customers').updateOne(
            { _id: new ObjectId(_id) },
            {
                $set: {status: 'verified'},
                $currentDate: { updatedAt: true }
            }
        );

        return _id
    } catch (e) {
        return e;
    }
}

const createGroup =  async (parent, args) => {
    try {
        let group = {
            customerId: new ObjectId(args.data.customerId),
            uploadIds: args.data.uploadIds ? args.data.uploadIds.map(id => new ObjectId(id)) : [],
            name: args.data.name,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        group = await dbClient.db(dbName).collection('customer_groups').insertOne(group);

        return group.insertedId.toString();
    } catch (e) {
        return e;
    }
}

const saveFeedback =  async (parent, args) => {
    try {
        let id = null;
        if ( args.data.feedbackId ){
            const response = await dbClient.db(dbName).collection('customer_feedbacks').updateOne(
                { _id: new ObjectId(args.data.feedbackId) },
                {
                    $set: {status: args.data.status},
                    $currentDate: { updatedAt: true }
                }
            );
            id = args.data.feedbackId;
        } else {
            let feedback = {
                customerId: new ObjectId(args.data.customerId),
                title: args.data.title,
                copy: args.data.copy,
                publishType: args.data.publishType,
                status: 'unpublished',
                groupId: args.data.groupId ? new ObjectId(args.data.groupId) : null,
                createdAt: new Date(),
                updatedAt: new Date()
            };

            group = await dbClient.db(dbName).collection('customer_feedbacks').insertOne(feedback);
            id = group.insertedId.toString();
        }

        return id;
    } catch (e) {
        return e;
    }
}


module.exports = {
    queries: {
        customers,
        getCustomer,
        getCustomerCategoriesAndProducts,
        getCustomerBrandsAndCategories,
        getCustomerBrandsCategoriesProducts,
        getCustomerProducts,
        getCustomerGroups,
        getCustomerFeedbacks,
        getPendingCustomers
    },
    mutations: {
        saveCustomer,
        verifyCustomer,
        createGroup,
        saveFeedback
    },
    helper: {
        getGroups
    }
}