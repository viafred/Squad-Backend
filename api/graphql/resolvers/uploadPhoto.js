const { dbClient, dbName } = require('../../config/mongo');
const ObjectId = require('mongodb').ObjectId;

var _ = require('lodash');

const getUploadedPhotos = async (root, args, context, info) => {
    const uploadedRef = dbClient.db(dbName).collection("uploads");
    const uploads = await uploadedRef.find({}).toArray();

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
    const uploads = await dbClient.db(dbName).collection("uploads").aggregate([
        { $match : { $text: { $search: args.searchParam } } },
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

/* MUTATIONS */

const addUploadedPhoto =  async (parent, args) => {
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



module.exports = {
    queries: {
        getUploadedPhotos,
        getUserUploads,
        getBrandUploads,
        uploadsSearch
    },
    mutations: {
        addUploadedPhoto,
        likeUploadedPhoto,
    }
}