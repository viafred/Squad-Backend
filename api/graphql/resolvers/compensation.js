const {dbClient, dbName} = require('../../config/mongo');
const ObjectId = require('mongodb').ObjectId;
const moment = require('moment'); // require
const crypto = require('crypto');
const _ = require('lodash');

const uploadResolvers = require('../resolvers/uploadPhoto');
const notificationResolvers = require('../resolvers/notification');

const activeCompensation = async (root, args, context, info) => {
    let oDate = new Date()

    let comp = await dbClient.db(dbName).collection("compensations").aggregate([
        {
            $lookup: {
                from: "users",
                localField: "userId",
                foreignField: "_id",
                as: "user"
            }
        },
        /*{ $match : { startDate: { $lt: oDate }, expirationDate: { $gte: oDate }, payType: "upload"  } },*/
        {$sort: {createdAt: -1}}
    ]).toArray();

    if (comp && comp[0]) {
        comp[0]['user'] = comp[0]['user'][0]
        return comp[0]
    }
}

const getMemberCompensations = async (root, args, context, info) => {
    const memberId = args.memberId;
    let comps = await dbClient.db(dbName).collection("compensations").aggregate([
        {
            $lookup: {
                from: "uploads",
                localField: "uploadIds",
                foreignField: "_id",
                as: "uploads"
            }
        },
        {$match: {"uploads.memberId": new ObjectId(memberId)}}
    ]).toArray();

    let uploads = []
    for (let comp of comps) {
        uploads = comp.uploads.filter(u => u.memberId == memberId)
        comp.totalCompensation = uploads.map(u => u.earnedAmount)
        comp.totalCompensation = comp.totalCompensation.reduce((previous, next) => previous + next, 0)
        comp.totalCompensation = parseFloat(comp.totalCompensation + "").toFixed(2)
    }

    return comps
}

const getMemberTotalEarnings = async (root, args, context, info) => {
    let memberEarnings = {}

    const uploadEarnings = await dbClient.db(dbName).collection("member_earnings").find({memberId: new ObjectId(args.memberId), type: "upload"}).toArray();
    const offerEarnings = await dbClient.db(dbName).collection("member_earnings").find({memberId: new ObjectId(args.memberId), type: "offer"}).toArray();
    memberEarnings.uploads = uploadEarnings.map(u => u.amount ? u.amount : 0).reduce((previous, next) => parseFloat(previous) + parseFloat(next), 0)
    memberEarnings.offers = offerEarnings.map(u => u.amount ? u.amount : 0).reduce((previous, next) => parseFloat(previous) + parseFloat(next), 0)

    return memberEarnings
}

const getDisbursedEarnings = async(args, userId) => {
    try {
        let disbursed = await dbClient.db(dbName).collection("member_earnings").aggregate([
            {
                $project:
                    {
                        amount: "$amount",
                        memberId:"$memberId",
                        member: "$member",
                        payed: "$payed",
                        entityId: "$entityId",
                        type: "$type",
                        createdAt: "$createdAt",
                        totalUploadEarnings: "$totalUploadEarnings",
                        year: { $year: "$createdAt" },
                        month: { $month: "$createdAt" }
                    }
            },
            { $match : { "month" : args.month, "year": args.year, payed: true, memberId: new ObjectId(userId) } },
        ]).toArray()

        return !_.isEmpty(disbursed)
    } catch (e){
        return e
    }
}

