const { dbClient, dbName } = require('../../config/mongo');
const ObjectId = require('mongodb').ObjectId;
const NotificationFactory = require('../../utils/Notification/notificationFactory')

const moment = require('moment'); // require

const NOTIFICATION_TYPES = {
    OFFER_CREATED: 'offer_created'
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
        console.log('Notification Requests ', data)

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
        const _uploads = await dbClient.db(dbName).collection("uploads").find({ _id: { $in: uploads.map(u => new ObjectId(u)) } }).toArray();

        for ( let upload of _uploads ){
            const data = {
                type: NOTIFICATION_TYPES.OFFER_CREATED,
                title: "New Offer",
                message: "New feedback offer from Customer",
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

module.exports = {
    queries: {
        getMemberNotifications
    },
    mutations: {

    },
    helper: {
        addNotification,
        createOfferNotificationsToMembers,
    }
}