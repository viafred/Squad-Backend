const { dbClient, dbName } = require('../../config/mongo');
const ObjectId = require('mongodb').ObjectId;

const _ = require('lodash');
const { union } = require('lodash');

const productHelper = require('./product')

const getUploadedPhotos = async (root, args, context, info) => {

    const uploads = await dbClient.db(dbName).collection("uploads").aggregate([
        {
            $lookup:{
                from: "users",
                localField : "memberId",
                foreignField : "_id",
                as : "member"
            }
        },
        {
            $lookup:{
                from: "brands",
                localField : "brandId",
                foreignField : "_id",
                as : "brand"
            }
        },
        {
            $lookup:{
                from: "categories",
                localField : "categoryId",
                foreignField : "_id",
                as : "category"
            }
        }
    ]).toArray();

    for ( let upload of uploads ){
        upload.brand = upload.brand[0];
        upload.member = upload.member[0];
        upload.category = upload.category[0];
    }

    return uploads;
}

const getUpload = async (root, {id}, context, info) => {

    const uploads = await dbClient.db(dbName).collection("uploads").aggregate([
        {
            $lookup:{
                from: "users",
                localField : "memberId",
                foreignField : "_id",
                as : "member"
            }
        },
        {
            $lookup:{
                from: "brands",
                localField : "brandId",
                foreignField : "_id",
                as : "brand"
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
        {
            $lookup:{
                from: "products",
                localField : "productId",
                foreignField : "_id",
                as : "product"
            }
        },
        { $match : {_id: new ObjectId(id) }}
    ]).toArray();

    for ( let upload of uploads ){
        upload.brand = upload.brand[0];
        upload.member = upload.member[0];
        upload.category = upload.category[0];
        upload.product = upload.product.length > 0 ? upload.product[0] : [];
        upload.tags = upload.tags ? upload.tags : []
    }

    return uploads[0];
}

const getPendingUploads = async (root, args, context, info) => {

    const uploads = await dbClient.db(dbName).collection("uploads").aggregate([
        {
            $lookup:{
                from: "users",
                localField : "memberId",
                foreignField : "_id",
                as : "member"
            }
        },
        {
            $lookup:{
                from: "brands",
                localField : "brandId",
                foreignField : "_id",
                as : "brand"
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
        {
            $lookup:{
                from: "products",
                localField : "productId",
                foreignField : "_id",
                as : "product"
            }
        },
        { $match : {$or: [{ approved: false }, { approved: null }]} }
    ]).toArray();

    for ( let upload of uploads ){
        upload.brand = upload.brand[0];
        upload.member = upload.member[0];
        upload.category = upload.category[0];
        upload.product = upload.product.length > 0 ? upload.product[0] : [];
        upload.tags = upload.tags ? upload.tags : []
    }

    return uploads;
}

const getFlaggedUploads = async (root, args, context, info) => {

    const uploads = await dbClient.db(dbName).collection("uploads").aggregate([
        {
            $lookup:{
                from: "users",
                localField : "memberId",
                foreignField : "_id",
                as : "member"
            }
        },
        {
            $lookup:{
                from: "brands",
                localField : "brandId",
                foreignField : "_id",
                as : "brand"
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
        {
            $lookup:{
                from: "products",
                localField : "productId",
                foreignField : "_id",
                as : "product"
            }
        },
        { $match : { approved : null, flagged: true } }
    ]).toArray();

    for ( let upload of uploads ){
        upload.brand = upload.brand[0];
        upload.member = upload.member[0];
        upload.category = upload.category[0];
        upload.product = upload.product.length > 0 ? upload.product[0] : [];
        upload.tags = upload.tags ? upload.tags : []
    }

    return uploads;
}

const getUserUploads =  async (root, args, context, info) => {
    if ( !args.userId ){
        return []
    }

    const uploads = await dbClient.db(dbName).collection("uploads").aggregate([
        {
            $lookup:{
                from: "users",
                localField : "memberId",
                foreignField : "_id",
                as : "member"
            }
        },
        {
            $lookup:{
                from: "brands",
                localField : "brandId",
                foreignField : "_id",
                as : "brand"
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
        { $match : { memberId : new ObjectId(args.userId) } }
    ]).toArray();

    for ( let upload of uploads ){
        upload.brand = upload.brand[0];
        upload.member = upload.member[0];
        upload.category = upload.category[0];
    }

    return uploads;
}

const getApprovedNotCredited = async (root, args, context, info) => {
    return await dbClient.db(dbName).collection("uploads").find({ approved: true, credited: null }).toArray();
}

const getApprovedNotCreditedUploadedProducts = async (root, args, context, info) => {
    return await dbClient.db(dbName).collection("uploads").find({ approved: true, credited: null, productId: {$ne: null} }).toArray();
}

const getBrandUploads =  async (root, args, context, info) => {
    if ( !args.brandId ){
        return []
    }

    const uploads = await dbClient.db(dbName).collection("uploads").aggregate([
        {
            $lookup:{
                from: "users",
                localField : "memberId",
                foreignField : "_id",
                as : "member"
            }
        },
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
        { $match : { brandId : new ObjectId(args.brandId) } }
    ]).toArray();


    const brandSubscriptions = await dbClient.db(dbName).collection("brand_subscriptions").findOne({brandId: new ObjectId(args.brandId), userId: new ObjectId(args.userId)})
    const brand = await dbClient.db(dbName).collection("brands").findOne({_id: new ObjectId(args.brandId)});

    const customers = await dbClient.db(dbName).collection("customer_brands").aggregate([
        {
            $lookup:{
                from: "customers",
                localField : "customerId",
                foreignField : "_id",
                as : "customer",
            }
        },
        { $match : { brandId : new ObjectId(args.brandId) } }
    ]).toArray();

    if ( customers ){
        brand.banner = customers[0].customer[0].companyBanner;
        brand.logo = customers[0].customer[0].companyLogo;
    }

    for ( let upload of uploads ){
        upload.brand = upload.brand[0];
        upload.member = upload.member[0];
        upload.category = upload.category[0];
    }

    let returnData = {};
    returnData.isSubscribed = brandSubscriptions != null;
    returnData.brand = brand;
    returnData.uploads = uploads;

    return returnData;

}

const uploadsSearch = async (root, args, context, info) => {
    let { searchParam, brandIds, uploadIds, categoryIds, productIds } = args;

    let $match = { $match: {} };
    const $sort = { $sort: { score: { $meta: "textScore" } } };

    if ( searchParam && searchParam != '-' ){
        $match.$match.$text = { $search: searchParam };
    }

    if ( brandIds && brandIds != '-' ){
        brandIds = brandIds.split(',');
        let $brandIds = [];
        for ( let brandId of brandIds ){
            $brandIds.push(new ObjectId(brandId));
        }

        $match.$match.brandId = { $in: $brandIds }
    }

    if ( uploadIds && uploadIds != '-' ){
        uploadIds = uploadIds.split(',');
        let $uploadIds = [];
        for ( let uploadId of uploadIds ){
            $uploadIds.push(new ObjectId(uploadId));
        }

        $match.$match._id = { $in: $uploadIds }
    }

    if ( productIds && productIds != '-' ){
        productIds = productIds.split(',');
        let $productIds = [];
        for ( let productId of productIds ){
            $productIds.push(new ObjectId(productId));
        }

        $match.$match.productId = { $in: $productIds }
    }

    if ( categoryIds && categoryIds != '-' ){
        categoryIds = categoryIds.split(',');
        let $categoryIds= [];
        for ( let categoryId of categoryIds ){
            $categoryIds.push(new ObjectId(categoryId));
        }

        $match.$match.categoryId = { $in: $categoryIds }
    }

    const uploads = await dbClient.db(dbName).collection("uploads").aggregate([
        $match,
        {
            $lookup:{
                from: "users",
                localField : "memberId",
                foreignField : "_id",
                as : "member"
            }
        },
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


    for ( let upload of uploads ){
        upload.brand = upload.brand[0];
        upload.member = upload.member[0];
        upload.category = upload.category[0];
    }

    return uploads;
}

const uploadsFilter = async (root, args, context, info) => {
    const { gender = null, location = null, education = null, ageFrom = null, ageTo = null, categoryNames = [], productNames = [], brandNames = []} = args.filter;

    const searchCategory = categoryNames ? _.map(categoryNames).join(' ') : '';
    const searchBrand = brandNames ? _.map(brandNames).join(' ') : '';
    const searchProduct = productNames ? _.map(productNames).join(' ') : '';

    const search = searchCategory + " " + searchBrand + " " + searchProduct;

    let userFind = [];
    let userFindFilter = {};

    if ( gender ){
        userFind.push( { gender: new RegExp(gender) });
    }

    if ( location ){
        userFind.push( { '$or': [{ "hometownCity": new RegExp(location) }, { "hometownState": new RegExp(location)}] });
    }

    if ( education ){
        userFind.push( { education: new RegExp(education) });
    }

    if ( ageFrom && ageTo){
        userFind.push( { age: { $gte: ageFrom, $lte: ageTo } });
    }

    if ( ageFrom && !ageTo ){
        userFind.push( { age: { $gte: ageFrom } });
    }

    if ( !ageFrom && ageTo ){
        userFind.push( { age: { $lte: ageTo } });
    }

    if ( userFind.length ){
        userFindFilter['$and'] = userFind;
    }

    const users = await dbClient.db(dbName).collection("users").find(userFindFilter).toArray();
    let userIds = [];

    for ( let user of users ){
        userIds.push(new ObjectId(user._id));
    }

    const pipeline = [];

    let $match = {};
    const $sort = { $sort: { score: { $meta: "textScore" } } };

    if ( userIds && userIds.length > 0 && search.trim().length != 0 ){
        $match = { $match : { $text: { $search: search }, memberId: { $in: userIds } }  };
        pipeline.push($match, $sort);
    } else if ( search.trim().length != 0 && !userIds.length ){
        $match = { $match : { $text: { $search: search } } };
        pipeline.push($match, $sort);
    } else {
        $match = {$match: {memberId: {$in: userIds}}};
        pipeline.push($match);
    }

    pipeline.push({
            $lookup:{
                from: "users",
                localField : "memberId",
                foreignField : "_id",
                as : "member"
            }
        },
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
        });

    const uploads = await dbClient.db(dbName).collection("uploads").aggregate(pipeline).toArray();

    for ( let upload of uploads ){
        upload.brand = upload.brand[0];
        upload.member = upload.member[0];
        upload.category = upload.category[0];
    }

    return uploads;
}

/* MUTATIONS */

const addUploadedPhoto =  async (parent, args) => {
    try {
        console.log('addUploadedPhoto')
        console.log(args)
        let photo = {
            brandId: null,
            categoryId: null,
            productId: null,
            memberId: new ObjectId(args.uploadPhoto.userId),
            productName: args.uploadPhoto.productName,
            brandName: args.uploadPhoto.brand.name,
            categoryName: args.uploadPhoto.category.name,
            productUrl: args.uploadPhoto.productUrl,
            approved: false,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        let brand = null
        if ( args.uploadPhoto.brand._id ){
            brand = args.uploadPhoto.brand
            photo.brandId = new ObjectId(args.uploadPhoto.brand._id)
        } else {
            brand = await dbClient.db(dbName).collection('brands').insertOne(
                { name: args.uploadPhoto.brand.name, verified: false, createdAt: new Date(), updatedAt: new Date() });
            photo.brandId = new ObjectId(brand.insertedId);
        }

        let category = null
        if ( args.uploadPhoto.category._id ){
            category = args.uploadPhoto.category
            photo.categoryId = new ObjectId(args.uploadPhoto.category._id)
        } else {
            category = await dbClient.db(dbName).collection('categories').insertOne(
                {name: args.uploadPhoto.category.name, verified: false, createdAt: new Date(), updatedAt: new Date()} );
            photo.categoryId = new ObjectId(category.insertedId);
        }

        let product = null
        if ( args.uploadPhoto.product._id ){
            product = args.uploadPhoto.product
            photo.productId = new ObjectId(args.uploadPhoto.product._id)
            photo.productName = args.uploadPhoto.product.productName
        } else {
            product = await dbClient.db(dbName).collection('products').insertOne(
                {
                    brandId: new ObjectId(photo.brandId),
                    categoryId: new ObjectId(photo.categoryId),
                    productName: args.uploadPhoto.product.productName,
                    productUrl: photo.productUrl,
                    brandName: photo.brandName,
                    categoryName: photo.categoryName,
                    verified: false,
                    createdAt: new Date(),
                    updatedAt: new Date()
                } );
            photo.productId = new ObjectId(product.insertedId);
            photo.productName = args.uploadPhoto.product.productName
        }

        photo.approved = brand.verified === true && category.verified === true && product.verified === true
        console.log(photo)
        let upload = await dbClient.db(dbName).collection('uploads').insertOne(photo);

        return upload.insertedId.toString();

        //Brands - Note: Leave here as an example
        /*let brands = await dbClient.db(dbName).collection('brands').aggregate(
            [
                {
                    $project:
                        {
                            name: { $toLower: "$name" },
                            verified: 1
                        }
                },
                { $match : { name : args.uploadPhoto.brand.name.toLowerCase() } }
            ]
        ).toArray();
        */
    } catch (e) {
        return e;
    }
}

const updateUploadedPhoto =  async (parent, args) => {
    try {
        let photo = {
            brandId: new ObjectId(args.uploadPhoto.brand._id),
            categoryId: new ObjectId(args.uploadPhoto.category._id),
            productId: new ObjectId(args.uploadPhoto.product._id),
            memberId: new ObjectId(args.uploadPhoto.member._id),
            productName: args.uploadPhoto.productName,
            productUrl: args.uploadPhoto.productUrl,
            brandName: args.uploadPhoto.brand.name,
            categoryName: args.uploadPhoto.category.name,
            approved: args.uploadPhoto.approved ? args.uploadPhoto.approved : false
        };

        await dbClient.db(dbName).collection('uploads').updateOne(
            { _id: new ObjectId(args.uploadPhoto._id) },
            {
                $set: {...photo},
                $currentDate: { updatedAt: true }
            }
        );

        return args.uploadPhoto._id;
    } catch (e) {
        return e;
    }
}

const verifyUploadedPhoto =  async (parent, args) => {
    try {
        let photo = {
            memberId: new ObjectId(args.uploadPhoto.member._id),
            productName: args.uploadPhoto.productName,
            productUrl: args.uploadPhoto.productUrl,
            brandName: args.uploadPhoto.brand.name,
            categoryName: args.uploadPhoto.category.name,
            approved: true
        };

        //BRANDS
        if ( args.uploadPhoto.brand._id ){
            photo.brandId = new ObjectId(args.uploadPhoto.brand._id)
        } else {
            let brands = await dbClient.db(dbName).collection('brands').aggregate(
                [{$project:{name: { $toLower: "$name" }}},{ $match : { name : args.uploadPhoto.brand.name.toLowerCase() } }]
            ).toArray();

            if (brands.length > 0){
                photo.brandId = new ObjectId(brands[0]._id)
                photo.brandName = args.uploadPhoto.brand.name
            } else {
                let brand = await dbClient.db(dbName).collection('brands').insertOne(
                    { name: args.uploadPhoto.brand.name, verified: true, createdAt: new Date(), updatedAt: new Date() });
                photo.brandId = new ObjectId(brand.insertedId);
                photo.brandName = args.uploadPhoto.brand.name
            }
        }

        //CATEGORY
        if ( args.uploadPhoto.category._id ){
            photo.categoryId = new ObjectId(args.uploadPhoto.category._id)
        } else {
            let categories = await dbClient.db(dbName).collection('categories').aggregate(
                [{$project:{name: { $toLower: "$name" }}},{ $match : { name : args.uploadPhoto.category.name.toLowerCase() } }]
            ).toArray();

            if (categories.length > 0){
                photo.categoryId = new ObjectId(categories[0]._id)
                photo.categoryName = args.uploadPhoto.category.name
            } else {
                let category = await dbClient.db(dbName).collection('categories').insertOne(
                    { name: args.uploadPhoto.category.name, verified: true, createdAt: new Date(), updatedAt: new Date() });
                photo.categoryId = new ObjectId(category.insertedId);
                photo.categoryName = args.uploadPhoto.category.name
            }
        }

        //PRODUCT
        if (args.uploadPhoto.product._id){
            photo.productId = new ObjectId(args.uploadPhoto.product._id)
        } else {
            let products = await dbClient.db(dbName).collection('products').aggregate(
                [{$project:{productName: { $toLower: "$productName" }}},{ $match : { productName : args.uploadPhoto.product.productName.toLowerCase() } }]
            ).toArray();

            if (products.length > 0){
                photo.productId = new ObjectId(products[0]._id);
                photo.productName = args.uploadPhoto.product.productName
            } else {
                let product = await dbClient.db(dbName).collection('products').insertOne(
                    {
                        brandId: new ObjectId(args.uploadPhoto.brand._id),
                        categoryId: new ObjectId(args.uploadPhoto.category._id),
                        productName: args.uploadPhoto.product.productName,
                        productUrl: args.uploadPhoto.productUrl,
                        brandName: args.uploadPhoto.brand.name,
                        categoryName: args.uploadPhoto.category.name,
                        tags: args.uploadPhoto.tags,
                        verified: true,
                        createdAt: new Date(),
                        updatedAt: new Date()
                    } );

                photo.productId = new ObjectId(product.insertedId);
                photo.productName = args.uploadPhoto.product.productName
            }

        }

        await dbClient.db(dbName).collection('uploads').updateOne(
            { _id: new ObjectId(args.uploadPhoto._id) },
            {
                $set: {...photo},
                $currentDate: { updatedAt: true }
            }
        );

        console.log(args.uploadPhoto)

        const brandsRef = dbClient.db(dbName).collection("customer_brands").aggregate([
            {
                $lookup:{
                    from: 'brands',
                    localField: 'brandId',
                    foreignField: '_id',
                    as: 'brands'
                },
                $lookup:{
                    from: 'customers',
                    localField: 'customerId',
                    foreignField: '_id',
                    as: 'customers'
                },
            },
            { $match : { brandId: new ObjectId(args.uploadPhoto.brand._id) }}
        ]);

        const brandCustomers = await brandsRef.toArray();
        if ( brandCustomers && brandCustomers.length > 0 ){
            const customer = brandCustomers[0].customers[0];
            console.log(customer)
            if ( customer ){
                await productHelper.helper.addProductToCustomer(
                    args.uploadPhoto.product,
                    customer,
                    args.uploadPhoto.brand,
                    args.uploadPhoto.category,
                    args.uploadPhoto.tags
                )

                if ( args.uploadPhoto.category.verified === false ){
                    await dbClient.db(dbName).collection('categories').updateOne(
                        { _id: new ObjectId(args.uploadPhoto.category._id) },
                        {
                            $set: { verified: true },
                            $currentDate: { updatedAt: true }
                        }
                    );

                    await dbClient.db(dbName).collection('customer_categories').insertOne({
                        categoryId: new ObjectId(args.uploadPhoto.category._id),
                        customerId: new ObjectId(customer._id),
                        name: args.uploadPhoto.category.name
                    });
                }
            }
        }

        return args.uploadPhoto._id;
    } catch (e) {
        return e;
    }
}

const likeUploadedPhoto =  async (parent, args) => {
    const upload = await dbClient.db(dbName).collection("uploads").findOne({_id: new ObjectId(args.id)});
    if ( upload && upload.userLikes && _.find(upload.userLikes, new ObjectId(args.userId)) ){
        await dbClient.db(dbName).collection("uploads").updateOne(
            { _id: new ObjectId(args.id) },
            { $pull: { userLikes: { $in: [ new ObjectId(args.userId) ] } }}
        )
    } else {
        await dbClient.db(dbName).collection("uploads").updateOne(
            { _id: new ObjectId(args.id) },
            { $push: { userLikes: new ObjectId(args.userId) }}
        )
    }

    return true;
}

const compensateUploads = async(amount) => {
    try {
        const uploads = await dbClient.db(dbName).collection("uploads").find({ approved: true, credited: null }).toArray();
        const uploadIds = uploads.map(u => (new ObjectId(u._id)));

        await dbClient.db(dbName).collection("uploads").updateMany(
            { _id: {$in: uploadIds} },
            { $set: { credited: true, earnedAmount: amount }}
        )

        return { uploadIds, totalCompensated: uploads ? uploads.length * amount : 0 }
    } catch (e){
        return e
    }
}

const compensateUploadedProducts = async(amount) => {
    try {
        const uploads = await dbClient.db(dbName).collection("uploads").find({ approved: true, credited: null, productId: {$ne: []} }).toArray();
        const uploadIds = uploads.map(u => (new ObjectId(u._id)));

        let productList = []
        uploads.map(u => ( productList.push(...u.productIds) ));

        await dbClient.db(dbName).collection("uploads").updateMany(
            { _id: {$in: uploadIds} },
            [
                { $set: { credited: true }},
                { $set: {"earnedAmount": { $multiply: [ {$size:"$productIds"}, amount ] } }}
            ]
        )

        return { uploadIds, totalCompensated: productList ? productList.length * amount : 0 }
    } catch (e){
        return e
    }
}

const compensate = async (payType, amount) => {
    try {
        if ( payType === 'upload' ){
            return await compensateUploads(amount)
        } else {
            return await compensateUploadedProducts(amount)
        }
    } catch (e){
        return e
    }
}

const validateUpload =  async (parent, args) => {
    const uploads = await dbClient.db(dbName).collection("uploads").aggregate([
        {
            $lookup:{
                from: "products",
                localField : "productId",
                foreignField : "_id",
                as : "product"
            }
        },
        {
            $lookup:{
                from: "brands",
                localField : "brandId",
                foreignField : "_id",
                as : "brand"
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
        { $match : { _id : new ObjectId(args.id) } }
    ]).toArray();

    let validateError = {
        brand: null,
        category: null,
        product: null,
        errorCount: 0
    }

    const upload = uploads[0];
    if ( upload ){
        upload.brand = upload.brand[0];
        upload.product = upload.product[0];
        upload.category = upload.category[0];

        if ( upload.brand.verified === undefined || upload.brand.verified === false ){
            validateError['brand'] = `Unable to find '${upload.brand.name}' in the system. Or is not a verified Brand/Customer.`
            validateError['errorCount'] += 1
        }

        if ( upload.category.verified === undefined || upload.category.verified === false ){
            validateError['category'] = `Unable to find '${upload.category.name}' in the system. Or is not a verified Category.`
            validateError['errorCount'] += 1
        }

        if ( !upload.product || upload.product && upload.product.verified === undefined || upload.product && upload.product.verified === false ){
            validateError['product'] = `Unable to find '${upload.productName}' in the system. Or is not a verified Product.`
            validateError['errorCount'] += 1
        }
    }

    return validateError;
}

const flagUploadedPhoto =  async (parent, args) => {
    await dbClient.db(dbName).collection('uploads').updateOne(
        { _id: new ObjectId(args.id) },
        {
            $set: {flagged: true},
            $currentDate: { updatedAt: true }
        }
    );

    return args.id;
}

module.exports = {
    queries: {
        getUpload,
        getUploadedPhotos,
        getUserUploads,
        getBrandUploads,
        uploadsSearch,
        uploadsFilter,
        getApprovedNotCredited,
        getApprovedNotCreditedUploadedProducts,
        getPendingUploads,
        getFlaggedUploads
    },
    mutations: {
        addUploadedPhoto,
        updateUploadedPhoto,
        likeUploadedPhoto,
        validateUpload,
        flagUploadedPhoto,
        verifyUploadedPhoto
    },
    helper: {
        compensate,
    }
}