const getMembersCompensationAdminLedger = async (root, args, context, info) => {
    try {
        let earnings = await dbClient.db(dbName).collection("member_earnings").aggregate([
            {
                $lookup: {
                    from: "users",
                    localField: "memberId",
                    foreignField: "_id",
                    as: "members"
                }
            },
            {
                $addFields: {
                    "member": { "$arrayElemAt": [ "$members", 0 ] },
                }
            },
            {
                $project:
                    {
                        amount: "$amount",
                        memberId:"$memberId",
                        member: "$member",
                        payed: "$payed",
                        entityId: "$entityId",
                        type: "$type",
                        createdAt: "$createdAt",
                        totalUploadEarnings: "$totalUploadEarnings",
                        year: { $year: "$createdAt" },
                        month: { $month: "$createdAt" }
                    }
            },
            { $match : { "month" : args.month, "year": args.year } },
            {
                $group: {
                    _id: {
                        memberId: "$member._id",
                        type: "$type",
                    },
                    totalEarnings: {
                        $sum: "$amount"
                    },
                    data: { $push: "$$ROOT" }
                },
            },
        ]).toArray()

        let earningList = []
        earnings.forEach(earning => {
            let disbursed = getDisbursedEarnings(args, earning._id.memberId.toString()).then(r => r);
            let earningItem = earningList.find(item => item.memberId == earning._id.memberId.toString());
            let totalEarningsType = 'totalEarnings'+ earning._id.type.charAt(0).toUpperCase() + earning._id.type.slice(1)

            if ( !earningItem ){

                let item = {
                    memberId: earning._id.memberId.toString(),
                    member: earning.data[0].member,
                    createdAt: earning.data[0].createdAt,
                    disbursed: disbursed
                }

                item[totalEarningsType] = earning.totalEarnings
                earningList.push(item)
            } else {
                earningItem[totalEarningsType] = earning.totalEarnings
            }
        });

        console.log(earningList)
        return earningList
    } catch (e){
        return e
    }

}

const getDisburedEarnings = async (root, args, context, info) => {
    try {
        const memberId = new ObjectId(args.memberId);

        const earnings = await dbClient.db(dbName).collection("member_earnings").aggregate([
            {
                $lookup: {
                    from: "users",
                    localField: "memberId",
                    foreignField: "_id",
                    as: "members"
                }
            },
            {
                $addFields: {
                    "member": { "$arrayElemAt": [ "$members", 0 ] },
                }
            },
            { $match : { memberId: memberId, payed: true } }
        ]).toArray()

        return earnings;
    } catch (e){
        return e
    }

}


const getCompensationAdminLedgerHistory = async (root, args, context, info) => {
    try {
        const memberId = new ObjectId(args.memberId);

        const earnings = await dbClient.db(dbName).collection("member_earnings").aggregate([
            {
                $lookup: {
                    from: "users",
                    localField: "memberId",
                    foreignField: "_id",
                    as: "members"
                }
            },
            {
                $addFields: {
                    "member": { "$arrayElemAt": [ "$members", 0 ] },
                }
            },
            { $match : { memberId: memberId } }
        ]).toArray()

        return earnings;
    } catch (e){
        return e
    }

}


const compensationHistory = async (root, args, context, info) => {
    let comps = await dbClient.db(dbName).collection("compensations_history").aggregate([
        {
            $lookup: {
                from: "users",
                localField: "userId",
                foreignField: "_id",
                as: "user"
            }
        }
    ]).toArray()

    let compsHistory = comps.map(c => ({...c, user: c.user[0]}))

    return compsHistory
}

/* MUTATIONS */
const saveCompensation = async (parent, args) => {
    try {
        let compensation = {
            userId: new ObjectId(args.data.userId),
            payNum: args.data.payNum,
            payType: args.data.payType,
            payAmount: args.data.payAmount,
            uploadIds: [],
            totalCompensation: 0,
            startDate: new Date(),
            expirationDate: new Date(args.data.expiration),
            createdAt: new Date()
        };

        let id = null;
        if (args.data.compensationId) {
            //nothing to be done YET I believe
        } else {
            let comp = await dbClient.db(dbName).collection('compensations').insertOne(compensation);
            id = comp.insertedId.toString();

            //Save Compensation History
            const compensationHistory = {
                ...compensation,
                createdAt: new Date()
            }

            await dbClient.db(dbName).collection('compensations_history').insertOne(compensationHistory);
        }

        await compensateAllUploads()
        await compensateAllProducts()
        return id;
    } catch (e) {
        return e;
    }
}

const compensateUploads = async (parent, args) => {
    try {
        await compensateAllUploads();
        return 'ok'
    } catch (e) {
        return e;
    }
}

const compensateProducts = async (parent, args) => {
    try {
        await compensateAllProducts();
        return 'ok'
    } catch (e) {
        return e;
    }
}

