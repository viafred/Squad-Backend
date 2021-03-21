const { dbClient, dbName } = require('../../config/mongo');
const ObjectId = require('mongodb').ObjectId;
const NotificationFactory = require('../../utils/Notification/notificationFactory')

const moment = require('moment'); // require

const NOTIFICATION_TYPES = {
    OFFER_CREATED: 'offer_created',
    MEMBER_OFFER_EARNED_AMOUNT: 'offer_earned_amount'
}

const NOTIFICATION_FROM_TO_TYPES = {
    CUSTOMER: 'customer',
    MEMBER: 'member',
    ADMIN: 'admin'
}

/* Queries */
const getMemberNotifications = async (root, args, context, info) => {
    const notifications = await dbClient.db(dbName)
        .collection("notifications")
        .find({ toUserType: "member", toUserId: new ObjectId(args.userId) })
        .sort({ createdAt: -1 })
        .limit(10)
        .toArray()

    console.log('Get Member Notifications ', notifications)

    for ( let notification of notifications ){
        const notificationObject = NotificationFactory.create(notification.type)
        const data = await notificationObject.getData(notification.externalId)

        console.log('Notification External Data ', data)

        notification.data = JSON.stringify(data)
        notification.fromNow = moment(notification.createdAt).fromNow()
    }

    return notifications;
}

/* Helpers */
const addNotification =  async (data) => {
    try {
        console.log('Add Notification Data ', data)

        let notification = {
            type: data.type,
            title: data.title,
            message: data.message,
            fromUserType: data.fromUserType,
            fromUserId: new ObjectId(data.fromUserId),
            toUserType: data.toUserType,
            toUserId: new ObjectId(data.toUserId),
            externalId: new ObjectId(data.externalId),
            read: false,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const _notification = await dbClient.db(dbName).collection('notifications').insertOne(notification);

        return _notification.insertedId.toString()
    } catch (e) {
        return e;
    }
}


const createOfferNotificationsToMembers = async (customerId, uploads, externalId) => {
    try {
        let customer = await dbClient.db(dbName).collection('customers').findOne({ _id: new ObjectId(customerId) });

        const _uploads = await dbClient.db(dbName).collection("uploads")
            .find({ _id: { $in: uploads.map(u => new ObjectId(u)) } })
            .toArray();

        for ( let upload of _uploads ){
            const data = {
                type: NOTIFICATION_TYPES.OFFER_CREATED,
                title: "New Offer",
                message: `New feedback offer from Customer ${customer.companyName}`,
                fromUserType: NOTIFICATION_FROM_TO_TYPES.CUSTOMER,
                fromUserId: customerId,
                toUserType: NOTIFICATION_FROM_TO_TYPES.MEMBER,
                toUserId: upload.memberId,
                externalId: externalId,
            }

            console.log('Create Offer Notification To Members ', data)
            await addNotification(data)
        }
    } catch (e) {
        return e;
    }
}

const createAnswerFeedbackEarnedNotificationToMember = async (customerId, userId, amount, externalId) => {
    try {
        let customer = await dbClient.db(dbName).collection('customers').findOne({ _id: new ObjectId(customerId) });

        const earnedAmount = (amount).toLocaleString('en-US', {
            style: 'currency',
            currency: 'USD',
        });

        const data = {
            type: NOTIFICATION_TYPES.MEMBER_OFFER_EARNED_AMOUNT,
            title: "New Answer",
            message: `Earned ${earnedAmount} from Customer ${customer.companyName} feedback Offer`,
            fromUserType: NOTIFICATION_FROM_TO_TYPES.CUSTOMER,
            fromUserId: customerId,
            toUserType: NOTIFICATION_FROM_TO_TYPES.MEMBER,
            toUserId: userId,
            externalId: externalId,
        }

        console.log('Create Earned Amount Notification To Members ', data)
        await addNotification(data)

    } catch (e) {
        return e;
    }
}




/* Mutations */
const readNotification =  async (parent, args) => {
    try {
        await dbClient.db(dbName).collection('notifications').updateOne(
            { _id: new ObjectId(args.notificationId) },
            {
                $set: { read: args.read },
                $currentDate: { updatedAt: true }
            }
        );
        return args.notificationId
    } catch (e) {
        return e;
    }
}


module.exports = {
    queries: {
        getMemberNotifications
    },
    mutations: {
        readNotification
    },
    helper: {
        addNotification,
        createOfferNotificationsToMembers,
        createAnswerFeedbackEarnedNotificationToMember
    }
}