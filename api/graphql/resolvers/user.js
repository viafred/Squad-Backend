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


/* MUTATIONS */
const updateUser = async (parent, args) => {
    let userInput = JSON.parse(JSON.stringify(args.user));
    if ( userInput.dob ){
        userInput.dob = new Date(userInput.dob);
    }

    await dbClient.db(dbName).collection('users').updateOne(
        { _id: new ObjectId(args.id) },
        {
            $set: userInput,
            $currentDate: { updatedAt: true }
        }
    );

    return { _id: new ObjectId(args.id) };
}


module.exports = {
    queries: {
        users,
        user,
        getSpotlightMembers,
        getUserByFirebaseId
    },
    mutations: {
        updateUser
    }
}