const disburseEarning = async (parent, args) => {
    let earnings = await dbClient.db(dbName).collection("member_earnings").aggregate([
        {
            $lookup: {
                from: "users",
                localField: "memberId",
                foreignField: "_id",
                as: "members"
            }
        },
        {
            $addFields: {
                "member": { "$arrayElemAt": [ "$members", 0 ] },
            }
        },
        {
            $project:
                {
                    _id: "$_id",
                    amount: "$amount",
                    memberId:"$memberId",
                    member: "$member",
                    payed: "$payed",
                    entityId: "$entityId",
                    type: "$type",
                    createdAt: "$createdAt",
                    totalUploadEarnings: "$totalUploadEarnings",
                    year: { $year: "$createdAt" },
                    month: { $month: "$createdAt" }
                }
        },
        { $match : { "month" : args.month, "year": args.year, memberId: new ObjectId(args.memberId), $or: [{ flagged: false }, { flagged : { "$exists": false } }] } }
    ]).toArray()

    let earningIds = earnings.map(e => new ObjectId(e._id) )

    earningIds.map(async (id) => {

        //This probably changes when We make the payments inside the system with the Venmo ID or something
        let paymentNumber = crypto.createHash('md5').update(id.toString()).digest("hex")
        await dbClient.db(dbName).collection('member_earnings').update(
            { _id: id },
            {
                $set: { payed: true, paymentDate: new Date(), paymentNumber: paymentNumber },
                $currentDate: { updatedAt: true }
            }
        );
    })

    try {
        return 'ok'
    } catch (e) {
        return e;
    }
}

const flagCompensationEarning = async (parent, args) => {
    const entityId = new ObjectId(args.entityId)
    const type = args.type;
    let object = null;

    if ( type == 'member' ){
        object = await dbClient.db(dbName).collection("users").findOne({ _id: entityId })
        if ( object ){
            let flagged = object.flagged ? !object.flagged : true;
            await dbClient.db(dbName).collection("users").updateOne(
                { _id: entityId },
                { $set: { flagged: flagged }}
            )
        }
    } else {
        object = await dbClient.db(dbName).collection("member_earnings").findOne({ entityId: entityId, type: type })
        if ( object ){
            let flagged = object.flagged ? !object.flagged : true;
            await dbClient.db(dbName).collection("member_earnings").updateOne(
                { _id: new ObjectId(object._id)},
                { $set: { flagged: flagged }}
            )
        }
    }

    try {
        return 'ok'
    } catch (e) {
        return e;
    }
}


/* HELPER */
const compensateApprovedUpload = async (uploadId, oDate) => {
    const activeComp = await availableUploadCompensation(oDate)
    console.log('uploadId', uploadId);
    console.log('activeComp', activeComp);

    if (activeComp) {
        let totalCompensated = activeComp.totalCompensation

        await dbClient.db(dbName).collection("uploads").updateOne(
            {_id: new ObjectId(uploadId)},
            {$set: {credited: true, earnedAmount: activeComp.payAmount}}
        )

        totalCompensated = totalCompensated + activeComp.payAmount

        console.log('totalCompensated', totalCompensated);

        await dbClient.db(dbName).collection("compensations").updateOne(
            {_id: new ObjectId(activeComp._id)},
            {"$set": {totalCompensation: totalCompensated}, "$push": {"uploadIds": {"$each": [new ObjectId(uploadId)]}}}
        )

        const uploadIds = []
        uploadIds.push(uploadId)
        await notificationResolvers.helper.createSuccessfulUploadNotificationToMember(uploadIds, activeComp.payAmount)

        let upload = await dbClient.db(dbName).collection('uploads').findOne({_id: new ObjectId(uploadId)});

        await dbClient.db(dbName).collection('member_earnings').insertOne(
            {
                entityId: new ObjectId(uploadId),
                type: 'upload',
                amount: activeComp.payAmount,
                memberId: upload.memberId,
                payed: false,
                createdAt: new Date(),
                updatedAt: new Date()
            }
        );
    }
}

