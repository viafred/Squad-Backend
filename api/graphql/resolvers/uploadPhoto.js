const { dbClient, dbName } = require('../../config/mongo');
const ObjectId = require('mongodb').ObjectId;

var _ = require('lodash');

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
    let { searchParam, brandIds, uploadIds, categoryIds } = args;

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
        uploadsSearch,
        uploadsFilter
    },
    mutations: {
        addUploadedPhoto,
        likeUploadedPhoto,
    }
}