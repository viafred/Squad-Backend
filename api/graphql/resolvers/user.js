const { dbClient, dbName } = require('../../config/mongo');
const ObjectId = require('mongodb').ObjectId;

const users = async (root, args, context, info) => {
    const usersRef = dbClient.db(dbName).collection("users");
    const users = await usersRef.find({}).toArray();

    return users;
}

const user = async (root, { id }, context, info) => {
    const usersRef = dbClient.db(dbName).collection("users");
    const user = await usersRef.findOne({_id: new ObjectId(id)});

    return user;
}

const getUserByFirebaseId = async (root, { firebaseId }, context, info) => {
    const usersRef = dbClient.db(dbName).collection("users");
    const user = await usersRef.findOne({firebaseId: new ObjectId(firebaseId)});

    return user;
}


const getSpotlightMembers = async (root, args, context, info) => {
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
        { $sort : { createdAt : -1 } }
    ]).limit(4).toArray();

    for ( let upload of uploads ){
        upload.brand = upload.brand[0];
        upload.member = upload.member[0];
        upload.category = upload.category[0];
    }

    return uploads;
}

const getLookbookByUserId = async (root, { userId }, context, info) => {
    const lookbook = await dbClient.db(dbName).collection("users_lookbook").aggregate([
        { "$lookup": {
            "from": "categories",
            "localField": "categoryIds",
            "foreignField": "_id",
            "as": "categories"
        } },
        { "$lookup": {
            "from": "brands",
            "localField": "brandIds",
            "foreignField": "_id",
            "as": "brands"
        } },
        { "$lookup": {
            "from": "uploads",
            "localField": "uploadIds",
            "foreignField": "_id",
            "as": "uploads"
        } },
        { "$addFields": {
            "brands": "$brands.name",
            "categories": "$categories.name",
            "uploads": "$uploads.productName"
        } },
        { $match : { userId : new ObjectId(userId) } }
    ]).toArray();

    console.log(lookbook)
    return lookbook;

}

const getLookbook = async (root, { id }, context, info) => {
    const lookbook = await dbClient.db(dbName).collection("users_lookbook").findOne({_id: new ObjectId(id)});

    return lookbook;
}

/* MUTATIONS */
const updateUser = async (parent, args) => {
    let userInput = JSON.parse(JSON.stringify(args.user));
    if ( userInput.dob ){
        userInput.dob = new Date(userInput.dob);
    }

    try {
        await dbClient.db(dbName).collection('users').updateOne(
            { _id: new ObjectId(args.id) },
            {
                $set: userInput,
                $currentDate: { updatedAt: true }
            }
        );
    } catch (e){
        console.log(e)
    }

    return { _id: new ObjectId(args.id) };
}

const lookbookit =  async (parent, args) => {
    try {
        let lookbook = {
            userId: new ObjectId(args.data.userId),
            brandIds: args.data.brandIds ? args.data.brandIds.map(id => new ObjectId(id)) : [],
            categoryIds: args.data.categoryIds ? args.data.categoryIds.map(id => new ObjectId(id)) : [],
            uploadIds: args.data.uploadIds ? args.data.uploadIds.map(id => new ObjectId(id)) : [],
            photoURL: args.data.photoURL,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        lookbook = await dbClient.db(dbName).collection('users_lookbook').insertOne(lookbook);

        return lookbook.insertedId.toString();
    } catch (e) {
        return e;
    }
}

module.exports = {
    queries: {
        users,
        user,
        getSpotlightMembers,
        getUserByFirebaseId,
        getLookbook,
        getLookbookByUserId
    },
    mutations: {
        updateUser,
        lookbookit
    }
}