const compensateApprovedProduct = async (uploadId, oDate) => {
    const activeComp = await availableProductCompensation(oDate)
    console.log('uploadId', uploadId);
    console.log('activeComp', activeComp);

    if (activeComp) {
        let totalCompensated = activeComp.totalCompensation

        await dbClient.db(dbName).collection("uploads").updateOne(
            {_id: new ObjectId(uploadId)},
            {$set: {credited: true, earnedAmount: activeComp.payAmount}}
        )

        totalCompensated = totalCompensated + activeComp.payAmount
        console.log('totalCompensated', totalCompensated);

        await dbClient.db(dbName).collection("compensations").updateOne(
            {_id: new ObjectId(activeComp._id)},
            {"$set": {totalCompensation: totalCompensated}, "$push": {"uploadIds": {"$each": [new ObjectId(uploadId)]}}}
        )

        const uploadIds = []
        uploadIds.push(uploadId)
        await notificationResolvers.helper.createSuccessfulUploadNotificationToMember(uploadIds, activeComp.payAmount)

        let upload = await dbClient.db(dbName).collection('uploads').findOne({_id: new ObjectId(uploadId)});

        await dbClient.db(dbName).collection('member_earnings').insertOne(
            {
                entityId: new ObjectId(uploadId),
                type: 'product',
                amount: activeComp.payAmount,
                memberId: new ObjectId(upload.memberId),
                payed: false,
                createdAt: new Date(),
                updatedAt: new Date()
            }
        );
    }
}

const availableUploadCompensation = async (oDate) => {
    let mDate = moment(oDate)
    let sDate = mDate.format("YYYY-MM-DDT23:59:59")

    let comp = await dbClient.db(dbName).collection("compensations").aggregate([
        {
            $lookup: {
                from: "users",
                localField: "userId",
                foreignField: "_id",
                as: "user"
            }
        },
        {$match: {startDate: {$lte: new Date(sDate)}, expirationDate: {$gte: new Date(sDate)}, payType: "upload"}},
        {$addFields: {user: {"$arrayElemAt": ["$user", 0]}}},
        {$sort: {createdAt: -1}}
    ]).toArray();

    return comp && comp[0] ? comp[0] : null;
}

const availableProductCompensation = async (oDate) => {
    let mDate = moment(oDate)
    let sDate = mDate.format("YYYY-MM-DDT23:59:59")

    let comp = await dbClient.db(dbName).collection("compensations").aggregate([
        {
            $lookup: {
                from: "users",
                localField: "userId",
                foreignField: "_id",
                as: "user"
            }
        },
        {$match: {startDate: {$lte: new Date(sDate)}, expirationDate: {$gte: new Date(sDate)}, payType: "product"}},
        {$addFields: {user: {"$arrayElemAt": ["$user", 0]}}},
        {$sort: {createdAt: -1}}
    ]).toArray();

    return comp && comp[0] ? comp[0] : null;
}

const compensateAllUploads = async () => {
    //Get Approved and not credited uploads
    const uploads = await dbClient.db(dbName).collection("uploads").find({approved: true, credited: null}).toArray();

    uploads.forEach(async (upload) => {
        await compensateApprovedUpload(upload._id, upload.createdAt)
    })
}

const compensateAllProducts = async () => {
    const uploads = await dbClient.db(dbName).collection("uploads").find({
        approved: true,
        credited: null,
        productId: {$ne: null}
    }).toArray();

    uploads.forEach(async (upload) => {
        await compensateApprovedProduct(upload._id, upload.createdAt)
    })
}

module.exports = {
    queries: {
        activeCompensation,
        compensationHistory,
        getMemberCompensations,
        getMemberTotalEarnings,
        getMembersCompensationAdminLedger,
        getCompensationAdminLedgerHistory,
        getDisburedEarnings
    },
    mutations: {
        saveCompensation,
        compensateUploads,
        compensateProducts,
        flagCompensationEarning,
        disburseEarning
    },
    helper: {
        availableUploadCompensation,
        compensateAllUploads,
        compensateAllProducts,
        compensateApprovedUpload,
        compensateApprovedProduct
    }
}