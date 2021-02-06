const { dbClient, dbName } = require('../../config/mongo');
const ObjectId = require('mongodb').ObjectId;

const brandResolvers = require('../resolvers/brand');
const categoryResolvers = require('../resolvers/category');
const productResolvers = require('../resolvers/product');

const { Stitch, UserPasswordAuthProviderClient, UserPasswordCredential } = require('mongodb-stitch-server-sdk');
const stitchClient = Stitch.initializeDefaultAppClient(process.env.REALM_APP_ID);
const emailPasswordClient = stitchClient.auth.getProviderClient(UserPasswordAuthProviderClient.factory);

const _ = require('lodash');

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
    let customerFeedbacksUploads = await dbClient.db(dbName).collection("customer_feedback").aggregate([
        {
            $lookup:{
                from: "customer_questions",
                localField : "questions",
                foreignField : "_id",
                as : "questions"
            }
        },
        {
            $lookup:{
                from: "brands",
                localField : "brandId",
                foreignField : "_id",
                as : "brandIds"
            }
        },
        {
            $lookup:{
                from: "categories",
                localField : "categoryId",
                foreignField : "_id",
                as : "categoryIds"
            }
        },
        {
            $lookup:{
                from: "uploads",
                localField : "uploadId",
                foreignField : "_id",
                as : "uploadIds"
            }
        },
        {
            $lookup: {
                from: 'uploads',
                let: { "uploads": "$uploads" },
                pipeline: [
                    { $match: { "$expr": { "$in": [ "$_id", "$$uploads" ] } } },
                    {
                        $lookup: {
                            from: 'users',
                            let: { "memberId": "$memberId" },
                            pipeline: [
                                { "$match": { "$expr": { "$eq": [ "$_id", "$$memberId" ] } } },
                            ],
                            as: "member"
                        }},
                    {
                        $addFields: {
                            member: { "$arrayElemAt": [ "$member", 0 ] }
                    }}
                ],
                as: "uploads"
            }
        },
        {
            $addFields: {
                "questions": "$questions",
                "uploads": "$uploads",
                "offerType": "upload",
                "brand": { "$arrayElemAt": [ "$brandIds", 0 ] },
                "category": { "$arrayElemAt": [ "$categoryIds", 0 ] },
                "upload": { "$arrayElemAt": [ "$uploadIds", 0 ] }
            }
        },

        { $match : { customerId : new ObjectId(args.customerId) } }
    ]).toArray();

    return [...customerFeedbacksUploads]
}

const getFeedbackAnswers = async (root, args, context, info) => {
    let customerFeedback = await dbClient.db(dbName).collection("customer_feedback").aggregate([
        {
            $lookup:{
                from: "customer_questions",
                localField : "questions",
                foreignField : "_id",
                as : "questions"
            }
        },
        {
            $lookup: {
                from: 'uploads',
                let: { "uploads": "$uploads" },
                pipeline: [
                    { $match: { "$expr": { "$in": [ "$_id", "$$uploads" ] } } },
                    {
                        $lookup: {
                            from: 'users',
                            let: { "memberId": "$memberId" },
                            pipeline: [
                                { "$match": { "$expr": { "$eq": [ "$_id", "$$memberId" ] } } },
                            ],
                            as: "member"
                        }},
                    {
                        $addFields: {
                            member: { "$arrayElemAt": [ "$member", 0 ] }
                        }}
                ],
                as: "uploads"
            }
        },
        {
            $addFields: {
                "questions": "$questions",
                "uploads": "$uploads"
            }
        },

        { $match : { _id : new ObjectId(args.feedbackId) } }
    ]).toArray();

    let feedback = customerFeedback[0]
    for ( const i in feedback.questions ){
        const q = feedback.questions[i]
        q.answers = q.answers.map(a => ({ name: a, count: 0 }))
    }


    let customerFeedbackAnswers = await dbClient.db(dbName).collection("feedback_answers").aggregate([
        {
            $lookup:{
                from: "users",
                localField : "userId",
                foreignField : "_id",
                as : "users"
            }
        },
        {
            $addFields: {
                "member": { "$arrayElemAt": [ "$users", 0 ] },
            }
        },

        { $match : { customerFeedbackId : new ObjectId(args.feedbackId) } }
    ]).toArray();

    feedback.memberAnswers = customerFeedbackAnswers

    for ( const k in feedback.questions ){
        const question = feedback.questions[k]
        for ( const answerI in customerFeedbackAnswers ){
            const memberFeedback = customerFeedbackAnswers[answerI]
            const memberAnswer = _.find(memberFeedback.answers, {'questionId': question._id})
            let feedbackQuestionAnswer = _.find(question.answers, {'name': memberAnswer.answer})
            feedbackQuestionAnswer.count = feedbackQuestionAnswer.count + 1
        }
    }

    return feedback
}

const getCustomerQuestion = async (root, args, context, info) => {
    const questions = await dbClient.db(dbName).collection("customer_questions")
        .find({_id : new ObjectId(args.questionId)})
        .limit(1)
        .toArray();

    if ( questions.length > 0 ){
        let question = questions[0];
        return question;
    }

    return {}
}

const getCustomerQuestions = async (root, args, context, info) => {
    let customerQuestions = await dbClient.db(dbName).collection("customer_questions").aggregate([
        {
            $lookup:{
                from: "customer",
                localField : "customerId",
                foreignField : "_id",
                as : "customer"
            }
        },
        { $match : { customerId : new ObjectId(args.customerId) } }
    ]).toArray();

    return customerQuestions
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

        let feedBack = {
            customerId: new ObjectId(args.data.customerId),
            brandId: args.data.brandId && new ObjectId(args.data.brandId) || null,
            categoryId: args.data.categoryId && new ObjectId(args.data.categoryId) || null,
            uploadId: args.data.uploadId && new ObjectId(args.data.uploadId) || null,
            uploads: args.data.uploads.map(u => new ObjectId(u)),
            questions: args.data.questions.map(q => new ObjectId(q)),
            offerType: args.data.offerType,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const _feedback = await dbClient.db(dbName).collection('customer_feedback').insertOne(feedBack);

        return _feedback.insertedId.toString()
    } catch (e) {
        return e;
    }
}

const saveQuestion =  async (parent, args) => {
    try {
        let question = {
            customerId: new ObjectId(args.question.customerId),
            question: args.question.question,
            answers: args.question.answers,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        if ( args.question._id ){
            await dbClient.db(dbName).collection("customer_questions").updateOne(
                { _id: new ObjectId(args.question._id) },
                {
                    $set: {answers: args.question.answers, question: question.question},
                    $currentDate: { updatedAt: true }
                });

            return args.question._id
        } else {
            question = await dbClient.db(dbName).collection('customer_questions').insertOne(question);
            return question.insertedId.toString();
        }
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
        getPendingCustomers,
        getCustomerQuestions,
        getCustomerQuestion,
        getFeedbackAnswers
    },
    mutations: {
        saveCustomer,
        verifyCustomer,
        createGroup,
        saveFeedback,
        saveQuestion
    },
    helper: {
        getGroups
    }
}